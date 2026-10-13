<?php
/**
 * İsgora giriş sayfası.
 *  - Hiç kullanıcı yoksa: ilk kurulum (yönetici hesabı oluşturma)
 *  - ?cikis=1           : oturumu kapat
 *  - ?sifirla=1         : data/ klasöründe "SIFRE-SIFIRLA" adlı bir dosya varsa yönetici şifresini yeniler
 */

define('ISGORA', 1);
require __DIR__ . '/api/_lib.php';

header('Cache-Control: no-store');
header('X-Frame-Options: DENY');

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

$setup = user_count() === 0;
$resetMode = !$setup && isset($_GET['sifirla']) && reset_file() !== null;
$setupCode = trim((string) (cfg()['setup_code'] ?? ''));
$error = '';
$info = '';

if (!$setup && !$resetMode && $_SERVER['REQUEST_METHOD'] === 'GET' && current_user()) {
    header('Location: ' . safe_next());
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = (string) ($_POST['_t'] ?? '');
    if (!hash_equals(csrf_token(), $token)) {
        $error = 'Form süresi doldu, lütfen tekrar deneyin.';
    } elseif (login_blocked()) {
        $error = 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.';
    } elseif ($setup || $resetMode) {
        $user = trim((string) ($_POST['kullanici'] ?? ''));
        $pass = (string) ($_POST['sifre'] ?? '');
        $pass2 = (string) ($_POST['sifre2'] ?? '');
        if ($setup && $setupCode !== '' && !hash_equals($setupCode, trim((string) ($_POST['kod'] ?? '')))) {
            login_failed();
            $error = 'Kurulum kodu hatalı.';
        } elseif ($setup && !preg_match('/^[\p{L}0-9._@-]{3,40}$/u', $user)) {
            $error = 'Kullanıcı adı 3-40 karakter olmalı (harf, rakam, . _ @ -).';
        } elseif ((function_exists("mb_strlen") ? mb_strlen($pass) : strlen($pass)) < 8) {
            $error = 'Şifre en az 8 karakter olmalı.';
        } elseif ($pass !== $pass2) {
            $error = 'Şifreler aynı değil.';
        } else {
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            if ($setup) {
                db()->prepare('INSERT INTO kullanicilar (kullanici_adi, sifre_hash, olusturma) VALUES (?, ?, ?)')
                    ->execute([$user, $hash, gmdate('c')]);
            } else {
                $first = db()->query('SELECT id FROM kullanicilar ORDER BY id LIMIT 1')->fetchColumn();
                db()->prepare('UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?')->execute([$hash, $first]);
                @unlink((string) reset_file());
            }
            $st = db()->query('SELECT id, kullanici_adi, sifre_hash FROM kullanicilar ORDER BY id LIMIT 1');
            $u = $st->fetch();
            login_ok();
            issue_session($u);
            header('Location: ' . safe_next());
            exit;
        }
    } else {
        $user = trim((string) ($_POST['kullanici'] ?? ''));
        $pass = (string) ($_POST['sifre'] ?? '');
        $st = db()->prepare('SELECT id, kullanici_adi, sifre_hash FROM kullanicilar WHERE kullanici_adi = ? COLLATE NOCASE');
        $st->execute([$user]);
        $u = $st->fetch();
        if ($u && password_verify($pass, $u['sifre_hash'])) {
            if (password_needs_rehash($u['sifre_hash'], PASSWORD_DEFAULT)) {
                $u['sifre_hash'] = password_hash($pass, PASSWORD_DEFAULT);
                db()->prepare('UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?')->execute([$u['sifre_hash'], $u['id']]);
            }
            login_ok();
            issue_session($u);
            header('Location: ' . safe_next());
            exit;
        }
        login_failed();
        $error = 'Kullanıcı adı veya şifre hatalı.';
    }
}

if (isset($_GET['sifirla']) && !$setup && !$resetMode) {
    $info = 'Şifre sıfırlamak için cPanel Dosya Yöneticisi\'nde data klasörüne "SIFRE-SIFIRLA" adlı boş bir dosya oluşturun ve bu sayfayı yenileyin.';
}

$title = $setup ? 'İlk kurulum' : ($resetMode ? 'Yeni şifre belirle' : 'Giriş yap');
$token = csrf_token();
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
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
    font-family:"Plus Jakarta Sans",-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#2A3A4C;
    background:radial-gradient(900px 420px at 85% -10%,#E4F1F8,transparent),radial-gradient(800px 400px at 0% 10%,#E6F5EC,transparent),#F4F7F9}
  .card{width:100%;max-width:410px;background:#fff;border:1px solid #E6EBF0;border-radius:28px;padding:32px;
    box-shadow:0 24px 60px -12px rgba(20,34,54,.18)}
  .logo{display:block;height:44px;margin:0 auto 6px}
  .tag{text-align:center;color:#6E7C8C;font-size:12.5px;margin-bottom:22px}
  h1{font-size:22px;margin:0 0 4px;color:#1E3145;font-weight:800}
  p.sub{margin:0 0 18px;color:#6E7C8C;font-size:13.5px;line-height:1.5}
  label{display:block;font-size:12.5px;font-weight:700;color:#1E3145;margin:14px 0 6px}
  input{width:100%;border:1px solid #E6EBF0;border-radius:16px;padding:13px 15px;font-size:15px;color:#1E3145;outline:none;background:#fff;font-family:inherit}
  input:focus{border-color:#107398;box-shadow:0 0 0 4px rgba(16,115,152,.1)}
  button{width:100%;margin-top:22px;border:0;border-radius:16px;padding:14px;font-size:15px;font-weight:800;color:#fff;cursor:pointer;
    background:linear-gradient(135deg,#5CBD7D 0%,#107398 100%);box-shadow:0 10px 24px -6px rgba(16,115,152,.45);font-family:inherit}
  .err{background:#FDE7EB;color:#D6334C;border-radius:14px;padding:11px 14px;font-size:13.5px;font-weight:700;margin-bottom:6px}
  .info{background:#E4F1F8;color:#107398;border-radius:14px;padding:11px 14px;font-size:13px;font-weight:600;margin-bottom:6px;line-height:1.5}
  .foot{margin-top:18px;text-align:center;font-size:12.5px;color:#9AA6B2}
  .foot a{color:#107398;font-weight:700;text-decoration:none}
</style>
</head>
<body>
  <form class="card" method="post" autocomplete="on">
    <img class="logo" src="/logo-horizontal.png" alt="İsgora">
    <div class="tag">İş Sağlığı ve Güvenliği App</div>
    <h1><?= h($title) ?></h1>
    <?php if ($setup): ?>
      <p class="sub">Yönetici hesabınızı oluşturun. Tüm kayıtlar bu sunucudaki SQLite veritabanında, bu hesapla korunur.</p>
    <?php elseif ($resetMode): ?>
      <p class="sub">Yönetici hesabı için yeni bir şifre belirleyin.</p>
    <?php else: ?>
      <p class="sub">Devam etmek için giriş yapın.</p>
    <?php endif; ?>

    <?php if ($error): ?><div class="err"><?= h($error) ?></div><?php endif; ?>
    <?php if ($info): ?><div class="info"><?= h($info) ?></div><?php endif; ?>

    <input type="hidden" name="_t" value="<?= h($token) ?>">
    <input type="hidden" name="next" value="<?= h(safe_next()) ?>">

    <?php if ($setup && $setupCode !== ''): ?>
      <label for="kod">Kurulum kodu</label>
      <input id="kod" name="kod" required autocomplete="off" inputmode="text">
    <?php endif; ?>

    <?php if (!$resetMode): ?>
      <label for="kullanici">Kullanıcı adı</label>
      <input id="kullanici" name="kullanici" required autocomplete="username" value="<?= h($_POST['kullanici'] ?? '') ?>" autofocus>
    <?php endif; ?>

    <label for="sifre"><?= $setup || $resetMode ? 'Şifre (en az 8 karakter)' : 'Şifre' ?></label>
    <input id="sifre" name="sifre" type="password" required autocomplete="<?= $setup || $resetMode ? 'new-password' : 'current-password' ?>">

    <?php if ($setup || $resetMode): ?>
      <label for="sifre2">Şifre (tekrar)</label>
      <input id="sifre2" name="sifre2" type="password" required autocomplete="new-password">
    <?php endif; ?>

    <button type="submit"><?= $setup ? 'Hesabı oluştur ve başla' : ($resetMode ? 'Şifreyi kaydet' : 'Giriş yap') ?></button>

    <div class="foot">
      <?php if (!$setup && !$resetMode): ?><a href="/giris.php?sifirla=1">Şifremi unuttum</a> · <?php endif; ?>
      <a href="/">Tanıtım sayfası</a>
    </div>
  </form>
</body>
</html>
