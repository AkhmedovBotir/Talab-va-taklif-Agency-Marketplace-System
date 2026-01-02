"use client"

import { cn } from "@/lib/utils"

import { motion } from "framer-motion"
import { Share2, Building2, Users, Briefcase, Database } from "lucide-react"

const apps = [
  {
    id: "marketplace",
    name: "Marketplace",
    icon: Share2,
    color: "bg-blue-500",
    pos: "top-0 left-1/2 -translate-x-1/2",
  },
  { id: "punkt", name: "Punkt", icon: Building2, color: "bg-emerald-500", pos: "bottom-0 left-0" },
  { id: "agent", name: "Agent", icon: Users, color: "bg-orange-500", pos: "bottom-0 right-0" },
  {
    id: "kontragent",
    name: "Kontragent",
    icon: Briefcase,
    color: "bg-purple-500",
    pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  },
]

export function EcosystemDiagram() {
  return (
    <div className="relative w-full max-w-2xl mx-auto h-[400px] bg-secondary/30 rounded-2xl border border-border p-8 overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Central Database/Core */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-20">
        <Database className="w-64 h-64 text-foreground" />
      </div>

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <motion.line
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          x1="50%"
          y1="20%"
          x2="50%"
          y2="50%"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
        <motion.line
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
          x1="20%"
          y1="80%"
          x2="50%"
          y2="50%"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
        <motion.line
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          x1="80%"
          y1="80%"
          x2="50%"
          y2="50%"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
      </svg>

      {/* App Nodes */}
      {apps.map((app, i) => (
        <motion.div
          key={app.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.2 }}
          className={cn(
            "absolute z-10 flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card shadow-2xl",
            app.pos,
          )}
        >
          <div className={cn("p-3 rounded-lg text-white", app.color)}>
            <app.icon className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">{app.name}</span>
        </motion.div>
      ))}

      {/* Interaction Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
        Ecosystem Data Flow Matrix
      </div>
    </div>
  )
}
