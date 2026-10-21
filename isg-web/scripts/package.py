#!/usr/bin/env python3
"""out/ klasöründen cPanel'e yüklenecek zip'i üretir.

Dosyalar 644, klasörler 755 izniyle paketlenir (aksi hâlde sunucu dosyaları okuyamaz ve 403 verir).
Kullanım: python3 scripts/package.py [hedef.zip] [kurulum-kodu]
Ortak Claude anahtarı pakete gömülecekse (depoya asla yazılmaz): ISGORA_AI_KEY ve gerekirse ISGORA_AI_WORKSPACE ortam değişkenleri.
"""
import os
import pathlib
import re
import sys
import time
import zipfile

out = pathlib.Path(__file__).resolve().parent.parent / "out"
target = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "isgora-site.zip")
setup_code = sys.argv[2] if len(sys.argv) > 2 else ""
ai_key = os.environ.get("ISGORA_AI_KEY", "").strip()
ai_ws = os.environ.get("ISGORA_AI_WORKSPACE", "").strip()
for v in (ai_key, ai_ws):
    if v and not re.fullmatch(r"[A-Za-z0-9_\-]+", v):
        sys.exit("Anahtar / çalışma alanı kimliği geçersiz karakter içeriyor.")
if ai_key and not ai_key.startswith("sk-ant-"):
    sys.exit("ISGORA_AI_KEY 'sk-ant-' ile başlamalı.")
now = time.localtime()[:6]


def entry(name: str, mode: int, is_dir: bool) -> zipfile.ZipInfo:
    zi = zipfile.ZipInfo(name, date_time=now)
    zi.create_system = 3  # Unix: izin bitleri açılırken uygulanır
    zi.external_attr = (((0o040000 if is_dir else 0o100000) | mode) << 16) | (0x10 if is_dir else 0)
    zi.compress_type = zipfile.ZIP_DEFLATED
    return zi


if not (out / "index.html").is_file():
    sys.exit("Önce derleyin: npm run build")

with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    paths = sorted(out.rglob("*"))
    for d in (p for p in paths if p.is_dir()):
        zf.writestr(entry(d.relative_to(out).as_posix() + "/", 0o755, True), b"")
    for f in (p for p in paths if p.is_file()):
        rel = f.relative_to(out).as_posix()
        # Çalışma zamanı verisi (veritabanı, config.local.php) asla pakete girmez
        if rel.startswith("data/") and f.name not in (".htaccess", "index.html"):
            continue
        data = f.read_bytes()
        if rel == "api/config.php":
            for key, val in (("setup_code", setup_code), ("anthropic_api_key", ai_key), ("anthropic_workspace_id", ai_ws)):
                if val:
                    data = data.replace(f"'{key}' => '',".encode(), f"'{key}' => '{val}',".encode())
        zf.writestr(entry(rel, 0o644, False), data)

print(f"{target} hazır ({target.stat().st_size / 1024 / 1024:.2f} MB)")
