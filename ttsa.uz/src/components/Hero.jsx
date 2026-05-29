import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-[#fef9f3] to-gray-50 pt-28 pb-20 md:pt-36 md:pb-28">
      <div
        className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-orange-100/80 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[#fef9f3] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl">
          <motion.div variants={item} className="mb-6">
            <BrandLogo className="h-16 w-16 md:h-20 md:w-20" size={80} />
          </motion.div>
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-sm font-semibold text-orange-800 shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            O&apos;zbekiston bo&apos;ylab onlayn xarid
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl lg:text-6xl"
          >
            Kerakli mahsulotlar —{' '}
            <span className="text-orange-500">yaqin va ishonchli</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            <strong className="font-bold text-gray-900">TTSA Market</strong> — bu uyingiz
            yaqinidagi do&apos;konlardan ham, katta yetkazib beruvchilardan ham bir joyda xarid
            qilish imkoniyati. Buyurtma bering, qolganini bizning tarmoq hal qiladi.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
            <a
              href="https://market.ttsa.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition hover:bg-orange-600"
            >
              Marketga o&apos;tish
              <ArrowRight size={20} />
            </a>
            <a
              href="#qanday"
              className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 bg-white px-8 py-4 text-base font-bold text-gray-700 transition hover:border-orange-300 hover:text-orange-600"
            >
              Qanday ishlaydi?
            </a>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-14 grid grid-cols-3 gap-6 border-t border-gray-200/80 pt-10 sm:max-w-lg"
          >
            {[
              { value: '2', label: 'xil bozor — katta va mahalla' },
              { value: '1', label: 'ilova — hamma narsa bir joyda' },
              { value: '∞', label: 'mahsulot — kundalik ehtiyojlar uchun' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-extrabold text-orange-600 md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-md md:absolute md:right-5 md:top-32 md:mt-0 lg:max-w-lg"
        >
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-gray-200/60">
            <div className="flex items-center gap-2">
              <BrandLogo className="h-8 w-8" size={32} />
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Sizning buyurtmangiz
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {['Mahsulotlar tanlandi', 'Do\'kon tasdiqladi', 'Yetkazib beruvchi yo\'lda'].map(
                (step, i) => (
                  <div
                    key={step}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                      i < 2 ? 'bg-orange-50 text-gray-900' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        i < 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {i < 2 ? (
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                      ) : (
                        <span className="text-sm font-bold">{i + 1}</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold">{step}</span>
                  </div>
                ),
              )}
            </div>
            <p className="mt-5 text-center text-sm text-gray-500">
              Har bosqichda siz xabardor bo&apos;lasiz
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
