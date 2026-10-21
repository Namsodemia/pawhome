<?php
/**
 * İsgora — PHP + SQLite sunucu tarafı ortak kütüphane.
 * Veritabanı: data/ klasöründe rastgele adlı bir .sqlite dosyası (ilk çalıştırmada oluşur).
 * Oturum: HMAC imzalı çerez (sunucuda oturum dosyası gerekmez).
 */

if (!defined('ISGORA')) {
    http_response_code(403);
    exit;
}

const ISGORA_COLLECTIONS = [
    'kasalar' => 'kasalar',
    'categories' => 'kategoriler',
    'transactions' => 'hareketler',
    'kursiyerler' => 'kursiyerler',
    'analyses' => 'risk_analizleri',
    'riskRows' => 'risk_maddeleri',
    'sinavSonuclari' => 'sinav_sonuclari',
    'olaylar' => 'olaylar',
    'denetimler' => 'denetimler',
    'siniflar' => 'siniflar',
    'uyeler' => 'sinif_uyeleri',
    'mesajlar' => 'sinif_mesajlari',
    'chat' => 'asistan_mesajlari',
    'muayeneler' => 'muayeneler',
    'egitimler' => 'egitim_kayitlari',
];
const ISGORA_ROLES = ['osgb', 'uzman', 'hekim', 'dsp', 'ogrenci'];
/** OSGB'nin açabileceği çalışan hesabı rolleri: İGU, işyeri hekimi, DSP */
const ISGORA_STAFF_ROLES = ['uzman', 'hekim', 'dsp'];
const ISGORA_USER_COLS = 'id, kullanici_adi, sifre_hash, eposta, ad_soyad, rol, profil, yonetici, osgb_id, aktif, dogrulandi, son_giris';
const ISGORA_JSON = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION;
const ISGORA_COOKIE = 'isgora_oturum';
const ISGORA_SESSION_DAYS = 30;

function data_dir(): string
{
    $dir = dirname(__DIR__) . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    // Veri klasörü web'den asla okunmasın (sunucu .htaccess'i desteklemese bile index ile listeleme kapanır)
    if (!is_file($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "Options -Indexes\n<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
    }
    if (!is_file($dir . '/index.html')) {
        @file_put_contents($dir . '/index.html', '');
    }
    return $dir;
}

/** config.php (pakette gelir) + data/config.local.php (ilk çalıştırmada üretilir, güncellemede ezilmez) */
function cfg(): array
{
    static $c = null;
    if ($c !== null) {
        return $c;
    }
    $base = require __DIR__ . '/config.php';
    $localFile = data_dir() . '/config.local.php';
    if (!is_file($localFile)) {
        $local = [
            'db_file' => 'isgora_' . bin2hex(random_bytes(12)) . '.sqlite',
            'secret' => bin2hex(random_bytes(32)),
        ];
        $php = "<?php\n// Otomatik oluşturuldu — silmeyin; veritabanı dosyasının adı ve oturum anahtarı buradadır.\nreturn " . var_export($local, true) . ";\n";
        if (@file_put_contents($localFile, $php, LOCK_EX) === false) {
            fail_json(500, 'Sunucu yapılandırması yazılamadı: data/ klasörüne yazma izni gerekli.');
        }
        @chmod($localFile, 0640);
    }
    $local = require $localFile;
    $c = array_merge(is_array($base) ? $base : [], is_array($local) ? $local : []);
    return $c;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    if (!class_exists('PDO') || !in_array('sqlite', PDO::getAvailableDrivers(), true)) {
        fail_json(500, 'Sunucuda PDO SQLite eklentisi yok. cPanel > Select PHP Version bölümünden pdo_sqlite eklentisini açın.');
    }
    $file = data_dir() . '/' . basename((string) cfg()['db_file']);
    $pdo = new PDO('sqlite:' . $file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA busy_timeout = 10000');
    $pdo->exec('PRAGMA foreign_keys = ON');
    @chmod($file, 0640);
    migrate($pdo);
    return $pdo;
}

function table_columns(PDO $db, string $table): array
{
    $cols = [];
    foreach ($db->query("PRAGMA table_info($table)")->fetchAll() as $c) {
        $cols[] = $c['name'];
    }
    return $cols;
}

function migrate(PDO $db): void
{
    $db->exec('CREATE TABLE IF NOT EXISTS ayarlar (anahtar TEXT PRIMARY KEY, deger TEXT)');
    $db->exec('CREATE TABLE IF NOT EXISTS kullanicilar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kullanici_adi TEXT NOT NULL UNIQUE COLLATE NOCASE,
        sifre_hash TEXT NOT NULL,
        olusturma TEXT NOT NULL
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS kullanici_ayarlar (
        kullanici_id INTEGER NOT NULL,
        anahtar TEXT NOT NULL,
        deger TEXT,
        PRIMARY KEY (kullanici_id, anahtar)
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS giris_denemeleri (ip TEXT NOT NULL, zaman INTEGER NOT NULL)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_giris_ip ON giris_denemeleri (ip, zaman)');
    $db->exec('CREATE TABLE IF NOT EXISTS kayit_denemeleri (ip TEXT NOT NULL, zaman INTEGER NOT NULL)');

    $version = (int) $db->query('PRAGMA user_version')->fetchColumn();
    if ($version < 2) {
        migrate_v2($db);
    }
    if ($version < 3) {
        migrate_v3($db);
    }
    foreach (ISGORA_COLLECTIONS as $table) {
        create_collection_table($db, $table);
    }
    // Kullanıcılar arası paylaşılan / güvenlik tabloları
    $db->exec('CREATE TABLE IF NOT EXISTS otp_kodlari (
        kullanici_id INTEGER NOT NULL,
        amac TEXT NOT NULL,
        kod_hash TEXT NOT NULL,
        son INTEGER NOT NULL,
        deneme INTEGER NOT NULL DEFAULT 0,
        olusturma INTEGER NOT NULL,
        PRIMARY KEY (kullanici_id, amac)
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS eposta_gonderim (eposta TEXT NOT NULL, ip TEXT NOT NULL, zaman INTEGER NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS ai_sorgular (
        kullanici_id INTEGER NOT NULL,
        sorgu_id TEXT NOT NULL,
        zaman INTEGER NOT NULL,
        PRIMARY KEY (kullanici_id, sorgu_id)
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS sinif_kodlari (
        kod TEXT PRIMARY KEY,
        sahip_id INTEGER NOT NULL,
        sinif_id INTEGER NOT NULL,
        olusturma TEXT NOT NULL
    )');
    $db->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_sinif_kod_sahip ON sinif_kodlari (sahip_id, sinif_id)');
    $db->exec('CREATE TABLE IF NOT EXISTS sinif_uyelik (
        sahip_id INTEGER NOT NULL,
        sinif_id INTEGER NOT NULL,
        kullanici_id INTEGER NOT NULL,
        katilma TEXT NOT NULL,
        PRIMARY KEY (sahip_id, sinif_id, kullanici_id)
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_sinif_uyelik_kullanici ON sinif_uyelik (kullanici_id)');
}

/** v2: kullanıcı başına veri + rol/profil (tek kullanıcılı v1 verisi ilk kullanıcıya taşınır) */
function migrate_v2(PDO $db): void
{
    $db->exec('BEGIN IMMEDIATE');
    try {
        $ucols = table_columns($db, 'kullanicilar');
        foreach (['eposta' => 'TEXT', 'ad_soyad' => 'TEXT', 'rol' => 'TEXT', 'profil' => 'TEXT', 'yonetici' => 'INTEGER NOT NULL DEFAULT 0'] as $col => $type) {
            if (!in_array($col, $ucols, true)) {
                $db->exec("ALTER TABLE kullanicilar ADD COLUMN $col $type");
            }
        }
        $first = $db->query('SELECT id FROM kullanicilar ORDER BY id LIMIT 1')->fetchColumn();
        $firstId = $first === false ? null : (int) $first;
        if ($firstId !== null) {
            $db->prepare("UPDATE kullanicilar SET yonetici = 1, rol = COALESCE(rol, 'osgb') WHERE id = ?")->execute([$firstId]);
        }
        foreach (ISGORA_COLLECTIONS as $table) {
            $exists = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name=" . $db->quote($table))->fetchColumn();
            if ($exists && !in_array('kullanici_id', table_columns($db, $table), true)) {
                $db->exec("ALTER TABLE $table RENAME TO {$table}_v1");
                create_collection_table($db, $table);
                $owner = $firstId ?? 1;
                $db->exec("INSERT INTO $table (kullanici_id, id, sira, veri, guncelleme) SELECT $owner, id, sira, veri, guncelleme FROM {$table}_v1");
                $db->exec("DROP TABLE {$table}_v1");
            } else {
                create_collection_table($db, $table);
            }
        }
        if ($firstId !== null) {
            foreach (['rev', 'seq', 'settings', 'soru_bankasi', 'anthropic_api_key'] as $k) {
                $st = $db->prepare('SELECT deger FROM ayarlar WHERE anahtar = ?');
                $st->execute([$k]);
                $v = $st->fetchColumn();
                if ($v !== false) {
                    $db->prepare('INSERT OR REPLACE INTO kullanici_ayarlar (kullanici_id, anahtar, deger) VALUES (?, ?, ?)')->execute([$firstId, $k, $v]);
                    $db->prepare('DELETE FROM ayarlar WHERE anahtar = ?')->execute([$k]);
                }
            }
        }
        $db->exec('PRAGMA user_version = 2');
        $db->exec('COMMIT');
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->exec('ROLLBACK');
        }
        throw $e;
    }
}

/** v3: OSGB çalışan hesapları (osgb_id), hesap durumu (aktif), e-posta doğrulaması (dogrulandi), son giriş */
function migrate_v3(PDO $db): void
{
    $db->exec('BEGIN IMMEDIATE');
    try {
        $ucols = table_columns($db, 'kullanicilar');
        foreach ([
            'osgb_id' => 'INTEGER',
            'aktif' => 'INTEGER NOT NULL DEFAULT 1',
            // Mevcut hesaplar doğrulanmış sayılır; yeni kayıtlar e-posta koduyla doğrulanır
            'dogrulandi' => 'INTEGER NOT NULL DEFAULT 1',
            'son_giris' => 'TEXT',
        ] as $col => $type) {
            if (!in_array($col, $ucols, true)) {
                $db->exec("ALTER TABLE kullanicilar ADD COLUMN $col $type");
            }
        }
        $db->exec('CREATE INDEX IF NOT EXISTS idx_kullanici_osgb ON kullanicilar (osgb_id)');
        $db->exec('PRAGMA user_version = 3');
        $db->exec('COMMIT');
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->exec('ROLLBACK');
        }
        throw $e;
    }
}

function create_collection_table(PDO $db, string $table): void
{
    // Her kayıt kendi satırında; alanlar mobil uygulamadaki adlarla JSON olarak saklanır. Kullanıcı başına ayrı.
    $db->exec("CREATE TABLE IF NOT EXISTS $table (
        kullanici_id INTEGER NOT NULL,
        id INTEGER NOT NULL,
        sira INTEGER NOT NULL,
        veri TEXT NOT NULL,
        guncelleme TEXT NOT NULL,
        PRIMARY KEY (kullanici_id, id)
    )");
}

/** Kullanıcıya ait ayar (sürüm, sayaç, uygulama ayarları, soru bankası, API anahtarı) */
function umeta_get(int $uid, string $key, ?string $default = null): ?string
{
    $st = db()->prepare('SELECT deger FROM kullanici_ayarlar WHERE kullanici_id = ? AND anahtar = ?');
    $st->execute([$uid, $key]);
    $v = $st->fetchColumn();
    return $v === false ? $default : (string) $v;
}

function umeta_set(int $uid, string $key, ?string $value): void
{
    if ($value === null) {
        db()->prepare('DELETE FROM kullanici_ayarlar WHERE kullanici_id = ? AND anahtar = ?')->execute([$uid, $key]);
        return;
    }
    db()->prepare('INSERT OR REPLACE INTO kullanici_ayarlar (kullanici_id, anahtar, deger) VALUES (?, ?, ?)')->execute([$uid, $key, $value]);
}

function meta_get(string $key, ?string $default = null): ?string
{
    $st = db()->prepare('SELECT deger FROM ayarlar WHERE anahtar = ?');
    $st->execute([$key]);
    $v = $st->fetchColumn();
    return $v === false ? $default : (string) $v;
}

function meta_set(string $key, ?string $value): void
{
    if ($value === null) {
        db()->prepare('DELETE FROM ayarlar WHERE anahtar = ?')->execute([$key]);
        return;
    }
    db()->prepare('INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES (?, ?)')->execute([$key, $value]);
}

// ---------------------------------------------------------------- HTTP yardımcıları

function json_out($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo is_string($data) ? $data : json_encode($data, ISGORA_JSON);
    exit;
}

function fail_json(int $code, string $message, string $error = 'error'): void
{
    json_out(['error' => $error, 'message' => $message], $code);
}

function is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    if (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') {
        return true;
    }
    return (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

/** Durum değiştiren API istekleri yalnızca uygulamanın kendi sayfasından gelebilir (özel başlık → başka sitelerden gönderilemez). */
function require_app_header(): void
{
    if (($_SERVER['HTTP_X_ISGORA'] ?? '') !== '1') {
        fail_json(403, 'Geçersiz istek.', 'csrf');
    }
}

// ---------------------------------------------------------------- oturum

function b64url(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64url_dec(string $s): string
{
    $d = base64_decode(strtr($s, '-_', '+/'), true);
    return $d === false ? '' : $d;
}

function user_fingerprint(array $u): string
{
    // Şifre değişince eski oturum çerezleri geçersiz olur
    return substr(hash('sha256', $u['sifre_hash']), 0, 16);
}

function issue_session(array $u): void
{
    $exp = time() + ISGORA_SESSION_DAYS * 86400;
    $payload = b64url(json_encode(['u' => (int) $u['id'], 'e' => $exp, 'f' => user_fingerprint($u)]));
    $sig = b64url(hash_hmac('sha256', $payload, (string) cfg()['secret'], true));
    setcookie(ISGORA_COOKIE, $payload . '.' . $sig, [
        'expires' => $exp,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clear_session(): void
{
    setcookie(ISGORA_COOKIE, '', ['expires' => time() - 3600, 'path' => '/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Lax']);
}

function current_user(): ?array
{
    $tok = (string) ($_COOKIE[ISGORA_COOKIE] ?? '');
    if ($tok === '' || substr_count($tok, '.') !== 1) {
        return null;
    }
    [$payload, $sig] = explode('.', $tok, 2);
    $expected = b64url(hash_hmac('sha256', $payload, (string) cfg()['secret'], true));
    if (!hash_equals($expected, $sig)) {
        return null;
    }
    $data = json_decode(b64url_dec($payload), true);
    if (!is_array($data) || (int) ($data['e'] ?? 0) < time()) {
        return null;
    }
    $u = user_by_id((int) ($data['u'] ?? 0));
    if (!$u || !hash_equals(user_fingerprint($u), (string) ($data['f'] ?? ''))) {
        return null;
    }
    // Pasifleştirilen (OSGB'nin kapattığı) ya da e-postası doğrulanmamış hesaplar oturum açamaz
    if ((int) $u['aktif'] !== 1 || (int) $u['dogrulandi'] !== 1) {
        return null;
    }
    return $u;
}

function user_by_id(int $id): ?array
{
    $st = db()->prepare('SELECT ' . ISGORA_USER_COLS . ' FROM kullanicilar WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    return $u ?: null;
}

function user_by_login(string $login): ?array
{
    $st = db()->prepare('SELECT ' . ISGORA_USER_COLS . ' FROM kullanicilar WHERE kullanici_adi = ? COLLATE NOCASE OR eposta = ? COLLATE NOCASE LIMIT 1');
    $st->execute([$login, $login]);
    $u = $st->fetch();
    return $u ?: null;
}

function email_taken(string $eposta, int $exceptId = 0): bool
{
    $st = db()->prepare('SELECT COUNT(*) FROM kullanicilar WHERE (kullanici_adi = ? COLLATE NOCASE OR eposta = ? COLLATE NOCASE) AND id <> ?');
    $st->execute([$eposta, $eposta, $exceptId]);
    return (int) $st->fetchColumn() > 0;
}

function mark_login(int $uid): void
{
    db()->prepare('UPDATE kullanicilar SET son_giris = ? WHERE id = ?')->execute([gmdate('c'), $uid]);
}

/** Kurum adı: profildeki kurum → Ayarlar'daki "firma" (raporlarda görünen ad) → ad soyad → kullanıcı adı */
function user_org_name(array $u): string
{
    $k = trim((string) (user_profile($u)['kurum'] ?? ''));
    if ($k === '') {
        $s = json_decode((string) umeta_get((int) $u['id'], 'settings', ''), true);
        $k = trim((string) (is_array($s) ? ($s['firma'] ?? '') : ''));
    }
    if ($k === '') {
        $k = trim((string) ($u['ad_soyad'] ?? ''));
    }
    return $k !== '' ? $k : (string) ($u['kullanici_adi'] ?? '');
}

function require_user(): array
{
    $u = current_user();
    if (!$u) {
        fail_json(401, 'Oturum açmanız gerekiyor.', 'auth');
    }
    return $u;
}

function user_count(): int
{
    return (int) db()->query('SELECT COUNT(*) FROM kullanicilar')->fetchColumn();
}

/** Kaba kuvvet koruması: 15 dakikada 8 hatalı denemeden sonra IP geçici olarak engellenir. */
function login_blocked(): bool
{
    $db = db();
    $db->prepare('DELETE FROM giris_denemeleri WHERE zaman < ?')->execute([time() - 86400]);
    $st = $db->prepare('SELECT COUNT(*) FROM giris_denemeleri WHERE ip = ? AND zaman > ?');
    $st->execute([client_ip(), time() - 900]);
    return (int) $st->fetchColumn() >= 8;
}

function login_failed(): void
{
    db()->prepare('INSERT INTO giris_denemeleri (ip, zaman) VALUES (?, ?)')->execute([client_ip(), time()]);
}

/** Aynı IP'den saatte en fazla 5 yeni hesap */
function register_blocked(): bool
{
    $db = db();
    $db->prepare('DELETE FROM kayit_denemeleri WHERE zaman < ?')->execute([time() - 86400]);
    $st = $db->prepare('SELECT COUNT(*) FROM kayit_denemeleri WHERE ip = ? AND zaman > ?');
    $st->execute([client_ip(), time() - 3600]);
    return (int) $st->fetchColumn() >= 5;
}

function register_mark(): void
{
    db()->prepare('INSERT INTO kayit_denemeleri (ip, zaman) VALUES (?, ?)')->execute([client_ip(), time()]);
}

function user_role(array $u): string
{
    $r = (string) ($u['rol'] ?? '');
    return in_array($r, ISGORA_ROLES, true) ? $r : 'osgb';
}

function user_profile(array $u): array
{
    $p = json_decode((string) ($u['profil'] ?? ''), true);
    return is_array($p) ? $p : [];
}

const ISGORA_PROFILE_FIELDS = [
    'ad_soyad' => 80, 'telefon' => 20, 'kurum' => 120, 'il' => 40, 'ilce' => 60,
    'uzmanlik_sinifi' => 2, 'belge_no' => 40, 'deneyim' => 20, 'uzmanlik_alani' => 80, 'meslek' => 60,
    'hedef_sinav' => 60, 'bolum' => 100, 'yetki_belge_no' => 40, 'vergi_no' => 11, 'adres' => 240,
];

function strlen_u(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s) : strlen($s);
}

function cut(string $v, int $max): string
{
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/** Profil alanlarını beyaz listeyle temizler */
function clean_profile(array $in): array
{
    $out = [];
    foreach (ISGORA_PROFILE_FIELDS as $k => $max) {
        if (!isset($in[$k])) {
            continue;
        }
        $v = cut(trim(preg_replace('/\s+/u', ' ', (string) $in[$k]) ?? ''), $max);
        if ($k === 'uzmanlik_sinifi' && !in_array($v, ['A', 'B', 'C', ''], true)) {
            $v = '';
        }
        if ($k === 'telefon' && $v !== '') {
            $v = normalize_phone($v) ?? '';
        }
        if ($k === 'vergi_no') {
            $v = preg_replace('/\D/', '', $v) ?? '';
        }
        $out[$k] = $v;
    }
    return $out;
}

/** Türkiye telefon numarası → "0XXX XXX XX XX"; geçersizse null */
function normalize_phone(string $raw): ?string
{
    $d = preg_replace('/\D/', '', $raw) ?? '';
    if (strlen($d) === 12 && strpos($d, '90') === 0) {
        $d = substr($d, 2);
    } elseif (strlen($d) === 11 && $d[0] === '0') {
        $d = substr($d, 1);
    }
    if (strlen($d) !== 10 || !preg_match('/^[2-5]/', $d)) {
        return null;
    }
    return '0' . substr($d, 0, 3) . ' ' . substr($d, 3, 3) . ' ' . substr($d, 6, 2) . ' ' . substr($d, 8, 2);
}

function login_ok(): void
{
    db()->prepare('DELETE FROM giris_denemeleri WHERE ip = ?')->execute([client_ip()]);
}

// ---------------------------------------------------------------- yapay zekâ

/** Ortak anahtar: yöneticinin Ayarlar'dan girdiği, yoksa config.php'deki */
function shared_ai_key(): string
{
    $k = trim((string) meta_get('ortak_ai_anahtari', ''));
    return $k !== '' ? $k : trim((string) (cfg()['anthropic_api_key'] ?? ''));
}

function ai_free_limit(): int
{
    return max(0, (int) (cfg()['ucretsiz_ai_sorgu'] ?? 4));
}

function ai_used(int $uid): int
{
    $st = db()->prepare('SELECT COUNT(*) FROM ai_sorgular WHERE kullanici_id = ?');
    $st->execute([$uid]);
    return (int) $st->fetchColumn();
}

/**
 * Kullanıcının yapay zekâ erişimi (kullanıcılar kendi anahtarını girmez):
 *  1) yönetici → ortak anahtar (ya da kendi kaydettiği anahtar), sınırsız
 *  2) yöneticinin OSGB'sine bağlı çalışan hesabı → ortak anahtar, sınırsız
 *  3) diğer herkes → ortak anahtar, ücretsiz soru hakkı kadar (varsayılan 4)
 */
function ai_access(array $u): array
{
    $uid = (int) $u['id'];
    $shared = shared_ai_key();
    $limit = ai_free_limit();
    $used = ai_used($uid);
    $base = ['own' => false, 'shared' => $shared !== '', 'limit' => $limit, 'used' => $used, 'left' => max(0, $limit - $used), 'unlimited' => false, 'metered' => false];
    if ((int) $u['yonetici'] === 1) {
        $own = trim((string) umeta_get($uid, 'anthropic_api_key', ''));
        return ['unlimited' => true] + $base + ['key' => $own !== '' ? $own : $shared];
    }
    if ($shared === '') {
        return $base + ['key' => ''];
    }
    if (!empty($u['osgb_id'])) {
        $org = user_by_id((int) $u['osgb_id']);
        if ($org && (int) $org['yonetici'] === 1) {
            return ['unlimited' => true] + $base + ['key' => $shared];
        }
    }
    return ['metered' => true] + $base + ['key' => $base['left'] > 0 ? $shared : ''];
}

// ---------------------------------------------------------------- e-posta

function site_host(): string
{
    $h = strtolower((string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost'));
    $h = preg_replace('/:\d+$/', '', $h) ?? $h;
    return preg_match('/^[a-z0-9.-]+$/', $h) ? $h : 'localhost';
}

function site_url(string $path = '/'): string
{
    return (is_https() ? 'https://' : 'http://') . (string) ($_SERVER['HTTP_HOST'] ?? site_host()) . $path;
}

function mail_from(): string
{
    $f = trim((string) (cfg()['mail_from'] ?? ''));
    if ($f !== '' && filter_var($f, FILTER_VALIDATE_EMAIL)) {
        return $f;
    }
    return 'no-reply@' . preg_replace('/^www\./', '', site_host());
}

function mime_header(string $s): string
{
    // Başlık enjeksiyonuna karşı: kullanıcı girdisi (kurum adı vb.) satır sonu taşıyamaz
    $s = trim(str_replace(["\r", "\n"], ' ', $s));
    return preg_match('/[^\x20-\x7e]/', $s) ? '=?UTF-8?B?' . base64_encode($s) . '?=' : $s;
}

/**
 * E-posta gönderir (config.php'de smtp_host doluysa SMTP, değilse PHP mail()).
 * Düz metin + HTML (multipart/alternative), UTF-8.
 */
function send_mail(string $to, string $subject, string $text, string $html): bool
{
    $from = mail_from();
    $fromName = (string) (cfg()['mail_from_name'] ?? 'İsgora');
    $boundary = 'isg_' . bin2hex(random_bytes(12));
    $headers = [
        'From: ' . mime_header($fromName) . ' <' . $from . '>',
        'Reply-To: ' . $from,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        'X-Mailer: Isgora',
    ];
    $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text))
        . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--$boundary--\r\n";
    $c = cfg();
    if (trim((string) ($c['smtp_host'] ?? '')) !== '') {
        try {
            return smtp_send($to, $from, mime_header($subject), implode("\r\n", $headers), $body);
        } catch (Throwable $e) {
            error_log('[isgora] SMTP: ' . $e->getMessage());
            return false;
        }
    }
    if (!function_exists('mail')) {
        return false;
    }
    $ok = @mail($to, mime_header($subject), $body, implode("\r\n", $headers), '-f' . $from);
    if (!$ok) {
        $ok = @mail($to, mime_header($subject), $body, implode("\r\n", $headers));
    }
    return (bool) $ok;
}

function smtp_send(string $to, string $from, string $subject, string $headers, string $body): bool
{
    $c = cfg();
    $host = (string) $c['smtp_host'];
    $port = (int) ($c['smtp_port'] ?? 465);
    $secure = strtolower((string) ($c['smtp_secure'] ?? ($port === 465 ? 'ssl' : 'tls')));
    $fp = @stream_socket_client(($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port, $errno, $errstr, 15);
    if (!$fp) {
        throw new RuntimeException("bağlantı kurulamadı: $errstr");
    }
    stream_set_timeout($fp, 20);
    $read = function () use ($fp): string {
        $out = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $out .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $out;
    };
    $cmd = function (string $c, array $okCodes) use ($fp, $read): string {
        if ($c !== '') {
            fwrite($fp, $c . "\r\n");
        }
        $r = $read();
        if (!in_array((int) substr($r, 0, 3), $okCodes, true)) {
            throw new RuntimeException(trim($r) ?: 'yanıt yok');
        }
        return $r;
    };
    $cmd('', [220]);
    $ehlo = 'EHLO ' . site_host();
    $cmd($ehlo, [250]);
    if ($secure === 'tls') {
        $cmd('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('STARTTLS başarısız');
        }
        $cmd($ehlo, [250]);
    }
    $user = (string) ($c['smtp_user'] ?? '');
    if ($user !== '') {
        $cmd('AUTH LOGIN', [334]);
        $cmd(base64_encode($user), [334]);
        $cmd(base64_encode((string) ($c['smtp_pass'] ?? '')), [235]);
    }
    $cmd('MAIL FROM:<' . $from . '>', [250]);
    $cmd('RCPT TO:<' . $to . '>', [250, 251]);
    $cmd('DATA', [354]);
    $msg = 'To: <' . $to . ">\r\nSubject: " . $subject . "\r\nDate: " . date('r') . "\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . '@' . site_host() . ">\r\n" . $headers . "\r\n\r\n" . $body;
    $msg = preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], ["\n", "\r\n"], $msg)) ?? $msg;
    $cmd($msg . "\r\n.", [250]);
    @fwrite($fp, "QUIT\r\n");
    fclose($fp);
    return true;
}

/** Aynı adrese saatte 6, aynı IP'den saatte 15 e-postadan fazlası gönderilmez */
function mail_rate_ok(string $eposta): bool
{
    $db = db();
    $db->prepare('DELETE FROM eposta_gonderim WHERE zaman < ?')->execute([time() - 86400]);
    $st = $db->prepare('SELECT COUNT(*) FROM eposta_gonderim WHERE eposta = ? AND zaman > ?');
    $st->execute([strtolower($eposta), time() - 3600]);
    if ((int) $st->fetchColumn() >= 6) {
        return false;
    }
    $st = $db->prepare('SELECT COUNT(*) FROM eposta_gonderim WHERE ip = ? AND zaman > ?');
    $st->execute([client_ip(), time() - 3600]);
    return (int) $st->fetchColumn() < 15;
}

function mail_mark(string $eposta): void
{
    db()->prepare('INSERT INTO eposta_gonderim (eposta, ip, zaman) VALUES (?, ?, ?)')->execute([strtolower($eposta), client_ip(), time()]);
}

/** Basit, e-posta istemcilerinde düzgün görünen şablon */
function mail_html(string $title, string $intro, string $code = '', string $outro = ''): string
{
    $e = function (string $s): string {
        return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    };
    $codeBox = $code !== ''
        ? '<div style="margin:22px 0;padding:18px;border-radius:16px;background:#F2F8FB;border:1px solid #D7E8F1;text-align:center;font:800 34px/1 Menlo,Consolas,monospace;letter-spacing:10px;color:#107398">' . $e($code) . '</div>'
        : '';
    return '<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#F4F7F9;font-family:Arial,Helvetica,sans-serif;color:#2A3A4C">'
        . '<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E6EBF0;border-radius:20px;padding:28px">'
        . '<div style="font-weight:800;font-size:20px;color:#107398">İsgora</div>'
        . '<div style="font-size:12px;color:#6E7C8C;margin-bottom:18px">İş Sağlığı ve Güvenliği Uygulaması</div>'
        . '<h1 style="font-size:19px;margin:0 0 10px;color:#1E3145">' . $e($title) . '</h1>'
        . '<p style="font-size:14.5px;line-height:1.6;margin:0">' . nl2br($e($intro)) . '</p>'
        . $codeBox
        . ($outro !== '' ? '<p style="font-size:13px;line-height:1.6;color:#6E7C8C;margin:0">' . nl2br($e($outro)) . '</p>' : '')
        . '</div></body></html>';
}

// ---------------------------------------------------------------- tek kullanımlık kod (OTP)

const ISGORA_OTP_TTL = 600;      // 10 dakika geçerli
const ISGORA_OTP_COOLDOWN = 60;  // yeniden gönderim için bekleme
const ISGORA_OTP_TRIES = 5;      // kod başına deneme hakkı

function otp_hash(int $uid, string $amac, string $kod): string
{
    return hash_hmac('sha256', $uid . '|' . $amac . '|' . $kod, (string) cfg()['secret']);
}

/** Yeniden gönderim için kalan bekleme (sn) */
function otp_wait(int $uid, string $amac): int
{
    $st = db()->prepare('SELECT olusturma FROM otp_kodlari WHERE kullanici_id = ? AND amac = ?');
    $st->execute([$uid, $amac]);
    $t = $st->fetchColumn();
    return $t === false ? 0 : max(0, (int) $t + ISGORA_OTP_COOLDOWN - time());
}

/**
 * 6 haneli kod üretir ve e-postayla gönderir. Döner: 'ok' | 'bekle' | 'limit' | 'gonderilemedi'
 * amac: kayit (e-posta doğrulama) | giris (kodla giriş) | sifre (şifre yenileme)
 */
function otp_send(array $u, string $amac): string
{
    $uid = (int) $u['id'];
    if (otp_wait($uid, $amac) > 0) {
        return 'bekle';
    }
    $eposta = (string) ($u['eposta'] ?: $u['kullanici_adi']);
    if (!mail_rate_ok($eposta)) {
        return 'limit';
    }
    $kod = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    db()->prepare('INSERT OR REPLACE INTO otp_kodlari (kullanici_id, amac, kod_hash, son, deneme, olusturma) VALUES (?, ?, ?, ?, 0, ?)')
        ->execute([$uid, $amac, otp_hash($uid, $amac, $kod), time() + ISGORA_OTP_TTL, time()]);
    mail_mark($eposta);
    $ad = trim((string) ($u['ad_soyad'] ?? ''));
    $selam = $ad !== '' ? "Merhaba $ad," : 'Merhaba,';
    $titles = ['kayit' => 'E-posta adresinizi doğrulayın', 'giris' => 'Giriş kodunuz', 'sifre' => 'Şifre yenileme kodunuz'];
    $intros = [
        'kayit' => "$selam\nİsgora hesabınızı etkinleştirmek için aşağıdaki doğrulama kodunu girin.",
        'giris' => "$selam\nİsgora'ya giriş yapmak için aşağıdaki kodu girin.",
        'sifre' => "$selam\nŞifrenizi yenilemek için aşağıdaki kodu girin.",
    ];
    $outro = 'Kod 10 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; kodu kimseyle paylaşmayın.';
    $title = $titles[$amac] ?? 'Doğrulama kodunuz';
    $text = ($intros[$amac] ?? $selam) . "\n\nKod: $kod\n\n$outro\n\n" . site_url('/giris.php');
    $ok = send_mail($eposta, "İsgora · $title: $kod", $text, mail_html($title, $intros[$amac] ?? $selam, $kod, $outro));
    if (!$ok) {
        // Gönderilemeyen kod için bekleme uygulanmasın
        db()->prepare('DELETE FROM otp_kodlari WHERE kullanici_id = ? AND amac = ?')->execute([$uid, $amac]);
        return 'gonderilemedi';
    }
    return 'ok';
}

/** Döner: 'ok' | 'hatali' | 'suresi' | 'deneme' | 'yok' */
function otp_check(int $uid, string $amac, string $kod): string
{
    $kod = preg_replace('/\D/', '', $kod) ?? '';
    $st = db()->prepare('SELECT kod_hash, son, deneme FROM otp_kodlari WHERE kullanici_id = ? AND amac = ?');
    $st->execute([$uid, $amac]);
    $r = $st->fetch();
    if (!$r) {
        return 'yok';
    }
    if ((int) $r['son'] < time()) {
        return 'suresi';
    }
    if ((int) $r['deneme'] >= ISGORA_OTP_TRIES) {
        return 'deneme';
    }
    if (strlen($kod) !== 6 || !hash_equals($r['kod_hash'], otp_hash($uid, $amac, $kod))) {
        db()->prepare('UPDATE otp_kodlari SET deneme = deneme + 1 WHERE kullanici_id = ? AND amac = ?')->execute([$uid, $amac]);
        return 'hatali';
    }
    db()->prepare('DELETE FROM otp_kodlari WHERE kullanici_id = ? AND amac = ?')->execute([$uid, $amac]);
    return 'ok';
}

function otp_required(): bool
{
    return (bool) (cfg()['otp_zorunlu'] ?? true);
}

// ---------------------------------------------------------------- sınıf katılımı

/** Karışmayan karakterlerle 6 haneli sınıf kodu */
function new_class_code(): string
{
    $abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for ($i = 0; $i < 20; $i++) {
        $k = '';
        for ($j = 0; $j < 6; $j++) {
            $k .= $abc[random_int(0, strlen($abc) - 1)];
        }
        $st = db()->prepare('SELECT 1 FROM sinif_kodlari WHERE kod = ?');
        $st->execute([$k]);
        if (!$st->fetchColumn()) {
            return $k;
        }
    }
    throw new RuntimeException('Sınıf kodu üretilemedi.');
}

/** OSGB'nin (sahip) sınıf kaydı — store'daki Sinif nesnesi */
function class_row(int $sahip, int $sinif): ?array
{
    $st = db()->prepare('SELECT veri FROM siniflar WHERE kullanici_id = ? AND id = ?');
    $st->execute([$sahip, $sinif]);
    $v = $st->fetchColumn();
    if ($v === false) {
        return null;
    }
    $d = json_decode((string) $v, true);
    return is_array($d) ? $d : null;
}

function class_lookup_code(string $kod): ?array
{
    $st = db()->prepare('SELECT sahip_id, sinif_id FROM sinif_kodlari WHERE kod = ?');
    $st->execute([strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $kod) ?? '')]);
    $r = $st->fetch();
    return $r ? ['sahip' => (int) $r['sahip_id'], 'sinif' => (int) $r['sinif_id']] : null;
}

function class_join(int $uid, int $sahip, int $sinif): void
{
    db()->prepare('INSERT OR IGNORE INTO sinif_uyelik (sahip_id, sinif_id, kullanici_id, katilma) VALUES (?, ?, ?, ?)')
        ->execute([$sahip, $sinif, $uid, gmdate('c')]);
}

/** Öğrencinin gördüğü sınıf özeti + kurumun bu sınıfa gönderdiği son 100 duyuru */
function class_item(int $sahip, int $sinif, string $katilma): ?array
{
    $row = class_row($sahip, $sinif);
    if (!$row) {
        return null;
    }
    $owner = user_by_id($sahip);
    $st = db()->prepare('SELECT veri FROM sinif_mesajlari WHERE kullanici_id = ? ORDER BY sira, id');
    $st->execute([$sahip]);
    $msgs = [];
    foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $v) {
        $m = json_decode((string) $v, true);
        if (is_array($m) && (int) ($m['sinif_id'] ?? 0) === $sinif) {
            $msgs[] = ['id' => (int) $m['id'], 'metin' => (string) ($m['metin'] ?? ''), 'created_at' => (string) ($m['created_at'] ?? '')];
        }
    }
    usort($msgs, function ($a, $b) {
        return $a['id'] <=> $b['id'];
    });
    $cnt = db()->prepare('SELECT COUNT(*) FROM sinif_uyelik WHERE sahip_id = ? AND sinif_id = ?');
    $cnt->execute([$sahip, $sinif]);
    return [
        'sahip_id' => $sahip,
        'sinif_id' => $sinif,
        'ad' => (string) ($row['ad'] ?? ''),
        'aciklama' => (string) ($row['aciklama'] ?? ''),
        'renk' => (string) ($row['renk'] ?? '#1D9BF0'),
        'kurum' => $owner ? user_org_name($owner) : '',
        'katilma' => $katilma,
        'uye_sayisi' => (int) $cnt->fetchColumn(),
        'mesajlar' => array_slice($msgs, -100),
    ];
}

/** Kullanıcıyı ve tüm verisini siler (OSGB'nin çalışan hesabını silmesi) */
function delete_user_everything(int $uid): void
{
    $db = db();
    $db->exec('BEGIN IMMEDIATE');
    try {
        foreach (ISGORA_COLLECTIONS as $table) {
            $db->prepare("DELETE FROM $table WHERE kullanici_id = ?")->execute([$uid]);
        }
        foreach (['kullanici_ayarlar', 'ai_sorgular', 'otp_kodlari', 'sinif_uyelik'] as $t) {
            $db->prepare("DELETE FROM $t WHERE kullanici_id = ?")->execute([$uid]);
        }
        $db->prepare('DELETE FROM sinif_uyelik WHERE sahip_id = ?')->execute([$uid]);
        $db->prepare('DELETE FROM sinif_kodlari WHERE sahip_id = ?')->execute([$uid]);
        $db->prepare('DELETE FROM kullanicilar WHERE id = ?')->execute([$uid]);
        $db->exec('COMMIT');
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->exec('ROLLBACK');
        }
        throw $e;
    }
}
