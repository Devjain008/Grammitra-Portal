import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Briefcase, ShoppingBag, Wrench, 
  Sprout, Landmark, HeartPulse, GraduationCap, 
  CloudSun, MessageCircle, LineChart, Settings, Store,
  Building2, Users, Menu, X, ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Sidebar = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userCategories = Array.isArray(user?.categories) 
    ? user.categories 
    : (typeof user?.categories === 'string' 
        ? [user.categories] 
        : []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', key: 'sidebar.dashboard', path: '/dashboard' },
    { icon: Sprout, label: 'Farmer AI', key: 'sidebar.farmerAi', path: '/farmer-ai', roles: ['farmer'] },
    { icon: Briefcase, label: 'Employment', key: 'sidebar.employment', path: '/employment' },
    { icon: ShoppingBag, label: 'Marketplace', key: 'sidebar.marketplace', path: '/marketplace' },
    { icon: Store, label: 'Your Shop', key: 'sidebar.yourShop', path: '/your-shop', roles: ['shopkeeper', 'businessman'] },
    { icon: Building2, label: 'Your Business', key: 'sidebar.yourBusiness', path: '/your-business', roles: ['businessman', 'shopkeeper'] },
    { icon: Wrench, label: 'Labour Services', key: 'sidebar.labourServices', path: '/labour' },
    { icon: Wrench, label: 'Your Work', key: 'sidebar.yourWork', path: '/your-work', roles: ['labour'] },
    { icon: Landmark, label: 'Gov Schemes', key: 'sidebar.govSchemes', path: '/schemes' },
    { icon: GraduationCap, label: 'Education', key: 'sidebar.education', path: '/education', roles: ['student', 'teacher'] },
    { icon: Users, label: 'Teachers', key: 'sidebar.teachers', path: '/teachers' },
    { icon: HeartPulse, label: 'Healthcare', key: 'sidebar.healthcare', path: '/healthcare' },
    { icon: MessageCircle, label: 'Live Chat', key: 'sidebar.liveChat', path: '/chat' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.path === '/chat' && user?.role === 'admin') return false;
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.some(role => userCategories.includes(role));
  });

  // Bottom nav shows the 4 most important items + "More" button
  const bottomNavItems = [
    { icon: LayoutDashboard, label: 'Home', key: 'sidebar.dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Jobs', key: 'sidebar.employment', path: '/employment' },
    { icon: ShoppingBag, label: 'Market', key: 'sidebar.marketplace', path: '/marketplace' },
    { icon: MessageCircle, label: 'Chat', key: 'sidebar.liveChat', path: '/chat' },
  ];

  const filteredBottomNav = bottomNavItems.filter(item => !(item.path === '/chat' && user?.role === 'admin'));

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 h-screen hidden md:flex flex-col glass-card-dark fixed left-0 top-0 m-4 rounded-3xl overflow-hidden z-50">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <Sprout className="w-8 h-8 text-village-mint" />
          <h2 className="text-xl font-bold text-white tracking-wide">GramMitra</h2>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {filteredMenuItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-village-emerald to-village-mint text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{t(item.key) || item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl w-full transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">{t('sidebar.settings') || 'Settings'}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-stretch">
        {filteredBottomNav.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-village-emerald' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-village-lightMint/60' : ''
              }`}>
                <item.icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span>{t(item.key) || item.label}</span>
            </NavLink>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-bold text-gray-400 transition-all"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* ── Mobile Full-Screen Menu Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            {/* Drawer slides up from bottom */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-[#1a3a2a] rounded-t-3xl max-h-[80vh] overflow-y-auto pb-6"
            >
              {/* Handle */}
              <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Sprout className="w-6 h-6 text-village-mint" />
                  <h3 className="text-lg font-bold text-white">GramMitra</h3>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav Items Grid */}
              <div className="px-4 pt-4 grid grid-cols-2 gap-2">
                {filteredMenuItems.map((item, idx) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={idx}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm ${
                        isActive
                          ? 'bg-gradient-to-r from-village-emerald to-village-mint text-white shadow-lg'
                          : 'bg-white/8 text-gray-300 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t(item.key) || item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              {/* Settings */}
              <div className="px-4 pt-4 border-t border-white/10 mt-4">
                <button className="flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-gray-300 bg-white/8 hover:bg-white/15 hover:text-white transition-all font-semibold text-sm">
                  <Settings className="w-4 h-4" />
                  <span>{t('sidebar.settings') || 'Settings'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;