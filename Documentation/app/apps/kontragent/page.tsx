"use client"

import { Briefcase, BarChart3, TrendingUp, Package, ShoppingCart, AlertCircle, Zap } from "lucide-react"

export default function KontragentDocs() {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold uppercase tracking-wider">
          <Briefcase className="w-3 h-3" /> Yetkazib Beruvchi Portali
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Kontragent Dasturi</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Kontragent dasturi - bu yetkazib beruvchi kompaniyalar uchun boshqaruv tizimi. Bu yerda o'z mahsulotlaringizni
          katalog qilasiz, buyurtmalarni boshqarasiz va sotuvlar statistikasini ko'rasiz. TTSA tizimida Kontragent - bu
          yetkazib berish jarayonining asosiy bosqichidir.
        </p>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Mahsulot Katalogi", desc: "5000+ mahsulotni boshqaring", color: "text-purple-500" },
          { icon: ShoppingCart, label: "Buyurtmalar", desc: "Real-time buyurtma axbori", color: "text-blue-500" },
          {
            icon: BarChart3,
            label: "Sotuvlar Analitikasi",
            desc: "Oylik va yillik natijalar",
            color: "text-emerald-500",
          },
          { icon: TrendingUp, label: "KPI Kuzatuv", desc: "Daromad va bonus hisoblash", color: "text-orange-500" },
        ].map((item) => (
          <div
            key={item.label}
            className="p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-all"
          >
            <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
            <div className="font-bold text-sm mb-1">{item.label}</div>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Core Functions */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Asosiy Funksiyalar</h2>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <Package className="w-5 h-5 text-purple-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">Mahsulot Boshqaruvi</h3>
                    <p className="text-sm text-muted-foreground">
                      Yangi mahsulot qo'shish, tavsif yozish, rasmlar yuklash, narxlarni o'rnatish. Har bir mahsulotning
                      miqdori, status (faol/o'chirilgan) va yetkazish hududlarini boshqaring.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">Katalog</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">Narxlar</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">Miqdor</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <ShoppingCart className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">Buyurtma Boshqaruvi</h3>
                    <p className="text-sm text-muted-foreground">
                      Bugungi buyurtmalarni ko'rish, filtrlash va statuslarni yangilash. Contragent Punkt orqali so'rov
                      olsa, uni qabul qilish yoki rad etishingiz mumkin. Buyurtma tugallangandan keyin to'lov holatini
                      kuzating.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">Qabul qilish</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">Filtrash</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">Kuzatish</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <BarChart3 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">Statistika va Hisobotlar</h3>
                    <p className="text-sm text-muted-foreground">
                      Jami buyurtmalar soni, qabul qilingan buyurtmalar, rad etilganlar, yetkazilganlar. Oylik
                      statistika, daromad, KPI bonus foizlari. To'lov holati (to'langan/to'lanmagan), muddat o'tganligi.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">Oylik</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">Daromad</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">KPI</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">KPI va Bonus Hisoblash</h3>
                    <p className="text-sm text-muted-foreground">
                      Har bir mahsulotga KPI bonus foizi berilgan. Har qancha satsangiz, shuncha bonus foizini qayd
                      qilamiz. KPI balansi, transaksiyalar tarixi, to'langan va to'lanmagan bonuslar.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600">Bonus</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600">Balans</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600">Tarikh</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Buyurtma Ish Jarayoni</h2>
            <p className="text-muted-foreground">Kontragentda buyurtmalar quyidagi ketma-ketlikda boshqariladi:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm font-bold text-purple-500 mb-2">1-bosqich</div>
                <h4 className="font-bold mb-2">Punkt so'roviga javob</h4>
                <p className="text-xs text-muted-foreground">
                  Punkt buyurtma uchun mahsulot so'raydi, siz qabul qilasiz yoki rad etasiz.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm font-bold text-purple-500 mb-2">2-bosqich</div>
                <h4 className="font-bold mb-2">Mahsulot tayyorlash</h4>
                <p className="text-xs text-muted-foreground">
                  Mahsulotni tayyorlaysiz, qadoqlaysiz va Punkt'ga yuborasiz.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm font-bold text-purple-500 mb-2">3-bosqich</div>
                <h4 className="font-bold mb-2">Punkt qabul qildi</h4>
                <p className="text-xs text-muted-foreground">
                  Punkt mahsulotni qabul qilgan deb xabar beradi, siz tasdiqlaysiz.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm font-bold text-purple-500 mb-2">4-bosqich</div>
                <h4 className="font-bold mb-2">To'lov</h4>
                <p className="text-xs text-muted-foreground">
                  Buyurtma tugallangandan keyin to'lov qilinadi, KPI bonus qayd etiladi.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 sticky top-24">
            <h4 className="font-bold">Kontragent Roli</h4>
            <p className="text-sm text-muted-foreground">
              Kontragent - bu TTSA tizimida yetkazib berish jarayonining uchinchi bosqichidir.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Mahsulot yuborish</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Sifat tekshiruv</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">To'lov kuzatuv</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">KPI bonus</span>
              </div>
            </div>
            <hr className="border-border" />
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-2">
              <div className="text-xs font-bold text-purple-600">Eslatma</div>
              <p className="text-xs text-muted-foreground">
                Barcha buyurtmalar Punkt orqali boshqariladi. To'g'ri vaqtda jo'natish juda muhim!
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Integration Note */}
      <section className="p-8 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold">TTSA Tizimida Kontragentning O'rni</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          TTSA tizimida buyurtma quyidagi yo'ldan o'tadi: Marketplace → Punkt → Kontragent → Agent. Kontragent yetkazib
          beruvchilar uchun mo'ljallangan. Agar siz mahsulot yuborsangiz, Punkt qabul qiladi. Agentga yuborishdan oldin
          Punkt size so'rov yuboradi. Siz tasdiqlasa, mahsulot Agent orqali mijozga yetkaziladi. Ko'rib turganingizdek,
          barcha ishlar bir-biriga bog'langan.
        </p>
      </section>
    </div>
  )
}
