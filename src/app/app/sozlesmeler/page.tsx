import Link from "next/link";

export default function SozlesmelerPage() {
  return (
    <>
      <header className="bg-white p-4 border-b border-slate-200 flex items-center gap-4">
        <Link href="/app/profil">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h1 className="font-bold">Yasal Bilgiler</h1>
      </header>
      <main className="p-6 pb-28 text-sm text-slate-600 space-y-4">
        <h2 className="font-bold text-slate-900">Gizlilik Politikası</h2>
        <p>
          PetWhisper olarak verilerinizi koruyoruz. Kişisel verileriniz 3. şahıslarla
          paylaşılmaz.
        </p>
        <h2 className="font-bold text-slate-900">Kullanım Koşulları</h2>
        <p>
          Uygulamadaki veteriner tavsiyeleri yapay zeka tarafından üretilmektedir. Tıbbi teşhis
          yerine geçmez.
        </p>
      </main>
    </>
  );
}
