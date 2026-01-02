"use client"

import { Sidebar } from "@/components/sidebar"
import { motion } from "framer-motion"
import { Layout, ArrowRight, Building2, MapPin, Truck, TrendingUp, Share2, Package, Users, ArrowRightCircle, Sparkles, RotateCw } from "lucide-react"
import Link from "next/link"

export default function EcosystemPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">TTSA</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Ekotizim Strukturasi</span>
          </div>
          <div className="flex gap-4">
            <button className="text-sm font-medium hover:text-muted-foreground transition-colors">
              Fikr bildirish
            </button>
            <button className="text-sm font-medium bg-foreground text-background px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">
              Boshlash
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-8 py-16 space-y-16">
          {/* Hero Section */}
          <section className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold tracking-tighter"
            >
              Ekotizim Strukturasi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed max-w-3xl"
            >
              TTSA tizimi to'rt asosiy stakeholder o'rtasida dumaloq ish jarayoni bilan ishlaydi. Har bir stakeholder
              o'z rol va mas'uliyatiga ega.
            </motion.p>
          </section>

          {/* Main Flow */}
          <section className="space-y-8">
            <motion.div
              className="flex items-center gap-3 mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <ArrowRightCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Buyurtmaning Yo'li: Marketplace → Punkt → Kontragent → Agent
              </h2>
            </motion.div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-secondary/50 via-secondary/30 to-secondary/50 border border-border/50 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50"></div>
              
              <div className="relative z-10 space-y-6">
                {[
                  {
                    icon: Share2,
                    num: "1",
                    title: "Marketplace",
                    role: "Buyurtma Boshi",
                    color: "from-blue-500/20 to-blue-600/30",
                    borderColor: "border-blue-500/50",
                    iconColor: "text-blue-500",
                    roleColor: "text-blue-500",
                    glowColor: "bg-blue-500/20",
                    description: "Buyurtmalarni olish va bazoda ko'rsatish joyi",
                    details: [
                      "Pembeli/o'yuvchi buyurtma beradi",
                      "Buyurtma sistemaga kiradi",
                      "Markdown va to'lov belgisi",
                      "Kontragent bilan bog'lanish",
                    ],
                  },
                  {
                    icon: MapPin,
                    num: "2",
                    title: "Punkt (Logistika Markazi)",
                    role: "Koordinatsiya Markazi",
                    color: "from-emerald-500/20 to-emerald-600/30",
                    borderColor: "border-emerald-500/50",
                    iconColor: "text-emerald-500",
                    roleColor: "text-emerald-500",
                    glowColor: "bg-emerald-500/20",
                    description: "Buyurtmalarni qabul qilish, yo'naltirilash va koordinatsiya",
                    details: [
                      "Buyurtmani qabul qilish",
                      "Kontragent topish",
                      "Logistika rejasini tuzish",
                      "Agentga yo'naltirish",
                    ],
                  },
                  {
                    icon: Package,
                    num: "3",
                    title: "Kontragent",
                    role: "Yetkazib Beruvchi",
                    color: "from-orange-500/20 to-orange-600/30",
                    borderColor: "border-orange-500/50",
                    iconColor: "text-orange-500",
                    roleColor: "text-orange-500",
                    glowColor: "bg-orange-500/20",
                    description: "Tovarni tayyorlash va Punktga topshirish",
                    details: [
                      "Tovarni tekshirish va tayyorlash",
                      "Qadovalash",
                      "Punktga topshirish",
                      "To'lovni qabul qilish",
                    ],
                  },
                  {
                    icon: Users,
                    num: "4",
                    title: "Agent (Yetkazuvchi)",
                    role: "Yetkazish Operatisi",
                    color: "from-purple-500/20 to-purple-600/30",
                    borderColor: "border-purple-500/50",
                    iconColor: "text-purple-500",
                    roleColor: "text-purple-500",
                    glowColor: "bg-purple-500/20",
                    description: "Buyurtmani buyurtmachiga yetkazish",
                    details: [
                      "Buyurtmani qabul qilish",
                      "Yetkazishni amalga oshirish",
                      "To'lovni qabul qilish",
                      "Hisobot yuborish",
                    ],
                  },
                ].map((step, idx) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
                    className="group"
                    whileHover={{ x: 5 }}
                  >
                    <div className="relative p-6 rounded-2xl bg-background/60 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl hover:border-foreground/20 transition-all overflow-hidden">
                      {/* Glow effect on hover */}
                      <div className={`absolute inset-0 ${step.glowColor} opacity-0 group-hover:opacity-100 blur-xl transition-opacity`}></div>
                      
                      <div className="relative z-10 flex gap-6 items-start">
                        {/* Icon with number */}
                        <div className="relative shrink-0">
                          <div className={`absolute inset-0 ${step.glowColor} blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`}></div>
                          <motion.div
                            className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} border-2 ${step.borderColor} flex items-center justify-center shadow-xl backdrop-blur-sm group-hover:scale-110 group-hover:shadow-2xl transition-all`}
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            <step.icon className={`w-9 h-9 ${step.iconColor}`} />
                          </motion.div>
                          {/* Number badge */}
                          <motion.div
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-lg z-10"
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15 + 0.2, type: "spring" }}
                          >
                            {step.num}
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                              {step.title}
                            </h3>
                            <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${step.color} border ${step.borderColor} ${step.roleColor} font-semibold shadow-sm`}>
                              {step.role}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-4 text-base leading-relaxed">{step.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {step.details.map((detail, detailIdx) => (
                              <motion.div
                                key={detail}
                                className="flex items-start gap-3 p-2 rounded-lg bg-secondary/30 border border-border/30 hover:border-foreground/20 transition-all group/item"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15 + detailIdx * 0.05 }}
                              >
                                <Sparkles className={`w-4 h-4 ${step.iconColor} mt-0.5 shrink-0 opacity-70`} />
                                <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors">
                                  {detail}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Animated Arrow */}
                    {idx < 3 && (
                      <motion.div
                        className="flex justify-center my-4"
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 + 0.3 }}
                      >
                        <motion.div
                          animate={{
                            y: [0, 5, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <ArrowRight className="w-6 h-6 text-primary rotate-90" />
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Circular Flow */}
          <section className="space-y-8">
            
          </section>

          {/* Stakeholder Details */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Har Bir Stakeholder</h2>
            <div className="space-y-6">
              <Link
                href="/apps/marketplace"
                className="block p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-bold">Marketplace</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-muted-foreground">
                  Buyurtmalarni qabul qilish va buyurtmachili bilan muloqot qilish
                </p>
                <div className="mt-4 text-sm text-muted-foreground">Davomi →</div>
              </Link>

              <Link
                href="/apps/punkt"
                className="block p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-emerald-500" />
                    <h3 className="text-xl font-bold">Punkt</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-muted-foreground">Logistika markazidir, buyurtmalarni koordinatsiya qiladi</p>
                <div className="mt-4 text-sm text-muted-foreground">Davomi →</div>
              </Link>

              <Link
                href="/apps/kontragent"
                className="block p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold">Kontragent</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-muted-foreground">Yetkazib beruvchi, tovarni tayyorlaydi va Punktga topshiradi</p>
                <div className="mt-4 text-sm text-muted-foreground">Davomi →</div>
              </Link>

              <Link
                href="/apps/agent"
                className="block p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-purple-500" />
                    <h3 className="text-xl font-bold">Agent</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-muted-foreground">Yetkazuvchi, buyurtmani oxirgi buyurtmachiga yetkazadi</p>
                <div className="mt-4 text-sm text-muted-foreground">Davomi →</div>
              </Link>
            </div>
          </section>

          {/* Data Flow */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Ma'lumot va To'lovlar Oqimi</h2>
            <div className="p-8 rounded-2xl bg-secondary/30 border border-border space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Buyurtma O'qimi
                </h3>
                <p className="text-sm text-muted-foreground ml-7">
                  Marketplace → Punkt → Kontragent → Agent → Buyurtmachi
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500 transform -rotate-180" />
                  To'lov O'qimi
                </h3>
                <p className="text-sm text-muted-foreground ml-7">
                  Buyurtmachi → Agent → Punkt → Kontragent → Marketplace (Bonus va komissiya)
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500 transform -rotate-180" />
                  Ma'lumot Oqimi
                </h3>
                <p className="text-sm text-muted-foreground ml-7">
                  Real-time barcha stakeholder o'rtasida. Har bir platform o'z ma'lumotlarini o'zgartiradi.
                </p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <section className="space-y-6 p-8 rounded-2xl bg-secondary/30 border border-border">
            <h2 className="text-2xl font-bold">Davom O'qishing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/about"
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium group"
              >
                Loyiha Haqida
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/values"
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium group"
              >
                Maqsad va Qadriyatlar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/apps/marketplace"
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium group"
              >
                Ilovalar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>

          <footer className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <Layout className="w-4 h-4" />
              <span>O'zbekiston, 2026 | TTSA</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-foreground transition-colors">
                Maxfiylik
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Yordam
              </a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
