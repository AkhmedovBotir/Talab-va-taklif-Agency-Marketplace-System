import { Handshake, ShoppingCart, Store } from 'lucide-react'
import { AnimateIn } from './AnimateIn'
import { IconBox } from './IconBox'

const cards = [
  {
    title: 'Talab',
    desc: 'Siz kerakli mahsulotni qidirasiz — biz uni topish va yetkazish yo\'lini tashkil qilamiz.',
    Icon: ShoppingCart,
  },
  {
    title: 'Taklif',
    desc: 'Do\'konlar va yetkazib beruvchilar o\'z mahsulotlarini sizga yetkazish imkoniyatiga ega bo\'ladi.',
    Icon: Store,
  },
  {
    title: 'Hamkorlik',
    desc: 'Barcha tomonlar — xaridor, do\'kon, yetkazuvchi — bir-birini qo\'llab-quvvatlaydigan tizimda ishlaydi.',
    Icon: Handshake,
  },
]

export function About() {
  return (
    <section id="haqida" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <AnimateIn className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-500">
            Biz haqimizda
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
            TTSA Market nima?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            <strong className="font-bold text-gray-900">Talab va Taklif Agency (TTSA)</strong> — bu
            O&apos;zbekistonda odamlarning kundalik ehtiyojlarini qondirish uchun yaratilgan
            xizmat. Biz mahalladagi kichik do&apos;konlarni ham, yirik yetkazib beruvchilarni ham
            bitta tizimda birlashtiramiz, shunda siz qayerda yashashingizdan qat&apos;i nazar
            qulay xarid qilasiz.
          </p>
        </AnimateIn>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {cards.map((card, i) => (
            <AnimateIn key={card.title} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-gray-100 bg-gray-50/80 p-8 transition hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/40">
                <IconBox>
                  <card.Icon size={24} strokeWidth={2} />
                </IconBox>
                <h3 className="mt-4 text-xl font-bold text-gray-900">{card.title}</h3>
                <p className="mt-3 leading-relaxed text-gray-600">{card.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
