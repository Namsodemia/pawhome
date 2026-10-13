<?php
/**
 * İsgora API — tek giriş noktası.
 *   GET  ?r=data            tüm kayıtlar (giriş gerekli)
 *   POST ?r=data            değişen koleksiyonları kaydet {baseRev, changes}
 *   GET|POST|DELETE ?r=bank içe aktarılan soru bankası
 *   GET  ?r=ai-status       sunucu anahtarı tanımlı mı
 *   POST|DELETE ?r=ai-key   kullanıcının API anahtarını kaydet / sil
 *   POST ?r=profile         rol ve profil bilgilerini güncelle
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
            $profil = array_merge(user_profile($u), clean_profile(is_array($in['profil'] ?? null) ? $in['profil'] : []));
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
            $uid = (int) require_user()['id'];
            $own = trim((string) umeta_get($uid, 'anthropic_api_key', '')) !== '';
            json_out(['serverKey' => server_ai_key($uid) !== '', 'accessCodeRequired' => false, 'backend' => 'php', 'keyFromFile' => !$own && server_ai_key($uid) !== '']);
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

        default:
            fail_json(404, 'Bulunamadı.', 'not_found');
    }
} catch (Throwable $e) {
    error_log('[isgora] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    fail_json(500, 'Sunucu hatası. Lütfen tekrar deneyin.', 'server_error');
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
    $key = server_ai_key((int) $u['id']);
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
        CURLOPT_WRITEFUNCTION => function ($c, $chunk) use (&$status, &$ctype, &$sent) {
            if (!$sent) {
                http_response_code($status ?: 200);
                header('Content-Type: ' . $ctype);
                $sent = true;
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
