import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Compass } from 'lucide-react';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'WeGo';

function nameFromEmail(email?: string | null) {
  return email ? (email.split('@')[0] || '') : '';
}

export default function Navbar() {
  const { user, logOut } = useAuth();
  const { data: profile } = useProfile(user?._id);
  const location = useLocation();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'px-3 py-2 font-semibold transition-colors',
      'hover:underline underline-offset-8 decoration-2',
      isActive 
        ? 'text-amber-600 dark:text-white underline decoration-2' 
        : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-white'
    );

  const displayName = (profile?.name && profile.name.trim()) || (user as any)?.username || nameFromEmail(user?.email) || '';
  const profileAvatar = profile?.avatar || '';
  const isTransient = profileAvatar && (profileAvatar.startsWith('blob:') || profileAvatar.startsWith('file:'));
  const avatar = isTransient ? '' : profileAvatar;
  const first = (displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-primary-900/70 backdrop-blur-xl shadow-sm dark:shadow-none transition-colors duration-200">
      <div className="container-app flex items-center justify-between py-3">
        {/* Brand with Logo */}
        <Link to="/" className="flex items-center gap-2 group" aria-label={APP_NAME}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
            <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 p-2 rounded-xl shadow-lg group-hover:shadow-purple-500/50 transition-all">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-2xl font-bold font-['Poppins'] bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-300 bg-clip-text text-transparent">
            WeGo
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          <NavLink to="/explore" className={linkClass}>Explore</NavLink>
          <NavLink to="/create" className={linkClass}>Create</NavLink>
          
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          )}

          <div className="ml-2">
            <ThemeToggle />
          </div>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500/40 px-4 py-2 transition-all hover:scale-105 shadow-sm hover:shadow-md h-10 group"
              >
                <div className="h-7 w-7 rounded-full overflow-hidden grid place-items-center bg-gradient-to-br from-amber-500/20 to-yellow-500/20 ring-1 ring-slate-200 dark:ring-amber-400/50 flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-300">{first}</span>
                  )}
                </div>
                <span className="text-slate-700 dark:text-white text-sm font-semibold max-w-[100px] truncate group-hover:text-amber-600 dark:group-hover:text-white transition-colors">
                  {displayName}
                </span>
              </Link>

              <button
                onClick={() => logOut()}
                className="px-5 py-2 rounded-xl font-semibold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-300 dark:hover:border-red-400/50 transition-all hover:scale-105 h-10"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <NavLink 
                to="/auth/signin" 
                className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-md shadow-amber-500/20"
              >
                Sign in
              </NavLink>
              <NavLink 
                to="/auth/signup" 
                className="px-5 py-2 rounded-xl font-semibold border-2 border-slate-200 dark:border-white/30 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/50 transition-all hover:scale-105"
              >
                Sign up
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}