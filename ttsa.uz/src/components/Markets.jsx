import { motion } from 'framer-motion'
import { Check, Layers, MapPin, ShoppingBag } from 'lucide-react'
import { AnimateIn } from './AnimateIn'

const markets = [
  {
    id: 'bozor',
    name: 'Bozor',
    tagline: 'Katta tanlov, butun tuman bo\'ylab',
    headerClass: 'bg-gradient-to-r from-orange-500 to-orange-600',
    border: 'border-orange-200',
    bg: 'bg-orange-50/50',
    icon: ShoppingBag,
    points: [
      'Turli yetkazib beruvchilardan minglab mahsulotlar',
      'Buyurtma mahalliy punkt orqali qabul qilinadi va sizga yetkaziladi',
      'Katta hajmdagi xaridlar uchun qulay',
    ],
  },
  {
    id: 'mahalla',
    name: 'Mahalla',
    tagline: 'Yaqin do\'kon — tez va tanish',
    headerClass: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50',
    icon: MapPin,
    points: [
      'Mahallangizdagi do\'konlardan to\'g\'ridan-to\'g\'ri buyurtma',
      'Mahalliy kuryer tez yetkazib beradi',
      'Kichik, tez-tez kerak bo\'ladigan xaridlar uchun ideal',
    ],
  },
]

export function Markets() {
  return (
    <section id="bozorlar" className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <AnimateIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
            Ikki xil xarid
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
            Sizga qaysi biri mos?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            TTSA Market ilovasida ikkala bozor ham bor — bir marta kirasiz, o&apos;zingizga qulay
            usulni tanlaysiz.
          </p>
        </AnimateIn>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {markets.map((m, i) => (
            <AnimateIn key={m.id} delay={i * 0.15}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={`overflow-hidden rounded-3xl border ${m.border} bg-white shadow-xl shadow-gray-200/50`}
              >
                <div className={`${m.headerClass} px-8 py-10 text-white`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                      <m.icon size={24} strokeWidth={2.25} />
                    </span>
                    <div>
                      <h3 className="text-3xl font-extrabold">{m.name}</h3>
                      <p className="mt-1 text-lg text-white/90">{m.tagline}</p>
                    </div>
                  </div>
                </div>
                <ul className={`space-y-4 p-8 ${m.bg}`}>
                  {m.points.map((point) => (
                    <li key={point} className="flex gap-3 text-gray-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm ring-1 ring-gray-100">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn className="mt-10 flex justify-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-800">
            <Layers size={16} className="text-orange-500" />
            Ilovada «Bozor» va «Mahalla» bo&apos;limlari alohida
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
