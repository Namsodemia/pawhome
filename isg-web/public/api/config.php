<?php
/**
 * İsgora sunucu ayarları.
 *
 * kayit_acik        : true ise herkes giris.php?kayit=1 üzerinden hesap açabilir (rol seçerek).
 * kayit_kodu        : Doluysa yeni hesap açarken bu davet kodu sorulur (kapalı grup için).
 * setup_code        : Doluysa İLK hesap (yönetici) açılırken bu kod sorulur.
 * anthropic_api_key : (İsteğe bağlı) Tüm kullanıcılar için ortak Claude anahtarı. Boş bırakın;
 *                     her kullanıcı kendi anahtarını Ayarlar > Yapay Zekâ bölümünden girer.
 */
return [
    'kayit_acik' => true,
    'kayit_kodu' => '',
    'setup_code' => '',
    'anthropic_api_key' => '',
];
