"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight, DollarSign, FileDown, Package, Receipt, Wallet } from "lucide-react"

import { StatCard } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SalesReportGroup, SalesReportSummary } from "@/lib/types/reports"
import { exportSalePDF, exportSalesPDF } from "@/lib/reports/pdf-export"

interface SalesReportProps {
  data: SalesReportGroup[]
  summary: SalesReportSummary | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getPaymentVariant(method: string) {
  if (method === "CASH") return "default"
  if (method === "CARD") return "secondary"
  return "outline"
}

function getStatusVariant(status: string) {
  if (status === "COMPLETED") return "default"
  if (status === "CANCELLED") return "destructive"
  return "outline"
}

export default function SalesReport({ data, summary }: SalesReportProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleGroup(invoiceNumber: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(invoiceNumber)) {
        next.delete(invoiceNumber)
      } else {
        next.add(invoiceNumber)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {summary ? (
        <div className="flex items-start justify-between gap-4">
          <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ventas" value={formatCurrency(summary.totalSales)} helper={`${summary.salesCount} transacciones`} icon={DollarSign} iconClassName="text-primary" />
            <StatCard label="Artículos" value={summary.totalItems} helper="Unidades vendidas" icon={Package} iconClassName="text-secondary-foreground" />
            <StatCard label="Impuestos" value={formatCurrency(summary.totalTax)} helper="Carga fiscal del período" icon={Receipt} iconClassName="text-warning" />
            <StatCard label="Ticket promedio" value={formatCurrency(summary.averageTicket)} helper="Valor medio por venta" icon={Wallet} iconClassName="text-success-foreground" />
          </div>
          <Button variant="outline" size="sm" className="mt-1 shrink-0" onClick={() => exportSalesPDF(data, `Reporte-Ventas`)}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/70">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden md:table-cell">Sucursal</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden sm:table-cell">Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  No hay datos de ventas en el período seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((group, indice) => (
                <Fragment key={`${group.invoiceNumber}-${indice}`}>
                  <TableRow
                    className="cursor-pointer bg-muted/20 hover:bg-muted/40"
                    onClick={() => toggleGroup(group.invoiceNumber)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {expanded.has(group.invoiceNumber) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">{group.invoiceNumber.slice(0, 8)}</TableCell>
                    <TableCell>{group.date}</TableCell>
                    <TableCell className="hidden md:table-cell">{group.location}</TableCell>
                    <TableCell className="text-right">{group.items.length}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(group.total)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={getPaymentVariant(group.paymentMethod)}>{group.paymentMethod}</Badge>
                    </TableCell>
                     <TableCell>
                       <Badge variant={getStatusVariant(group.status)}>{group.status}</Badge>
                     </TableCell>
                     <TableCell className="text-right">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={(event) => {
                           event.stopPropagation()
                           exportSalePDF(group)
                         }}
                       >
                         <FileDown className="h-4 w-4" />
                       </Button>
                     </TableCell>
                   </TableRow>
                   {expanded.has(group.invoiceNumber) && (
                     <TableRow key={`${group.invoiceNumber}-items`}>
                       <TableCell colSpan={9} className="bg-muted/10 p-0">
                         <div className="px-10 py-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right w-20">Cant.</TableHead>
                                <TableHead className="text-right w-28">Precio</TableHead>
                                <TableHead className="text-right w-28">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="whitespace-normal">{item.product}</TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 50 ? (
        <p className="text-center text-sm text-muted-foreground">Mostrando los primeros 50 de {data.length} registros.</p>
      ) : null}
    </div>
  )
}
