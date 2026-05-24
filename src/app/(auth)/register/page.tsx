import Link from "next/link";
import Image from "next/image";
import { registerAction } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error ?? "";

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="h-[30%] register-bg flex flex-col px-6 pt-6 text-white relative">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/login"
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <Link href="/" className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 p-1.5 flex items-center justify-center">
            <Image
              src="/logo-icon-white.png"
              alt="PawHome"
              width={40}
              height={40}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Aramıza Katıl</h1>
          <p className="text-blue-100 text-sm mt-2 opacity-90 pr-10">
            Evcil dostun için en iyi bakımı planlamaya başlamak üzeresin.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] -mt-10 relative z-20 px-8 pt-8 pb-6 flex flex-col overflow-y-auto">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-medium px-4 py-3 rounded-xl mb-4 border border-red-100 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <form action={registerAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
              Ad Soyad
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-regular fa-user text-slate-400"></i>
              </div>
              <input
                type="text"
                name="fullname"
                placeholder="Adınız Soyadınız"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
              />
            </div>
          </div>

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
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 ml-1">
              Şifre Oluştur
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-lock text-slate-400"></i>
              </div>
              <input
                type="password"
                name="password"
                placeholder="En az 6 karakter"
                required
                minLength={6}
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mt-2 group">
            <input
              type="checkbox"
              name="terms"
              defaultChecked
              required
              className="mt-1 w-4 h-4 accent-pw-primary"
            />
            <p className="text-xs text-slate-500 leading-snug">
              <span className="font-semibold text-pw-primary">Kullanım Koşulları</span>&apos;nı ve{" "}
              <span className="font-semibold text-pw-primary">Gizlilik Politikası</span>&apos;nı
              okudum, onaylıyorum.
            </p>
          </label>

          <button
            type="submit"
            className="w-full bg-pw-secondary text-white py-4 rounded-2xl font-semibold shadow-lg shadow-green-500/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-4"
          >
            <span>Hesap Oluştur</span>
          </button>
        </form>

        <div className="mt-auto pt-6 text-center pb-2">
          <p className="text-xs text-slate-500">
            Zaten bir hesabın var mı?{" "}
            <Link href="/login" className="text-pw-primary font-bold hover:underline">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
