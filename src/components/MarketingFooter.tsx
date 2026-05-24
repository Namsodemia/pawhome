import Link from "next/link";
import { Logo } from "./Logo";

export function MarketingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-3">
            <Logo variant="dark" size={36} className="text-lg" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evcil dostun için akıllı bakım asistanı. Plan yap, hatırlatıcı kur, anında veteriner
            tavsiyesi al.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Ürün</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/features" className="hover:text-white">Özellikler</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Fiyatlandırma</Link></li>
            <li><Link href="/app" className="hover:text-white">Uygulama</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Şirket</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/about" className="hover:text-white">Hakkımızda</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/contact" className="hover:text-white">İletişim</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white mb-3">Destek</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/sss" className="hover:text-white">SSS</Link></li>
            <li><Link href="/app/sozlesmeler" className="hover:text-white">Gizlilik</Link></li>
            <li><a href="mailto:destek@pawhome.app" className="hover:text-white">destek@pawhome.app</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} PawHome. Tüm hakları saklıdır.</span>
          <div className="flex gap-4">
            <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter hover:text-white"></i></a>
            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram hover:text-white"></i></a>
            <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin hover:text-white"></i></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
