<?php
/**
 * İsgora API — tek giriş noktası.
 *   GET  ?r=data            tüm kayıtlar (giriş gerekli)
 *   POST ?r=data            değişen koleksiyonları kaydet {baseRev, changes}
 *   GET|POST|DELETE ?r=bank içe aktarılan soru bankası
 *   GET  ?r=ai-status       yapay zekâ erişimi (kendi anahtarı / ücretsiz deneme hakkı)
 *   POST|DELETE ?r=ai-key   kullanıcının API anahtarını kaydet / sil
 *   GET|POST|DELETE ?r=ai-ortak-key  ücretsiz sorguların kullandığı ortak anahtar (yönetici)
 *   POST ?r=profile         rol ve profil bilgilerini güncelle
 *   GET|POST|DELETE ?r=ekip, POST ?r=ekip-guncelle   OSGB çalışan hesapları (İGU / İH / DSP)
 *   GET  ?r=atamalarim      çalışanın OSGB'de kendisine atanmış firmaları
 *   GET|POST ?r=sinif-kod, GET|DELETE ?r=sinif-ogrenciler   sınıf katılım kodu ve katılan öğrenciler (sınıf sahibi)
 *   POST ?r=sinif-katil, GET ?r=siniflarim, POST ?r=sinif-ayril   öğrencinin sınıfları
 *   POST /api/anthropic/v1/messages  (.htaccess ile ?r=anthropic) Claude vekili
 *   GET  ?r=ping            arka uç var mı (giriş gerekmez)
 */

define('ISGORA', 1);
require __DIR__ . '/_lib.php';

$route = (string) ($_GET['r'] ?? '');
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

try {
    switch ($route) {
        case 'ping':
            json_out(['ok' => true, 'kurulum' => user_count() === 0]);
            break;

        case 'me':
            $u = require_user();
            json_out(['user' => $u['kullanici_adi'], 'ad' => $u['ad_soyad'], 'rol' => user_role($u), 'profil' => user_profile($u)]);
            break;

        case 'profile':
            $u = require_user();
            require_app_header();
            if ($method !== 'POST') {
                fail_json(405, 'Desteklenmeyen yöntem.');
            }
            $in = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($in)) {
                fail_json(400, 'Geçersiz veri.');
            }
            $rol = isset($in['rol']) ? (string) $in['rol'] : user_role($u);
            if (!in_array($rol, ISGORA_ROLES, true)) {
                fail_json(400, 'Geçersiz rol.');
            }
            // OSGB'nin açtığı çalışan hesabında görev (rol) OSGB tarafından belirlenir
            if (!empty($u['osgb_id']) && $rol !== user_role($u)) {
                fail_json(403, 'Rolünüz bağlı olduğunuz OSGB tarafından belirlenir.');
            }
            $profil = array_merge(user_profile($u), clean_profile(is_array($in['profil'] ?? null) ? $in['profil'] : []));
            unset($profil['sinav_tarihi']);
            $ad = trim((string) ($profil['ad_soyad'] ?? $u['ad_soyad'] ?? ''));
            db()->prepare('UPDATE kullanicilar SET rol = ?, profil = ?, ad_soyad = ? WHERE id = ?')
                ->execute([$rol, json_encode($profil, ISGORA_JSON), $ad, (int) $u['id']]);
            json_out(['ok' => true, 'rol' => $rol, 'profil' => $profil]);
            break;

        case 'data':
            $u = require_user();
            if ($method === 'GET') {
                load_state($u);
            } elseif ($method === 'POST') {
                require_app_header();
                save_changes((int) $u['id']);
            }
            fail_json(405, 'Desteklenmeyen yöntem.');
            break;

        case 'bank':
            $uid = (int) require_user()['id'];
            if ($method === 'GET') {
                $raw = umeta_get($uid, 'soru_bankasi');
                json_out($raw === null ? 'null' : $raw);
            }
            require_app_header();
            if ($method === 'POST') {
                $raw = file_get_contents('php://input');
                if (json_decode((string) $raw) === null) {
                    fail_json(400, 'Geçersiz soru bankası.');
                }
                umeta_set($uid, 'soru_bankasi', $raw);
                json_out(['ok' => true]);
            }
            if ($method === 'DELETE') {
                umeta_set($uid, 'soru_bankasi', null);
                json_out(['ok' => true]);
            }
            fail_json(405, 'Desteklenmeyen yöntem.');
            break;

        case 'ai-status':
            $a = ai_access(require_user());
            json_out([
                'serverKey' => $a['key'] !== '',
                'accessCodeRequired' => false,
                'backend' => 'php',
                'ownKey' => $a['own'],
                'sharedKey' => $a['shared'],
                'free' => ['limit' => $a['limit'], 'used' => min($a['used'], $a['limit']), 'left' => $a['left'], 'unlimited' => $a['unlimited'] || $a['own']],
            ]);
            break;

        case 'ai-ortak-key':
            $u = require_user();
            if ((int) $u['yonetici'] !== 1) {
                fail_json(403, 'Bu ayarı yalnızca yönetici değiştirebilir.');
            }
            if ($method === 'GET') {
                $db = trim((string) meta_get('ortak_ai_anahtari', ''));
                json_out(['set' => shared_ai_key() !== '', 'fromConfig' => $db === '' && shared_ai_key() !== '', 'limit' => ai_free_limit()]);
            }
            require_app_header();
            if ($method === 'DELETE') {
                meta_set('ortak_ai_anahtari', null);
                json_out(['ok' => true]);
            }
            if ($method === 'POST') {
                $in = json_decode((string) file_get_contents('php://input'), true);
                $key = trim((string) ($in['key'] ?? ''));
                if (!preg_match('/^sk-ant-[A-Za-z0-9_\-]{20,}$/', $key)) {
                    fail_json(400, 'Anahtar "sk-ant-" ile başlamalı.');
                }
                meta_set('ortak_ai_anahtari', $key);
                json_out(['ok' => true]);
            }
            fail_json(405, 'Desteklenmeyen yöntem.');
            break;

        case 'ai-key':
            $uid = (int) require_user()['id'];
            require_app_header();
            if ($method === 'DELETE') {
                umeta_set($uid, 'anthropic_api_key', null);
                json_out(['ok' => true]);
            }
            if ($method === 'POST') {
                $in = json_decode((string) file_get_contents('php://input'), true);
                $key = trim((string) ($in['key'] ?? ''));
                if (!preg_match('/^sk-ant-[A-Za-z0-9_\-]{20,}$/', $key)) {
                    fail_json(400, 'Anahtar "sk-ant-" ile başlamalı.');
                }
                umeta_set($uid, 'anthropic_api_key', $key);
                json_out(['ok' => true]);
            }
            fail_json(405, 'Desteklenmeyen yöntem.');
            break;

        case 'anthropic':
            proxy_anthropic();
            break;

        // ------------------------------------------------ OSGB çalışan hesapları
        case 'ekip':
            $u = require_osgb();
            $oid = (int) $u['id'];
            if ($method === 'GET') {
                $st = db()->prepare('SELECT ' . ISGORA_USER_COLS . ', olusturma FROM kullanicilar WHERE osgb_id = ? ORDER BY ad_soyad COLLATE NOCASE');
                $st->execute([$oid]);
                json_out(['ekip' => array_map('staff_out', $st->fetchAll())]);
            }
            require_app_header();
            if ($method === 'POST') {
                $in = read_json();
                $c = staff_fields($in, true);
                $cnt = db()->prepare('SELECT COUNT(*) FROM kullanicilar WHERE osgb_id = ?');
                $cnt->execute([$oid]);
                if ((int) $cnt->fetchColumn() >= 300) {
                    fail_json(400, 'Çalışan hesabı sınırına ulaşıldı (300).');
                }
                if (email_taken($c['eposta'])) {
                    fail_json(400, 'Bu e-posta ile zaten bir hesap var.');
                }
                $op = user_profile($u);
                $profil = clean_profile($c['profil'] + ['kurum' => user_org_name($u), 'il' => (string) ($op['il'] ?? '')]);
                db()->prepare('INSERT INTO kullanicilar (kullanici_adi, sifre_hash, olusturma, eposta, ad_soyad, rol, profil, yonetici, osgb_id, aktif, dogrulandi) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 1, 1)')
                    ->execute([$c['eposta'], password_hash($c['sifre'], PASSWORD_DEFAULT), gmdate('c'), $c['eposta'], $c['ad_soyad'], $c['rol'], json_encode($profil, ISGORA_JSON), $oid]);
                $nid = (int) db()->lastInsertId();
                staff_welcome_mail($c, user_org_name($u));
                json_out(['ok' => true, 'calisan' => staff_out(staff_row($nid))]);
            }
            if ($method === 'DELETE') {
                $t = staff_owned($oid, (int) ($_GET['id'] ?? 0));
                delete_user_everything((int) $t['id']);
                json_out(['ok' => true]);
            }
            fail_json(405, 'Desteklenmeyen yöntem.');
            break;

        case 'ekip-guncelle':
            $u = require_osgb();
            require_app_header();
            if ($method !== 'POST') {
                fail_json(405, 'Desteklenmeyen yöntem.');
            }
            $in = read_json();
            $t = staff_owned((int) $u['id'], (int) ($in['id'] ?? 0));
            $c = staff_fields($in + ['ad_soyad' => $t['ad_soyad'], 'eposta' => $t['eposta'], 'rol' => $t['rol']], false);
            if (strcasecmp($c['eposta'], (string) $t['eposta']) !== 0 && email_taken($c['eposta'], (int) $t['id'])) {
                fail_json(400, 'Bu e-posta ile zaten bir hesap var.');
            }
            $profil = array_merge(user_profile($t), clean_profile($c['profil']));
            $hash = $c['sifre'] !== '' ? password_hash($c['sifre'], PASSWORD_DEFAULT) : $t['sifre_hash'];
            $aktif = array_key_exists('aktif', $in) ? ($in['aktif'] ? 1 : 0) : (int) $t['aktif'];
            db()->prepare('UPDATE kullanicilar SET kullanici_adi = ?, eposta = ?, ad_soyad = ?, rol = ?, profil = ?, sifre_hash = ?, aktif = ? WHERE id = ?')
                ->execute([$c['eposta'], $c['eposta'], $c['ad_soyad'], $c['rol'], json_encode($profil, ISGORA_JSON), $hash, $aktif, (int) $t['id']]);
            json_out(['ok' => true, 'calisan' => staff_out(staff_row((int) $t['id']))]);
            break;

        case 'atamalarim':
            $u = require_user();
            $oid = (int) ($u['osgb_id'] ?? 0);
            $org = $oid ? user_by_id($oid) : null;
            if (!$org) {
                json_out(['osgb' => null, 'firmalar' => []]);
            }
            $uid = (int) $u['id'];
            $st = db()->prepare('SELECT veri FROM kursiyerler WHERE kullanici_id = ? ORDER BY sira, id');
            $st->execute([$oid]);
            $out = [];
            foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $v) {
                $f = json_decode((string) $v, true);
                if (!is_array($f) || (isset($f['is_active']) && !$f['is_active'])) {
                    continue;
                }
                $gorev = [];
                foreach (['igu' => 'igu_id', 'ih' => 'ih_id', 'dsp' => 'dsp_id'] as $g => $k) {
                    if ((int) ($f[$k] ?? 0) === $uid) {
                        $gorev[] = $g;
                    }
                }
                if (!$gorev) {
                    continue;
                }
                $out[] = [
                    'id' => (int) $f['id'],
                    'ad' => (string) ($f['full_name'] ?? ''),
                    'yetkili' => (string) ($f['yetkili'] ?? ''),
                    'telefon' => (string) ($f['phone'] ?? ''),
                    'eposta' => (string) ($f['email'] ?? ''),
                    'il' => (string) ($f['city'] ?? ''),
                    'adres' => (string) ($f['adres'] ?? ''),
                    'tehlike_sinifi' => (string) ($f['tehlike_sinifi'] ?? ''),
                    'calisan_sayisi' => (int) ($f['calisan_sayisi'] ?? 0),
                    'nace_kodu' => (string) ($f['nace_kodu'] ?? ''),
                    'gorev' => $gorev,
                ];
            }
            json_out(['osgb' => ['id' => $oid, 'ad' => user_org_name($org)], 'firmalar' => $out]);
            break;

        // ------------------------------------------------ sınıf katılımı
        case 'sinif-kod':
            $u = require_user();
            $uid = (int) $u['id'];
            if ($method === 'GET') {
                $sid = (int) ($_GET['sinif'] ?? 0);
                $st = db()->prepare('SELECT kod FROM sinif_kodlari WHERE sahip_id = ? AND sinif_id = ?');
                $st->execute([$uid, $sid]);
                $k = $st->fetchColumn();
                json_out(['kod' => $k === false ? null : (string) $k]);
            }
            require_app_header();
            if ($method !== 'POST') {
                fail_json(405, 'Desteklenmeyen yöntem.');
            }
            $in = read_json();
            $sid = (int) ($in['sinif'] ?? 0);
            if (!class_row($uid, $sid)) {
                fail_json(404, 'Sınıf sunucuda bulunamadı. Yeni oluşturduysanız birkaç saniye sonra tekrar deneyin.');
            }
            $st = db()->prepare('SELECT kod FROM sinif_kodlari WHERE sahip_id = ? AND sinif_id = ?');
            $st->execute([$uid, $sid]);
            $k = $st->fetchColumn();
            if ($k !== false && empty($in['yenile'])) {
                json_out(['kod' => (string) $k]);
            }
            db()->prepare('DELETE FROM sinif_kodlari WHERE sahip_id = ? AND sinif_id = ?')->execute([$uid, $sid]);
            $kod = new_class_code();
            db()->prepare('INSERT INTO sinif_kodlari (kod, sahip_id, sinif_id, olusturma) VALUES (?, ?, ?, ?)')->execute([$kod, $uid, $sid, gmdate('c')]);
            json_out(['kod' => $kod]);
            break;

        case 'sinif-ogrenciler':
            $u = require_user();
            $uid = (int) $u['id'];
            $sid = (int) ($_GET['sinif'] ?? 0);
            if ($method === 'GET') {
                $st = db()->prepare('SELECT k.' . str_replace(', ', ', k.', ISGORA_USER_COLS) . ', m.katilma FROM sinif_uyelik m JOIN kullanicilar k ON k.id = m.kullanici_id WHERE m.sahip_id = ? AND m.sinif_id = ? ORDER BY m.katilma');
                $st->execute([$uid, $sid]);
                $list = [];
                foreach ($st->fetchAll() as $r) {
                    $p = user_profile($r);
                    $list[] = [
                        'id' => (int) $r['id'],
                        'ad_soyad' => (string) $r['ad_soyad'],
                        'eposta' => (string) $r['eposta'],
                        'telefon' => (string) ($p['telefon'] ?? ''),
                        'kurum' => (string) ($p['kurum'] ?? ''),
                        'katilma' => (string) $r['katilma'],
                    ];
                }
                json_out(['ogrenciler' => $list]);
            }
            require_app_header();
            if ($method === 'DELETE') {
                db()->prepare('DELETE FROM sinif_uyelik WHERE sahip_id = ? AND sinif_id = ? AND kullanici_id = ?')->execute([$uid, $sid, (int) ($_GET['kullanici'] ?? 0)]);
                json_out(['ok' => true]);
            }
            fail_json(405, 'Desteklenmeyen yöntem.');
            break;

        case 'sinif-katil':
            $u = require_user();
            require_app_header();
            if ($method !== 'POST') {
                fail_json(405, 'Desteklenmeyen yöntem.');
            }
            if (login_blocked()) {
                fail_json(429, 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.');
            }
            $in = read_json();
            $hit = class_lookup_code((string) ($in['kod'] ?? ''));
            if (!$hit || !class_row($hit['sahip'], $hit['sinif'])) {
                login_failed();
                fail_json(404, 'Bu kodla bir sınıf bulunamadı. Kodu kontrol edin.');
            }
            if ($hit['sahip'] === (int) $u['id']) {
                fail_json(400, 'Bu sınıf zaten sizin; öğrenciler bu kodla katılır.');
            }
            class_join((int) $u['id'], $hit['sahip'], $hit['sinif']);
            $st = db()->prepare('SELECT katilma FROM sinif_uyelik WHERE sahip_id = ? AND sinif_id = ? AND kullanici_id = ?');
            $st->execute([$hit['sahip'], $hit['sinif'], (int) $u['id']]);
            json_out(['ok' => true, 'sinif' => class_item($hit['sahip'], $hit['sinif'], (string) $st->fetchColumn())]);
            break;

        case 'siniflarim':
            $u = require_user();
            $st = db()->prepare('SELECT sahip_id, sinif_id, katilma FROM sinif_uyelik WHERE kullanici_id = ? ORDER BY katilma DESC');
            $st->execute([(int) $u['id']]);
            $list = [];
            foreach ($st->fetchAll() as $m) {
                $item = class_item((int) $m['sahip_id'], (int) $m['sinif_id'], (string) $m['katilma']);
                if ($item) {
                    $list[] = $item;
                } else {
                    // Kurum sınıfı silmiş: üyeliği temizle
                    db()->prepare('DELETE FROM sinif_uyelik WHERE sahip_id = ? AND sinif_id = ?')->execute([(int) $m['sahip_id'], (int) $m['sinif_id']]);
                }
            }
            json_out(['siniflar' => $list]);
            break;

        case 'sinif-ayril':
            $u = require_user();
            require_app_header();
            $in = read_json();
            db()->prepare('DELETE FROM sinif_uyelik WHERE sahip_id = ? AND sinif_id = ? AND kullanici_id = ?')
                ->execute([(int) ($in['sahip_id'] ?? 0), (int) ($in['sinif_id'] ?? 0), (int) $u['id']]);
            json_out(['ok' => true]);
            break;

        default:
            fail_json(404, 'Bulunamadı.', 'not_found');
    }
} catch (Throwable $e) {
    error_log('[isgora] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    fail_json(500, 'Sunucu hatası. Lütfen tekrar deneyin.', 'server_error');
}

// ---------------------------------------------------------------- yardımcılar

function read_json(): array
{
    $in = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($in)) {
        fail_json(400, 'Geçersiz veri.');
    }
    return $in;
}

function require_osgb(): array
{
    $u = require_user();
    if (user_role($u) !== 'osgb' || !empty($u['osgb_id'])) {
        fail_json(403, 'Çalışan hesaplarını yalnızca OSGB hesabı yönetebilir.');
    }
    return $u;
}

/** Hesap bir OSGB çalışanıysa o OSGB: {id, ad} */
function staff_org(array $u): ?array
{
    $oid = (int) ($u['osgb_id'] ?? 0);
    $org = $oid ? user_by_id($oid) : null;
    return $org ? ['id' => $oid, 'ad' => user_org_name($org)] : null;
}

function staff_row(int $id): array
{
    $st = db()->prepare('SELECT ' . ISGORA_USER_COLS . ', olusturma FROM kullanicilar WHERE id = ?');
    $st->execute([$id]);
    return $st->fetch() ?: [];
}

function staff_owned(int $osgbId, int $id): array
{
    $t = staff_row($id);
    if (!$t || (int) $t['osgb_id'] !== $osgbId) {
        fail_json(404, 'Çalışan bulunamadı.');
    }
    return $t;
}

function staff_out(array $r): array
{
    $p = user_profile($r);
    return [
        'id' => (int) $r['id'],
        'ad_soyad' => (string) $r['ad_soyad'],
        'eposta' => (string) $r['eposta'],
        'rol' => user_role($r),
        'telefon' => (string) ($p['telefon'] ?? ''),
        'profil' => (object) $p,
        'aktif' => (int) $r['aktif'] === 1,
        'olusturma' => (string) ($r['olusturma'] ?? ''),
        'son_giris' => $r['son_giris'] ?: null,
    ];
}

/** Çalışan formunu doğrular: {ad_soyad, eposta, sifre, rol, profil} */
function staff_fields(array $in, bool $new): array
{
    $ad = trim((string) ($in['ad_soyad'] ?? ''));
    $eposta = strtolower(trim((string) ($in['eposta'] ?? '')));
    $sifre = (string) ($in['sifre'] ?? '');
    $rol = (string) ($in['rol'] ?? '');
    $tel = trim((string) ($in['telefon'] ?? ''));
    if (strlen_u($ad) < 3) {
        fail_json(400, 'Çalışanın adını ve soyadını yazın.');
    }
    if (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
        fail_json(400, 'Geçerli bir e-posta adresi yazın.');
    }
    if (!in_array($rol, ISGORA_STAFF_ROLES, true)) {
        fail_json(400, 'Görev İGU, işyeri hekimi ya da DSP olmalı.');
    }
    if (($new || $sifre !== '') && strlen_u($sifre) < 8) {
        fail_json(400, 'Şifre en az 8 karakter olmalı.');
    }
    if ($tel !== '' && normalize_phone($tel) === null) {
        fail_json(400, 'Telefon numarası geçersiz (ör. 0532 123 45 67).');
    }
    $profil = ['ad_soyad' => $ad];
    foreach (['telefon', 'uzmanlik_sinifi', 'belge_no', 'meslek'] as $k) {
        if (array_key_exists($k, $in)) {
            $profil[$k] = (string) $in[$k];
        }
    }
    return ['ad_soyad' => cut($ad, 80), 'eposta' => $eposta, 'sifre' => $sifre, 'rol' => $rol, 'profil' => $profil];
}

/** Hesabı açılan çalışana bilgilendirme e-postası (şifre gönderilmez) */
function staff_welcome_mail(array $c, string $org): void
{
    if (!mail_rate_ok($c['eposta'])) {
        return;
    }
    $roles = ['uzman' => 'İş Sağlığı ve Güvenliği Uzmanı', 'hekim' => 'İşyeri Hekimi', 'dsp' => 'Diğer Sağlık Personeli'];
    $intro = "Merhaba {$c['ad_soyad']},\n$org sizin için İsgora'da bir hesap açtı (görev: " . ($roles[$c['rol']] ?? '') . ").\n\n"
        . 'Giriş adresi: ' . site_url('/giris.php') . "\nE-posta: {$c['eposta']}\n\nŞifrenizi OSGB yetkilinizden alın; ilk girişten sonra Ayarlar'dan değiştirebilirsiniz.";
    if (send_mail($c['eposta'], "İsgora hesabınız açıldı · $org", $intro, mail_html('İsgora hesabınız açıldı', $intro))) {
        mail_mark($c['eposta']);
    }
}

// ---------------------------------------------------------------- veri

/** Tüm koleksiyonları, kayıtların istemciden geldiği hâliyle (ham JSON) birleştirip döndürür. */
function load_state(array $u): void
{
    $db = db();
    $uid = (int) $u['id'];
    $rev = umeta_get($uid, 'rev');
    $parts = [];
    foreach (ISGORA_COLLECTIONS as $key => $table) {
        $st = $db->prepare("SELECT veri FROM $table WHERE kullanici_id = ? ORDER BY sira, id");
        $st->execute([$uid]);
        $rows = $st->fetchAll(PDO::FETCH_COLUMN);
        $parts[] = json_encode($key) . ':[' . implode(',', $rows) . ']';
    }
    $parts[] = '"seq":' . (int) umeta_get($uid, 'seq', '0');
    $settings = umeta_get($uid, 'settings');
    if ($settings !== null) {
        $parts[] = '"settings":' . $settings;
    }
    $out = '{"rev":' . (int) ($rev ?? 0)
        . ',"empty":' . ($rev === null ? 'true' : 'false')
        . ',"user":' . json_encode($u['kullanici_adi'], ISGORA_JSON)
        . ',"ad":' . json_encode((string) ($u['ad_soyad'] ?? ''), ISGORA_JSON)
        . ',"rol":' . json_encode(user_role($u))
        . ',"profil":' . json_encode((object) user_profile($u), ISGORA_JSON)
        . ',"eposta":' . json_encode((string) ($u['eposta'] ?? ''), ISGORA_JSON)
        . ',"yonetici":' . ((int) $u['yonetici'] === 1 ? 'true' : 'false')
        . ',"osgb":' . json_encode(staff_org($u), ISGORA_JSON)
        . ',"state":{' . implode(',', $parts) . '}}';
    json_out($out);
}

/**
 * Yalnızca değişen koleksiyonlar gelir; her biri tablo içinde baştan yazılır.
 * baseRev sunucudaki sürümle aynı değilse (başka sekme/cihaz kaydetmiş) 409 döner.
 */
function save_changes(int $uid): void
{
    $in = json_decode((string) file_get_contents('php://input'));
    if (!is_object($in) || !isset($in->changes) || !is_object($in->changes)) {
        fail_json(400, 'Geçersiz veri.');
    }
    $base = isset($in->baseRev) ? (int) $in->baseRev : -1;
    $db = db();
    $db->exec('BEGIN IMMEDIATE');
    try {
        $rev = (int) umeta_get($uid, 'rev', '0');
        if ($base !== $rev) {
            $db->exec('ROLLBACK');
            json_out(['error' => 'conflict', 'rev' => $rev], 409);
        }
        $now = gmdate('c');
        foreach (get_object_vars($in->changes) as $key => $val) {
            if (isset(ISGORA_COLLECTIONS[$key])) {
                if (!is_array($val)) {
                    continue;
                }
                $table = ISGORA_COLLECTIONS[$key];
                $db->prepare("DELETE FROM $table WHERE kullanici_id = ?")->execute([$uid]);
                $st = $db->prepare("INSERT OR REPLACE INTO $table (kullanici_id, id, sira, veri, guncelleme) VALUES (?, ?, ?, ?, ?)");
                foreach ($val as $i => $rec) {
                    if (!is_object($rec) || !isset($rec->id) || !is_numeric($rec->id)) {
                        continue;
                    }
                    $st->execute([$uid, (int) $rec->id, (int) $i, json_encode($rec, ISGORA_JSON), $now]);
                }
            } elseif ($key === 'seq') {
                umeta_set($uid, 'seq', (string) (int) $val);
            } elseif ($key === 'settings' && is_object($val)) {
                umeta_set($uid, 'settings', json_encode($val, ISGORA_JSON));
            }
        }
        $rev++;
        umeta_set($uid, 'rev', (string) $rev);
        $db->exec('COMMIT');
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->exec('ROLLBACK');
        }
        throw $e;
    }
    json_out(['rev' => $rev]);
}

// ---------------------------------------------------------------- Claude vekili

function proxy_anthropic(): void
{
    $u = current_user();
    if (!$u) {
        // SDK 401'i "anahtar geçersiz" sanmasın diye 403 + açıklama
        json_out(['type' => 'error', 'error' => ['type' => 'permission_error', 'message' => 'Oturum süresi doldu; sayfayı yenileyip tekrar giriş yapın.']], 403);
    }
    require_app_header();
    $uid = (int) $u['id'];
    $acc = ai_access($u);
    // Aynı sorgunun araç turları / yeniden denemeleri aynı kimliği taşır → bir kez sayılır
    $qid = strtolower((string) ($_SERVER['HTTP_X_ISGORA_SORGU'] ?? ''));
    if (!preg_match('/^[a-f0-9]{8,64}$/', $qid)) {
        $qid = bin2hex(random_bytes(12));
    }
    $counted = false;
    if ($acc['metered']) {
        $st = db()->prepare('SELECT 1 FROM ai_sorgular WHERE kullanici_id = ? AND sorgu_id = ?');
        $st->execute([$uid, $qid]);
        $counted = (bool) $st->fetchColumn();
        if (!$counted && $acc['left'] <= 0) {
            json_out(['type' => 'error', 'error' => ['type' => 'billing_error', 'message' => 'Ücretsiz ' . $acc['limit'] . ' yapay zekâ soru hakkınız doldu. Devam etmek için Ayarlar > Yapay Zekâ bölümünden kendi Anthropic API anahtarınızı ekleyin.']], 402);
        }
    }
    // Hakkı biten kullanıcı, zaten sayılmış bir sorgunun araç turlarını yine de tamamlayabilir
    $key = $acc['key'] !== '' ? $acc['key'] : ($acc['metered'] && $counted ? shared_ai_key() : '');
    if ($key === '') {
        json_out(['type' => 'error', 'error' => ['type' => 'api_error', 'message' => 'Sunucuda API anahtarı tanımlı değil. Ayarlar > Yapay Zekâ bölümünden ekleyin.']], 503);
    }
    if (($_GET['p'] ?? '') !== 'v1/messages') {
        json_out(['type' => 'error', 'error' => ['type' => 'not_found_error', 'message' => 'Desteklenmeyen uç nokta.']], 404);
    }
    if (strtoupper((string) $_SERVER['REQUEST_METHOD']) !== 'POST') {
        json_out(['type' => 'error', 'error' => ['type' => 'invalid_request_error', 'message' => 'Yalnızca POST.']], 405);
    }
    if (!function_exists('curl_init')) {
        json_out(['type' => 'error', 'error' => ['type' => 'api_error', 'message' => 'Sunucuda PHP cURL eklentisi yok.']], 500);
    }

    $query = $_GET;
    unset($query['r'], $query['p']);
    $url = 'https://api.anthropic.com/v1/messages' . ($query ? '?' . http_build_query($query) : '');
    $headers = [
        'x-api-key: ' . $key,
        'content-type: application/json',
        'anthropic-version: ' . ($_SERVER['HTTP_ANTHROPIC_VERSION'] ?? '2023-06-01'),
    ];
    if (!empty($_SERVER['HTTP_ANTHROPIC_BETA'])) {
        $headers[] = 'anthropic-beta: ' . $_SERVER['HTTP_ANTHROPIC_BETA'];
    }
    // Ortak anahtar bir çalışma alanına bağlı değilse Anthropic bu başlığı ister (config.php: anthropic_workspace_id)
    $ws = trim((string) (cfg()['anthropic_workspace_id'] ?? ''));
    if ($ws !== '' && $key === shared_ai_key() && preg_match('/^[A-Za-z0-9_\-]{4,80}$/', $ws)) {
        $headers[] = 'anthropic-workspace-id: ' . $ws;
    }
    if (!empty($_SERVER['HTTP_ACCEPT'])) {
        $headers[] = 'accept: ' . $_SERVER['HTTP_ACCEPT'];
    }

    // Akışı (stream) tamponlamadan ilet; uzun risk analizi üretimleri için süre sınırı yok
    @set_time_limit(0);
    @ini_set('zlib.output_compression', '0');
    @ini_set('output_buffering', '0');
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }
    header('X-Accel-Buffering: no');
    header('Cache-Control: no-store');

    $status = 0;
    $ctype = 'application/json';
    $sent = false;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => (string) file_get_contents('php://input'),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 20,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_HEADERFUNCTION => function ($c, $line) use (&$status, &$ctype) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) {
                $status = (int) $m[1];
            } elseif (stripos($line, 'content-type:') === 0) {
                $ctype = trim(substr($line, 13));
            }
            return strlen($line);
        },
        CURLOPT_WRITEFUNCTION => function ($c, $chunk) use (&$status, &$ctype, &$sent, $acc, $counted, $uid, $qid) {
            if (!$sent) {
                http_response_code($status ?: 200);
                header('Content-Type: ' . $ctype);
                $sent = true;
                // Ücretsiz deneme: yalnızca başarılı yanıtlar sorgu hakkından düşer
                if ($acc['metered'] && !$counted && $status >= 200 && $status < 300) {
                    db()->prepare('INSERT OR IGNORE INTO ai_sorgular (kullanici_id, sorgu_id, zaman) VALUES (?, ?, ?)')->execute([$uid, $qid, time()]);
                }
            }
            echo $chunk;
            @flush();
            return connection_aborted() ? 0 : strlen($chunk);
        },
    ]);
    $ok = curl_exec($ch);
    if ($ok === false && !$sent) {
        $err = curl_error($ch);
        json_out(['type' => 'error', 'error' => ['type' => 'api_error', 'message' => "Anthropic'e bağlanılamadı: " . $err]], 502);
    }
    exit;
}
