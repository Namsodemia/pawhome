export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-16 md:py-24">
      <div className="text-center mb-14">
        <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">
          Hakkımızda
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
          Evcil dostlara daha iyi bir bakım için
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          PawHome, evcil hayvan sahibi olmanın getirdiği günlük yükü hafifletmek için kuruldu.
        </p>
      </div>

      <div className="prose prose-slate max-w-none">
        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Hikayemiz</h2>
        <p className="text-slate-600 leading-relaxed">
          2024&apos;te bir grup mühendis ve veteriner, evcil hayvan sahiplerinin aşı tarihlerini
          unutmak, doğru veterineri bulamamak ve küçük endişeler için ne yapacağını bilmemek gibi
          ortak problemlerle karşılaştıklarını fark etti. Mevcut çözümler ya çok karmaşık ya da
          eksikti. Biz de basit, akıllı ve duyarlı bir uygulama yapmaya karar verdik.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Misyonumuz</h2>
        <p className="text-slate-600 leading-relaxed">
          Her evcil hayvanın eşit kaliteli bakım almasına yardımcı olmak. Bilgiye erişimi
          demokratikleştirmek, yapay zeka ile sahipleri güçlendirmek ve veteriner-sahip bağını
          kolaylaştırmak.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Değerlerimiz</h2>
        <div className="grid md:grid-cols-2 gap-5 not-prose mt-6">
          {[
            { title: "Hayvan Refahı Önce", desc: "Her özellik, hayvan dostumuzun sağlığını ve mutluluğunu önceler." },
            { title: "Şeffaflık", desc: "Kapalı kapılar arkasında karar almayız. Yol haritamız ve fiyatlandırma her zaman açık." },
            { title: "Veri Mahremiyeti", desc: "Kullanıcı verisi satılmaz, paylaşılmaz. Veri minimumda tutulur." },
            { title: "Yapay Zeka Sorumlu", desc: "VetAI teşhis koymaz, gerçek veterinere yönlendirir. AI sadece destek aracıdır." },
          ].map((v) => (
            <div key={v.title} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
              <p className="text-sm text-slate-600">{v.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
