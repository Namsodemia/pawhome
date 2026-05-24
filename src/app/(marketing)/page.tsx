import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50"></div>
        <div className="absolute -top-32 -right-20 w-96 h-96 bg-pw-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pw-secondary/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1 text-[11px] font-semibold text-slate-700 mb-5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              Yapay zeka destekli evcil bakım
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              Dostunun bakımı,{" "}
              <span className="bg-gradient-to-r from-pw-primary to-pw-secondary bg-clip-text text-transparent">
                tek dokunuşta
              </span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed max-w-lg">
              Aşı, mama, yürüyüş ve veteriner randevularını planla. Acil durumda VetAI ile anında
              tavsiye al. Köpek ya da kedi, herkes için.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="bg-pw-primary text-white font-semibold px-7 py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Ücretsiz Başla <i className="fa-solid fa-arrow-right text-sm"></i>
              </Link>
              <Link
                href="/features"
                className="bg-white border border-slate-200 text-slate-800 font-semibold px-7 py-4 rounded-2xl hover:border-pw-primary hover:text-pw-primary transition-colors text-center"
              >
                Özellikleri Gör
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-check text-pw-secondary"></i> Kredi kartı gerekmez
              </div>
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-check text-pw-secondary"></i> 30 saniyede kayıt
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative">
            {/* glow rings */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pw-primary/20 to-pw-secondary/20 rounded-[3rem] blur-2xl"></div>
            <div className="absolute inset-10 border-2 border-pw-primary/10 rounded-full animate-pw-ping"></div>

            <div className="relative mx-auto max-w-[280px] aspect-[9/19] bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 rounded-[2.3rem] flex flex-col items-center justify-center text-white relative overflow-hidden">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full"></div>

                {/* Logo with bounce */}
                <div className="relative w-24 h-24 mb-4 animate-pw-bounce">
                  <Image
                    src="/logo-icon-white.png"
                    alt="PawHome"
                    fill
                    sizes="96px"
                    className="object-contain"
                    priority
                  />
                </div>

                <p className="text-xs opacity-80 mb-1">Hoş geldin,</p>
                <h2 className="text-xl font-bold">Luna nasıl?</h2>

                <div className="mt-6 flex gap-2">
                  <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-2 text-[10px]">💉 Aşı</div>
                  <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-2 text-[10px]">🦴 Mama</div>
                  <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-2 text-[10px]">🐾 Gezdir</div>
                </div>

                {/* AI dot pattern overlay */}
                <div className="absolute inset-0 pw-pattern-dots opacity-30 pointer-events-none"></div>
              </div>
            </div>

            {/* floating mini badges */}
            <div className="hidden md:flex absolute -left-6 top-20 bg-white rounded-2xl shadow-xl border border-slate-100 px-3 py-2 items-center gap-2 animate-pw-fade-in">
              <span className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                <i className="fa-solid fa-check"></i>
              </span>
              <div>
                <div className="text-[10px] text-slate-400">Hatırlatıcı</div>
                <div className="text-xs font-bold text-slate-800">Aşı tamam ✓</div>
              </div>
            </div>
            <div
              className="hidden md:flex absolute -right-6 bottom-20 bg-white rounded-2xl shadow-xl border border-slate-100 px-3 py-2 items-center gap-2 animate-pw-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <span className="w-7 h-7 rounded-full vet-ai-btn flex items-center justify-center text-xs">
                ✨
              </span>
              <div>
                <div className="text-[10px] text-slate-400">VetAI</div>
                <div className="text-xs font-bold text-slate-800">Anında cevap</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "12K+", l: "Mutlu Sahip" },
            { n: "350+", l: "Veteriner Kliniği" },
            { n: "85K+", l: "Plan Tamamlandı" },
            { n: "4.9★", l: "App Store Puanı" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl md:text-3xl font-bold text-slate-900">{s.n}</div>
              <div className="text-xs text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">
            Neden PawHome
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Tek uygulamada, tüm bakım
          </h2>
          <p className="mt-3 text-slate-600">
            Hatırlatıcılardan veteriner aramaya, sosyal toplulukta paylaşıma kadar her şey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "fa-bell",
              color: "from-blue-500 to-blue-600",
              title: "Akıllı Hatırlatıcılar",
              desc: "Aşı tarihleri, mama saatleri, yürüyüş — hiçbirini unutma. Esnek tekrar seçenekleri.",
            },
            {
              icon: "fa-wand-magic-sparkles",
              color: "from-purple-500 to-pink-500",
              title: "VetAI Asistan",
              desc: "Gece yarısı bir şey mi oldu? ChatGPT destekli asistana sor, ne yapman gerektiğini anında öğren.",
            },
            {
              icon: "fa-map-location-dot",
              color: "from-green-500 to-emerald-500",
              title: "En Yakın Klinik",
              desc: "Konumuna göre veteriner klinikleri, açık olanlar ve nöbetçiler — tek dokunuşla ara.",
            },
            {
              icon: "fa-comments",
              color: "from-orange-500 to-amber-500",
              title: "Topluluk",
              desc: "Hayvan sahibi binlerce kişi. Soru sor, deneyim paylaş, hikaye anlat.",
            },
            {
              icon: "fa-chart-line",
              color: "from-cyan-500 to-teal-500",
              title: "Sağlık Takibi",
              desc: "Dostunun sağlık ve enerji skoru. Beslenme ve aktivite trendleri.",
            },
            {
              icon: "fa-mobile-screen",
              color: "from-slate-700 to-slate-900",
              title: "iOS & Android",
              desc: "Mobil için optimize. Bildirimleri telefonuna gelir, herhangi bir cihazdan ulaş.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group bg-white p-6 rounded-2xl border border-slate-100 hover:border-pw-primary/30 hover:shadow-xl transition-all"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center text-lg mb-4 group-hover:scale-110 transition-transform`}
              >
                <i className={`fa-solid ${f.icon}`}></i>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pw-pattern-dots opacity-20"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-pw-primary/20 rounded-full blur-3xl"></div>

        {/* Watermark logo */}
        <div className="absolute right-10 bottom-10 opacity-10 hidden md:block">
          <Image
            src="/logo-icon-white.png"
            alt=""
            width={180}
            height={180}
            className="object-contain"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-5 py-20 text-center">
          <i className="fa-solid fa-quote-left text-pw-primary text-3xl opacity-50 mb-4"></i>
          <div className="text-yellow-400 text-2xl mb-5">★★★★★</div>
          <blockquote className="text-xl md:text-2xl font-medium leading-relaxed">
            &ldquo;Luna&apos;nın aşı takvimini hep kaçırırdım. PawHome&apos;dan sonra hiçbir randevuyu unutmuyorum,
            VetAI da gece yarısı paniklediğimde hayat kurtardı.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm font-bold">
              ZE
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Zeynep E.</div>
              <div className="text-xs text-slate-400">Kedi annesi · İstanbul</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="bg-gradient-to-br from-pw-primary via-blue-600 to-pw-secondary rounded-3xl p-10 md:p-16 text-white text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 pw-pattern-grid opacity-30 pointer-events-none"></div>

          <div className="relative">
            {/* Center logo */}
            <div className="w-16 h-16 mx-auto mb-5 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/30 p-2 flex items-center justify-center">
              <Image
                src="/logo-icon-white.png"
                alt="PawHome"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Dostunun bakımına bugün başla
            </h2>
            <p className="text-blue-50 max-w-md mx-auto mb-7">
              30 saniyede kayıt ol. Kredi kartı gerekmez. İlk 1 evcil hayvan ve temel hatırlatıcılar
              hep ücretsiz.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-pw-primary font-bold px-8 py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
            >
              Ücretsiz Hesap Oluştur <i className="fa-solid fa-arrow-right text-sm"></i>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
