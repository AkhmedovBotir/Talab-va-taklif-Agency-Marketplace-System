"use client"

import { Building2, Package, QrCode, MapPin, CheckCircle, Users, Zap, AlertCircle, Network } from "lucide-react"

export default function PunktDocs() {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-3 h-3" /> Logistika Markazi
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Punkt Tizimi</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Punkt - bu logistika markazlari uchun boshqaruv tizimi. Bu yerda buyurtmalarni qabul qilasiz, Kontragentlarga
          so'rov yuborasiz, mahsulotlarni saqlaysiz va agentlarga yuborasiz. Punkt TTSA tizimining markaziy bo'limi -
          xabar o'tuvchi.
        </p>
      </section>

      {/* Quick Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl bg-secondary/30 border border-border flex gap-6">
          <div className="p-4 rounded-2xl bg-emerald-500 text-white h-fit shrink-0">
            <Network className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Punkt-to-Punkt Koordinatsiya</h3>
            <p className="text-muted-foreground text-sm">
              Boshqa tumandagi mahsulot kerak bo'lsa, boshqa Punkt'ga so'rov yuborasiz. Shu boshqa Punkt qabul qilsa,
              mahsulot sizga yetkaziladi.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-2xl bg-secondary/30 border border-border flex gap-6">
          <div className="p-4 rounded-2xl bg-blue-500 text-white h-fit shrink-0">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Avtomatik Workflow</h3>
            <p className="text-muted-foreground text-sm">
              Har bir buyurtma avtomatik tugallanadi. Siz faqat tugmani bossangiz, barcha hisob-kitoblar avtomatik.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Core Functions */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Asosiy Funksiyalar</h2>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <Package className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">Buyurtma Qabul Qilish</h3>
                    <p className="text-sm text-muted-foreground">
                      Marketplace orqali buyurtma kelganda, Punkt avtomatik xabar oladi. Buyurtma tafsilotlarini
                      ko'rish, Kontragentga so'rov yuborish, so'rovga javob olish va buyurtmani tasdiqlash.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <Users className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">Kontragent Boshqaruvi</h3>
                    <p className="text-sm text-muted-foreground">
                      Ushbu tumandagi kontragentlarga so'rov yuborish. Qaysi Kontragent qaysi mahsulotni ta'minlay olsa,
                      shunga so'rov yuborish. Ko'p kontragent bor bo'lsa, ko'p so'rov yuborish va eng tezini tanlash
                      mumkin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">Punkt-to-Punkt So'rovlar</h3>
                    <p className="text-sm text-muted-foreground">
                      Ushbu tumandagi kontragentda mahsulot bo'lmasa, boshqa tumandagi Punkt'ga so'rov yuborasiz.
                      Shuning uchun Punkt-to-Punkt so'rovlari jarayoni bor. Har bir so'rovni kuzatish va javob olishni
                      boshqarish.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <Zap className="w-5 h-5 text-purple-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">Agent Boshqaruvi</h3>
                    <p className="text-sm text-muted-foreground">
                      Mahsulot Punkt'ga kelgandan keyin, agentga yuborish vaqti keladi. Qaysi agent yetkazib berishni
                      tanlash, agent ma'lumotlarini yuborish, agent tasdiqlashi uchun kutish.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <QrCode className="w-5 h-5 text-pink-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">KPI va Bonus</h3>
                    <p className="text-sm text-muted-foreground">
                      KPI tizimi - bu Punkt va Agent hisobi. Har bir buyurtmada KPI bonus beriladi. Kontragent, Punkt,
                      Agent - hammasi bonus oladi. KPI balansini kuzatish, transaksiyalar tarixi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Punkt Xodimining Ish Jarayoni</h2>
            <p className="text-muted-foreground">Har bir buyurtma quyidagi bosqichlardan o'tadi:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: "Buyurtma Qabul Qilish",
                  desc: "Marketplace'dan buyurtma keldi, Punkt qabul qiladi",
                  color: "bg-emerald-500",
                },
                {
                  step: "2",
                  title: "Kontragentga So'rov",
                  desc: "Kontragentga mahsulot so'raydi",
                  color: "bg-blue-500",
                },
                {
                  step: "3",
                  title: "Mahsulot Qabul Qilish",
                  desc: "Kontragent mahsulotni yubordi, Punkt qabul qiladi",
                  color: "bg-orange-500",
                },
                {
                  step: "4",
                  title: "Agentga Yuborish",
                  desc: "Agent tanlaydi va buyurtmani yuboradi",
                  color: "bg-purple-500",
                },
              ].map((item) => (
                <div key={item.step} className="p-6 rounded-2xl bg-card border border-border">
                  <div
                    className={`w-10 h-10 ${item.color} text-white rounded-lg flex items-center justify-center font-bold mb-3`}
                  >
                    {item.step}
                  </div>
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 sticky top-24">
            <h4 className="font-bold">Punkt Roli</h4>
            <p className="text-sm text-muted-foreground">Punkt TTSA tizimining markaziy bo'limi - xabar o'tuvchi.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Buyurtma boshqaruvi</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Koordinatsiya</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Mahsulot saqlash</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">KPI hisoblash</span>
              </div>
            </div>
            <hr className="border-border" />
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="text-xs font-bold text-emerald-600">Muhim</div>
              <p className="text-xs text-muted-foreground">
                Punkt o'z tunarmachining markazidir. Tezlik va sifat Punkt'ning tanqida!
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Integration Note */}
      <section className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-emerald-500" />
          <h3 className="text-xl font-bold">TTSA Tizimida Punkt'ning O'rni</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Marketplace → Punkt → Kontragent → Agent yo'lida Punkt - bu ikkinchi bosqich. Buyurtma Marketplace'dan
          kelganda, Punkt qabul qiladi va boshqa har kimni boshqaradi. Kontragent so'rovini yuboradi, Agentga yuboradi.
          Barcha koordinatsiya Punkt orqali bo'ladi. Shuning uchun Punkt tizimi eng muhim bo'lib hisoblanadi.
        </p>
      </section>
    </div>
  )
}
