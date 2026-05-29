import { MapPin, Package, Search, Truck } from 'lucide-react'
import { AnimateIn } from './AnimateIn'
import { IconBox } from './IconBox'

const steps = [
  {
    num: '01',
    title: 'Manzilingizni tanlang',
    desc: 'Viloyat, tuman va mahallangizni belgilang — shunda faqat sizga yetkaziladigan mahsulotlar ko\'rinadi.',
    Icon: MapPin,
  },
  {
    num: '02',
    title: 'Mahsulot tanlang',
    desc: 'Bozor yoki Mahalla bo\'limidan kerakli narsalarni savatga qo\'shing.',
    Icon: Search,
  },
  {
    num: '03',
    title: 'Buyurtma bering',
    desc: 'Telefon raqamingiz bilan tasdiqlang, yetkazish manzilini kiriting va buyurtmani yuboring.',
    Icon: Package,
  },
  {
    num: '04',
    title: 'Yetkazib oling',
    desc: 'Buyurtma holati haqida xabar olasiz — mahsulot uyingizgacha yetkaziladi.',
    Icon: Truck,
  },
]

export function HowItWorks() {
  return (
    <section id="qanday" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <AnimateIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
            Oddiy va tushunarli
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
            Qanday xarid qilish mumkin?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            To&apos;rtta qadam — va kerakli mahsulot eshigingiz oldida.
          </p>
        </AnimateIn>

        <div className="relative mt-16">
          <div
            className="absolute left-8 top-0 hidden h-full w-0.5 bg-gradient-to-b from-orange-300 to-orange-100 md:left-1/2 md:block md:-translate-x-px"
            aria-hidden
          />
          <div className="space-y-12">
            {steps.map((step, i) => (
              <AnimateIn key={step.num} delay={i * 0.08}>
                <div
                  className={`relative flex flex-col gap-6 md:flex-row md:items-center ${
                    i % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="md:w-1/2 md:pr-12 md:text-right">
                    <div className={i % 2 === 1 ? 'md:text-left md:pl-12 md:pr-0' : ''}>
                      <div
                        className={`mb-3 inline-flex ${i % 2 === 1 ? 'md:justify-start' : 'md:justify-end md:w-full'}`}
                      >
                        <IconBox>
                          <step.Icon size={22} strokeWidth={2} />
                        </IconBox>
                      </div>
                      <span className="text-sm font-bold text-orange-500">{step.num}</span>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                  <div className="absolute left-8 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-white bg-orange-500 shadow md:left-1/2 md:block" />
                  <div className="md:w-1/2" />
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
