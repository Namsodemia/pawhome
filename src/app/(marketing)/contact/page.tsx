import { contactAction } from "./actions";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const sent = sp.sent === "1";
  const plan = sp.plan;

  return (
    <div className="max-w-3xl mx-auto px-5 py-16 md:py-24">
      <div className="text-center mb-12">
        <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">İletişim</p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Bize ulaş</h1>
        <p className="mt-4 text-slate-600 text-lg">
          Sorun, öneri, iş birliği — her şey için buradayız.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-10">
        <Card icon="fa-envelope" title="E-posta" value="destek@pawhome.app" href="mailto:destek@pawhome.app" />
        <Card icon="fa-phone" title="Telefon" value="+90 850 555 PAW" href="tel:+908505557729" />
        <Card icon="fa-location-dot" title="Ofis" value="İstanbul, Türkiye" />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-7 md:p-10 shadow-sm">
        {sent ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Mesajın alındı!</h2>
            <p className="text-slate-600">24 saat içinde dönüş yapacağız.</p>
          </div>
        ) : (
          <form action={contactAction} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">E-posta</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Konu</label>
              <select
                name="subject"
                defaultValue={plan === "klinik" ? "Klinik üyeliği" : "Genel soru"}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
              >
                <option>Genel soru</option>
                <option>Klinik üyeliği</option>
                <option>Teknik destek</option>
                <option>Faturalama</option>
                <option>İş birliği</option>
                <option>Basın</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mesajın</label>
              <textarea
                name="message"
                rows={5}
                required
                placeholder="Detaylı yaz, sana en uygun kişi dönsün."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto bg-pw-primary text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-blue-500/30"
            >
              Mesaj Gönder
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Card({ icon, title, value, href }: { icon: string; title: string; value: string; href?: string }) {
  const inner = (
    <>
      <div className="w-10 h-10 rounded-xl bg-pw-primary/10 text-pw-primary flex items-center justify-center mb-3">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{title}</div>
      <div className="text-sm font-bold text-slate-900 mt-1">{value}</div>
    </>
  );
  return href ? (
    <a href={href} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-pw-primary/30 transition-colors block">
      {inner}
    </a>
  ) : (
    <div className="bg-white border border-slate-100 rounded-2xl p-5">{inner}</div>
  );
}
