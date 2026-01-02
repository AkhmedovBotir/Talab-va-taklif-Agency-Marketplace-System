"use client"

import { Users, Navigation, Bell, Clock, Star, DollarSign, TrendingUp, AlertCircle, Zap } from "lucide-react"

export default function AgentDocs() {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
          <Users className="w-3 h-3" /> Yetkazib Berish Operatsiyasi
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Agent Ilovasi</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Agent ilovasi - bu yetkazib beruvchilar va kuryerlar uchun telefon dasturi. Bu yerda buyurtmalarni ko'rasiz,
          manzilni topasiz, mijozga chaqirasiz va to'lovni qabul qilasiz. Agent TTSA tizimining oxirgi bosqichi -
          buyurtmani mijozga yetkazuvchi.
        </p>
      </section>

      {/* Quick Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Agent Nima Qiladi</h2>
            <p className="text-muted-foreground mb-6">
              Agent - bu buyurtmani ijara beruvchidan qabul qilib, mijozga yetkazadigan odam. Punkt unga buyurtmani
              beradi, Agent yetkazib beradi va to'lovni qabul qiladi.
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                icon: Navigation,
                title: "Manzilni Topish",
                desc: "Ilova GPS orqali eng qisqa yo'lni ko'rsatadi, Agent adashib qolmaydi",
              },
              {
                icon: Bell,
                title: "Yangi Buyurtmalar",
                desc: "Yangi buyurtma kelganda agentga darhol xabar va eslatma keladi",
              },
              {
                icon: DollarSign,
                title: "To'lov Qabul Qilish",
                desc: "Naqd yoki karta orqali to'lovni qabul qilish, xabar berish",
              },
              {
                icon: TrendingUp,
                title: "KPI va Bonus",
                desc: "Har bir yetkazish uchun KPI bonus olasiz, balans ko'rasiz",
              },
              {
                icon: Clock,
                title: "Ish Vaqti Kuzatuv",
                desc: "Agent nechta vaqt ishladi va nechta buyurtma topshirdi - hammasi ko'rinadi",
              },
              {
                icon: Star,
                title: "Reyting Tizimi",
                desc: "Mijozlar agentni baholaydi. Yaxshi ishlaganlar yuqori reytingga ega bo'ladi",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-2xl bg-secondary/30 border border-border hover:border-orange-500/50 transition-colors"
              >
                <feature.icon className="w-6 h-6 text-orange-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 sticky top-24">
            <h4 className="font-bold">Agent Roli</h4>
            <p className="text-sm text-muted-foreground">
              Agent TTSA tizimining oxirgi bosqichidir - buyurtmani mijozga yetkazuvchi.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Buyurtma qabul qilish</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Manzilga yetkazish</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">To'lov qabul qilish</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Reyting olish</span>
              </div>
            </div>
            <hr className="border-border" />
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 space-y-2">
              <div className="text-xs font-bold text-orange-600">Eslatma</div>
              <p className="text-xs text-muted-foreground">
                Agent roli uchun telefon dasturi kerak. Web emas, mobil ilova!
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Agent Types */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Uchta Xil Agent</h2>
        <p className="text-muted-foreground">
          Agent to'rt darajali tizim bilan ishlaydi - MFY, Tuman, Viloyat, Moliya:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold mb-4">
              M
            </div>
            <h3 className="font-bold mb-2">MFY Agent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mahalla fuqarolari yig'ini agenti. To'lovlarni qabul qiladi, tuman agentga yuboradi.
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>✓ Buyurtma yetkazish</li>
              <li>✓ To'lov qabul qilish</li>
              <li>✓ Statistika ko'rish</li>
              <li>✓ KPI balans</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold mb-4">
              T
            </div>
            <h3 className="font-bold mb-2">Tuman Agent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tuman agenti. MFY agentlardan topshiruvlarni qabul qiladi, viloyat agentga yuboradi.
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>✓ MFY topshiruvlarni qabul</li>
              <li>✓ Viloyatga topshirish</li>
              <li>✓ To'lov statistikasi</li>
              <li>✓ Kunlik hisobot</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold mb-4">
              V
            </div>
            <h3 className="font-bold mb-2">Viloyat Agent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Viloyat agenti. Tuman agentlardan topshiruvlarni qabul qiladi, moliya bo'limiga yuboradi.
            </p>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>✓ Tuman topshiruvlarni qabul</li>
              <li>✓ Moliyaga topshirish</li>
              <li>✓ Balans kuzatuv</li>
              <li>✓ Yuqori darajali hisobot</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Finance Management */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-2">Moliya Boshqaruvi</h2>
        <p className="text-muted-foreground">
          Agent dasturi MFY, Tuman va Viloyat agentlar uchun moliya boshqaruv funksiyalari bilan:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <h3 className="font-bold mb-3">Kunlik Hisobot</h3>
            <p className="text-sm text-muted-foreground">
              Har kun nechta buyurtma qabul qilindi, qancha pul to'landi, qancha kutilmoqda - hammasi ko'rinadi.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <h3 className="font-bold mb-3">To'lovlar Boshqaruvi</h3>
            <p className="text-sm text-muted-foreground">
              To'langan va to'lanmagan to'lovlar. Tanlash, topshirish, tasdiqlash va statistika.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <h3 className="font-bold mb-3">KPI va Bonus</h3>
            <p className="text-sm text-muted-foreground">
              Har bir buyurtmada KPI bonus. Kunlik balans, transaksiyalar tarixi, to'langan bonuslar.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
            <h3 className="font-bold mb-3">Topshiruvlar Zanjiri</h3>
            <p className="text-sm text-muted-foreground">
              MFY → Tuman → Viloyat → Moliya. Har bir bosqichda tasdiqlash va kuzatuv.
            </p>
          </div>
        </div>
      </section>

      {/* Integration Note */}
      <section className="p-8 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          <h3 className="text-xl font-bold">TTSA Tizimida Agent'ning O'rni</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Marketplace → Punkt → Kontragent → Agent - bu buyurtmaning oxirgi bosqichidir. Agent buyurtmani mijozga
          yetkazuvchi. Punkt agentga buyurtmani beradi, Agent yetkazadi va to'lovni qabul qiladi. Agent to'lovni hisobi
          bo'lgan tuman agentga yuboradi. Tuman agenti viloyat agentga yuboradi. Viloyat agenti moliya bo'limiga
          yuboradi. Dumaloq jarayon!
        </p>
      </section>
    </div>
  )
}
