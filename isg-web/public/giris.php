<?php
/**
 * İsgora giriş & kayıt sayfası.
 *  - /giris.php            : giriş (e-posta veya kullanıcı adı + şifre)
 *  - /giris.php?kayit=1    : kayıt — rol seçimi (OSGB, İSG uzmanı, işyeri hekimi, öğrenci) ve role özel alanlar
 *  - /giris.php?cikis=1    : oturumu kapat
 *  - /giris.php?sifirla=1  : data/ klasöründe "SIFRE-SIFIRLA" dosyası varsa ilk yöneticinin şifresini yeniler
 * Hiç kullanıcı yoksa ilk kayıt yönetici olur (config.php'de setup_code doluysa kod sorulur).
 */

define('ISGORA', 1);
require __DIR__ . '/api/_lib.php';

header('Cache-Control: no-store');
header('X-Frame-Options: DENY');

function h($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function strlen_u(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s) : strlen($s);
}

function safe_next(): string
{
    $n = (string) ($_GET['next'] ?? $_POST['next'] ?? '');
    return preg_match('#^/app(/[^\s]*)?$#', $n) && strpos($n, '//') === false ? $n : '/app/';
}

function csrf_token(): string
{
    static $t = null;
    if ($t !== null) {
        return $t;
    }
    $t = (string) ($_COOKIE['isgora_form'] ?? '');
    if (!preg_match('/^[a-f0-9]{32}$/', $t)) {
        $t = bin2hex(random_bytes(16));
        setcookie('isgora_form', $t, ['expires' => 0, 'path' => '/giris.php', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Strict']);
    }
    return $t;
}

function reset_file(): ?string
{
    foreach (['SIFRE-SIFIRLA', 'SIFRE-SIFIRLA.txt', 'sifre-sifirla', 'sifre-sifirla.txt'] as $f) {
        if (is_file(data_dir() . '/' . $f)) {
            return data_dir() . '/' . $f;
        }
    }
    return null;
}

function post(string $k): string
{
    return trim((string) ($_POST[$k] ?? ''));
}

try {
    db();
} catch (Throwable $e) {
    error_log('[isgora] ' . $e->getMessage());
    http_response_code(500);
    echo 'Veritabanı açılamadı. data/ klasörünün yazılabilir olduğundan ve PHP pdo_sqlite eklentisinin açık olduğundan emin olun.';
    exit;
}

if (isset($_GET['cikis'])) {
    clear_session();
    header('Location: /giris.php');
    exit;
}

$cfg = cfg();
$firstRun = user_count() === 0;
$registerOpen = $firstRun || !empty($cfg['kayit_acik']);
$mode = 'giris';
if ($firstRun || isset($_GET['kayit'])) {
    $mode = $registerOpen ? 'kayit' : 'giris';
}
if (!$firstRun && isset($_GET['sifirla']) && reset_file() !== null) {
    $mode = 'sifirla';
}
$setupCode = trim((string) ($cfg['setup_code'] ?? ''));
$inviteCode = trim((string) ($cfg['kayit_kodu'] ?? ''));
$needCode = $firstRun ? $setupCode : $inviteCode;

$ROLES = [
    'osgb' => ['OSGB / Eğitim Kurumu', 'Risk analizi, kasa/cari, kursiyer takibi, sınıflar ve tüm İSG araçları', '#107398',
        '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01"/>'],
    'uzman' => ['İş Güvenliği Uzmanı', 'Risk analizi, saha denetimi, kaza / ramak kala kayıtları, mevzuat ve hesaplayıcı', '#3AA466',
        '<path d="M2 18a10 10 0 0 1 20 0v2H2z"/><path d="M10 9V5a2 2 0 0 1 4 0v4M4 14a8 8 0 0 1 4-6M20 14a8 8 0 0 0-4-6"/>'],
    'hekim' => ['İşyeri Hekimi / Doktor', 'Periyodik muayene takibi, meslek hastalığı ve kaza kayıtları, mevzuat', '#D6334C',
        '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>'],
    'ogrenci' => ['Öğrenci / Uzman Adayı', 'İSG uzmanlığı sınav hazırlık, deneme sınavları, mevzuat ve yapay zekâ asistanı', '#6C5CE7',
        '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'],
];

$error = '';
$info = '';
$sel = in_array($_POST['rol'] ?? '', array_keys($ROLES), true) ? $_POST['rol'] : (in_array($_GET['rol'] ?? '', array_keys($ROLES), true) ? $_GET['rol'] : '');

if ($mode === 'giris' && $_SERVER['REQUEST_METHOD'] === 'GET' && current_user()) {
    header('Location: ' . safe_next());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals(csrf_token(), (string) ($_POST['_t'] ?? ''))) {
        $error = 'Form süresi doldu, lütfen tekrar deneyin.';
    } elseif ($mode === 'giris') {
        if (login_blocked()) {
            $error = 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.';
        } else {
            $id = post('kullanici');
            $st = db()->prepare('SELECT id, kullanici_adi, sifre_hash FROM kullanicilar WHERE kullanici_adi = ? COLLATE NOCASE OR eposta = ? COLLATE NOCASE LIMIT 1');
            $st->execute([$id, $id]);
            $u = $st->fetch();
            if ($u && password_verify((string) ($_POST['sifre'] ?? ''), $u['sifre_hash'])) {
                if (password_needs_rehash($u['sifre_hash'], PASSWORD_DEFAULT)) {
                    $u['sifre_hash'] = password_hash((string) $_POST['sifre'], PASSWORD_DEFAULT);
                    db()->prepare('UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?')->execute([$u['sifre_hash'], $u['id']]);
                }
                login_ok();
                issue_session($u);
                header('Location: ' . safe_next());
                exit;
            }
            login_failed();
            $error = 'E-posta / kullanıcı adı veya şifre hatalı.';
        }
    } elseif ($mode === 'sifirla') {
        $pass = (string) ($_POST['sifre'] ?? '');
        if (strlen_u($pass) < 8) {
            $error = 'Şifre en az 8 karakter olmalı.';
        } elseif ($pass !== (string) ($_POST['sifre2'] ?? '')) {
            $error = 'Şifreler aynı değil.';
        } else {
            $first = db()->query('SELECT id FROM kullanicilar ORDER BY id LIMIT 1')->fetchColumn();
            db()->prepare('UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $first]);
            @unlink((string) reset_file());
            $st = db()->prepare('SELECT id, kullanici_adi, sifre_hash FROM kullanicilar WHERE id = ?');
            $st->execute([$first]);
            login_ok();
            issue_session($st->fetch());
            header('Location: /app/');
            exit;
        }
    } else { // kayıt
        $ad = post('ad_soyad');
        $eposta = strtolower(post('eposta'));
        $pass = (string) ($_POST['sifre'] ?? '');
        $kurum = post('kurum');
        if (register_blocked()) {
            $error = 'Bu bağlantıdan çok fazla hesap açıldı. Bir saat sonra tekrar deneyin.';
        } elseif ($needCode !== '' && !hash_equals($needCode, post('kod'))) {
            login_failed();
            $error = $firstRun ? 'Kurulum kodu hatalı.' : 'Davet kodu hatalı.';
        } elseif ($sel === '') {
            $error = 'Lütfen bir rol seçin.';
        } elseif (strlen_u($ad) < 3) {
            $error = 'Adınızı ve soyadınızı yazın.';
        } elseif (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
            $error = 'Geçerli bir e-posta adresi yazın.';
        } elseif (strlen_u($pass) < 8) {
            $error = 'Şifre en az 8 karakter olmalı.';
        } elseif ($pass !== (string) ($_POST['sifre2'] ?? '')) {
            $error = 'Şifreler aynı değil.';
        } elseif ($sel === 'osgb' && strlen_u($kurum) < 2) {
            $error = 'OSGB / kurum adını yazın.';
        } else {
            $st = db()->prepare('SELECT COUNT(*) FROM kullanicilar WHERE kullanici_adi = ? COLLATE NOCASE OR eposta = ? COLLATE NOCASE');
            $st->execute([$eposta, $eposta]);
            if ((int) $st->fetchColumn() > 0) {
                $error = 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.';
            } else {
                $profil = clean_profile([
                    'ad_soyad' => $ad,
                    'kurum' => $kurum,
                    'il' => post('il'),
                    'uzmanlik_sinifi' => $sel === 'uzman' ? post('uzmanlik_sinifi') : '',
                    'hedef_sinav' => $sel === 'ogrenci' ? post('hedef_sinav') : '',
                    'sinav_tarihi' => $sel === 'ogrenci' ? post('sinav_tarihi') : '',
                ]);
                db()->prepare('INSERT INTO kullanicilar (kullanici_adi, sifre_hash, olusturma, eposta, ad_soyad, rol, profil, yonetici) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                    ->execute([$eposta, password_hash($pass, PASSWORD_DEFAULT), gmdate('c'), $eposta, $ad, $sel, json_encode($profil, ISGORA_JSON), $firstRun ? 1 : 0]);
                $uid = (int) db()->lastInsertId();
                register_mark();
                login_ok();
                $st = db()->prepare('SELECT id, kullanici_adi, sifre_hash FROM kullanicilar WHERE id = ?');
                $st->execute([$uid]);
                issue_session($st->fetch());
                header('Location: /app/?hosgeldin=1');
                exit;
            }
        }
    }
}

if (isset($_GET['sifirla']) && $mode !== 'sifirla') {
    $info = 'Şifre sıfırlamak için site yöneticisinin cPanel Dosya Yöneticisi\'nde data klasörüne "SIFRE-SIFIRLA" adlı boş bir dosya oluşturması ve bu sayfayı yenilemesi gerekir.';
}
if (isset($_GET['kayit']) && !$registerOpen) {
    $info = 'Yeni kayıtlar şu an kapalı.';
}

$titles = ['giris' => 'Giriş yap', 'kayit' => $firstRun ? 'İlk kurulum · hesap oluştur' : 'Hesap oluştur', 'sifirla' => 'Yeni şifre belirle'];
$title = $titles[$mode];
$token = csrf_token();
$v = function (string $k) {
    return h($_POST[$k] ?? '');
};
?><!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title><?= h($title) ?> · İsgora</title>
<link rel="icon" href="/icon.png">
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;
    font-family:"Plus Jakarta Sans",-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#2A3A4C;
    background:radial-gradient(900px 420px at 85% -10%,#E4F1F8,transparent),radial-gradient(800px 400px at 0% 10%,#E6F5EC,transparent),#F4F7F9}
  .card{width:100%;max-width:440px;background:#fff;border:1px solid #E6EBF0;border-radius:28px;padding:30px;box-shadow:0 24px 60px -12px rgba(20,34,54,.18)}
  .card.wide{max-width:760px}
  .logo{display:block;height:44px;margin:0 auto 6px}
  .tag{text-align:center;color:#6E7C8C;font-size:12.5px;margin-bottom:20px}
  h1{font-size:22px;margin:0 0 4px;color:#1E3145;font-weight:800}
  p.sub{margin:0 0 16px;color:#6E7C8C;font-size:13.5px;line-height:1.5}
  label.f{display:block;font-size:12.5px;font-weight:700;color:#1E3145;margin:14px 0 6px}
  input,select{width:100%;border:1px solid #E6EBF0;border-radius:16px;padding:12px 14px;font-size:15px;color:#1E3145;outline:none;background:#fff;font-family:inherit}
  input:focus,select:focus{border-color:#107398;box-shadow:0 0 0 4px rgba(16,115,152,.1)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}
  @media (max-width:560px){.grid2{grid-template-columns:1fr}.card{padding:22px}}
  button.go{width:100%;margin-top:22px;border:0;border-radius:16px;padding:14px;font-size:15px;font-weight:800;color:#fff;cursor:pointer;
    background:linear-gradient(135deg,#5CBD7D 0%,#107398 100%);box-shadow:0 10px 24px -6px rgba(16,115,152,.45);font-family:inherit}
  .err{background:#FDE7EB;color:#D6334C;border-radius:14px;padding:11px 14px;font-size:13.5px;font-weight:700;margin-bottom:8px}
  .info{background:#E4F1F8;color:#107398;border-radius:14px;padding:11px 14px;font-size:13px;font-weight:600;margin-bottom:8px;line-height:1.5}
  .foot{margin-top:18px;text-align:center;font-size:13px;color:#6E7C8C}
  .foot a{color:#107398;font-weight:800;text-decoration:none}
  .step{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1E3145;margin:18px 0 10px;display:flex;align-items:center;gap:8px}
  .step:before{content:"";width:16px;height:3px;border-radius:9px;background:linear-gradient(135deg,#5CBD7D,#107398)}
  .roles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media (max-width:560px){.roles{grid-template-columns:1fr}}
  .role{position:relative;display:flex;gap:12px;align-items:flex-start;border:2px solid #E6EBF0;border-radius:20px;padding:14px;cursor:pointer;transition:.15s;background:#fff}
  .role:hover{border-color:#B9D9E7}
  .role input{position:absolute;opacity:0;pointer-events:none}
  .role .ic{flex:none;width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff}
  .role .ic svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .role b{display:block;color:#1E3145;font-size:14.5px}
  .role span.d{display:block;color:#6E7C8C;font-size:12.5px;line-height:1.45;margin-top:3px}
  .role.on{border-color:#107398;background:#F2F8FB;box-shadow:0 8px 20px -10px rgba(16,115,152,.5)}
  .role .chk{position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:99px;border:2px solid #E6EBF0;background:#fff}
  .role.on .chk{border-color:#107398;background:#107398;box-shadow:inset 0 0 0 3px #fff}
  .only{display:none}
  form[data-rol="osgb"] .r-osgb, form[data-rol="uzman"] .r-uzman, form[data-rol="hekim"] .r-hekim, form[data-rol="ogrenci"] .r-ogrenci{display:block}
  form:not([data-rol]) .details, form[data-rol=""] .details{display:none}
  .js-off .only{display:block} .js-off .details{display:block !important}
  .hint{font-size:12px;color:#6E7C8C;margin-top:5px}
</style>
</head>
<body>
<?php if ($mode === 'kayit'): ?>
  <form class="card wide js-off" method="post" id="f" data-rol="<?= h($sel) ?>" autocomplete="on">
    <img class="logo" src="/logo-horizontal.png" alt="İsgora">
    <div class="tag">İş Sağlığı ve Güvenliği App</div>
    <h1><?= h($title) ?></h1>
    <p class="sub"><?= $firstRun ? 'Bu sunucudaki ilk hesap yönetici olur. Rolünüzü seçin; menüler ve ana sayfa buna göre hazırlanır.' : 'Rolünüzü seçin; menüler, ana sayfa ve asistan buna göre hazırlanır. Rolü daha sonra Ayarlar\'dan değiştirebilirsiniz.' ?></p>
    <?php if ($error): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
    <?php if ($info): ?><div class="info"><?= h($info) ?></div><?php endif; ?>
    <input type="hidden" name="_t" value="<?= h($token) ?>">

    <div class="step">1 · Rolünüz</div>
    <div class="roles">
      <?php foreach ($ROLES as $id => [$ad, $aciklama, $renk, $svg]): ?>
        <label class="role<?= $sel === $id ? ' on' : '' ?>">
          <input type="radio" name="rol" value="<?= h($id) ?>"<?= $sel === $id ? ' checked' : '' ?> required>
          <span class="ic" style="background:<?= h($renk) ?>"><svg viewBox="0 0 24 24"><?= $svg ?></svg></span>
          <span><b><?= h($ad) ?></b><span class="d"><?= h($aciklama) ?></span></span>
          <span class="chk"></span>
        </label>
      <?php endforeach; ?>
    </div>

    <div class="details">
      <div class="step">2 · Bilgileriniz</div>
      <div class="grid2">
        <div><label class="f" for="ad_soyad">Ad soyad</label><input id="ad_soyad" name="ad_soyad" required autocomplete="name" value="<?= $v('ad_soyad') ?>"></div>
        <div><label class="f" for="eposta">E-posta</label><input id="eposta" name="eposta" type="email" required autocomplete="email" value="<?= $v('eposta') ?>"></div>
      </div>

      <div class="only r-osgb">
        <div class="grid2">
          <div><label class="f" for="kurum_o">OSGB / kurum adı</label><input id="kurum_o" name="kurum" data-k="kurum" value="<?= $sel === 'osgb' ? $v('kurum') : '' ?>" placeholder="Örn. Demirel OSGB Ltd. Şti."></div>
          <div><label class="f" for="il_o">İl</label><input id="il_o" name="il" data-k="il" value="<?= $sel === 'osgb' ? $v('il') : '' ?>"></div>
        </div>
        <div class="hint">Kurum adınız raporlarda ve risk analizi çıktılarında görünür.</div>
      </div>

      <div class="only r-uzman">
        <div class="grid2">
          <div><label class="f" for="sinif">Uzmanlık belgesi sınıfı</label>
            <select id="sinif" name="uzmanlik_sinifi">
              <option value="">Seçin</option>
              <?php foreach (['A', 'B', 'C'] as $c): ?><option value="<?= $c ?>"<?= ($_POST['uzmanlik_sinifi'] ?? '') === $c ? ' selected' : '' ?>><?= $c ?> sınıfı</option><?php endforeach; ?>
            </select></div>
          <div><label class="f" for="kurum_u">Çalıştığınız firma / OSGB</label><input id="kurum_u" name="kurum" data-k="kurum" value="<?= $sel === 'uzman' ? $v('kurum') : '' ?>" placeholder="İsteğe bağlı"></div>
        </div>
        <label class="f" for="il_u">İl</label><input id="il_u" name="il" data-k="il" value="<?= $sel === 'uzman' ? $v('il') : '' ?>">
      </div>

      <div class="only r-hekim">
        <div class="grid2">
          <div><label class="f" for="kurum_h">Çalıştığınız kurum / OSGB / hastane</label><input id="kurum_h" name="kurum" data-k="kurum" value="<?= $sel === 'hekim' ? $v('kurum') : '' ?>" placeholder="İsteğe bağlı"></div>
          <div><label class="f" for="il_h">İl</label><input id="il_h" name="il" data-k="il" value="<?= $sel === 'hekim' ? $v('il') : '' ?>"></div>
        </div>
        <div class="hint">Ana sayfanızda periyodik muayene takibi ve sağlık gözetimi araçları açılır.</div>
      </div>

      <div class="only r-ogrenci">
        <div class="grid2">
          <div><label class="f" for="hedef">Hazırlandığınız sınav</label>
            <select id="hedef" name="hedef_sinav">
              <option value="">Seçin</option>
              <?php foreach (['C Sınıfı İSG Uzmanlığı', 'B Sınıfı İSG Uzmanlığı', 'A Sınıfı İSG Uzmanlığı', 'İşyeri Hekimliği', 'DSP (Diğer Sağlık Personeli)'] as $c): ?>
                <option<?= ($_POST['hedef_sinav'] ?? '') === $c ? ' selected' : '' ?>><?= h($c) ?></option>
              <?php endforeach; ?>
            </select></div>
          <div><label class="f" for="tarih">Sınav tarihi</label><input id="tarih" name="sinav_tarihi" type="date" value="<?= $v('sinav_tarihi') ?>"></div>
        </div>
        <label class="f" for="kurum_s">Kurs / okul</label><input id="kurum_s" name="kurum" data-k="kurum" value="<?= $sel === 'ogrenci' ? $v('kurum') : '' ?>" placeholder="İsteğe bağlı">
        <div class="hint">Ana sayfanızda deneme sınavları, ders ilerlemesi ve sınava kalan gün görünür.</div>
      </div>

      <div class="grid2">
        <div><label class="f" for="sifre">Şifre (en az 8 karakter)</label><input id="sifre" name="sifre" type="password" required autocomplete="new-password"></div>
        <div><label class="f" for="sifre2">Şifre (tekrar)</label><input id="sifre2" name="sifre2" type="password" required autocomplete="new-password"></div>
      </div>
      <?php if ($needCode !== ''): ?>
        <label class="f" for="kod"><?= $firstRun ? 'Kurulum kodu' : 'Davet kodu' ?></label>
        <input id="kod" name="kod" required autocomplete="off">
      <?php endif; ?>
      <button class="go" type="submit">Hesabı oluştur ve başla</button>
    </div>
    <?php if (!$firstRun): ?><div class="foot">Zaten hesabınız var mı? <a href="/giris.php">Giriş yapın</a></div><?php endif; ?>
  </form>
  <script>
    (function () {
      var f = document.getElementById('f');
      f.classList.remove('js-off');
      var cards = f.querySelectorAll('.role');
      function sync() {
        var r = (f.querySelector('input[name=rol]:checked') || {}).value || '';
        f.setAttribute('data-rol', r);
        cards.forEach(function (c) { c.classList.toggle('on', c.querySelector('input').checked); });
        // Yalnızca seçili role ait "kurum" ve "il" alanları gönderilsin
        f.querySelectorAll('[data-k]').forEach(function (inp) {
          var box = inp.closest('.only');
          inp.disabled = !!box && !box.classList.contains('r-' + r);
        });
      }
      cards.forEach(function (c) {
        c.addEventListener('change', function () {
          sync();
          var a = document.getElementById('ad_soyad');
          setTimeout(function () {
            var el = document.activeElement;
            // Kullanıcı başka bir alana geçmediyse ad soyad alanına odaklan
            if (a && !a.value && (!el || el === document.body || el.name === 'rol')) a.focus();
          }, 50);
        });
      });
      sync();
    })();
  </script>
<?php else: ?>
  <form class="card" method="post" autocomplete="on">
    <img class="logo" src="/logo-horizontal.png" alt="İsgora">
    <div class="tag">İş Sağlığı ve Güvenliği App</div>
    <h1><?= h($title) ?></h1>
    <p class="sub"><?= $mode === 'sifirla' ? 'Yönetici hesabı için yeni bir şifre belirleyin.' : 'OSGB, İSG uzmanı, işyeri hekimi ve öğrenciler için İSG uygulaması.' ?></p>
    <?php if ($error): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
    <?php if ($info): ?><div class="info"><?= h($info) ?></div><?php endif; ?>
    <input type="hidden" name="_t" value="<?= h($token) ?>">
    <input type="hidden" name="next" value="<?= h(safe_next()) ?>">
    <?php if ($mode === 'giris'): ?>
      <label class="f" for="kullanici">E-posta veya kullanıcı adı</label>
      <input id="kullanici" name="kullanici" required autocomplete="username" value="<?= $v('kullanici') ?>" autofocus>
      <label class="f" for="sifre">Şifre</label>
      <input id="sifre" name="sifre" type="password" required autocomplete="current-password">
      <button class="go" type="submit">Giriş yap</button>
      <div class="foot">
        <?php if ($registerOpen): ?>Hesabınız yok mu? <a href="/giris.php?kayit=1">Kayıt olun</a><br><?php endif; ?>
        <a href="/giris.php?sifirla=1" style="font-weight:600">Şifremi unuttum</a> · <a href="/" style="font-weight:600">Tanıtım sayfası</a>
      </div>
    <?php else: ?>
      <label class="f" for="sifre">Yeni şifre (en az 8 karakter)</label>
      <input id="sifre" name="sifre" type="password" required autocomplete="new-password">
      <label class="f" for="sifre2">Yeni şifre (tekrar)</label>
      <input id="sifre2" name="sifre2" type="password" required autocomplete="new-password">
      <button class="go" type="submit">Şifreyi kaydet</button>
    <?php endif; ?>
  </form>
<?php endif; ?>
</body>
</html>
