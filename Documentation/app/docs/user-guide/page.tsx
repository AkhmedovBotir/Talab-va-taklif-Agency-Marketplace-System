"use client"
import { BookOpen, Smartphone, Check, AlertCircle, HelpCircle, Lock, Clock, DollarSign } from "lucide-react"

export default function UserGuide() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3 h-3" /> Foydalanuvchi Qo'llanmasi
        </div>
        <h1 className="text-5xl font-bold tracking-tight">TTSA Tizimini Qanday Ishlatish</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Siz qaysi xil foydalanuvchi bo'lishingizdan qat'i nazar, bu qo'llanmada TTSA tizimini qanday ishlatishni sodda
          tilda tushuntirapmiz. Texnik so'zlar yo'q, faqat amaliy maslahatlar.
        </p>
      </section>

      {/* User Types */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">Siz Qaysi Xil Foydalanuvchi?</h2>
        <p className="text-muted-foreground">
          TTSA tizimida to'rt xil foydalanuvchi bor. Har biri o'z ishini bajaradi:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              name: "Miyoz",
              desc: "Tovarni buyurtma qiladigan odamlar",
              app: "Marketplace",
              features: ["Tovarlarni qidirish", "Buyurtma berish", "To'lov qilish", "Buyurtmani kuzatish"],
              icon: "🛍️",
              color: "bg-blue-500/10 border-blue-500/30",
            },
            {
              name: "Punkt Xodimi",
              desc: "Do'kon yoki omborxonada ishlaydiganlar",
              app: "Punkt Ilovasi",
              features: ["Buyurtmani qabul qilish", "QR kod skaner qilish", "Mahsulotni tekshirish", "Agentga berish"],
              icon: "📦",
              color: "bg-emerald-500/10 border-emerald-500/30",
            },
            {
              name: "Kontragent",
              desc: "Yetkazib beruvchi kompaniyalar",
              app: "Kontragent Portali",
              features: ["Mahsulot boshqaruvi", "Buyurtma javob", "Statistika", "To'lov kuzatuv"],
              icon: "🏢",
              color: "bg-purple-500/10 border-purple-500/30",
            },
            {
              name: "Agent",
              desc: "Yetkazib beruvchi va kuryerlar",
              app: "Agent Ilovasi",
              features: ["Buyurtma qabul qilish", "Manzilni topish", "To'lov qabul qilish", "KPI kuzatish"],
              icon: "🚚",
              color: "bg-orange-500/10 border-orange-500/30",
            },
          ].map((user) => (
            <div key={user.name} className={`p-6 rounded-2xl border ${user.color}`}>
              <div className="text-4xl mb-3">{user.icon}</div>
              <h3 className="text-xl font-bold mb-1">{user.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{user.desc}</p>
              <div className="p-3 rounded-lg bg-background/50 border border-border mb-4 text-xs font-bold">
                {user.app}
              </div>
              <ul className="space-y-2">
                {user.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs">
                    <Check className="w-3 h-3 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Started */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">
          Boshlash Yo'li (Barcha Foydalanuvchilar Uchun)
        </h2>
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Ro'yxatdan O'tish",
              desc: "Telefon raqamingizni kiritingiz. SMS kod yuboriladi, kodni tasdiqlang.",
              tips: ["Haqiqiy telefon raqamini kiriting", "SMS kodni 5 daqiqada kiritishingiz kerak"],
            },
            {
              step: "2",
              title: "Parol O'rnatish",
              desc: "Yangi parol o'rnating. Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
              tips: ["Oson va eslash mumkin parol qo'ying", "Parolni kimga ham ayting"],
            },
            {
              step: "3",
              title: "Qurilma Tasdiqlash",
              desc: "Yangi qurilmada kirish uchun SMS kodni kiriting. Bu xavfsizlik uchun.",
              tips: ["Barcha qurilmalarni tasdiqlang", "O'z qurilmalaringizni bilasiz"],
            },
            {
              step: "4",
              title: "Profil To'ldirish",
              desc: "O'zingiz haqida ma'lumot kiritingiz. Agar Kontragent bo'lsangiz, mahsulot qo'shing.",
              tips: ["To'g'ri ma'lumot kiritingiz", "Profil rasmini qo'shing (ixtiyoriy)"],
            },
          ].map((item) => (
            <div key={item.step} className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center font-bold shrink-0">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                  <div className="bg-background/50 rounded-lg p-3 border border-border text-xs space-y-1">
                    {item.tips.map((tip) => (
                      <div key={tip} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role-Specific Guides */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">Rolga Bog'liq Qo'llanmalar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              role: "Mijoz",
              guide: [
                "Marketplace'da mahsulotlarni qidiring",
                "Faqat tanagan mahsulotlarni savatchiga qo'shing",
                "To'lov usulini tanlang (naqd yoki karta)",
                "Manzil va telefon raqamini to'g'ri kiritingiz",
                "Buyurtmani yakuniy qilmadan avval tekshiring",
                "Buyurtma berganingizdan keyin xabar kutish kerak",
              ],
            },
            {
              role: "Punkt Xodimi",
              guide: [
                "Har safar dasturga kirish uchun parolni kiritingiz",
                "Buyurtmalar bo'limiga o'ting va yangi buyurtmalarni ko'ring",
                "Yangi buyurtma kelganda xabar qabul qilasiz",
                "QR kodni skaner qilish orqali buyurtmani tizimga kiriting",
                "Mahsulotni tekshiring va miqdorini hisoblang",
                "Hammasi to'g'ri bo'lsa, agentga berishga tayyorlang",
              ],
            },
            {
              role: "Kontragent",
              guide: [
                "Profil bo'limidan kompaniya ma'lumotlarini kiriting",
                "Mahsulot katalogida mahsulot qo'shing",
                "Har mahsulotga narx va miqdor kiritingiz",
                "Mahsulot rasmini yuklab qo'ying",
                "Haftada kamida bir marta statistikani ko'ring",
                "To'lovlar bo'limida, muddat o'tgan to'lovlarni bilang",
              ],
            },
            {
              role: "Agent",
              guide: [
                "Sabah ilovani ochib, yangi buyurtmalarni ko'ring",
                "Manzilni ko'rish uchun navigatsiyani oching",
                "Mijozga chaqirib, yaqinlashayotganingizni ayting",
                "Mahsulotni berganingizdan keyin to'lovni qabul qiling",
                "Appda to'lov statusini 'to'langan' deb belgilang",
                "Kunagi tugallangan buyurtmalarni statistikada ko'ring",
              ],
            },
          ].map((item) => (
            <div key={item.role} className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <h3 className="text-lg font-bold">{item.role}</h3>
              <ol className="space-y-2">
                {item.guide.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="font-bold text-muted-foreground shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ & Troubleshooting */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">Tez-Tez Soʻraladigan Savollar</h2>
        <div className="space-y-4">
          {[
            {
              q: "Parolimni unutdim, nima qilsam?",
              a: "Kirish sahifasida 'Parolni unutdim' tugmasini bosing. Telefon raqamingizni kiritingiz, SMS kod keladi, yangi parol o'rnating.",
              icon: Lock,
            },
            {
              q: "Yangi qurilmada kirish qanday?",
              a: "Telefon raqam va parolni kiritingiz. SMS kod yuboriladi, kodni tasdiqlang. Bu birinchi marta bo'lsa, qurilmani tasdiqlash kerak.",
              icon: Smartphone,
            },
            {
              q: "Buyurtmani qayta berish/bekor qilish mumkinmi?",
              a: "Buyurtma berish vaqtidaasiz bekor qilishingiz mumkin. Lekin berganingizdan keyin, punkt yoki agent bilan aloqa qiling.",
              icon: AlertCircle,
            },
            {
              q: "KPI bonus nima va uni qanday qayd qilasan?",
              a: "KPI bonus - bu har bir mahsulot satilsa berilgan pul. Avtomatik qayd etiladi. Kontragent va Agent portallarda ko'rasiz.",
              icon: DollarSign,
            },
            {
              q: "Intervyu qancha vaqt ishlaydi?",
              a: "Avtomatik. Agent buyurtmani yetkazib bersa darhol davom etadi. Oqib xabar qancha vaqt bo'lishini eng ishonchli ombordan so'rasin.",
              icon: Clock,
            },
            {
              q: "Agar ilova yangilanmasa?",
              a: "App store yoki Google Play'dan eng oxirgi versiyani yuklab oling. Agar bu ham ishlamasa, dasturni o'chirib qayta o'rnatish kerak.",
              icon: HelpCircle,
            },
          ].map((item) => (
            <div key={item.q} className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Best Practices */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b border-border pb-4">Yaxshi Amallar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Xavfsizlik",
              tips: [
                "Parolni kimga ham ayting",
                "Har oy parol o'zgartiring",
                "Bilinmagan qurilmalarni tasdiqlang",
                "Tizimdan chiqish uchun logout bosing",
              ],
            },
            {
              title: "Qulaylik",
              tips: [
                "Profilni to'liq to'ldiring",
                "Kontaktlaringizni saqlab qo'ying",
                "Internet ulanishini tekshiring",
                "Ilovani qayta ishga tushing kun boshida",
              ],
            },
            {
              title: "Samaradorik",
              tips: [
                "Har kuni ilovani oching",
                "Yangi buyurtmalarni darhol ko'rish",
                "Xabarlarni o'qiyingiz",
                "Statistikani haftalik ko'ring",
              ],
            },
            {
              title: "Muammo Hal Qilish",
              tips: [
                "Birinchi, ilovani qayta ishga tushing",
                "Internet ulanishini tekshiring",
                "Parolni noto'g'ri kiritmasligingizni tekshiring",
                "Yordam xizmati bilan bog'laning",
              ],
            },
          ].map((section) => (
            <div key={section.title} className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-4">
              <h3 className="text-lg font-bold">{section.title}</h3>
              <ul className="space-y-2">
                {section.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 space-y-4">
        <div className="flex items-start gap-4">
          <HelpCircle className="w-6 h-6 text-green-500 shrink-0" />
          <div>
            <h3 className="text-xl font-bold mb-2">Yangi Muammo?</h3>
            <p className="text-muted-foreground mb-4">
              Agar siz biror muammoga duch kelsangiz, zerikarli bo'lmang. Yordam xizmati siz uchun tayyor.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-lg bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity">
                Yordam Xizmati Chaqirish
              </button>
              <button className="px-4 py-2 rounded-lg bg-background border border-border font-bold text-sm hover:bg-secondary transition-colors">
                FAQ O'qish
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
