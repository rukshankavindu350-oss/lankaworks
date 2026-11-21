import { Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface PublicLayoutProps {
  children: ReactNode;
}

const NAV_LINKS = [
  { to: '/services', label: 'Browse' },
  { to: '/categories', label: 'Categories' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/track-booking', label: 'Track Booking' },
] as const;

export function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { firebaseUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#18181B]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0"
          >
            LankaWorks
          </Link>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#52525B]"
          >
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[#18181B] ${
                    isActive
                      ? 'text-[#0F766E] underline underline-offset-8 decoration-2'
                      : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/account"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {firebaseUser ? 'Account' : 'Sign In'}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E4E4E7] bg-white px-4 py-4 space-y-2">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-[#0F766E]/10 text-[#0F766E]'
                      : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-[#E4E4E7]">
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#E4E4E7] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-display font-bold text-[#18181B]">LankaWorks</p>
            <p className="text-[#52525B] leading-relaxed">
              Sri Lanka local services marketplace covering all 9 provinces and 25 districts.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[#18181B]">Marketplace</p>
            <ul className="space-y-1.5 text-[#52525B]">
              <li>
                <Link to="/services" className="hover:text-[#18181B]">
                  Browse Services
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-[#18181B]">
                  Service Categories
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#18181B]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/worker" className="hover:text-[#18181B]">
                  For Service Providers
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[#18181B]">Support & Legal</p>
            <ul className="space-y-1.5 text-[#52525B]">
              <li>
                <Link to="/about" className="hover:text-[#18181B]">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#18181B]">
                  Help & FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#18181B]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#18181B]">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#18181B]">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#E4E4E7] py-4 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#52525B]">
            <span>© {new Date().getFullYear()} LankaWorks. All rights reserved.</span>
            <span>Free for customers across Sri Lanka</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
