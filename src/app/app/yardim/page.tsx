import Link from "next/link";

export default function YardimPage() {
  return (
    <>
      <header className="bg-white p-4 border-b border-slate-200 flex items-center gap-4">
        <Link href="/app/profil">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h1 className="font-bold">Yardım Merkezi</h1>
      </header>
      <main className="p-6 pb-28 space-y-4">
        <Faq question="Şifremi nasıl değiştiririm?">
          Profil &gt; Hesap Bilgileri sayfasından yeni şifrenizi girerek güncelleyebilirsiniz.
        </Faq>
        <Faq question="Üyelik ücretli mi?">
          Başlangıç paketi ücretsizdir. Sınırsız özellikler için Premium pakete geçebilirsiniz.
        </Faq>

        <div className="mt-8">
          <h3 className="font-bold mb-2">Bize Ulaşın</h3>
          <a
            href="mailto:destek@petwhisper.com"
            className="block bg-blue-100 text-blue-700 p-4 rounded-xl text-center font-bold text-sm"
          >
            E-posta Gönder
          </a>
        </div>

        <div className="mt-4 text-center">
          <Link href="/app/sozlesmeler" className="text-xs text-slate-400 underline">
            Gizlilik Politikası ve Sözleşmeler
          </Link>
        </div>
      </main>
    </>
  );
}

function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="bg-white p-4 rounded-xl border border-slate-200 group">
      <summary className="font-bold text-sm cursor-pointer list-none flex justify-between items-center">
        {question}
        <i className="fa-solid fa-chevron-down group-open:rotate-180 transition"></i>
      </summary>
      <p className="text-xs text-slate-500 mt-2">{children}</p>
    </details>
  );
}
