import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

const links = [
  { href: '#haqida', label: 'Biz haqimizda' },
  { href: '#bozorlar', label: 'Bozorlar' },
  { href: '#qanday', label: 'Qanday ishlaydi' },
  { href: '#hamkorlar', label: 'Hamkorlar' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-x-0 top-0 z-50 transition-shadow duration-300 ${
        scrolled
          ? 'border-b border-gray-100 bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#" className="flex items-center gap-2">
          <BrandLogo />
          <span className="text-left leading-tight">
            <span className="block text-sm font-bold text-gray-900">TTSA Market</span>
            <span className="block text-xs text-gray-500">Talab va Taklif</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 transition hover:text-orange-600"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://market.ttsa.uz"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
          >
            Xarid qilish
          </a>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-gray-700 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menyu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-100 bg-white px-5 py-4 md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 font-medium text-gray-700"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://market.ttsa.uz"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block rounded-full bg-orange-500 py-3 text-center font-bold text-white"
          >
            Xarid qilish
          </a>
        </motion.nav>
      )}
    </motion.header>
  )
}
