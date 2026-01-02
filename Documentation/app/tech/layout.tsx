import type React from "react"
import { Sidebar } from "@/components/sidebar"

export default function TechLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">Ekotizim</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-sm">Texnik dokumentatsiya</span>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-8 py-12">{children}</div>
      </main>
    </div>
  )
}
