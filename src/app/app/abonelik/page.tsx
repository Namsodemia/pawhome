import Link from "next/link";

export default function AbonelikPage() {
  return (
    <>
      <header className="bg-white p-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-10">
        <Link
          href="/app/profil"
          className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h1 className="font-bold text-lg">Abonelik Paketim</h1>
      </header>

      <main className="p-6 pb-28 space-y-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 relative opacity-70">
          <h3 className="font-bold text-lg text-slate-700">Başlangıç Paketi</h3>
          <p className="text-2xl font-bold mt-2">Ücretsiz</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li>
              <i className="fa-solid fa-check text-green-500 mr-2"></i> 1 Evcil Hayvan Profili
            </li>
            <li>
              <i className="fa-solid fa-check text-green-500 mr-2"></i> Temel Hatırlatıcılar
            </li>
          </ul>
          <button className="w-full mt-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm font-bold cursor-default">
            Kullanılan Paket
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
            ÖNERİLEN
          </div>
          <h3 className="font-bold text-lg">PetWhisper Premium</h3>
          <p className="text-2xl font-bold mt-2">
            ₺49.99 <span className="text-sm font-normal opacity-70">/ay</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-blue-100">
            <li>
              <i className="fa-solid fa-check text-yellow-300 mr-2"></i> Sınırsız Evcil Hayvan
            </li>
            <li>
              <i className="fa-solid fa-check text-yellow-300 mr-2"></i> VetAI ile Sınırsız Sohbet
            </li>
            <li>
              <i className="fa-solid fa-check text-yellow-300 mr-2"></i> 7/24 Veteriner Desteği
            </li>
          </ul>
          <button className="w-full mt-6 py-3 rounded-xl bg-white text-blue-600 font-bold shadow-lg">
            Premium&apos;a Geç
          </button>
        </div>
      </main>
    </>
  );
}
