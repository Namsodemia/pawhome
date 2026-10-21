<?php
/**
 * İsgora giriş & kayıt sayfası.
 *  - /giris.php             : giriş (e-posta veya kullanıcı adı + şifre)
 *  - /giris.php?kodla=1     : şifresiz giriş — e-postaya 6 haneli kod (OTP)
 *  - /giris.php?kayit=1     : kayıt — rol seçimi (OSGB, İGU, işyeri hekimi, DSP, öğrenci) ve role özel alanlar,
 *                             ardından e-posta doğrulama kodu (config.php: otp_zorunlu)
 *  - /giris.php?dogrula=1   : e-postaya gelen kodu girme (kayıt / kodla giriş / şifre yenileme)
 *  - /giris.php?unuttum=1   : şifre yenileme kodu iste
 *  - /giris.php?cikis=1     : oturumu kapat
 *  - /giris.php?sifirla=1   : e-posta çalışmıyorsa: data/ klasöründe "SIFRE-SIFIRLA" dosyası varsa ilk yöneticinin şifresini yeniler
 * Hiç kullanıcı yoksa ilk kayıt yönetici olur (config.php'de setup_code doluysa kod sorulur; e-posta doğrulaması istenmez).
 */

define('ISGORA', 1);
require __DIR__ . '/api/_lib.php';

header('Cache-Control: no-store');
header('X-Frame-Options: DENY');

const PENDING_COOKIE = 'isgora_dogrula';

function h($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
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

function go(string $url): void
{
    header('Location: ' . $url);
    exit;
}

/** Kod bekleyen işlem: hangi kullanıcı, hangi amaçla (kayit | giris | sifre), sonra nereye */
function pending_set(int $uid, string $amac, string $next = '/app/'): void
{
    $exp = time() + 3600;
    $payload = b64url(json_encode(['u' => $uid, 'a' => $amac, 'n' => $next, 'e' => $exp]));
    $sig = b64url(hash_hmac('sha256', 'dogrula|' . $payload, (string) cfg()['secret'], true));
    setcookie(PENDING_COOKIE, $payload . '.' . $sig, ['expires' => $exp, 'path' => '/giris.php', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Lax']);
}

function pending_get(): ?array
{
    $tok = (string) ($_COOKIE[PENDING_COOKIE] ?? '');
    if (substr_count($tok, '.') !== 1) {
        return null;
    }
    [$payload, $sig] = explode('.', $tok, 2);
    if (!hash_equals(b64url(hash_hmac('sha256', 'dogrula|' . $payload, (string) cfg()['secret'], true)), $sig)) {
        return null;
    }
    $d = json_decode(b64url_dec($payload), true);
    if (!is_array($d) || (int) ($d['e'] ?? 0) < time() || !in_array($d['a'] ?? '', ['kayit', 'giris', 'sifre'], true)) {
        return null;
    }
    $u = user_by_id((int) ($d['u'] ?? 0));
    return $u ? ['user' => $u, 'amac' => (string) $d['a'], 'next' => (string) ($d['n'] ?? '/app/')] : null;
}

function pending_clear(): void
{
    setcookie(PENDING_COOKIE, '', ['expires' => time() - 3600, 'path' => '/giris.php', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Lax']);
}

/** o•••@alan.com */
function mask_email(string $e): string
{
    [$a, $d] = array_pad(explode('@', $e, 2), 2, '');
    return (function_exists('mb_substr') ? mb_substr($a, 0, 1) : substr($a, 0, 1)) . str_repeat('•', max(2, min(6, strlen($a) - 1))) . '@' . $d;
}

/** otp_send sonucunu kullanıcı mesajına çevirir ('' = başarılı) */
function otp_error(string $r): string
{
    switch ($r) {
        case 'ok':
            return '';
        case 'bekle':
            return 'Yeni kod istemeden önce biraz bekleyin.';
        case 'limit':
            return 'Bu adrese çok fazla kod gönderildi. Bir saat sonra tekrar deneyin.';
        default:
            return 'Doğrulama e-postası gönderilemedi. Birkaç dakika sonra "Kodu tekrar gönder" ile deneyin; sorun sürerse site yöneticisine bildirin.';
    }
}

function login_and_go(array $u, string $to): void
{
    pending_clear();
    login_ok();
    mark_login((int) $u['id']);
    issue_session($u);
    go($to);
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
    pending_clear();
    go('/giris.php');
}

$cfg = site_cfg();
$firstRun = user_count() === 0;
$registerOpen = $firstRun || !empty($cfg['kayit_acik']);
$pending = pending_get();

$mode = 'giris';
if ($firstRun || isset($_GET['kayit'])) {
    $mode = $registerOpen ? 'kayit' : 'giris';
} elseif (isset($_GET['dogrula'])) {
    $mode = $pending ? 'dogrula' : 'giris';
} elseif (isset($_GET['kodla'])) {
    $mode = 'kodla';
} elseif (isset($_GET['unuttum'])) {
    $mode = 'unuttum';
} elseif (isset($_GET['sifirla']) && reset_file() !== null) {
    $mode = 'sifirla';
}
$setupCode = trim((string) ($cfg['setup_code'] ?? ''));
$inviteCode = trim((string) ($cfg['kayit_kodu'] ?? ''));
$needCode = $firstRun ? $setupCode : $inviteCode;

$ROLES = [
    'osgb' => ['OSGB / Eğitim Kurumu', 'Firma (müşteri) takibi, İGU / İH / DSP çalışan hesapları, risk analizi, kasa/cari, sınıflar ve tüm İSG araçları', '#107398',
        '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01"/>'],
    'uzman' => ['İş Sağlığı ve Güvenliği Uzmanı (İGU)', 'Risk analizi, saha denetimi, kaza / ramak kala kayıtları, eğitimler, mevzuat ve hesaplayıcı', '#3AA466',
        '<path d="M2 18a10 10 0 0 1 20 0v2H2z"/><path d="M10 9V5a2 2 0 0 1 4 0v4M4 14a8 8 0 0 1 4-6M20 14a8 8 0 0 0-4-6"/>'],
    'hekim' => ['İşyeri Hekimi (İH)', 'Periyodik muayene takibi, meslek hastalığı ve kaza kayıtları, eğitimler, mevzuat', '#D6334C',
        '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>'],
    'dsp' => ['Diğer Sağlık Personeli (DSP)', 'Sağlık gözetimi ve muayene takibi, ilk yardım, kaza kayıtları, eğitimler ve mevzuat', '#B5467B',
        '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M3.2 12H9l1.5-3 2 6 1.5-3h6.8"/>'],
    'ogrenci' => ['Öğrenci / Uzman Adayı', 'İSG sınav hazırlık, deneme sınavları, sınıf grubu, eğitimler, mevzuat ve yapay zekâ asistanı', '#6C5CE7',
        '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'],
];
$ILLER = ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın',
    'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce',
    'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
    'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa',
    'Siirt', 'Sinop', 'Şırnak', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'];
$HEDEFLER = ['C Sınıfı İş Sağlığı ve Güvenliği Uzmanlığı', 'B Sınıfı İş Sağlığı ve Güvenliği Uzmanlığı', 'A Sınıfı İş Sağlığı ve Güvenliği Uzmanlığı',
    'İşyeri Hekimliği', 'Diğer Sağlık Personeli (DSP)'];
$MESLEKLER = ['Hemşire', 'Sağlık memuru', 'Acil tıp teknisyeni', 'Çevre sağlığı teknisyeni', 'Diğer'];
$DENEYIM = ['0–1 yıl', '1–3 yıl', '3–5 yıl', '5–10 yıl', '10 yıldan fazla'];

$error = '';
$info = '';
$sel = in_array($_POST['rol'] ?? '', array_keys($ROLES), true) ? $_POST['rol'] : (in_array($_GET['rol'] ?? '', array_keys($ROLES), true) ? $_GET['rol'] : '');

if (in_array($mode, ['giris', 'kodla'], true) && $_SERVER['REQUEST_METHOD'] === 'GET' && current_user()) {
    go(safe_next());
}
// Zaten giriş yapmış biri sınıf davet bağlantısını açtıysa doğrudan Sınıfım sayfasında katılsın
if ($mode === 'kayit' && !$firstRun && $_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['sinif']) && current_user()) {
    go('/app/sinifim/?kod=' . rawurlencode(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $_GET['sinif']) ?? '')));
}
if ($mode === 'dogrula' && isset($_GET['durum'])) {
    $error = otp_error((string) $_GET['durum']);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals(csrf_token(), (string) ($_POST['_t'] ?? ''))) {
        $error = 'Form süresi doldu, lütfen tekrar deneyin.';
    } elseif ($mode === 'giris') {
        if (login_blocked()) {
            $error = 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.';
        } else {
            $u = user_by_login(post('kullanici'));
            if ($u && password_verify((string) ($_POST['sifre'] ?? ''), $u['sifre_hash'])) {
                if (password_needs_rehash($u['sifre_hash'], PASSWORD_DEFAULT)) {
                    $u['sifre_hash'] = password_hash((string) $_POST['sifre'], PASSWORD_DEFAULT);
                    db()->prepare('UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?')->execute([$u['sifre_hash'], $u['id']]);
                }
                if ((int) $u['aktif'] !== 1) {
                    $error = 'Bu hesap kapatılmış. OSGB yetkilinizle görüşün.';
                } elseif ((int) $u['dogrulandi'] !== 1) {
                    // Kayıt olup e-postasını doğrulamamış: yeni kod gönder
                    login_ok();
                    $r = otp_send($u, 'kayit');
                    pending_set((int) $u['id'], 'kayit', safe_next());
                    go('/giris.php?dogrula=1' . ($r === 'ok' || $r === 'bekle' ? '' : '&durum=' . $r));
                } else {
                    login_and_go($u, safe_next());
                }
            } else {
                login_failed();
                $error = 'E-posta / kullanıcı adı veya şifre hatalı.';
            }
        }
    } elseif ($mode === 'kodla' || $mode === 'unuttum') {
        $eposta = strtolower(post('eposta'));
        $u = filter_var($eposta, FILTER_VALIDATE_EMAIL) ? user_by_login($eposta) : null;
        if (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
            $error = 'Geçerli bir e-posta adresi yazın.';
        } elseif (!$u) {
            $error = 'Bu e-posta ile kayıtlı bir hesap bulunamadı.';
        } elseif ((int) $u['aktif'] !== 1) {
            $error = 'Bu hesap kapatılmış. OSGB yetkilinizle görüşün.';
        } else {
            $amac = $mode === 'unuttum' ? 'sifre' : ((int) $u['dogrulandi'] === 1 ? 'giris' : 'kayit');
            $r = otp_send($u, $amac);
            if ($r === 'ok' || $r === 'bekle') {
                pending_set((int) $u['id'], $amac, safe_next());
                go('/giris.php?dogrula=1' . ($r === 'bekle' ? '&durum=bekle' : ''));
            }
            $error = otp_error($r);
        }
    } elseif ($mode === 'dogrula') {
        $u = $pending['user'];
        $amac = $pending['amac'];
        if (($_POST['islem'] ?? '') === 'yeniden') {
            $r = otp_send($u, $amac);
            $error = otp_error($r);
            if ($r === 'ok') {
                $info = 'Yeni kod gönderildi. Gelen kutunuzu (ve istenmeyen klasörünü) kontrol edin.';
            }
        } elseif (login_blocked()) {
            $error = 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.';
        } else {
            $pass = (string) ($_POST['sifre'] ?? '');
            if ($amac === 'sifre' && strlen_u($pass) < 8) {
                $error = 'Yeni şifre en az 8 karakter olmalı.';
            } elseif ($amac === 'sifre' && $pass !== (string) ($_POST['sifre2'] ?? '')) {
                $error = 'Şifreler aynı değil.';
            } else {
                $r = otp_check((int) $u['id'], $amac, post('kod'));
                if ($r === 'ok') {
                    // Kodu girebilen kişi e-postanın sahibidir → hesap doğrulanır
                    if ($amac === 'sifre') {
                        $u['sifre_hash'] = password_hash($pass, PASSWORD_DEFAULT);
                        db()->prepare('UPDATE kullanicilar SET sifre_hash = ?, dogrulandi = 1 WHERE id = ?')->execute([$u['sifre_hash'], (int) $u['id']]);
                    } else {
                        db()->prepare('UPDATE kullanicilar SET dogrulandi = 1 WHERE id = ?')->execute([(int) $u['id']]);
                    }
                    $next = $amac === 'kayit' && $u['son_giris'] === null ? '/app/?hosgeldin=1' : (preg_match('#^/app#', $pending['next']) ? $pending['next'] : '/app/');
                    login_and_go($u, $next);
                }
                if ($r === 'hatali') {
                    login_failed();
                }
                $error = [
                    'hatali' => 'Kod hatalı. E-postadaki 6 haneli kodu kontrol edin.',
                    'suresi' => 'Kodun süresi doldu. "Kodu tekrar gönder" ile yeni kod isteyin.',
                    'deneme' => 'Bu kod için deneme hakkınız bitti. Yeni kod isteyin.',
                    'yok' => 'Geçerli bir kod yok. "Kodu tekrar gönder" ile yeni kod isteyin.',
                ][$r] ?? 'Kod doğrulanamadı.';
            }
        }
    } elseif ($mode === 'sifirla') {
        $pass = (string) ($_POST['sifre'] ?? '');
        if (strlen_u($pass) < 8) {
            $error = 'Şifre en az 8 karakter olmalı.';
        } elseif ($pass !== (string) ($_POST['sifre2'] ?? '')) {
            $error = 'Şifreler aynı değil.';
        } else {
            $first = (int) db()->query('SELECT id FROM kullanicilar ORDER BY id LIMIT 1')->fetchColumn();
            db()->prepare('UPDATE kullanicilar SET sifre_hash = ?, aktif = 1, dogrulandi = 1 WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $first]);
            @unlink((string) reset_file());
            login_and_go(user_by_id($first), '/app/');
        }
    } else { // kayıt
        $ad = post('ad_soyad');
        $eposta = strtolower(post('eposta'));
        $pass = (string) ($_POST['sifre'] ?? '');
        $tel = normalize_phone(post('telefon'));
        $kurum = post('kurum');
        $il = post('il');
        $sinifKodu = $sel === 'ogrenci' ? strtoupper(preg_replace('/[^A-Za-z0-9]/', '', post('sinif_kodu')) ?? '') : '';
        $sinif = $sinifKodu !== '' ? class_lookup_code($sinifKodu) : null;
        if (register_blocked()) {
            $error = 'Bu bağlantıdan çok fazla hesap açıldı. Bir saat sonra tekrar deneyin.';
        } elseif ($needCode !== '' && !hash_equals($needCode, post('kod'))) {
            login_failed();
            $error = $firstRun ? 'Kurulum kodu hatalı.' : 'Davet kodu hatalı.';
        } elseif ($sel === '') {
            $error = 'Lütfen bir rol seçin.';
        } elseif (strlen_u($ad) < 3 || strpos($ad, ' ') === false) {
            $error = 'Adınızı ve soyadınızı yazın.';
        } elseif (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
            $error = 'Geçerli bir e-posta adresi yazın.';
        } elseif ($tel === null) {
            $error = 'Geçerli bir telefon numarası yazın (ör. 0532 123 45 67).';
        } elseif (!in_array($il, $ILLER, true)) {
            $error = 'Bulunduğunuz ili seçin.';
        } elseif ($sel === 'osgb' && strlen_u($kurum) < 2) {
            $error = 'OSGB / kurum adını yazın.';
        } elseif ($sel === 'uzman' && strlen_u($kurum) < 2) {
            $error = 'Çalıştığınız firmayı / OSGB\'yi yazın.';
        } elseif ($sel === 'uzman' && !in_array(post('uzmanlik_sinifi'), ['A', 'B', 'C'], true)) {
            $error = 'Uzmanlık belgenizin sınıfını seçin.';
        } elseif ($sel === 'dsp' && !in_array(post('meslek'), $MESLEKLER, true)) {
            $error = 'Mesleğinizi seçin.';
        } elseif ($sel === 'ogrenci' && strlen_u($kurum) < 2) {
            $error = 'Eğitim aldığınız eğitim kurumunu yazın.';
        } elseif ($sel === 'ogrenci' && !in_array(post('hedef_sinav'), $HEDEFLER, true)) {
            $error = 'Hazırlandığınız sınavı seçin.';
        } elseif ($sinifKodu !== '' && (!$sinif || !class_row($sinif['sahip'], $sinif['sinif']))) {
            $error = 'Sınıf katılım kodu bulunamadı. Kodu kontrol edin ya da boş bırakın (sonra Sınıfım sayfasından katılabilirsiniz).';
        } elseif (strlen_u($pass) < 8) {
            $error = 'Şifre en az 8 karakter olmalı.';
        } elseif ($pass !== (string) ($_POST['sifre2'] ?? '')) {
            $error = 'Şifreler aynı değil.';
        } elseif (empty($_POST['kvkk'])) {
            $error = 'Devam etmek için kişisel verilerin işlenmesine onay verin.';
        } elseif (email_taken($eposta)) {
            $error = 'Bu e-posta ile zaten bir hesap var. Giriş yapın; e-postanızı doğrulamadıysanız giriş sırasında yeni kod gönderilir.';
        } else {
            $alan = [
                'osgb' => ['yetki_belge_no', 'vergi_no', 'adres'],
                'uzman' => ['uzmanlik_sinifi', 'belge_no', 'deneyim'],
                'hekim' => ['belge_no', 'uzmanlik_alani'],
                'dsp' => ['meslek', 'belge_no'],
                'ogrenci' => ['hedef_sinav', 'bolum'],
            ][$sel];
            $raw = ['ad_soyad' => $ad, 'telefon' => $tel, 'kurum' => $kurum, 'il' => $il, 'ilce' => post('ilce')];
            foreach ($alan as $k) {
                $raw[$k] = post($k);
            }
            $profil = clean_profile($raw);
            $verified = $firstRun || !otp_required() ? 1 : 0;
            db()->prepare('INSERT INTO kullanicilar (kullanici_adi, sifre_hash, olusturma, eposta, ad_soyad, rol, profil, yonetici, aktif, dogrulandi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)')
                ->execute([$eposta, password_hash($pass, PASSWORD_DEFAULT), gmdate('c'), $eposta, cut($ad, 80), $sel, json_encode($profil, ISGORA_JSON), $firstRun ? 1 : 0, $verified]);
            $uid = (int) db()->lastInsertId();
            umeta_set($uid, 'kvkk_onay', gmdate('c'));
            if ($sinif) {
                class_join($uid, $sinif['sahip'], $sinif['sinif']);
            }
            register_mark();
            $u = user_by_id($uid);
            if ($verified) {
                login_and_go($u, '/app/?hosgeldin=1');
            }
            $r = otp_send($u, 'kayit');
            pending_set($uid, 'kayit', '/app/?hosgeldin=1');
            go('/giris.php?dogrula=1' . ($r === 'ok' ? '' : '&durum=' . $r));
        }
    }
}

if (isset($_GET['sifirla']) && $mode !== 'sifirla') {
    $info = 'E-posta ile şifre yenilemek için "Şifremi unuttum" bağlantısını kullanın. E-posta çalışmıyorsa site yöneticisi cPanel Dosya Yöneticisi\'nde data klasörüne "SIFRE-SIFIRLA" adlı boş bir dosya oluşturup bu sayfayı yenileyebilir.';
}
if (isset($_GET['kayit']) && !$registerOpen) {
    $info = 'Yeni kayıtlar şu an kapalı.';
}

$titles = [
    'giris' => 'Giriş yap',
    'kodla' => 'E-posta koduyla giriş',
    'unuttum' => 'Şifremi unuttum',
    'kayit' => $firstRun ? 'İlk kurulum · hesap oluştur' : 'Hesap oluştur',
    'sifirla' => 'Yeni şifre belirle',
    'dogrula' => ($pending['amac'] ?? '') === 'sifre' ? 'Şifrenizi yenileyin' : (($pending['amac'] ?? '') === 'giris' ? 'Giriş kodunu girin' : 'E-postanızı doğrulayın'),
];
$title = $titles[$mode];
$token = csrf_token();
$v = function (string $k) {
    return h($_POST[$k] ?? '');
};
$opt = function (array $list, string $cur) {
    $o = '';
    foreach ($list as $x) {
        $o .= '<option' . ($cur === $x ? ' selected' : '') . '>' . h($x) . '</option>';
    }
    return $o;
};
$wait = $mode === 'dogrula' ? otp_wait((int) $pending['user']['id'], $pending['amac']) : 0;
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
  .card.wide{max-width:820px}
  .logo{display:block;height:44px;margin:0 auto 6px}
  .tag{text-align:center;color:#6E7C8C;font-size:12.5px;margin-bottom:20px}
  h1{font-size:22px;margin:0 0 4px;color:#1E3145;font-weight:800}
  p.sub{margin:0 0 16px;color:#6E7C8C;font-size:13.5px;line-height:1.5}
  label.f{display:block;font-size:12.5px;font-weight:700;color:#1E3145;margin:14px 0 6px}
  label.f i{font-style:normal;color:#D6334C;margin-left:2px}
  label.f small{font-weight:600;color:#8A97A6;margin-left:6px}
  input,select{width:100%;border:1px solid #E6EBF0;border-radius:16px;padding:12px 14px;font-size:15px;color:#1E3145;outline:none;background:#fff;font-family:inherit}
  input:focus,select:focus{border-color:#107398;box-shadow:0 0 0 4px rgba(16,115,152,.1)}
  input.code{font:800 28px/1 Menlo,Consolas,monospace;letter-spacing:12px;text-align:center;padding:16px 10px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 12px}
  @media (max-width:640px){.grid2,.grid3{grid-template-columns:1fr}.card{padding:22px}}
  button.go{width:100%;margin-top:22px;border:0;border-radius:16px;padding:14px;font-size:15px;font-weight:800;color:#fff;cursor:pointer;
    background:linear-gradient(135deg,#5CBD7D 0%,#107398 100%);box-shadow:0 10px 24px -6px rgba(16,115,152,.45);font-family:inherit}
  button.link{border:0;background:none;color:#107398;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;padding:0}
  button.link:disabled{color:#8A97A6;cursor:default}
  .err{background:#FDE7EB;color:#D6334C;border-radius:14px;padding:11px 14px;font-size:13.5px;font-weight:700;margin-bottom:8px;line-height:1.45}
  .info{background:#E4F1F8;color:#107398;border-radius:14px;padding:11px 14px;font-size:13px;font-weight:600;margin-bottom:8px;line-height:1.5}
  .foot{margin-top:18px;text-align:center;font-size:13px;color:#6E7C8C;line-height:1.9}
  .foot a{color:#107398;font-weight:800;text-decoration:none}
  .step{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1E3145;margin:22px 0 4px;display:flex;align-items:center;gap:8px}
  .step:before{content:"";width:16px;height:3px;border-radius:9px;background:linear-gradient(135deg,#5CBD7D,#107398)}
  .roles{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:10px}
  .role{position:relative;display:flex;gap:12px;align-items:flex-start;border:2px solid #E6EBF0;border-radius:20px;padding:14px 34px 14px 14px;cursor:pointer;transition:.15s;background:#fff}
  .role:hover{border-color:#B9D9E7}
  .role input{position:absolute;opacity:0;pointer-events:none}
  .role .ic{flex:none;width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff}
  .role .ic svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .role b{display:block;color:#1E3145;font-size:14.5px;line-height:1.3}
  .role span.d{display:block;color:#6E7C8C;font-size:12.5px;line-height:1.45;margin-top:3px}
  .role.on{border-color:#107398;background:#F2F8FB;box-shadow:0 8px 20px -10px rgba(16,115,152,.5)}
  .role .chk{position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:99px;border:2px solid #E6EBF0;background:#fff}
  .role.on .chk{border-color:#107398;background:#107398;box-shadow:inset 0 0 0 3px #fff}
  .only{display:none}
  form[data-rol="osgb"] .r-osgb, form[data-rol="uzman"] .r-uzman, form[data-rol="hekim"] .r-hekim, form[data-rol="dsp"] .r-dsp, form[data-rol="ogrenci"] .r-ogrenci{display:block}
  form:not([data-rol]) .details, form[data-rol=""] .details{display:none}
  .js-off .only{display:block} .js-off .details{display:block !important}
  .hint{font-size:12px;color:#6E7C8C;margin-top:6px;line-height:1.5}
  .check{display:flex;gap:10px;align-items:flex-start;margin-top:16px;font-size:13px;line-height:1.5;color:#2A3A4C;cursor:pointer}
  .check input{width:18px;height:18px;flex:none;margin:2px 0 0;accent-color:#107398}
  .otp-note{display:flex;gap:10px;align-items:center;background:#F2F8FB;border:1px dashed #B9D9E7;border-radius:16px;padding:12px 14px;margin-top:16px;font-size:12.5px;color:#1E3145;line-height:1.5}
  .otp-note svg{flex:none}
  .otp-note b{color:#107398}
  .resend{margin-top:14px;text-align:center;font-size:13px;color:#6E7C8C}
</style>
</head>
<body>
<?php if ($mode === 'kayit'): ?>
  <form class="card wide js-off" method="post" id="f" data-rol="<?= h($sel) ?>" autocomplete="on">
    <img class="logo" src="/logo-horizontal.png" alt="İsgora">
    <div class="tag">İş Sağlığı ve Güvenliği App</div>
    <h1><?= h($title) ?></h1>
    <p class="sub"><?= $firstRun ? 'Bu sunucudaki ilk hesap yönetici olur. Rolünüzü seçin; menüler ve ana sayfa buna göre hazırlanır.' : 'Rolünüzü seçin; menüler, ana sayfa ve asistan buna göre hazırlanır.' ?></p>
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
      <div class="step">2 · Kişisel bilgiler</div>
      <div class="grid2">
        <div><label class="f" for="ad_soyad">Ad soyad<i>*</i></label><input id="ad_soyad" name="ad_soyad" required autocomplete="name" value="<?= $v('ad_soyad') ?>"></div>
        <div><label class="f" for="eposta">E-posta<i>*</i></label><input id="eposta" name="eposta" type="email" required autocomplete="email" value="<?= $v('eposta') ?>"></div>
      </div>
      <div class="grid3">
        <div><label class="f" for="telefon">Cep telefonu<i>*</i></label><input id="telefon" name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="0532 123 45 67" value="<?= $v('telefon') ?>"></div>
        <div><label class="f" for="il">İl<i>*</i></label>
          <select id="il" name="il" required><option value="">Seçin</option><?= $opt($ILLER, (string) ($_POST['il'] ?? '')) ?></select></div>
        <div><label class="f" for="ilce">İlçe<small>isteğe bağlı</small></label><input id="ilce" name="ilce" autocomplete="address-level2" value="<?= $v('ilce') ?>"></div>
      </div>

      <div class="step">3 · Mesleki bilgiler</div>

      <div class="only r-osgb">
        <div class="grid2">
          <div><label class="f" for="kurum_o">OSGB / kurum adı<i>*</i></label><input id="kurum_o" name="kurum" data-k required value="<?= $sel === 'osgb' ? $v('kurum') : '' ?>" placeholder="Örn. Demirel OSGB Ltd. Şti."></div>
          <div><label class="f" for="yetki">OSGB yetki belgesi no<small>isteğe bağlı</small></label><input id="yetki" name="yetki_belge_no" data-k value="<?= $v('yetki_belge_no') ?>"></div>
        </div>
        <div class="grid2">
          <div><label class="f" for="vergi">Vergi no<small>isteğe bağlı</small></label><input id="vergi" name="vergi_no" data-k inputmode="numeric" maxlength="11" value="<?= $v('vergi_no') ?>"></div>
          <div><label class="f" for="adres">Adres<small>isteğe bağlı</small></label><input id="adres" name="adres" data-k autocomplete="street-address" value="<?= $v('adres') ?>"></div>
        </div>
        <div class="hint">Kurum adınız raporlarda ve risk analizi çıktılarında görünür. Kayıttan sonra İGU, işyeri hekimi ve DSP çalışanlarınıza Müşteri Takip &gt; Çalışanlar bölümünden hesap açabilirsiniz.</div>
      </div>

      <div class="only r-uzman">
        <div class="grid2">
          <div><label class="f" for="kurum_u">Çalıştığınız firma / OSGB<i>*</i></label><input id="kurum_u" name="kurum" data-k required value="<?= $sel === 'uzman' ? $v('kurum') : '' ?>" placeholder="Örn. Demirel OSGB"></div>
          <div><label class="f" for="sinif">Uzmanlık belgesi sınıfı<i>*</i></label>
            <select id="sinif" name="uzmanlik_sinifi" data-k required>
              <option value="">Seçin</option>
              <?php foreach (['A', 'B', 'C'] as $c): ?><option value="<?= $c ?>"<?= ($_POST['uzmanlik_sinifi'] ?? '') === $c ? ' selected' : '' ?>><?= $c ?> sınıfı</option><?php endforeach; ?>
            </select></div>
        </div>
        <div class="grid2">
          <div><label class="f" for="belge_u">Belge (sertifika) no<small>isteğe bağlı</small></label><input id="belge_u" name="belge_no" data-k value="<?= $sel === 'uzman' ? $v('belge_no') : '' ?>"></div>
          <div><label class="f" for="deneyim">Mesleki deneyim<small>isteğe bağlı</small></label>
            <select id="deneyim" name="deneyim" data-k><option value="">Seçin</option><?= $opt($DENEYIM, (string) ($_POST['deneyim'] ?? '')) ?></select></div>
        </div>
      </div>

      <div class="only r-hekim">
        <div class="grid2">
          <div><label class="f" for="kurum_h">Çalıştığınız kurum / OSGB / hastane<small>isteğe bağlı</small></label><input id="kurum_h" name="kurum" data-k value="<?= $sel === 'hekim' ? $v('kurum') : '' ?>"></div>
          <div><label class="f" for="belge_h">İşyeri hekimliği belge no<small>isteğe bağlı</small></label><input id="belge_h" name="belge_no" data-k value="<?= $sel === 'hekim' ? $v('belge_no') : '' ?>"></div>
        </div>
        <label class="f" for="alan">Uzmanlık alanı<small>isteğe bağlı</small></label><input id="alan" name="uzmanlik_alani" data-k placeholder="Örn. Aile hekimliği, iç hastalıkları" value="<?= $v('uzmanlik_alani') ?>">
        <div class="hint">Ana sayfanızda periyodik muayene takibi ve sağlık gözetimi araçları açılır.</div>
      </div>

      <div class="only r-dsp">
        <div class="grid2">
          <div><label class="f" for="meslek">Mesleğiniz<i>*</i></label>
            <select id="meslek" name="meslek" data-k required><option value="">Seçin</option><?= $opt($MESLEKLER, (string) ($_POST['meslek'] ?? '')) ?></select></div>
          <div><label class="f" for="kurum_d">Çalıştığınız kurum / OSGB<small>isteğe bağlı</small></label><input id="kurum_d" name="kurum" data-k value="<?= $sel === 'dsp' ? $v('kurum') : '' ?>"></div>
        </div>
        <label class="f" for="belge_d">DSP belge no<small>isteğe bağlı</small></label><input id="belge_d" name="belge_no" data-k value="<?= $sel === 'dsp' ? $v('belge_no') : '' ?>">
        <div class="hint">Ana sayfanızda muayene takibi, ilk yardım ve kaza kayıtları açılır.</div>
      </div>

      <div class="only r-ogrenci">
        <div class="grid2">
          <div><label class="f" for="kurum_s">Eğitim aldığınız eğitim kurumu<i>*</i></label><input id="kurum_s" name="kurum" data-k required value="<?= $sel === 'ogrenci' ? $v('kurum') : '' ?>" placeholder="Örn. Demirel OSGB Eğitim Merkezi"></div>
          <div><label class="f" for="hedef">Hazırlandığınız sınav<i>*</i></label>
            <select id="hedef" name="hedef_sinav" data-k required><option value="">Seçin</option><?= $opt($HEDEFLER, (string) ($_POST['hedef_sinav'] ?? '')) ?></select></div>
        </div>
        <div class="grid2">
          <div><label class="f" for="bolum">Okuduğunuz / mezun olduğunuz bölüm<small>isteğe bağlı</small></label><input id="bolum" name="bolum" data-k placeholder="Örn. Makine mühendisliği" value="<?= $v('bolum') ?>"></div>
          <div><label class="f" for="sinif_kodu">Sınıf katılım kodu<small>isteğe bağlı</small></label><input id="sinif_kodu" name="sinif_kodu" data-k maxlength="8" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em" placeholder="K7M2QX" value="<?= h($_POST['sinif_kodu'] ?? ($_GET['sinif'] ?? '')) ?>"></div>
        </div>
        <div class="hint">Eğitim kurumunuz bir katılım kodu verdiyse yazın; kurumun sınıf grubuna katılır ve duyuruları uygulamada görürsünüz. Ana sayfanızda deneme sınavları ve ders ilerlemesi görünür.</div>
      </div>

      <div class="step">4 · Güvenlik</div>
      <div class="grid2">
        <div><label class="f" for="sifre">Şifre (en az 8 karakter)<i>*</i></label><input id="sifre" name="sifre" type="password" required minlength="8" autocomplete="new-password"></div>
        <div><label class="f" for="sifre2">Şifre (tekrar)<i>*</i></label><input id="sifre2" name="sifre2" type="password" required minlength="8" autocomplete="new-password"></div>
      </div>
      <?php if ($needCode !== ''): ?>
        <label class="f" for="kod"><?= $firstRun ? 'Kurulum kodu' : 'Davet kodu' ?><i>*</i></label>
        <input id="kod" name="kod" required autocomplete="off">
      <?php endif; ?>
      <label class="check"><input type="checkbox" name="kvkk" value="1" required<?= !empty($_POST['kvkk']) ? ' checked' : '' ?>>
        <span>Kişisel verilerimin (ad, iletişim ve mesleki bilgiler) İsgora hizmetinin sunulması amacıyla işlenmesini ve saklanmasını kabul ediyorum.</span></label>
      <?php if (!$firstRun && otp_required()): ?>
        <div class="otp-note"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#107398" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
          <span>Hesabınızı oluşturduktan sonra e-postanıza <b>6 haneli doğrulama kodu</b> gönderilir.</span></div>
      <?php endif; ?>
      <button class="go" type="submit">Hesabı oluştur</button>
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
        // Yalnızca seçili role ait alanlar gönderilsin / doğrulansın
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
      var s1 = document.getElementById('sifre'), s2 = document.getElementById('sifre2');
      function same() { s2.setCustomValidity(s2.value && s2.value !== s1.value ? 'Şifreler aynı değil.' : ''); }
      s1.addEventListener('input', same);
      s2.addEventListener('input', same);
      sync();
    })();
  </script>
<?php elseif ($mode === 'dogrula'): ?>
  <form class="card" method="post" autocomplete="off" id="f">
    <img class="logo" src="/logo-horizontal.png" alt="İsgora">
    <div class="tag">İş Sağlığı ve Güvenliği App</div>
    <h1><?= h($title) ?></h1>
    <p class="sub"><b><?= h(mask_email((string) $pending['user']['eposta'])) ?></b> adresine 6 haneli bir kod gönderdik. Kod 10 dakika geçerlidir; gelmediyse istenmeyen (spam) klasörüne bakın.</p>
    <?php if ($error): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
    <?php if ($info): ?><div class="info"><?= h($info) ?></div><?php endif; ?>
    <input type="hidden" name="_t" value="<?= h($token) ?>">
    <label class="f" for="kod">Doğrulama kodu</label>
    <input id="kod" name="kod" class="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7" required autofocus placeholder="••••••">
    <?php if ($pending['amac'] === 'sifre'): ?>
      <label class="f" for="sifre">Yeni şifre (en az 8 karakter)</label>
      <input id="sifre" name="sifre" type="password" required minlength="8" autocomplete="new-password">
      <label class="f" for="sifre2">Yeni şifre (tekrar)</label>
      <input id="sifre2" name="sifre2" type="password" required minlength="8" autocomplete="new-password">
    <?php endif; ?>
    <button class="go" type="submit"><?= $pending['amac'] === 'sifre' ? 'Şifreyi yenile ve giriş yap' : ($pending['amac'] === 'giris' ? 'Giriş yap' : 'Doğrula ve başla') ?></button>
    <div class="resend">Kod gelmedi mi?
      <button class="link" type="submit" name="islem" value="yeniden" formnovalidate id="yeniden"<?= $wait > 0 ? ' disabled' : '' ?>>Kodu tekrar gönder<?= $wait > 0 ? ' (' . $wait . ' sn)' : '' ?></button></div>
    <div class="foot"><a href="/giris.php?cikis=1" style="font-weight:600">Vazgeç</a></div>
  </form>
  <script>
    (function () {
      var b = document.getElementById('yeniden'), left = <?= (int) $wait ?>;
      if (left > 0) {
        var t = setInterval(function () {
          left--;
          b.textContent = left > 0 ? 'Kodu tekrar gönder (' + left + ' sn)' : 'Kodu tekrar gönder';
          if (left <= 0) { b.disabled = false; clearInterval(t); }
        }, 1000);
      }
      var k = document.getElementById('kod'), f = document.getElementById('f');
      k.addEventListener('input', function () {
        k.value = k.value.replace(/\D/g, '').slice(0, 6);
        // Şifre yenilemede yeni şifre alanları da doldurulmalı; diğerlerinde 6 hane girilince gönder
        if (k.value.length === 6 && !document.getElementById('sifre') && f.requestSubmit) f.requestSubmit();
      });
    })();
  </script>
<?php else: ?>
  <form class="card" method="post" autocomplete="on">
    <img class="logo" src="/logo-horizontal.png" alt="İsgora">
    <div class="tag">İş Sağlığı ve Güvenliği App</div>
    <h1><?= h($title) ?></h1>
    <p class="sub"><?php
      if ($mode === 'sifirla') {
          echo 'Yönetici hesabı için yeni bir şifre belirleyin.';
      } elseif ($mode === 'kodla') {
          echo 'E-posta adresinizi yazın; şifre yerine 6 haneli bir giriş kodu gönderelim.';
      } elseif ($mode === 'unuttum') {
          echo 'Hesabınızın e-posta adresini yazın; şifre yenileme kodu gönderelim.';
      } else {
          echo 'OSGB\'ler, iş sağlığı ve güvenliği uzmanları, işyeri hekimleri, DSP\'ler ve öğrenciler için İSG uygulaması.';
      }
    ?></p>
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
        <a href="/giris.php?kodla=1">E-postaya gelen kodla giriş yap</a><br>
        <?php if ($registerOpen): ?>Hesabınız yok mu? <a href="/giris.php?kayit=1">Kayıt olun</a><br><?php endif; ?>
        <a href="/giris.php?unuttum=1" style="font-weight:600">Şifremi unuttum</a> · <a href="/" style="font-weight:600">Tanıtım sayfası</a>
      </div>
    <?php elseif ($mode === 'kodla' || $mode === 'unuttum'): ?>
      <label class="f" for="eposta">E-posta</label>
      <input id="eposta" name="eposta" type="email" required autocomplete="email" value="<?= $v('eposta') ?>" autofocus>
      <button class="go" type="submit"><?= $mode === 'kodla' ? 'Giriş kodu gönder' : 'Yenileme kodu gönder' ?></button>
      <div class="foot"><a href="/giris.php">Şifreyle giriş yap</a></div>
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
