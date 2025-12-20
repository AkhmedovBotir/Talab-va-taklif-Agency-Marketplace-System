import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PartnershipForm from '../components/PartnershipForm';
import Logo from '../components/Logo';
import { 
  ShoppingBagIcon, 
  StoreIcon, 
  LocationIcon, 
  TruckIcon, 
  BriefcaseIcon,
  CheckIcon,
  MobileIcon,
  UsersIcon,
  SupportIcon
} from '../components/Icons';

function HomePage() {
  const [showPartnership, setShowPartnership] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (showPartnership) {
      setTimeout(() => {
        const element = document.getElementById('partnership-section');
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [showPartnership]);

  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a');
      if (target) {
        const href = target.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const id = href.substring(1);
          const element = document.getElementById(id);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <Logo className="w-12 h-12" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-green-600 bg-clip-text text-transparent">
                  TTSA
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block font-medium">
                  Talab va Taklif Sotuv Agency
                </p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm">
                Biz haqimizda
              </a>
              <a href="#services" className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm">
                Xizmatlar
              </a>
              <a href="#partnership" className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-sm">
                Hamkorlik
              </a>
              <Link 
                to="/downloads" 
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-105 shadow-md hover:shadow-lg text-sm"
              >
                Dasturlar
              </Link>
            </nav>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="#about" 
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Biz haqimizda
                </a>
                <a 
                  href="#services" 
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Xizmatlar
                </a>
                <a 
                  href="#partnership" 
                  className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Hamkorlik
                </a>
                <Link 
                  to="/downloads" 
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-105 shadow-md hover:shadow-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dasturlar
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight">
              O'zbekiston bo'yicha{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-100 bg-clip-text text-transparent">
                zamonaviy marketplace
              </span>{' '}
              platformasi
            </h1>
            <p className="text-xl sm:text-2xl text-white/95 mb-12 leading-relaxed max-w-3xl mx-auto">
              TTSA - bu kontragentlar, punktlar, agentlar va mijozlarni birlashtirgan 
              to'liq funksional e-commerce ekosistemasi. Bizning platformamiz orqali 
              mahsulotlarni osongina sotib oling va yetkazib bering.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowPartnership(true)}
                className="px-10 py-4 bg-white text-primary-600 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                Hamkor bo'lish
              </button>
              <a
                href="#about"
                className="px-10 py-4 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
              >
                Batafsil ma'lumot
              </a>
              <a
                href="/downloads"
                className="px-10 py-4 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
              >
                Dasturlarni yuklab olish
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 text-gray-900">
              Biz haqimizda
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-green-600 mx-auto rounded-full"></div>
          </div>
          <div className="grid lg:grid-cols-3 gap-16 items-center">
            <div className="lg:col-span-2 space-y-8">
              <p className="text-xl text-gray-700 leading-relaxed">
                <strong className="text-gray-900 font-bold">TTSA (Talab va Taklif Sotuv Agency)</strong> - O'zbekistondagi 
                eng yirik marketplace va yetkazib berish tizimlaridan biri. Bizning 
                platformamiz kontragentlar, logistika punktlari, agentlar va mijozlarni 
                birlashtirgan to'liq integratsiyalangan ekosistemadir.
              </p>
              <p className="text-xl text-gray-700 leading-relaxed">
                Bizning maqsadimiz - O'zbekistondagi barcha hududlarda sifatli va 
                tezkor yetkazib berish xizmatlarini ta'minlash, kichik va o'rta biznes 
                uchun yangi imkoniyatlar yaratish va mijozlarga eng yaxshi xizmatni 
                ko'rsatishdir.
              </p>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary-50 via-primary-100 to-primary-50 p-8 rounded-3xl text-center shadow-lg border border-primary-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
                  <MobileIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-extrabold text-primary-600 mb-2">5+</div>
                <div className="text-gray-700 font-semibold text-lg">Mobil ilova</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 p-8 rounded-3xl text-center shadow-lg border border-green-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-extrabold text-green-600 mb-2">1000+</div>
                <div className="text-gray-700 font-semibold text-lg">Aktiv foydalanuvchilar</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 via-green-50 to-primary-50 p-8 rounded-3xl text-center shadow-lg border border-primary-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-green-600 rounded-2xl mb-4">
                  <SupportIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-green-600 bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-gray-700 font-semibold text-lg">Qo'llab-quvvatlash</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 text-gray-900">
              Bizning dasturlar
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-green-600 mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Marketplace */}
            <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 group transform hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBagIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Marketplace</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Mijozlar uchun mobil ilova. Kontragentlar mahsulotlarini ko'rish, 
                qidirish, savatga qo'shish va buyurtma berish imkoniyati.
              </p>
              <ul className="space-y-3">
                {['Mahsulotlarni qidirish va filtrlash', 'Savat va buyurtma boshqaruvi', 'To\'lov tizimi', 'Buyurtma holatini kuzatish'].map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600">
                    <span className="text-green-500 mr-3 mt-0.5">
                      <CheckIcon className="w-5 h-5" />
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contragent */}
            <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 group transform hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <StoreIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Contragent</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Yetkazib beruvchilar uchun mobil ilova. Mahsulotlarni yaratish, 
                tahrirlash, buyurtmalarni qabul qilish va statistika ko'rish.
              </p>
              <ul className="space-y-3">
                {['Ombor boshqaruvi', 'Mahsulotlar yaratish', 'Buyurtmalarni boshqarish', 'Statistika va hisobotlar'].map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600">
                    <span className="text-green-500 mr-3 mt-0.5">
                      <CheckIcon className="w-5 h-5" />
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Punkt */}
            <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 group transform hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-green-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <LocationIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Punkt</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Logistika punktlari uchun mobil ilova. Buyurtmalarni qabul qilish, 
                kontragentlarga so'rov yuborish, agentlarga tayinlash.
              </p>
              <ul className="space-y-3">
                {['Buyurtma boshqaruvi', 'Punkt-to-punkt koordinatsiya', 'KPI kuzatuv', 'Real-time bildirishnomalar'].map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600">
                    <span className="text-green-500 mr-3 mt-0.5">
                      <CheckIcon className="w-5 h-5" />
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agent */}
            <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 group transform hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <TruckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Agent</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Yetkazib beruvchi agentlar uchun mobil ilova. Buyurtmalarni qabul 
                qilish, mijozlarga yetkazish va moliyaviy hisobotlar.
              </p>
              <ul className="space-y-3">
                {['Buyurtmalarni yetkazish', 'KPI bonus tizimi', 'Moliya boshqaruvi', 'Kunlik hisobotlar'].map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600">
                    <span className="text-green-500 mr-3 mt-0.5">
                      <CheckIcon className="w-5 h-5" />
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vakant */}
            <div className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 group transform hover:-translate-y-2 md:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <BriefcaseIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Vakant</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Vakansiya ilovasi. Agent yoki Punkt qismlariga ishga kirish uchun 
                ariza topshirish va intervyu jarayonini kuzatish.
              </p>
              <ul className="space-y-3">
                {['Vakansiyalarni ko\'rish', 'Ariza yuborish', 'Intervyu kuzatuv', 'Holat yangilanishlari'].map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600">
                    <span className="text-green-500 mr-3 mt-0.5">
                      <CheckIcon className="w-5 h-5" />
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section id="partnership" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-gray-900">
                Hamkor bo'ling
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-green-600 rounded-full mb-8"></div>
              <p className="text-xl text-gray-700 mb-10 leading-relaxed">
                Biz bilan hamkor bo'lish orqali sizning kompaniyangiz TTSA platformasida 
                mahsulotlaringizni sotish imkoniyatiga ega bo'ladi. Biz sizga:
              </p>
              <ul className="space-y-5">
                {[
                  'Keng auditoriyaga yetib borish',
                  'Zamonaviy marketplace platformasi',
                  'To\'liq logistika qo\'llab-quvvatlash',
                  'Real-time buyurtma boshqaruvi',
                  'Statistika va hisobotlar',
                  'Professional qo\'llab-quvvatlash'
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="text-green-500 mr-4 mt-1">
                      <CheckIcon className="w-6 h-6" />
                    </span>
                    <span className="text-xl">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white p-10 rounded-3xl shadow-xl border border-gray-200">
              <PartnershipForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Logo className="w-10 h-10" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-green-400 bg-clip-text text-transparent">TTSA</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Talab va Taklif Sotuv Agency - O'zbekistondagi eng yirik 
                marketplace platformasi.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Dasturlar</h4>
              <ul className="space-y-3">
                {['Marketplace', 'Contragent', 'Punkt', 'Agent', 'Vakant'].map((app, idx) => (
                  <li key={idx}>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors text-sm">
                      {app}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Aloqa</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#partnership" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Hamkor bo'lish
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Biz haqimizda
                  </a>
                </li>
                <li>
                  <a href="/downloads" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Dasturlarni yuklab olish
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; 2024 TTSA. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

