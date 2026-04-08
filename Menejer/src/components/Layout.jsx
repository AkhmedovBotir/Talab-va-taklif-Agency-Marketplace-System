import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 80 : 256);
  const isSidebarVisible = isMobile ? mobileMenuOpen : true;

  return (
    <div className="min-h-screen bg-gray-50">
      {isSidebarVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        isMobile={isMobile}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <Header 
        sidebarCollapsed={sidebarCollapsed} 
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobile={isMobile}
      />
      <main
        className="pt-16 pb-8 transition-all duration-300 min-h-screen"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
