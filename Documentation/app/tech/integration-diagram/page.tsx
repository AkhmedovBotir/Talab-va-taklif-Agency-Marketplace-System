"use client"

import { motion } from "framer-motion"
import {
  Share2,
  Building2,
  Users,
  Briefcase,
  Database,
  ArrowRight,
  Zap,
  ShieldCheck,
  Network,
  GitBranch,
  Workflow,
} from "lucide-react"

const nodes = [
  { id: "marketplace", name: "Marketplace", icon: Share2, color: "bg-blue-500", x: "50%", y: "15%" },
  { id: "db", name: "API Server", icon: Database, color: "bg-slate-700", x: "50%", y: "50%" },
  { id: "punkt", name: "Punkt", icon: Building2, color: "bg-emerald-500", x: "15%", y: "85%" },
  { id: "agent", name: "Agent", icon: Users, color: "bg-orange-500", x: "85%", y: "85%" },
  { id: "kontragent", name: "Kontragent", icon: Briefcase, color: "bg-purple-500", x: "50%", y: "85%" },
]

const connections = [
  { from: "marketplace", to: "db", label: "Internet orqali" },
  { from: "punkt", to: "db", label: "Real-time API" },
  { from: "agent", to: "db", label: "Mobil dastur" },
  { from: "kontragent", to: "db", label: "Xavfsiz aloqa" },
]

export default function IntegrationDiagramPage() {
  return (
    <div className="space-y-16">
      {/* Page Header */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <Network className="w-3 h-3" /> Tizim Arxitekturasi
        </div>
        <h1 className="text-5xl font-bold tracking-tight">TTSA Integratsiya Diagrammasi</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          TTSA tizimidagi barcha dasturlar qanday bir-biriga bog'langani, ma'lumotlar qanday almashilishi va tizim
          qanday ishlashini texnik va notexnik tilda tushuntiramiz.
        </p>
      </section>

      {/* Interactive Diagram Canvas */}
      <section className="relative w-full aspect-video bg-secondary/20 rounded-3xl border border-border overflow-hidden p-8">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-muted-foreground" />
            </marker>
          </defs>
          {connections.map((conn, idx) => {
            const fromNode = nodes.find((n) => n.id === conn.from)!
            const toNode = nodes.find((n) => n.id === conn.to)!
            return (
              <g key={idx}>
                <motion.line
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: idx * 0.2 }}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  className="text-muted-foreground/30"
                  markerEnd="url(#arrow)"
                />
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12, delay: i * 0.1 }}
            style={{ left: node.x, top: node.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="group relative flex flex-col items-center gap-3">
              <div
                className={`p-5 rounded-2xl shadow-2xl border-4 border-background transition-transform group-hover:scale-110 ${node.color} text-white`}
              >
                <node.icon className="w-8 h-8" />
              </div>
              <div className="bg-background/80 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                {node.name}
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="p-8 rounded-3xl bg-blue-500/10 border border-blue-500/30 space-y-6">
        <h2 className="text-2xl font-bold">Bu Diagramma Nimani Anglatadi</h2>
        <p className="text-muted-foreground leading-relaxed">
          Markazda <strong>"API Server"</strong> bor - bu yerda barcha ma'lumotlar saqlanadi va barcha dasturlar bu
          serverga ulangan. Har bir dastur (Marketplace, Punkt, Agent, Kontragent) o'zining maxsus ish vaqti bo'lsa ham,
          barcha ma'lumot shu markaziy serverga yuboriladi. Server hamma dasturlarga doimiy xabar beradi.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="font-bold mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              Marketplace
            </div>
            <p className="text-sm text-muted-foreground">
              Mijoz buyurtma bersa, bu ma'lumot darhol serverga yuboriladi va Punkt'ga xabar ketadi.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="font-bold mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              Punkt
            </div>
            <p className="text-sm text-muted-foreground">
              Punkt xodimi buyurtmani qabul qilsa, avtomatik server yangilanadi va Kontragent, Agent biladi.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="font-bold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              Agent
            </div>
            <p className="text-sm text-muted-foreground">
              Kuryer buyurtmani yetkazib bersa, telefon orqali serverga xabar beradi va Punkt yangilanadi.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="font-bold mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-500" />
              Kontragent
            </div>
            <p className="text-sm text-muted-foreground">
              Biznes egasi statistikani ko'rmoqchi bo'lsa, serverdan barcha ma'lumotlarni tez-tez oladi.
            </p>
          </div>
        </div>
      </section>

      {/* Order Flow Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">Buyurtmaning Yo'li</h2>
        <p className="text-muted-foreground">Har bir buyurtma quyidagi to'rtta bosqichdan ketma-ketlikda o'tadi:</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: "1",
              app: "Marketplace",
              desc: "Mijoz buyurtma beradi",
              details: "Internet orqali buyurtma tizimga kiritiladi",
              color: "bg-blue-500",
            },
            {
              step: "2",
              app: "Punkt",
              desc: "Punkt qabul qiladi",
              details: "Kontragentga so'rov yuboradi yoki agentga beradi",
              color: "bg-emerald-500",
            },
            {
              step: "3",
              app: "Kontragent",
              desc: "Mahsulot yuboradi",
              details: "Mahsulot Punkt'ga yetib boradi va tekshiriladi",
              color: "bg-purple-500",
            },
            {
              step: "4",
              app: "Agent",
              desc: "Agent yetkazadi",
              details: "Buyurtma mijozga yetib boradi, to'lov qabul qilinadi",
              color: "bg-orange-500",
            },
          ].map((item) => (
            <div key={item.step} className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div
                className={`w-10 h-10 ${item.color} text-white rounded-lg flex items-center justify-center font-bold`}
              >
                {item.step}
              </div>
              <div>
                <div className="font-bold text-sm mb-1">{item.app}</div>
                <div className="text-sm font-semibold mb-2">{item.desc}</div>
                <p className="text-xs text-muted-foreground">{item.details}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-secondary/30 border border-border space-y-6">
          <div className="flex items-center gap-3">
            <Workflow className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold">Ma'lumotlar Qanday Yuriladi</h3>
          </div>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <ArrowRight className="w-4 h-4 shrink-0 text-primary" />
              <span>
                <strong>API Orqali:</strong> Barcha dasturlar REST API orqali serverga so'rov yuboradi va javob oladi.
              </span>
            </li>
            <li className="flex gap-3">
              <ArrowRight className="w-4 h-4 shrink-0 text-primary" />
              <span>
                <strong>Real-time Yangilanish:</strong> Bir dasturda o'zgarish bo'lsa, boshqalari darhol biladi.
              </span>
            </li>
            <li className="flex gap-3">
              <ArrowRight className="w-4 h-4 shrink-0 text-primary" />
              <span>
                <strong>Avtomatik Sinkronizatsiya:</strong> Har bir operatsiya avtomatik qayd etiladi va hisoblanadi.
              </span>
            </li>
            <li className="flex gap-3">
              <ArrowRight className="w-4 h-4 shrink-0 text-primary" />
              <span>
                <strong>Xatolikni Qayta Ishlash:</strong> Agar internet tekis bo'lmasa, ma'lumot keyinchalik yuboriladi.
              </span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-3xl bg-secondary/30 border border-border space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <h3 className="text-xl font-bold">Xavfsizlik Qanday Ta'minlanadi</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Barcha ma'lumotlar shifrlangan holda yuboriladi va saqlanadi. Har bir foydalanuvchi uchun yo'q ruxsat
            (token) beriladi. Bu degani, faqat siz sizning ma'lumotlarni ko'ra olasiz.
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-background border border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Autentifikatsiya</div>
              <div className="text-sm font-semibold">Telefon + Parol + SMS kod</div>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Shifrlash</div>
              <div className="text-sm font-semibold">256-bit SSL/TLS</div>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Qayd Etish</div>
              <div className="text-sm font-semibold">Barcha harakatlar qayd etiladi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">Qo'llaniladigan Texnologiyalar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold">Frontend</h3>
            </div>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>React Native (Agent)</li>
              <li>Next.js (Marketplace)</li>
              <li>React (Web)</li>
              <li>TypeScript</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold">Backend</h3>
            </div>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>Node.js / Express</li>
              <li>PostgreSQL</li>
              <li>REST API</li>
              <li>JWT Authentication</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold">Infrastructure</h3>
            </div>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>Cloud Hosting</li>
              <li>CDN</li>
              <li>SSL/TLS</li>
              <li>Load Balancer</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
