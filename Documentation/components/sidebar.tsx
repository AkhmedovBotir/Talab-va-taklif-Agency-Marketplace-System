"use client"

import { Search, ChevronDown, BookOpen, Layout, Target, Share2, Users, Briefcase, Building2, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  {
    title: "Kirish",
    items: [
      { name: "Bosh sahifa", icon: Home, href: "/" },
      { name: "Loyiha haqida", icon: BookOpen, href: "/about" },
      { name: "Maqsad va Qadriyatlar", icon: Target, href: "/values" },
      { name: "Ekotizim strukturasi", icon: Layout, href: "/ecosystem" },
    ],
  },
  {
    title: "Ilovalar",
    items: [
      { name: "Marketplace", icon: Share2, href: "/apps/marketplace" },
      { name: "Punkt (Nuqta)", icon: Building2, href: "/apps/punkt" },
      { name: "Agent", icon: Users, href: "/apps/agent" },
      { name: "Kontragent", icon: Briefcase, href: "/apps/kontragent" },
    ],
  },
  {
    title: "Texnik qism",
    items: [{ name: "Integratsiya diagrammasi", icon: ChevronDown, href: "/tech/integration-diagram" }],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r border-border h-screen sticky top-0 bg-background overflow-y-auto hidden md:block">
      <div className="p-4 flex items-center gap-2 border-b border-border mb-4">
        <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center text-background font-bold">
          T
        </div>
        <span className="font-semibold text-lg tracking-tight">TTSA Docs</span>
      </div>

      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Qidirish... (Cmd+K)"
            className="w-full bg-secondary text-sm rounded-md py-2 pl-8 pr-4 border border-transparent focus:border-border outline-none transition-all"
          />
          <kbd className="absolute right-2 top-2.5 text-[10px] bg-background border border-border px-1 rounded text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <nav className="px-2 space-y-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors group",
                      pathname === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
