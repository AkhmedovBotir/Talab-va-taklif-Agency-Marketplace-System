import { Package, Store, Truck, Users } from 'lucide-react'
import { AnimateIn } from './AnimateIn'

const roles = [
  {
    title: 'Xaridorlar',
    desc: 'Uyda qulay xarid, aniq narxlar, buyurtma holatini kuzatish va mahalladagi do\'konlarga ham, katta bozorga ham kirish.',
    Icon: Users,
    iconClass: 'bg-orange-500/20 text-orange-200',
  },
  {
    title: 'Mahalladagi do\'konlar',
    desc: 'Mahsulotlarini onlayn ko\'rsatish, buyurtmalarni qabul qilish va o\'z kuryerlari orqali mijozlarga yetkazish.',
    Icon: Store,
    iconClass: 'bg-emerald-500/20 text-emerald-200',
  },
  {
    title: 'Yetkazib beruvchilar',
    desc: 'Katta hajmdagi mahsulotlarni tayyorlash va punkt orqali tizimga ulash — ko\'proq mijozga yetishish imkoniyati.',
    Icon: Package,
    iconClass: 'bg-white/15 text-white',
  },
  {
    title: 'Yetkazib beruvchi xizmat',
    desc: 'Buyurtmalarni qabul qilish, yetkazish va to\'lovni qayta ishlash — hammasi tartibli va nazorat ostida.',
    Icon: Truck,
    iconClass: 'bg-white/15 text-white',
  },
]

export function ForEveryone() {
  return (
    <section
      id="hamkorlar"
      className="bg-gradient-to-b from-gray-900 via-gray-900 to-orange-950 py-20 text-white md:py-28"
    >
      <div className="mx-auto max-w-6xl px-5">
        <AnimateIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-400">
            Keng tarmoq
          </p>
          <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
            Kimlar TTSA Marketda ishlaydi?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Bu faqat xaridorlar uchun emas — butun mahalla va tuman iqtisodiyotiga foyda
            keltiradigan ekotizim.
          </p>
        </AnimateIn>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {roles.map((r, i) => (
            <AnimateIn key={r.title} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition hover:border-orange-500/30 hover:bg-white/10">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${r.iconClass}`}
                >
                  <r.Icon size={24} strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-xl font-bold">{r.title}</h3>
                <p className="mt-3 leading-relaxed text-gray-300">{r.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn className="mt-12 text-center">
          <p className="text-gray-400">
            Biznes sifatida hamkorlik qilmoqchimisiz?{' '}
            <a
              href="https://market.ttsa.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-orange-400 underline decoration-orange-500/50 underline-offset-4 transition hover:text-orange-300"
            >
              Market ilovasida so&apos;rov yuboring
            </a>
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
