import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Users, Calendar, Star, ArrowRight, Compass, MessageCircle, Shield, Zap, Heart, TrendingUp } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (!loading && user) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <div className="relative -m-4 sm:-m-6 min-h-[calc(100vh-4rem)] overflow-hidden">
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight font-['Poppins']">
              <span className="text-slate-900 dark:text-white">
                อยู่คนเดียวไม่ต้องเหงา
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-300 bg-clip-text text-transparent">
                เพราะพวกเราจะไปด้วยกัน
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-light max-w-2xl mx-auto">
              หาเพื่อนร่วมกิจกรรม จัดกลุ่ม นัดเวลา คุยกันในแชต - ครบจบในที่เดียว
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                to="/auth/signup"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500
                           hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600
                           shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40
                           transition-all duration-500 ease-out hover:scale-110 hover:-translate-y-1 active:scale-95
                           animate-pulse-subtle"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500 ease-out" />
              </Link>
              <Link
                to="/explore"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold 
                           text-slate-700 dark:text-white
                           border-2 border-slate-200 dark:border-white/30 
                           bg-white/50 dark:bg-white/5 
                           hover:bg-slate-100 dark:hover:bg-white/10 
                           hover:border-slate-300 dark:hover:border-white/50
                           backdrop-blur-sm transition-all duration-500 ease-out hover:scale-110 hover:-translate-y-1 active:scale-95"
              >
                Explore Events
                <Compass className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ease-out" />
              </Link>
            </div>
          </div>

          <div className="relative group max-w-5xl mx-auto">
            <div className="relative transform transition-all duration-700 ease-out 
                            group-hover:scale-[1.03] group-hover:-translate-y-3">
              <img
                src="https://i.pinimg.com/1200x/54/57/24/545724f929914db48a3d1964f983f755.jpg"
                alt="Friends enjoying campus activities together"
                className="w-full h-auto rounded-2xl object-cover aspect-[16/9] shadow-2xl
                           contrast-110 brightness-105 saturate-110
                           group-hover:contrast-115 group-hover:brightness-110
                           transition-all duration-700 ease-out"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 
                              rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 dark:opacity-100" />
              <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-800/50 
                              border border-slate-200 dark:border-white/10 backdrop-blur-sm 
                              hover:border-blue-500/40 shadow-sm dark:shadow-none
                              transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-default">
                <Users className="w-6 h-6 text-blue-500 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">50+</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">ผู้ใช้งาน</div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 
                              rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 dark:opacity-100" />
              <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-800/50 
                              border border-slate-200 dark:border-white/10 backdrop-blur-sm 
                              hover:border-amber-500/40 shadow-sm dark:shadow-none
                              transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-default">
                <Calendar className="w-6 h-6 text-amber-500 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">10+</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">กิจกรรม</div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 
                              rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 dark:opacity-100" />
              <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-800/50 
                              border border-slate-200 dark:border-white/10 backdrop-blur-sm 
                              hover:border-yellow-500/40 shadow-sm dark:shadow-none
                              transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-default">
                <Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400 mb-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">4.8/5</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">คะแนนรีวิว</div>
              </div>
            </div>
          </div>

          <div className="pt-20 pb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-4 font-['Poppins']">
              ทำไมต้องเลือก WeGo?
            </h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
              ทุกสิ่งที่คุณต้องการเพื่อเชื่อมต่อ สำรวจ และเติบโตไปด้วยกันในที่เดียว
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 dark:opacity-100" />
                <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-800/30 
                                border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none
                                hover:border-blue-500/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-4
                                  group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-['Poppins']">หาเพื่อนใหม่</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    เชื่อมต่อกับเพื่อนที่มีความสนใจและแชร์ความหลงใหลเดียวกันกับคุณ
                  </p>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 dark:opacity-100" />
                <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-800/30 
                                border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none
                                hover:border-amber-500/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4
                                  group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-['Poppins']">จัดตารางง่าย</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    วางแผนกิจกรรมและอีเวนต์ด้วยระบบจัดตารางอัจฉริยะที่เหมาะกับทุกคน
                  </p>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 dark:opacity-100" />
                <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-800/30 
                                border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none
                                hover:border-purple-500/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-4
                                  group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-['Poppins']">เชื่อมต่อตลอดเวลา</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    แชทกับเพื่อนและสมาชิกกลุ่มแบบเรียลไทม์ ทุกที่ทุกเวลา
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 pb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-4 font-['Poppins']">
              วิธีการใช้งาน
            </h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
              เริ่มต้นได้ง่ายๆ ในเพียง 3 ขั้นตอน
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4
                                shadow-lg shadow-purple-500/30 group-hover:shadow-2xl group-hover:shadow-purple-500/50 
                                transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-['Poppins']">สมัครฟรี</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  สร้างบัญชีของคุณได้ในไม่กี่วินาทีด้วยอีเมล
                </p>
              </div>

              <div className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center mx-auto mb-4
                                shadow-lg shadow-pink-500/30 group-hover:shadow-2xl group-hover:shadow-pink-500/50 
                                transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-['Poppins']">สำรวจกิจกรรม</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  เลือกดูอีเวนต์และหากลุ่มที่ตรงกับความสนใจ
                </p>
              </div>

              <div className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-4
                                shadow-lg shadow-cyan-500/30 group-hover:shadow-2xl group-hover:shadow-cyan-500/50 
                                transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-['Poppins']">เข้าร่วมและเชื่อมต่อ</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  พบเพื่อนใหม่และเริ่มผจญภัยร่วมกันได้ทันที
                </p>
              </div>
            </div>
          </div>

          <div className="pt-12 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center group cursor-default">
                <div className="flex justify-center mb-2">
                  <Shield className="w-8 h-8 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">ปลอดภัย</p>
              </div>
              
              <div className="text-center group cursor-default">
                <div className="flex justify-center mb-2">
                  <Zap className="w-8 h-8 text-yellow-500 dark:text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">รวดเร็ว</p>
              </div>
              
              <div className="text-center group cursor-default">
                <div className="flex justify-center mb-2">
                  <Heart className="w-8 h-8 text-pink-500 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">ใส่ใจ</p>
              </div>
              
              <div className="text-center group cursor-default">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-8 h-8 text-green-500 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">เติบโตต่อเนื่อง</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}