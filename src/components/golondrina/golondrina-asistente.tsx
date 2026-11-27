"use client"

// Golondrina en RetailPOS: asistente que hace las cosas por vos (pedís con tus palabras)
// y automatización que aprende las costumbres de cada usuario. 100% configurable.
import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Golondrina, type Accion } from "@/golondrina"

// Una sola instancia para toda la app.
let instancia: Golondrina | null = null
function obtener() {
  if (!instancia) {
    instancia = new Golondrina({
      app: "retailpos",
      acciones: [],
      colorPrimario: "#5f7fa3",
      saludo:
        "¡Hola! Soy Golondrina. Pedime lo que necesites con tus palabras: «nueva venta», «buscar coca», «ver stock», «reporte de ventas»… Y con el uso aprendo lo que hacés siempre y te lo dejo a mano.",
    })
  }
  return instancia
}

const REPORTES: Record<string, string> = { ventas: "sales", stock: "inventory", compras: "purchases", gráficos: "charts" }

/** Escribe en un campo de React como si lo hiciera el usuario. */
function escribirEn(selector: string, texto: string, intentos = 20) {
  const el = document.querySelector<HTMLInputElement>(selector)
  if (!el) {
    if (intentos > 0) setTimeout(() => escribirEn(selector, texto, intentos - 1), 150)
    return
  }
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(el, texto)
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.focus()
}

/** Toca un botón por su texto, esperando a que aparezca. */
function tocarBoton(texto: string, intentos = 20) {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.trim().toLowerCase().includes(texto.toLowerCase()))
  if (b) b.click()
  else if (intentos > 0) setTimeout(() => tocarBoton(texto, intentos - 1), 150)
}

function acciones(ir: (ruta: string) => void): Accion[] {
  const pagina = (id: string, titulo: string, ruta: string, frases: string[], descripcion?: string): Accion => ({
    id,
    titulo,
    descripcion,
    frases,
    ejecutar: () => {
      ir(ruta)
      return `Listo, te llevé a ${titulo.replace(/^Ver /, "").toLowerCase()}.`
    },
  })
  return [
    pagina("ver-resumen", "Ver el resumen de caja", "/dashboard", ["ver resumen", "ir a caja", "inicio", "cómo vamos hoy"], "ver las ventas de hoy y las cajas abiertas"),
    {
      id: "nueva-venta",
      titulo: "Nueva venta",
      descripcion: "abrir el punto de venta para cobrar",
      frases: ["nueva venta", "punto de venta", "abrir el pos", "quiero cobrar"],
      ejecutar: () => {
        ir("/pos")
        return "Abrí el punto de venta. Buscá el producto o escaneá el código."
      },
    },
    {
      id: "vender-producto",
      titulo: "Vender «{producto}»",
      descripcion: "buscar un producto en el punto de venta",
      frases: ["vender {producto}", "cobrar {producto}", "agregar {producto} al carrito", "venta de {producto}"],
      parametros: [{ nombre: "producto", libre: true, requerido: true, pregunta: "¿Qué producto?" }],
      ejecutar: ({ producto }) => {
        ir("/pos")
        escribirEn('main input[type="search"], main input[placeholder*="uscar" i]', producto)
        return `Busqué «${producto}» en el punto de venta.`
      },
    },
    {
      id: "abrir-caja",
      titulo: "Abrir la caja",
      descripcion: "abrir la caja del turno",
      frases: ["abrir caja", "abrir la caja", "empezar el turno"],
      ejecutar: () => {
        ir("/dashboard")
        setTimeout(() => tocarBoton("Abrir caja"), 400)
        return "Te abrí el formulario para abrir la caja del turno."
      },
    },
    pagina("movimientos-caja", "Ver movimientos de caja", "/cash-movements", ["movimientos de caja", "ingresos y egresos", "retiros"]),
    {
      id: "ver-reporte",
      titulo: "Ver el reporte de {tipo}",
      descripcion: "ver los reportes de ventas, stock, compras o gráficos",
      frases: ["reporte de {tipo}", "ver {tipo}", "informe de {tipo}", "reportes"],
      parametros: [{ nombre: "tipo", opciones: () => Object.keys(REPORTES), requerido: true, pregunta: "¿Qué reporte? Ventas, stock, compras o gráficos." }],
      ejecutar: ({ tipo }) => {
        ir(`/reports?tab=${REPORTES[tipo] ?? "sales"}`)
        return `Te muestro el reporte de ${tipo}.`
      },
    },
    {
      id: "buscar-producto",
      titulo: "Buscar «{consulta}»",
      descripcion: "buscar un producto por nombre o código",
      frases: ["buscar {consulta}", "busco {consulta}", "tenés {consulta}", "precio de {consulta}"],
      parametros: [{ nombre: "consulta", libre: true, requerido: true, pregunta: "¿Qué busco?" }],
      ejecutar: ({ consulta }) => {
        ir("/products")
        escribirEn('main input[placeholder*="uscar" i]', consulta)
        return `Busqué «${consulta}» en los productos.`
      },
    },
    pagina("ver-productos", "Ver productos", "/products", ["productos", "ver productos", "catálogo", "lista de precios"]),
    pagina("ver-categorias", "Ver categorías", "/categories", ["categorías", "ver categorías", "rubros"]),
    pagina("ver-promociones", "Ver promociones", "/promotions", ["promociones", "ofertas", "descuentos"]),
    pagina("ver-movimientos-stock", "Ver entradas y salidas", "/inventory-movements", ["entradas y salidas", "movimientos de stock", "mercadería"]),
    pagina("ver-proveedores", "Ver proveedores", "/suppliers", ["proveedores", "ver proveedores"]),
    pagina("ver-ordenes", "Ver órdenes de compra", "/purchase-orders", ["órdenes de compra", "pedidos a proveedores", "compras"]),
    pagina("ver-sucursales", "Ver sucursales", "/locations", ["sucursales", "locales"]),
  ]
}

// Qué acción corresponde a cada pantalla (para aprender aunque el usuario navegue a mano).
const POR_RUTA: [RegExp, string, Record<string, string>?][] = [
  [/^\/dashboard/, "ver-resumen"],
  [/^\/pos/, "nueva-venta"],
  [/^\/cash-movements/, "movimientos-caja"],
  [/^\/products/, "ver-productos"],
  [/^\/categories/, "ver-categorias"],
  [/^\/promotions/, "ver-promociones"],
  [/^\/inventory-movements/, "ver-movimientos-stock"],
  [/^\/suppliers/, "ver-proveedores"],
  [/^\/purchase-orders/, "ver-ordenes"],
  [/^\/locations/, "ver-sucursales"],
]

export function GolondrinaAsistente({ usuario }: { usuario?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routerRef = useRef(router)
  routerRef.current = router

  // Se monta una vez (y se desmonta al salir, también en el doble montaje de desarrollo).
  useEffect(() => {
    const g = obtener()
    g.definirAcciones(acciones((ruta) => routerRef.current.push(ruta)))
    g.montar()
    return () => {
      g.destruir()
      instancia = null
    }
  }, [])

  useEffect(() => {
    if (usuario) obtener().usuario(usuario)
  }, [usuario])

  // Cada pantalla es un contexto; lo que el usuario abre a mano también se aprende.
  useEffect(() => {
    const g = obtener()
    g.contexto(pathname.split("/")[1] || "inicio")
    if (pathname.startsWith("/reports")) {
      const tab = searchParams.get("tab") ?? "sales"
      const tipo = Object.entries(REPORTES).find(([, v]) => v === tab)?.[0] ?? "ventas"
      g.registrar("ver-reporte", { tipo })
      return
    }
    const r = POR_RUTA.find(([re]) => re.test(pathname))
    if (r) g.registrar(r[1], r[2] ?? {})
  }, [pathname, searchParams])

  return null
}
