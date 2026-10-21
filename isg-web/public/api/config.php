<?php
/**
 * İsgora sunucu ayarları.
 *
 * kayit_acik         : true ise herkes giris.php?kayit=1 üzerinden hesap açabilir (rol seçerek).
 * kayit_kodu         : Doluysa yeni hesap açarken bu davet kodu sorulur (kapalı grup için).
 * setup_code         : Doluysa İLK hesap (yönetici) açılırken bu kod sorulur.
 * otp_zorunlu        : true ise yeni hesaplar e-postaya gelen 6 haneli kodla doğrulanır (ilk yönetici hesabı hariç).
 *
 * anthropic_api_key  : (İsteğe bağlı) Ortak Claude anahtarı. Yönetici bunu Ayarlar > Yapay Zekâ bölümünden de girebilir.
 *                      Kendi anahtarı olmayan her kullanıcı bu anahtarla "ucretsiz_ai_sorgu" kadar sorgu yapar.
 * ucretsiz_ai_sorgu  : Kullanıcı başına ücretsiz yapay zekâ sorgusu (varsayılan 4). Yönetici sınırsızdır.
 *
 * E-posta (doğrulama kodları): varsayılan olarak sunucunun PHP mail() işlevi kullanılır (cPanel'de hazırdır).
 * mail_from          : Gönderen adresi (boşsa no-reply@alanadiniz). cPanel'de bu adla bir e-posta hesabı açmanız önerilir.
 * smtp_host …        : Doluysa mail() yerine SMTP kullanılır (ör. mail.alanadiniz.com, 465, ssl).
 */
return [
    'kayit_acik' => true,
    'kayit_kodu' => '',
    'setup_code' => '',
    'otp_zorunlu' => true,

    'anthropic_api_key' => '',
    'ucretsiz_ai_sorgu' => 4,
    // Anahtar bir çalışma alanına (workspace) bağlı değilse Anthropic Console > Settings > Workspaces'taki kimlik (wrkspc_…)
    'anthropic_workspace_id' => '',

    'mail_from' => '',
    'mail_from_name' => 'İsgora',
    'smtp_host' => '',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => '',
    'smtp_pass' => '',
];
