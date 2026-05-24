import Link from "next/link";
import Image from "next/image";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const successMsg = sp.registered ? "Kayıt başarılı! Şimdi giriş yapabilirsiniz." : "";
  const error = sp.error ?? "";

  return (
    <div className="h-screen flex flex-col justify-between bg-white">
      <div className="h-[40%] login-bg flex flex-col justify-center px-8 text-white relative">
        <div className="relative z-10 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center p-2 shadow-xl shadow-blue-900/40">
              <Image
                src="/logo-icon-white.png"
                alt="PawHome"
                width={56}
                height={56}
                priority
                className="object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20 text-[10px] font-medium mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Akıllı Bakım Asistanı
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Paw<span className="text-teal-200">Home</span>
                <span className="text-xs align-super ml-0.5 text-teal-200">AI</span>
              </h1>
            </div>
          </div>
          <p className="text-blue-100 text-sm opacity-90">
            Hesabına giriş yap ve dostunun rutinlerini yönetmeye devam et.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] -mt-10 relative z-20 px-8 pt-10 pb-6 flex flex-col">
        {successMsg && (
          <div className="bg-green-50 text-green-700 text-xs font-medium px-4 py-3 rounded-xl mb-4 border border-green-100 flex items-center gap-2">
            <i className="fa-solid fa-circle-check"></i>
            {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-medium px-4 py-3 rounded-xl mb-4 border border-red-100 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <form action={loginAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
              E-posta Adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-regular fa-envelope text-slate-400"></i>
              </div>
              <input
                type="email"
                name="email"
                placeholder="ornek@mail.com"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary focus:ring-4 focus:ring-pw-primary/10 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-xs font-semibold text-slate-700">Şifre</label>
              <a href="#" className="text-xs text-pw-primary font-medium hover:underline">
                Şifremi Unuttum?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-lock text-slate-400"></i>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary focus:ring-4 focus:ring-pw-primary/10 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-pw-primary text-white py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <span>Giriş Yap</span>
            <i className="fa-solid fa-arrow-right text-sm opacity-80"></i>
          </button>
        </form>

        <div className="mt-auto pt-6 text-center">
          <p className="text-xs text-slate-500">
            Henüz hesabın yok mu?{" "}
            <Link href="/register" className="text-pw-primary font-bold hover:underline">
              Hemen Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
