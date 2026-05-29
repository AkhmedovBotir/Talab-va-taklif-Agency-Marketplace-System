import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { AnimateIn } from './AnimateIn'
import { BrandLogo } from './BrandLogo'

export function Cta() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <AnimateIn>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 px-8 py-16 text-center text-white shadow-2xl shadow-orange-500/30 md:px-16 md:py-20"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, white 0%, transparent 40%), radial-gradient(circle at 80% 20%, #fef9f3 0%, transparent 35%)',
              }}
              aria-hidden
            />
            <div className="relative">
              <BrandLogo className="mx-auto mb-6 h-14 w-14" size={56} />
              <h2 className="text-3xl font-extrabold md:text-4xl">Bugun xaridni boshlang</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-orange-100">
                TTSA Market ilovasiga kiring, manzilingizni tanlang va kerakli mahsulotlarni
                buyurtma qiling — qolganini biz hal qilamiz.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="https://market.ttsa.uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-base font-extrabold text-orange-600 shadow-lg transition hover:bg-orange-50"
                >
                  market.ttsa.uz ga o&apos;tish
                  <ArrowRight size={20} />
                </a>
              </div>
              <p className="mt-8 text-sm text-orange-200">
                Savollar bo&apos;lsa, ilova ichidagi yordam bo&apos;limidan murojaat qiling.
              </p>
            </div>
          </motion.div>
        </AnimateIn>
      </div>
    </section>
  )
}
