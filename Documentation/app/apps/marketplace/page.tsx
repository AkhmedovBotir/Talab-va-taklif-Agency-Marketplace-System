"use client"
import { Share2, Zap, ShieldCheck, Search, CreditCard, Package } from "lucide-react"

export default function MarketplaceDocs() {
  return (
    <div className="space-y-16">
      {/* Title & Badge */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider">
          <Share2 className="w-3 h-3" /> Asosiy Platforma
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Bu bizning onlayn do'konimiz. Mijozlar bu yerda mahsulotlarni ko'rib chiqadi, tanlaydi va buyurtma beradi.
          Xuddi oddiy internet do'kondek, lekin bizning tizimimizga biriktirilgan.
        </p>
      </section>

      {/* Quick Stats/Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Tezlik", value: "0.1 soniya", desc: "Buyurtmani qayta ishlash vaqti", icon: Zap },
          { title: "Xavfsizlik", value: "100%", desc: "To'lovlar himoyalangan", icon: ShieldCheck },
          { title: "Mahsulotlar", value: "10,000+", desc: "Turli xil tovarlar", icon: Package },
        ].map((item) => (
          <div key={item.title} className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-3">
            <item.icon className="w-6 h-6 text-primary" />
            <div>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Nima Qilish Mumkin</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Search, text: "Mahsulotlarni qidirish" },
                { icon: Package, text: "Tovarlarni tanlash" },
                { icon: CreditCard, text: "To'lovni amalga oshirish" },
                { icon: Zap, text: "Buyurtmani kuzatish" },
              ].map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm"
                >
                  <feature.icon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Mijozlar Uchun Qulayliklar</h2>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="font-bold mb-2">Tez Qidiruv</h3>
                <p className="text-sm text-muted-foreground">
                  Siz kerakli mahsulotni yozganingizda, bir necha soniya ichida barcha variantlar chiqadi.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="font-bold mb-2">Xavfsiz To'lov</h3>
                <p className="text-sm text-muted-foreground">
                  Karta ma'lumotlari to'liq himoyalangan. Hech kim sizning pullaringizga qo'l tekizmaydi.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
                <h3 className="font-bold mb-2">Buyurtmani Kuzatish</h3>
                <p className="text-sm text-muted-foreground">
                  Buyurtmangiz qayerda ekanligini har daqiqada ko'rib turasiz.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 sticky top-24">
            <h4 className="font-bold">Tezkor Havolalar</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Kirish
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Qulayliklar
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Yordam
              </a>
            </nav>
            <hr className="border-border" />
            <button className="w-full py-2 bg-foreground text-background rounded-lg font-medium text-sm hover:opacity-90 transition-all">
              Marketplacega Kirish
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
