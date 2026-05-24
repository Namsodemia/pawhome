"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

export function PushSubscribe() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);

    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  async function subscribe() {
    setBusy(true);
    setMessage(null);
    try {
      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!pub) throw new Error("VAPID public key tanımlı değil.");

      // Register SW
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMessage("Bildirim izni reddedildi.");
        return;
      }

      // Subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pub),
      });

      // Send to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Sunucuya kayıt başarısız.");

      setSubscribed(true);
      setMessage("Bildirimler aktif ✓");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setSubscribed(false);
      setMessage("Bildirimler kapatıldı.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    setMessage(
      data.sent
        ? `Test bildirimi gönderildi (${data.sent} cihaz).`
        : "Bildirim gönderilemedi — önce aboneliği aç."
    );
  }

  if (!supported) {
    return (
      <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs p-3 rounded-xl mt-4">
        Tarayıcın Web Push desteklemiyor. (iOS Safari için PWA olarak yükle.)
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 mt-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg shrink-0">
          <i className="fa-solid fa-bell"></i>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm">Push Bildirimleri</h4>
          <p className="text-[10px] text-slate-400 mb-3">
            Bilgisayar veya telefonunda anında bildirim al.
          </p>

          {!subscribed ? (
            <button
              onClick={subscribe}
              disabled={busy}
              className="bg-pw-primary text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-60"
            >
              {busy ? "Kuruluyor..." : "Bildirimleri Aç"}
            </button>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1.5 rounded font-semibold">
                <i className="fa-solid fa-check mr-1"></i>Aktif
              </span>
              <button
                onClick={sendTest}
                disabled={busy}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                Test Bildirimi
              </button>
              <button
                onClick={unsubscribe}
                disabled={busy}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
              >
                Kapat
              </button>
            </div>
          )}

          {message && <p className="text-[11px] text-slate-500 mt-2">{message}</p>}
        </div>
      </div>
    </div>
  );
}
