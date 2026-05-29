import { BrandLogo } from './BrandLogo'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <BrandLogo />
              <div>
                <p className="font-bold text-gray-900">TTSA Market</p>
                <p className="text-sm text-gray-500">Talab va Taklif Agency</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
              O&apos;zbekiston bo&apos;ylab onlayn bozor va mahalladagi do&apos;konlar — bitta
              ishonchli xizmat ostida.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-600 md:justify-end">
            <a href="#haqida" className="transition hover:text-orange-600">
              Biz haqimizda
            </a>
            <a href="#bozorlar" className="transition hover:text-orange-600">
              Bozorlar
            </a>
            <a href="#qanday" className="transition hover:text-orange-600">
              Qanday ishlaydi
            </a>
            <a
              href="https://market.ttsa.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-orange-500 hover:text-orange-600"
            >
              Xarid qilish
            </a>
          </nav>
        </div>

        <p className="mt-10 border-t border-gray-100 pt-8 text-center text-xs text-gray-400">
          © {year} TTSA — Talab va Taklif Agency. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </footer>
  )
}
