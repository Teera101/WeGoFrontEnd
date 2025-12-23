import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../components/Toasts';
import { useAuth } from '../../hooks/useAuth';

export default function SignUp() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('โปรดกรอกชื่อ', 'error');
    if (!email.trim()) return toast('โปรดกรอกอีเมล', 'error');
    if (pw.length < 6) return toast('รหัสผ่านอย่างน้อย 6 ตัวอักษร', 'error');

    try {
      setLoading(true);
      await signUp(email, pw, name.trim());
      toast('สมัครสมาชิกสำเร็จ! ยินดีต้อนรับสู่ WeGo 🎉', 'success');
      nav('/profile');
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('duplicate')) {
        toast('อีเมลนี้มีบัญชีอยู่แล้ว • กด "Sign in" หรือ "Reset password"', 'error');
      } else if (message.includes('email')) {
        toast('อีเมลไม่ถูกต้อง', 'error');
      } else if (message.includes('password')) {
        toast('รหัสผ่านน้อยเกินไป (อย่างน้อย 6 ตัวอักษร)', 'error');
      } else {
        toast(`สมัครไม่สำเร็จ: ${err?.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-6 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-amber-500/20 shadow-2xl shadow-slate-200 dark:shadow-amber-500/10 transition-colors duration-200">
          <header className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-800 via-emerald-600 to-amber-500 dark:from-white dark:via-pink-300 dark:to-amber-400 bg-clip-text text-transparent font-['Poppins']">
              Sign Up
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Create your WeGo account</p>
          </header>

          <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="username">
              <p></p> Username :
            </label>
            <input
              id="username"
              className="input bg-slate-100 dark:bg-slate-700/50 border-slate-400 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300 placeholder:text-slate-400"
              placeholder="Your username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="email">
              <p></p> Email :
            </label>
            <input
              id="email"
              className="input bg-slate-100 dark:bg-slate-700/50 border-slate-400 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300 placeholder:text-slate-400"
              placeholder="Your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="password">
              <p></p> Password :
            </label>
            <div className="relative">
              <input
                id="password"
                className="input bg-slate-100 dark:bg-slate-700/50 border-slate-400 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 pr-12 transition-all duration-300 placeholder:text-slate-400"
                placeholder="At least 6 characters"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-all duration-300"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                title={showPw ? 'Hide password' : 'Show password'}
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
            type="submit" 
            className="w-full mt-6 px-8 py-3.5 font-bold text-white rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:transform-none disabled:shadow-none" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700/50">
            <p className="text-slate-600 dark:text-slate-300">
              Already have an account?{' '}
              <Link to="/auth/signin" className="text-amber-500 dark:text-amber-400 font-bold hover:text-amber-600 dark:hover:text-amber-300 transition-colors duration-300">
                Sign in
              </Link>
            </p>
          </div>
          </form>
        </div>
      </div>
    </section>
  );
}