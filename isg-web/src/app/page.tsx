import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  GraduationCap,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Siren,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

const FEATURES: { icon: LucideIcon; color: string; title: string; text: string }[] = [
  {
    icon: ShieldCheck,
    color: "#5CBD7D",
    title: "Yapay zekâ ile risk analizi",
    text: "İşletmeyi tanımlayın; 5x5 L tipi matrise göre 20–150 maddelik, bölüm bölüm risk değerlendirmesi üretilsin. Excel ve PDF rapor tek tıkla.",
  },
  {
    icon: Wallet,
    color: "#107398",
    title: "Kasa / Cari",
    text: "Birden çok kasa, gelir-gider kategorileri, aylık özet. Kursiyer tahsilatları kasaya otomatik ve çift kayıtsız yansır.",
  },
  {
    icon: Users,
    color: "#0B6F7B",
    title: "Müşteri (kursiyer) takip",
    text: "Program bazında sözleşme, nakit/banka tahsilat ve kalan borç. Hızlı tahsilat, arama, WhatsApp, Excel içe/dışa aktarım.",
  },
  {
    icon: MessagesSquare,
    color: "#1B8ECF",
    title: "Sınıflar ve duyurular",
    text: "Listeyi yapıştırın, numaralar otomatik ayrışsın. Sınıfa WhatsApp sırası ya da toplu SMS ile tek seferde duyuru gönderin.",
  },
  {
    icon: GraduationCap,
    color: "#6C5CE7",
    title: "İSG uzmanlığı sınav hazırlık",
    text: "Ders bazında ön test / son test, karışık deneme sınavları, süre, cevap anahtarı ve geçme notu takibi.",
  },
  {
    icon: Sparkles,
    color: "#107398",
    title: "İsgora Asistan",
    text: "Kasa, kursiyer ve risk verinizi görür; “Yasin kasasına 1.500 TL kırtasiye gideri gir” deyin, onayınızla kaydetsin.",
  },
  {
    icon: BookOpen,
    color: "#1E3145",
    title: "Mevzuat rehberi",
    text: "6331 ve yönetmeliklerden saha özeti: yenileme süreleri, eğitim saatleri, kurul, temsilci, periyodik kontroller.",
  },
  {
    icon: Siren,
    color: "#D6334C",
    title: "Kaza / ramak kala",
    text: "Olay kaydı, kök neden, düzeltici faaliyet ve SGK'ya 3 iş günü bildirim süresi takibi.",
  },
  {
    icon: ClipboardCheck,
    color: "#3AA466",
    title: "Saha denetimi",
    text: "Genel, şantiye, restoran ve ofis kontrol listeleri; uygunluk puanı ve imzalı PDF rapor.",
  },
  {
    icon: Calculator,
    color: "#F4772E",
    title: "İSG hesaplayıcı",
    text: "Uzman/hekim süresi, temsilci, ilk yardımcı ve destek elemanı sayısı, kaza sıklık ve ağırlık hızları, hızlı 5x5 skor.",
  },
];

const MATRIX_COLORS = (o: number, s: number) => {
  const sc = o * s;
  if (sc >= 20) return "#D6334C";
  if (sc >= 15) return "#F4772E";
  if (sc >= 8) return "#FFD100";
  return "#8BD35C";
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-text">
      {/* Üst menü */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="İsgora" className="h-8 w-auto" />
          <nav className="ml-6 hidden items-center gap-6 text-[14px] font-semibold text-muted md:flex">
            <a href="#ozellikler" className="hover:text-navy">
              Özellikler
            </a>
            <a href="#risk" className="hover:text-navy">
              Risk analizi
            </a>
            <a href="#guvenlik" className="hover:text-navy">
              Veri güvenliği
            </a>
          </nav>
          <Link
            href="/app"
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-2xl bg-brand px-4 text-[14px] font-bold text-white shadow-fab transition hover:brightness-105"
          >
            Uygulamayı aç <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_80%_-10%,#E4F1F8,transparent),radial-gradient(900px_420px_at_0%_10%,#E6F5EC,transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 md:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-brand-blue shadow-card">
              <WandSparkles size={14} /> Yapay zekâ destekli İSG süper uygulaması
            </span>
            <h1 className="mt-5 text-[38px] font-extrabold leading-[1.08] tracking-tight text-navy md:text-[54px]">
              İş sağlığı ve güvenliğinin <span className="bg-brand bg-clip-text text-transparent">bütün işleri</span> tek ekranda.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
              Risk analizi, kasa/cari, kursiyer takibi, sınav hazırlık, sınıf duyuruları, mevzuat, kaza kaydı, saha denetimi ve hesaplayıcılar. İsgora mobil
              uygulamasının web sürümü: telefonda, tablette ve bilgisayarda aynı deneyim.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-brand px-6 text-[15px] font-extrabold text-white shadow-fab transition hover:brightness-105"
              >
                Uygulamayı aç <ArrowRight size={18} />
              </Link>
              <Link
                href="/app?demo=1"
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-6 text-[15px] font-bold text-navy transition hover:bg-paper"
              >
                Örnek verilerle dene
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Lock size={14} className="text-brand-green" /> Üyelik gerekmez
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Database size={14} className="text-brand-green" /> Veriler tarayıcınızda
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileSpreadsheet size={14} className="text-brand-green" /> Excel + PDF rapor
              </span>
            </div>
          </div>

          {/* Uygulama önizlemesi */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-[40px] bg-brand opacity-15 blur-2xl" />
            <div className="relative rounded-[34px] border-[10px] border-navy bg-paper p-4 shadow-pop">
              <div className="flex items-center justify-between">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-horizontal.png" alt="" className="h-6 w-auto" />
                <span className="h-7 w-7 rounded-xl bg-white shadow-card" />
              </div>
              <div className="mt-3 text-[18px] font-extrabold text-navy">Günaydın 👋</div>
              <div className="hero-glow relative mt-3 overflow-hidden rounded-[22px] bg-brand p-4 text-white">
                <div className="relative z-10">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-85">Net kasa</div>
                  <div className="num text-[26px] font-extrabold">184.250,00 ₺</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10.5px]">
                    {[
                      ["Bu ay gelir", "54.000 ₺"],
                      ["Bu ay gider", "29.050 ₺"],
                      ["Alacak", "31.200 ₺"],
                    ].map(([a, b]) => (
                      <div key={a} className="rounded-xl bg-white/15 px-2 py-1.5">
                        <div className="opacity-85">{a}</div>
                        <div className="num font-extrabold">{b}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  [5, 4, "Mutfak · LPG'li ocaklarla pişirme", "LPG hortum ve bağlantılarında kaçak"],
                  [3, 5, "Paket Servis · Motosikletle teslimat", "Trafikte hızlı ve dikkatsiz sürüş"],
                  [4, 3, "Mutfak · Fritözde kızartma", "Sıçrayan kızgın yağ ve sıcak yüzeyler"],
                ].map(([o, s, k, t]) => (
                  <div key={String(k)} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-card">
                    <span
                      className="num flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-[14px] font-extrabold"
                      style={{ background: MATRIX_COLORS(Number(o), Number(s)), color: Number(o) * Number(s) >= 20 ? "#fff" : "#1E3145" }}
                    >
                      {Number(o) * Number(s)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[10.5px] font-bold text-muted">{k}</div>
                      <div className="truncate text-[12.5px] font-extrabold text-navy">{t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="ozellikler" className="bg-paper py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="section-label">Modüller</div>
          <h2 className="mt-3 max-w-2xl text-[30px] font-extrabold tracking-tight text-navy md:text-[38px]">Bir OSGB&apos;nin ve İSG uzmanının ihtiyacı olan her şey</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl2 border border-line/70 bg-white p-5 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: f.color }}>
                    <Icon size={21} />
                  </span>
                  <div className="mt-4 text-[16.5px] font-extrabold text-navy">{f.title}</div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Risk analizi */}
      <section id="risk" className="py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
          <div>
            <div className="section-label">Risk değerlendirme</div>
            <h2 className="mt-3 text-[30px] font-extrabold tracking-tight text-navy md:text-[38px]">Mevzuata uygun, işletmeye özel 5x5 risk analizi</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">
              Tehlike kaynağı ile olası sonuç ayrı yazılır, olasılık ve şiddet gerçekçi puanlanır, önlem, sorumlu ve termin her maddede yer alır.
              Üretim bölüm bölüm kaydedilir; yarıda kalırsa kaldığı yerden devam eder.
            </p>
            <ol className="mt-6 space-y-3">
              {[
                ["Plan", "Tehlike sınıfı, faaliyet tanımı ve bölüm başına madde paylaşımı"],
                ["Bölüm bölüm üretim", "Her bölüm için tekrarsız, işletmeye özgü maddeler"],
                ["Sektöre özel uygulama", "Prosedüre eklenen 5–7 maddelik saha esasları"],
                ["Rapor", "4 sayfalı Excel (Giriş, Prosedür, Değerlendirme, RD Ekibi) ve PDF"],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-[13px] font-extrabold text-white">{i + 1}</span>
                  <div>
                    <div className="text-[15px] font-extrabold text-navy">{t}</div>
                    <div className="text-[14px] text-muted">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl3 border border-line/70 bg-white p-6 shadow-card">
            <div className="mb-3 flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-muted">
              <span>5x5 L tipi matris</span>
              <span>Olasılık × Şiddet</span>
            </div>
            <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1.5">
              <span />
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="num text-center text-[11px] font-bold text-muted">
                  Ş{s}
                </span>
              ))}
              {[5, 4, 3, 2, 1].map((o) => (
                <div key={o} className="contents">
                  <span className="num flex items-center pr-1 text-[11px] font-bold text-muted">O{o}</span>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className="num flex aspect-square items-center justify-center rounded-xl text-[15px] font-extrabold"
                      style={{ background: MATRIX_COLORS(o, s), color: o * s >= 20 ? "#fff" : "#1E3145" }}
                    >
                      {o * s}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
              {[
                ["#8BD35C", "1–7 Kabul edilebilir · 1-45 gün"],
                ["#FFD100", "8–14 Dikkate değer · 1-30 gün"],
                ["#F4772E", "15–19 Yüksek · 1-15 gün"],
                ["#D6334C", "20–25 Kabul edilemez · Derhal"],
              ].map(([c, t]) => (
                <span key={t} className="flex items-center gap-2 font-semibold text-text">
                  <span className="h-3 w-3 rounded" style={{ background: c }} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Veri güvenliği */}
      <section id="guvenlik" className="bg-navy py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3 md:px-6">
          {[
            [Database, "Verileriniz sizde", "Kayıtlar sunucuya değil, tarayıcınızın kendi veritabanına (IndexedDB) yazılır. Ayarlar'dan JSON yedek alıp geri yükleyebilirsiniz."],
            [Sparkles, "Claude ile çalışır", "Yapay zekâ özellikleri Anthropic Claude ile çalışır. Kendi API anahtarınızı girin ya da sunucuda tanımlı anahtarı kullanın."],
            [Smartphone, "Telefona kurun", "Tarayıcı menüsünden “Ana ekrana ekle” deyin; İsgora uygulama gibi tam ekran açılır."],
          ].map(([Icon, t, d]) => {
            const I = Icon as LucideIcon;
            return (
              <div key={t as string} className="rounded-xl2 bg-navy-panel p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand">
                  <I size={21} />
                </span>
                <div className="mt-4 text-[17px] font-extrabold">{t as string}</div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/75">{d as string}</p>
              </div>
            );
          })}
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 md:px-6">
          <div className="text-[22px] font-extrabold">Hemen başlayın — kurulum yok.</div>
          <Link
            href="/app"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-[15px] font-extrabold text-navy transition hover:bg-white/90"
          >
            Uygulamayı aç <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-[13px] text-muted md:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="İsgora" className="h-7 w-auto" />
          <span>İsgora · İş Sağlığı ve Güvenliği App · Mevzuat özetleri bilgilendirme amaçlıdır; kesin işlem için güncel Resmî Gazete metnine bakın.</span>
        </div>
      </footer>
    </div>
  );
}
