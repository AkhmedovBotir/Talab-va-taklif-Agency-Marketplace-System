"use client"

import { Sidebar } from "@/components/sidebar"
import { motion } from "framer-motion"
import { Target, Heart, Shield, Zap, LayoutGrid, MapPin, Truck, Building, ArrowRight, Share2, Package, Users, Building2, RotateCw, ArrowRightCircle } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">TTSA</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Umumiy Ma'lumot</span>
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
        <div className="max-w-4xl mx-auto px-8 py-16 space-y-24">
          {/* Hero Section */}
          <section className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold tracking-tighter"
            >
              TTSA Ekosistemi <br />
              <span className="text-muted-foreground">Talab va Taklif Savdo Agentligi</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed max-w-2xl"
            >
              Tashqi bozorlarga eksport qilish uchun ishonchliligi yuqori, zamonaviy va xavfsiz savdo tizimi.
              Kontragentlar, logistika markazlari, yetkazib beruvchilar va buyurtmachili bir platforma orqali muammosiz
              ishlaydi.
            </motion.p>
          </section>

          {/* Ecosystem Visualization */}
          <section className="space-y-8">
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <RotateCw className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Tizim Qanday Ishlaydi
              </h2>
            </motion.div>

            <div className="relative p-12 rounded-3xl bg-gradient-to-br from-secondary/50 via-secondary/30 to-secondary/50 border border-border/50 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50"></div>
              
              {/* Header Text */}
              <motion.div
                className="relative z-10 mb-26 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-lg text-muted-foreground/90 font-medium max-w-2xl mx-auto leading-relaxed">
                  TTSA tizimi <span className="text-primary font-semibold">dumaloq ish jarayonida</span>, buyurtmalar va pul har bir bosqichdan o'tadi va davomiy aylanib turadi
                </p>
              </motion.div>
              
              {/* Circular Process Flow */}
              <div className="relative w-full max-w-2xl mx-auto aspect-square">
                {/* Animated Background Glow */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-3xl opacity-30"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    background: "radial-gradient(circle, oklch(0.488 0.243 264.376) 0%, transparent 70%)",
                  }}
                />

                {/* Circular Arrow SVG */}
                <motion.div
                  className="absolute inset-0 w-full h-full z-0"
                  initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <svg
                    className="w-full h-full drop-shadow-2xl"
                    viewBox="0 0 500 500"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <defs>
                      {/* Glow filter */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      
                      {/* Arrow marker */}
                      <marker
                        id="arrowhead-modern"
                        markerWidth="12"
                        markerHeight="12"
                        refX="10"
                        refY="3"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 12 3, 0 6"
                          fill="oklch(0.488 0.243 264.376)"
                          opacity="0.9"
                        />
                      </marker>
                      
                      {/* Enhanced gradient */}
                      <linearGradient id="arrowGradient-modern" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity="0.3" />
                        <stop offset="30%" stopColor="oklch(0.696 0.17 162.48)" stopOpacity="0.5" />
                        <stop offset="60%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    
                    {/* Outer circle track with glow */}
                    <circle
                      cx="250"
                      cy="250"
                      r="180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border opacity-10"
                    />
                    
                    {/* Main animated circular arrow */}
                    <circle
                      cx="250"
                      cy="250"
                      r="180"
                      fill="none"
                      stroke="url(#arrowGradient-modern)"
                      strokeWidth="5"
                      strokeDasharray="1131"
                      strokeDashoffset="1131"
                      strokeLinecap="round"
                      markerEnd="url(#arrowhead-modern)"
                      filter="url(#glow)"
                      style={{
                        animation: "dash 4s linear infinite",
                      }}
                    />
                    
                    {/* Secondary inner arrow for depth */}
                    <circle
                      cx="250"
                      cy="250"
                      r="170"
                      fill="none"
                      stroke="url(#arrowGradient-modern)"
                      strokeWidth="2"
                      strokeDasharray="1068"
                      strokeDashoffset="1068"
                      strokeLinecap="round"
                      opacity="0.4"
                      style={{
                        animation: "dash 3s linear infinite",
                      }}
                    />
                    
                    {/* Animated pulsing dots along the path */}
                    {[0, 90, 180, 270].map((angle, i) => {
                      const x = 250 + 180 * Math.cos((angle - 90) * Math.PI / 180);
                      const y = 250 + 180 * Math.sin((angle - 90) * Math.PI / 180);
                      return (
                        <g key={i} transform={`translate(${x}, ${y})`}>
                          <circle
                            r="8"
                            fill="oklch(0.488 0.243 264.376)"
                            filter="url(#glow)"
                            style={{
                              animation: `pulse-dot 2s ease-in-out infinite`,
                              animationDelay: `${i * 0.5}s`,
                            }}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Process Steps in Circle */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="relative w-full h-full">
                    {/* Step 1 - Top - Marketplace */}
                    <motion.div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      initial={{ opacity: 0, scale: 0.5, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.1, y: -5 }}
                    >
                      <div className="flex flex-col items-center gap-3 group">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl group-hover:bg-blue-500/40 transition-all"></div>
                          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center shadow-xl backdrop-blur-md group-hover:border-blue-400 group-hover:shadow-blue-500/50 transition-all">
                            <Share2 className="w-8 h-8 text-blue-500" />
                          </div>
                        </div>
                        <div className="text-center bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 shadow-lg">
                          <span className="font-bold text-base block text-blue-500">Marketplace</span>
                          <span className="text-xs text-muted-foreground font-medium">Buyurtma boshi</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Step 2 - Right - Punkt */}
                    <motion.div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                      initial={{ opacity: 0, scale: 0.5, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.1, x: 5 }}
                    >
                      <div className="flex flex-col items-center gap-3 group">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/40 transition-all"></div>
                          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border-2 border-emerald-500/50 flex items-center justify-center shadow-xl backdrop-blur-md group-hover:border-emerald-400 group-hover:shadow-emerald-500/50 transition-all">
                            <Building2 className="w-8 h-8 text-emerald-500" />
                          </div>
                        </div>
                        <div className="text-center bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 shadow-lg">
                          <span className="font-bold text-base block text-emerald-500">Punkt</span>
                          <span className="text-xs text-muted-foreground font-medium">Logistika xubi</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Step 3 - Bottom - Kontragent */}
                    <motion.div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.1, y: 5 }}
                    >
                      <div className="flex flex-col items-center gap-3 group">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl group-hover:bg-orange-500/40 transition-all"></div>
                          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/30 border-2 border-orange-500/50 flex items-center justify-center shadow-xl backdrop-blur-md group-hover:border-orange-400 group-hover:shadow-orange-500/50 transition-all">
                            <Package className="w-8 h-8 text-orange-500" />
                          </div>
                        </div>
                        <div className="text-center bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 shadow-lg">
                          <span className="font-bold text-base block text-orange-500">Kontragent</span>
                          <span className="text-xs text-muted-foreground font-medium">Yetkazib berish</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Step 4 - Left - Agent */}
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2"
                      initial={{ opacity: 0, scale: 0.5, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.1, x: -5 }}
                    >
                      <div className="flex flex-col items-center gap-3 group">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl group-hover:bg-purple-500/40 transition-all"></div>
                          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 border-2 border-purple-500/50 flex items-center justify-center shadow-xl backdrop-blur-md group-hover:border-purple-400 group-hover:shadow-purple-500/50 transition-all">
                            <Users className="w-8 h-8 text-purple-500" />
                          </div>
                        </div>
                        <div className="text-center bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 shadow-lg">
                          <span className="font-bold text-base block text-purple-500">Agent</span>
                          <span className="text-xs text-muted-foreground font-medium">Yetkazish</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Center - TTSA Logo/Text */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
                    >
                      <div className="text-center">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"></div>
                          <motion.div
                            className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-2 border-primary/40 flex items-center justify-center shadow-2xl backdrop-blur-md"
                            animate={{
                              boxShadow: [
                                "0 0 20px oklch(0.488 0.243 264.376 / 0.3)",
                                "0 0 40px oklch(0.488 0.243 264.376 / 0.5)",
                                "0 0 20px oklch(0.488 0.243 264.376 / 0.3)",
                              ],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                              TTSA
                            </span>
                          </motion.div>
                        </div>
                        <motion.p
                          className="text-sm text-muted-foreground font-semibold mt-3 flex items-center justify-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <RotateCw className="w-4 h-4 animate-spin" />
                          Dumaloq Jarayon
                        </motion.p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Enhanced Legend */}
              <motion.div
                className="mt-26 flex flex-wrap justify-center gap-4 text-sm relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 shadow-lg backdrop-blur-sm hover:border-blue-400/50 transition-all group">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 group-hover:scale-125 transition-transform"></div>
                  <span className="text-foreground font-semibold">Buyurtmalar</span>
                  <ArrowRightCircle className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 shadow-lg backdrop-blur-sm hover:border-emerald-400/50 transition-all group">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 group-hover:scale-125 transition-transform"></div>
                  <span className="text-foreground font-semibold">Pul oqimi</span>
                  <ArrowRightCircle className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            </div>
          </section>

          {/* Purpose & Values */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-2xl font-bold">Bizning Maqsadimiz</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                O'zbekiston va chet el savdosini oson va ishonchli qilish. Har bir ishtirokchi - kontragent, logistika
                markazlari, hamkorim va yetkazib beruvchilar - o'z ishini samarali bajarishi uchun zarur vositalarni
                taqdim etish.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <Shield className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                  <span className="text-sm">Xavfsizlik - Barcha operatsiyalar tekshirilgan va ishonchli</span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <Zap className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                  <span className="text-sm">Tezlik - Avtomatik qayta ishlash va real-time kuzatuv</span>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-400" />
                <h2 className="text-2xl font-bold">Nima Uchun Ishonchli</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                  <Shield className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-semibold">Halollik</h4>
                    <p className="text-sm text-muted-foreground">
                      Barcha operatsiyalar shaffof va tekshiruvdan o'tgan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                  <Zap className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-semibold">Avtomatlashtirilgan</h4>
                    <p className="text-sm text-muted-foreground">
                      Buyurtmalar va to'lovlar avtomatik yo'naltiriladi, vaqt va xato kamaytiradi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Apps Detailed Section */}
          <section className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-3">Uchta Asosiy Dastur</h2>
              <p className="text-muted-foreground">
                Har bir stakeholder o'z ishini bajarish uchun mahsus dastur va dokumentasiyon:
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: Building,
                  title: "Kontragent",
                  role: "Yetkazib beruvchi",
                  description:
                    "Mahsulotlarni boshqarish, buyurtmalarni qabul qilish, statistika va to'lovlarni kuzatish.",
                  features: ["Mahsulot katalogi", "Buyurtma boshqaruvi", "To'lov statistikasi", "KPI kuzatuv"],
                  color: "bg-purple-500",
                  href: "/apps/kontragent",
                },
                {
                  icon: MapPin,
                  title: "Punkt",
                  role: "Logistika markazi",
                  description:
                    "Buyurtmalarni qabul qilish, kontragentlar va agentlar bilan koordinatsiya, KPI hisoblash.",
                  features: ["Buyurtma workflow", "Punkt-to-punkt koordinatsiya", "KPI tizimlari", "Hisobotlar"],
                  color: "bg-emerald-500",
                  href: "/apps/punkt",
                },
                {
                  icon: Truck,
                  title: "Agent",
                  role: "Yetkazib berish operatisi",
                  description: "Buyurtmalarni yetkazish, to'lovlarni qabul qilish, finance va KPI hisobotlari.",
                  features: ["Buyurtma yetkazish", "Moliya boshqaruvi", "KPI statistikasi", "Real-time xabarnomalar"],
                  color: "bg-orange-500",
                  href: "/apps/agent",
                },
              ].map((app) => (
                <Link
                  key={app.title}
                  href={app.href}
                  className="block p-8 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 hover:bg-secondary/50 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div
                      className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center text-white shrink-0`}
                    >
                      <app.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold">{app.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
                          {app.role}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{app.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {app.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-xs px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/70"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground group-hover:gap-3 transition-all">
                        Dokumentatsiyani o'qish
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Dokumentatsiya Turlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="text-lg font-bold mb-3">Oddiy Foydalanuvchilar Uchun</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Dasturlarni qanday ishlatish, buyurtmalarni kuzatish va muammolarni hal qilish.
                </p>
                <Link href="/docs/user-guide" className="text-sm font-medium text-blue-500 hover:text-blue-600">
                  Foydalanuvchi qo'llanmasi →
                </Link>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="text-lg font-bold mb-3">Dasturchilar Uchun</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  API dokumentatsiyasi, integratsiya qo'llanmalari, texnik arxitektura va kodlar.
                </p>
                <Link
                  href="/tech/integration-diagram"
                  className="text-sm font-medium text-blue-500 hover:text-blue-600"
                >
                  Texnik dokumentatsiya →
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <MapPin className="w-4 h-4" />
              <span>O'zbekiston, 2026 | TTSA</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-foreground transition-colors">
                Maxfiylik
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Yordam
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
