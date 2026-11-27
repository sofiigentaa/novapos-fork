"use client"

import { Suspense, useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useSession } from "next-auth/react"
import { GolondrinaAsistente } from "@/components/golondrina/golondrina-asistente"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string>("ADMIN")
  const [userName, setUserName] = useState<string>("Usuario")

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any)?.role || "CASHIER"
      const name = session.user.name || "Usuario"
      setUserRole(role)
      setUserName(name)
    }
  }, [session])

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <Sidebar userRole={userRole} userName={userName} />
      </Suspense>
      {/* Golondrina: asistente que aprende de cada usuario (100% configurable) */}
      <Suspense fallback={null}>
        <GolondrinaAsistente usuario={session?.user?.email ?? undefined} />
      </Suspense>
      <main className="lg:pl-64">
        <div className="min-h-screen bg-background/60 px-4 py-4 pt-20 sm:px-6 sm:py-6 sm:pt-24 lg:p-6">
          <div className="mx-auto max-w-7xl animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
