"use client"

import { Sidebar } from "@/components/sidebar"
import { motion } from "framer-motion"
import { BookOpen, ArrowRight, CheckCircle2, Users, Globe, Zap, Calendar, Rocket, Code, Building2, Smartphone, ShoppingCart, Sparkles } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">TTSA</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Loyiha haqida</span>
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
        <div className="max-w-4xl mx-auto px-8 py-16 space-y-16">
          {/* Hero Section */}
          <section className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold tracking-tighter"
            >
              Loyiha Haqida
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed max-w-3xl"
            >
              TTSA (Talab va Taklif Savdo Agentligi) - O'zbekiston va xorijiy bozorlarga eksport qilishni
              osonlashtiruvchi zamonaviy, ishonchli va xavfsiz savdo tizimi. Bu loyiha kontragentlar, logistika
              markazlari, yetkazib beruvchilar va buyurtmachililarni bitta platforma orqali bog'laydi.
            </motion.p>
          </section>

          {/* Project Genesis */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-3xl font-bold">Loyihaning Qo'yilishi</h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="text-xl font-bold mb-3">Muammo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  O'zbekistonda savdo tizimi ko'p narsada qo'ldan boshqariladi, bu esa xatalar, kechiktirishlar va
                  ishonchsizlikni keltirib chiqaradi. Xorijiy bozorlarga eksport qilish esa yanada murakkabroq va vaqt
                  talab qiladi.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="text-xl font-bold mb-3">Yechim</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Markupida har bir qadam avtomatik qayta ishlaydi, barcha stakeholderlar real-time ma'lumot oladi va
                  buyurtmalar xavfsiz tarzda ketadi. TTSA tizimi dumaloq ish jarayonida ishlaydi, bu esa samaradorlikni
                  ko'taradi.
                </p>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Asosiy Xususiyatlari</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Avtomatlashtirilgan Jarayon",
                  description: "Buyurtmalar va pul avtomatik yo'naltiriladi, inson xatosi kamaytiradi.",
                },
                {
                  icon: CheckCircle2,
                  title: "Real-time Kuzatuv",
                  description: "Har bir bosqichda buyurtmaning holatini darhol bilish mumkin.",
                },
                {
                  icon: Users,
                  title: "Hammasini Bog'lash",
                  description: "Kontragent, Punkt, Agent va Marketplace bitta tizimda ishlaydi.",
                },
                {
                  icon: Globe,
                  title: "Xorijiy Bozorlarga Tayyorlangan",
                  description: "Tashqi bozorlarga eksport qilish uchun zarur barcha funksiyalar mavjud.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <feature.icon className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="space-y-8">
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Rivojlanish Bosqichlari
              </h2>
            </motion.div>

            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-secondary/50 via-secondary/30 to-secondary/50 border border-border/50 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50"></div>
              
              <div className="relative z-10 space-y-0">
                {[
                  {
                    phase: "Boshlang'ich",
                    title: "Loyihaning Tayyorlash",
                    description: "TTSA tizimining arxitekturasi va tasdiqi",
                    icon: Rocket,
                    color: "from-blue-500/20 to-blue-600/30",
                    borderColor: "border-blue-500/50",
                    iconColor: "text-blue-500",
                    phaseColor: "text-blue-500",
                    glowColor: "bg-blue-500/20",
                  },
                  {
                    phase: "Birinchi bosqich",
                    title: "Kontragent Dasturi",
                    description: "Yetkazib beruvchilar uchun dastur ishlab chiqilishi",
                    icon: Building2,
                    color: "from-purple-500/20 to-purple-600/30",
                    borderColor: "border-purple-500/50",
                    iconColor: "text-purple-500",
                    phaseColor: "text-purple-500",
                    glowColor: "bg-purple-500/20",
                  },
                  {
                    phase: "Ikkinchi bosqich",
                    title: "Punkt Tizimi",
                    description: "Logistika markazlari uchun boshqaruv tizimi",
                    icon: Code,
                    color: "from-emerald-500/20 to-emerald-600/30",
                    borderColor: "border-emerald-500/50",
                    iconColor: "text-emerald-500",
                    phaseColor: "text-emerald-500",
                    glowColor: "bg-emerald-500/20",
                  },
                  {
                    phase: "Uchinchi bosqich",
                    title: "Agent Platforma",
                    description: "Yetkazuvchilar uchun mobile dastur",
                    icon: Smartphone,
                    color: "from-orange-500/20 to-orange-600/30",
                    borderColor: "border-orange-500/50",
                    iconColor: "text-orange-500",
                    phaseColor: "text-orange-500",
                    glowColor: "bg-orange-500/20",
                  },
                  {
                    phase: "To'ldirish",
                    title: "Marketplace Integratsiyasi",
                    description: "Buyurtmachi platformasining to'liq integratsiyasi",
                    icon: ShoppingCart,
                    color: "from-pink-500/20 to-pink-600/30",
                    borderColor: "border-pink-500/50",
                    iconColor: "text-pink-500",
                    phaseColor: "text-pink-500",
                    glowColor: "bg-pink-500/20",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="relative flex gap-6 group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        {/* Glow effect */}
                        <div className={`absolute inset-0 rounded-full ${item.glowColor} blur-xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        
                        {/* Icon Circle */}
                        <motion.div
                          className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} border-2 ${item.borderColor} flex items-center justify-center shadow-xl backdrop-blur-md group-hover:shadow-2xl group-hover:scale-110 transition-all z-10`}
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                        </motion.div>
                        
                        {/* Number badge */}
                        <motion.div
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-black shadow-lg z-10"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                        >
                          {index + 1}
                        </motion.div>
                      </div>
                      
                      {/* Connecting Line */}
                      {index !== 4 && (
                        <motion.div
                          className="w-0.5 h-20 my-4 bg-gradient-to-b from-border via-border/50 to-transparent"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        />
                      )}
                    </div>

                    {/* Content Card */}
                    <motion.div
                      className="flex-1 pb-8 group-hover:translate-x-2 transition-transform"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.1 }}
                    >
                      <div className="p-6 rounded-2xl bg-background/60 backdrop-blur-md border border-border/50 shadow-lg group-hover:shadow-xl group-hover:border-foreground/20 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className={`w-4 h-4 ${item.iconColor} opacity-70`} />
                          <span className={`text-xs font-bold ${item.phaseColor} uppercase tracking-wider`}>
                            {item.phase}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="space-y-6 p-8 rounded-2xl bg-secondary/30 border border-border">
            <h2 className="text-2xl font-bold">Keyingi Qadamlar</h2>
            <p className="text-muted-foreground">
              TTSA tizimi haqida ko'proq ma'lumot olish uchun quyidagi bo'limlarni o'qing:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/values"
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium group"
              >
                Maqsad va Qadriyatlar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/ecosystem"
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium group"
              >
                Ekotizim Strukturasi
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
              <BookOpen className="w-4 h-4" />
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
