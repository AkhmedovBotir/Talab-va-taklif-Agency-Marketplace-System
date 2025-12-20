import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const APPS = [
  {
    id: 'marketplace',
    name: 'Marketplace',
    apk: '/apks/marketplace.apk',
    logo: '/logos/marketplace.png',
    gradient: 'from-green-500 to-emerald-600',
    iconBg: 'bg-green-500',
  },
  {
    id: 'contragent',
    name: 'Do\'kon Egasi',
    apk: '/apks/contragent.apk',
    logo: '/logos/contragent.png',
    gradient: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-500',
  },
  {
    id: 'agent',
    name: 'Agent',
    apk: '/apks/agent.apk',
    logo: '/logos/agent.png',
    gradient: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-500',
  },
  {
    id: 'punkt',
    name: 'Punkt',
    apk: '/apks/punkt.apk',
    logo: '/logos/punkt.png',
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500',
  },
  {
    id: 'vakansiya',
    name: 'Vakansiya',
    apk: '/apks/vakansiya.apk',
    logo: '/logos/vakansiya.png',
    gradient: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-500',
  }
];

function DownloadsPage() {
  const handleDownload = (apkPath, appName) => {
    const link = document.createElement('a');
    link.href = apkPath;
    link.download = apkPath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-primary-600 via-primary-700 to-green-600 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <Logo className="w-10 h-10 transition-transform group-hover:scale-110" />
              <div>
                <h1 className="text-lg font-bold text-white">TTSA</h1>
              </div>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white transition-colors font-medium text-sm rounded-lg hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Bosh sahifa</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-6xl">
          {/* Title Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2">
              Mobil Dasturlar
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Android ilovalarni yuklab oling
            </p>
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => handleDownload(app.apk, app.name)}
                className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/20 hover:border-white/40 flex flex-col items-center gap-3"
              >
                {/* App Icon */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 ${app.iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative overflow-hidden flex items-center justify-center`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-90`}></div>
                  <img 
                    src={app.logo} 
                    alt={app.name}
                    className="w-full h-full object-contain p-2 relative z-10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className={`w-full h-full bg-gradient-to-br ${app.gradient} hidden items-center justify-center text-white font-bold text-xl relative z-10`}>
                    {app.name.charAt(0)}
                  </div>
                </div>

                {/* App Name */}
                <div className="text-center">
                  <div className="text-white font-bold text-xs sm:text-sm mb-1 group-hover:text-yellow-200 transition-colors">
                    {app.name}
                  </div>
                  <div className="text-white/70 text-[10px] sm:text-xs">Android</div>
                </div>

                {/* Download Icon */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Android Info */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 text-white/80 text-xs sm:text-sm">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.82-1.09-.07-2.21-.14-3.51-.82-.65-.35-1.18-.78-1.65-1.28-4.9-5.11-4.9-13.16 0-18.27.47-.5 1-1.05 1.65-1.28 1.3-.68 2.42-.75 3.51-.82 1.03-.06 2.1-.13 3.08.82.47.46.87 1.02 1.21 1.61.34.59.6 1.22.78 1.87.18.65.28 1.32.3 2 .02.68-.05 1.36-.2 2.02-.15.66-.38 1.3-.68 1.9-.3.6-.67 1.16-1.1 1.66-.43.5-.92.94-1.46 1.32-.54.38-1.13.7-1.75.95-.62.25-1.27.43-1.93.54-.66.11-1.33.15-2 .12-.67-.03-1.34-.12-2.02-.3-.68-.18-1.35-.44-1.94-.78-.59-.34-1.15-.74-1.61-1.21z"/>
            </svg>
            <span className="font-medium">Android uchun optimallashtirilgan</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DownloadsPage;
