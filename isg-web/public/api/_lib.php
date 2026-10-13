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
];
const ISGORA_ROLES = ['osgb', 'uzman', 'hekim', 'ogrenci'];
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
    if ($version >= 2) {
        foreach (ISGORA_COLLECTIONS as $table) {
            create_collection_table($db, $table);
        }
        return;
    }

    // v2: kullanıcı başına veri + rol/profil (tek kullanıcılı v1 verisi ilk kullanıcıya taşınır)
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
    $st = db()->prepare('SELECT id, kullanici_adi, sifre_hash, eposta, ad_soyad, rol, profil, yonetici FROM kullanicilar WHERE id = ?');
    $st->execute([(int) ($data['u'] ?? 0)]);
    $u = $st->fetch();
    if (!$u || !hash_equals(user_fingerprint($u), (string) ($data['f'] ?? ''))) {
        return null;
    }
    return $u;
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

/** Profil alanlarını beyaz listeyle temizler */
function clean_profile(array $in): array
{
    $out = [];
    foreach (['ad_soyad' => 80, 'kurum' => 120, 'il' => 60, 'uzmanlik_sinifi' => 2, 'hedef_sinav' => 40, 'sinav_tarihi' => 10] as $k => $max) {
        if (!isset($in[$k])) {
            continue;
        }
        $v = trim((string) $in[$k]);
        $v = function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
        if ($k === 'uzmanlik_sinifi' && !in_array($v, ['A', 'B', 'C', ''], true)) {
            $v = '';
        }
        if ($k === 'sinav_tarihi' && $v !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
            $v = '';
        }
        $out[$k] = $v;
    }
    return $out;
}

function login_ok(): void
{
    db()->prepare('DELETE FROM giris_denemeleri WHERE ip = ?')->execute([client_ip()]);
}

// ---------------------------------------------------------------- yapay zekâ

/** Önce kullanıcının kendi kaydettiği anahtar, yoksa config.php'deki ortak anahtar */
function server_ai_key(int $uid): string
{
    $k = trim((string) umeta_get($uid, 'anthropic_api_key', ''));
    if ($k !== '') {
        return $k;
    }
    return trim((string) (cfg()['anthropic_api_key'] ?? ''));
}
