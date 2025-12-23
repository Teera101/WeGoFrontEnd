// apps/frontend/src/pages/auth/SignIn.tsx
import { useState, useEffect } from 'react';
import { SignInSchema } from '../../lib/validators';
import { toast } from '../../components/Toasts';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from?.pathname || '/';

  const { signIn } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const parsed = SignInSchema.safeParse({ email, password: pass });
    if (!parsed.success) return toast(parsed.error.errors[0].message, 'error');

    try {
      setLoading(true);
      const result = await signIn(email.trim(), pass);
      toast('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับกลับมา 🎉', 'success');
      
      if (result && result.role === 'admin') {
        nav('/admin/dashboard', { replace: true });
      } else {
        nav(from === '/' ? '/explore' : from, { replace: true });
      }
    } catch (err: any) {
      toast(err?.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-6 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-amber-500/20 shadow-2xl shadow-slate-200 dark:shadow-amber-500/10 transition-colors duration-200">
          <header className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl mb-4 shadow-lg shadow-amber-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-800 via-amber-600 to-amber-500 dark:from-white dark:via-pink-300 dark:to-amber-400 bg-clip-text text-transparent font-['Poppins']">
              Sign In
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Welcome back to WeGo</p>
          </header>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="email">
                <p></p>Email :
              </label>
              <input
                id="email"
                // แก้ไขตรงนี้: ใช้ bg-slate-100 ใน Light mode และปรับสีขอบ/ตัวอักษรให้ชัดเจน
                className="input bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300 placeholder:text-slate-400"
                placeholder="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="password">
                <p></p>Password :
              </label>
              <div className="relative">
                <input
                  id="password"
                  // แก้ไขตรงนี้เช่นกัน
                  className="input bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 pr-12 transition-all duration-300 placeholder:text-slate-400"
                  placeholder="password"
                  type={showPw ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-all duration-300"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  title={showPw ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5.477 20 1 12 1 12a20.76 20.76 0 0 1 5.06-5.94" />
                      <path d="M10.73 5.08A11 11 0 0 1 12 4c6.523 0 11 8 11 8a20.76 20.76 0 0 1-4.17 4.92" />
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4.5-8 11-8 11 8 11 8-4.5 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              className="w-full mt-6 px-8 py-3.5 font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:transform-none disabled:shadow-none" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700/50">
              <p className="text-slate-600 dark:text-slate-300">
                Don't have an account?{' '}
                <Link to="/auth/signup" className="text-amber-500 dark:text-amber-400 font-bold hover:text-amber-600 dark:hover:text-amber-300 transition-colors duration-300">
                  Sign up
                </Link>
              </p>
              <p>
                <Link to="/auth/forgot-password" className="text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300 inline-flex items-center gap-1">
                  <span>🔑</span> Forgot password?
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}