import {
  Clock,
  Heart,
  MapPinned,
  ShieldCheck,
  ShoppingBag,
  Wallet,
} from 'lucide-react'
import { AnimateIn } from './AnimateIn'

const benefits = [
  {
    title: 'Yaqin va tez',
    desc: 'Mahallangizdagi do\'konlar va mahalliy yetkazuvchilar tufayli kutish vaqti qisqaradi.',
    Icon: Clock,
  },
  {
    title: 'Ishonchli tarmoq',
    desc: 'Har bir buyurtma punkt va yetkazuvchilar zanjiri orqali o\'tadi — siz har doim nima bo\'layotganini bilasiz.',
    Icon: ShieldCheck,
  },
  {
    title: 'Keng tanlov',
    desc: 'Kundalik oziq-ovqatdan tortib uy-ro\'zg\'or buyumlarigacha — bitta ilovada ikkala bozor ham mavjud.',
    Icon: ShoppingBag,
  },
  {
    title: 'O\'zbek tilida',
    desc: 'Interfeys va xabarlar sizga tushunarli tilda — qo\'shimcha murakkabliksiz.',
    Icon: MapPinned,
  },
  {
    title: 'Mahallani qo\'llab-quvvatlash',
    desc: 'Xaridingiz yaqin do\'konlarga va mahalliy tadbirkorlarga yordam beradi.',
    Icon: Heart,
  },
  {
    title: 'Qulay to\'lov',
    desc: 'Yetkazib berish paytida to\'lov — siz oldindan pul o\'tkazmasdan ham buyurtma bera olasiz.',
    Icon: Wallet,
  },
]

export function Benefits() {
  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <AnimateIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
            Nima uchun biz?
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
            TTSA Market afzalliklari
          </h2>
        </AnimateIn>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <AnimateIn key={b.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-orange-200">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
                  <b.Icon size={22} strokeWidth={2} />
                </span>
                <div className="mb-4 mt-4 h-1 w-10 rounded-full bg-orange-500 transition group-hover:w-14" />
                <h3 className="text-lg font-bold text-gray-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{b.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
