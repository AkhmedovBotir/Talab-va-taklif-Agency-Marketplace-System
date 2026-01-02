"use client"

import { Sidebar } from "@/components/sidebar"
import { motion } from "framer-motion"
import { Heart, Shield, Zap, Globe, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ValuesPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">TTSA</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Maqsad va Qadriyatlar</span>
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
              Maqsad va Qadriyatlar
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed max-w-3xl"
            >
              TTSA tizimi uchta asosiy qadriyat va bitta katta maqsad atrofida qurilgan. Bu qadriyatlar har bir qaror va
              harakat bilan aks ettiriladi.
            </motion.p>
          </section>

          {/* Main Purpose */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5" />
              <h2 className="text-3xl font-bold">Asosiy Maqsad</h2>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/20">
              <p className="text-lg text-muted-foreground leading-relaxed">
                O'zbekiston savdosini global bozorlarga oching, mahalliy bizneslarning xorijiy bozorlarda raqobatbardosh
                bo'lishiga yordam ber va har bir stakeholder o'z sharoitida samarali ishlashi mumkin bo'lgan zamonaviy,
                avtomatik tizim yaratish.
              </p>
            </div>
          </section>

          {/* Core Values */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Uchta Asosiy Qadriyat</h2>

            <div className="space-y-6">
              {[
                {
                  icon: Heart,
                  title: "Halollik (Honesty)",
                  color: "from-red-500/10 to-pink-500/10",
                  borderColor: "border-red-500/20",
                  textColor: "text-red-500",
                  description: "Barcha operatsiyalar shaffof, tekshirilgan va haqiqiy.",
                  details: [
                    "Har bir tranzaksiya qayd etiladi",
                    "Sahih ma'lumot har vaqt mavjud",
                    "Foydalanuvchilar o'zlarining hisobtasini ko'rishi mumkin",
                    "Hech qanday yashiringan to'lovlar yo'q",
                  ],
                },
                {
                  icon: Shield,
                  title: "Xavfsizlik (Security)",
                  color: "from-orange-500/10 to-yellow-500/10",
                  borderColor: "border-orange-500/20",
                  textColor: "text-orange-500",
                  description: "Barcha ma'lumot va to'lovlar eng yuqori xavfsizlik standartiga asosan o'tadi.",
                  details: [
                    "Shifrlangan tranzaksiyalar",
                    "Identifikatsiya tekshiruvi",
                    "Noto'g'ri foydalanishni monitoringi",
                    "Qonuniy to'lov to'sigi",
                  ],
                },
                {
                  icon: Zap,
                  title: "Avtomatlashtirilgan (Automation)",
                  color: "from-emerald-500/10 to-teal-500/10",
                  borderColor: "border-emerald-500/20",
                  textColor: "text-emerald-500",
                  description: "Buyurtmalar, to'lovlar va ma'lumotlar avtomatik ravishda lo'nda ishlaydi.",
                  details: [
                    "Vaqt sezimlari kamaytiradi",
                    "Inson xatosini bartaraf etadi",
                    "Samaradorlikni ko'taradi",
                    "Real-time yangilanishlar",
                  ],
                },
              ].map((value) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`p-8 rounded-2xl bg-gradient-to-br ${value.color} border ${value.borderColor} hover:border-foreground/20 transition-all`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <value.icon className={`w-8 h-8 ${value.textColor} shrink-0`} />
                    <div>
                      <h3 className="text-2xl font-bold">{value.title}</h3>
                      <p className="text-muted-foreground mt-1">{value.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {value.details.map((detail) => (
                      <div key={detail} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-2 shrink-0" />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* How Values Manifest */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Qadriyatlar Qanday Aks Ettiriladi</h2>

            <div className="space-y-4">
              {[
                {
                  role: "Kontragent (Yetkazib beruvchi)",
                  values:
                    "Halollik: Tovar haqida aniq ma'lumot berish | Xavfsizlik: O'z hisobini tekshirish | Avtomatlashtirilgan: To'lovlarni avtomatik qabul qilish",
                },
                {
                  role: "Punkt (Logistika markazi)",
                  values:
                    "Halollik: Buyurtmalarni aniq qaydga olish | Xavfsizlik: Ma'lumotlarning to'g'riligi | Avtomatlashtirilgan: Operatsiyalarni tezlash",
                },
                {
                  role: "Agent (Yetkazuvchi)",
                  values:
                    "Halollik: Buyurtmalarni vaqtida yetkazish | Xavfsizlik: To'lovlarni xavfsiz o'tkazish | Avtomatlashtirilgan: KPI avtomatik hisoblanishi",
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className="p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all"
                >
                  <h4 className="font-bold mb-3">{item.role}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.values}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Impact */}
          <section className="space-y-8 p-8 rounded-2xl bg-secondary/30 border border-border">
            <h2 className="text-2xl font-bold">Qadriyatlarning Tasiri</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { number: "100%", label: "Shaffoflik", description: "Barcha operatsiyalar qayd etiladi" },
                { number: "0", label: "Xatolar", description: "Avtomatlashtirilgan sistem xatolar kamaytiradi" },
                { number: "3x", label: "Tezlik", description: "Qo'ldan boshqarilganga qaraganda tezroq" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-blue-500 mb-2">{stat.number}</div>
                  <div className="font-semibold mb-1">{stat.label}</div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Next Steps */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Davom O'qishing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/about"
                className="p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold mb-2">Loyiha Haqida</h3>
                    <p className="text-sm text-muted-foreground">TTSA tizimining asosi va rivojlanishi</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link
                href="/ecosystem"
                className="p-6 rounded-2xl bg-secondary/30 border border-border hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold mb-2">Ekotizim Strukturasi</h3>
                    <p className="text-sm text-muted-foreground">Qanday ishlashidan tushunish</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </section>

          <footer className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <Heart className="w-4 h-4" />
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
