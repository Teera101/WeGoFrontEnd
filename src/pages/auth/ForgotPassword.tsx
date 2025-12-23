import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../components/Toasts';
import { api } from '../../lib/apiClient';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return toast('โปรดกรอกอีเมล', 'error');
    }

    try {
      setLoading(true);
      // Backend จะส่ง OTP ไปที่เมลเท่านั้น (ไม่มี devOTP กลับมาแล้ว)
      await api.post('/auth/forgot-password', { email });
      
      toast('ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว', 'success');
      setStep('otp');
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
      toast(serverMessage || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      return toast('โปรดกรอกรหัส OTP', 'error');
    }
    
    if (newPassword.length < 6) {
      return toast('รหัสผ่านอย่างน้อย 6 ตัวอักษร', 'error');
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      toast('รีเซ็ตรหัสผ่านสำเร็จ 🎉', 'success');
      navigate('/auth/signin');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'เกิดข้อผิดพลาด';
      toast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-6 px-4">
      <div className="w-full max-w-md">
        {/* Card Frame ที่ปรับให้เหมือน SignIn/SignUp */}
        <div className="card p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-amber-500/20 shadow-2xl shadow-slate-200 dark:shadow-amber-500/10 transition-colors duration-200">
          
          <header className="text-center mb-8">
            {/* Icon Box */}
            <div className="inline-block p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4 shadow-lg shadow-orange-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            {/* Gradient Text Title */}
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-800 via-orange-600 to-amber-500 dark:from-white dark:via-orange-300 dark:to-amber-400 bg-clip-text text-transparent font-['Poppins']">
              {step === 'email' ? 'Forgot Password' : 'Reset Password'}
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400">
              {step === 'email' 
                ? 'Enter your email to receive a recovery code' 
                : 'Enter the code sent to your email'}
            </p>
          </header>

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="email">
                  <p></p> Email :
                </label>
                <input
                  id="email"
                  type="email"
                  // ใช้สไตล์ Input เดียวกับ SignIn
                  className="input bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300 placeholder:text-slate-400"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
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
                    Sending Code...
                  </span>
                ) : (
                  'Send Recovery Code'
                )}
              </button>

              <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                <p className="text-slate-600 dark:text-slate-300">
                  Remember your password?{' '}
                  <Link to="/auth/signin" className="text-amber-500 dark:text-amber-400 font-bold hover:text-amber-600 dark:hover:text-amber-300 transition-colors duration-300">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              
              {/* Email Badge */}
              <div className="bg-slate-100 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600/50 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-600/50 rounded-full shrink-0 shadow-sm">
                  <span className="text-lg">📧</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Code sent to:</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="otp">
                  <p></p> OTP Code :
                </label>
                <input
                  id="otp"
                  type="text"
                  className="input bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300 text-center text-2xl tracking-[0.5em] font-bold placeholder:text-slate-300"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="label font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2" htmlFor="newPassword">
                  <p></p> New Password :
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="input bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 pr-12 transition-all duration-300 placeholder:text-slate-400"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-all duration-300"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5.477 20 1 12 1 12a20.76 20.76 0 0 1 5.06-5.94" />
                        <path d="M10.73 5.08A11 11 0 0 1 12 4c6.523 0 11 8 11 8a20.76 20.76 0 0 1-4.17 4.92" />
                        <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                    Resetting Password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>

              <div className="text-sm text-center space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-amber-500 dark:text-amber-400 font-bold hover:text-amber-600 dark:hover:text-amber-300 transition-colors duration-300"
                >
                  ← Back to email
                </button>
                <p className="text-slate-600 dark:text-slate-300">
                  Didn't receive code?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      toast('Please request a new code', 'info');
                    }}
                    className="text-amber-500 dark:text-amber-400 font-bold hover:text-amber-600 dark:hover:text-amber-300 transition-colors duration-300"
                  >
                    Resend
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}