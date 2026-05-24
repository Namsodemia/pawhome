"use client";

import { useState } from "react";

export function NotificationsForm({
  initialEmail,
  initialApp,
}: {
  initialEmail: boolean;
  initialApp: boolean;
}) {
  const [notifyEmail, setNotifyEmail] = useState(initialEmail);
  const [notifyApp, setNotifyApp] = useState(initialApp);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ notifyEmail, notifyApp }),
      headers: { "Content-Type": "application/json" },
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Tercihler kaydedildi.");
    } else {
      setMsg("Bir hata oluştu.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-6">
      {msg && <div className="text-green-600 text-sm">{msg}</div>}

      <Toggle
        label="E-posta Bildirimleri"
        subtitle="Kampanyalar ve özetler"
        checked={notifyEmail}
        onChange={setNotifyEmail}
      />
      <Toggle
        label="Uygulama İçi"
        subtitle="Hatırlatıcılar ve uyarılar"
        checked={notifyApp}
        onChange={setNotifyApp}
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-60"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function Toggle({
  label,
  subtitle,
  checked,
  onChange,
}: {
  label: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-bold text-sm">{label}</h4>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full border border-gray-300 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
