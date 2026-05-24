import type { Session } from "next-auth";

export function sessionUserId(session: Session): number {
  return Number(session.user!.id);
}

export function formatDateTR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return `Bugün, ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  if (isTomorrow) {
    return `Yarın, ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
}

export function reminderStyle(type: string) {
  switch (type) {
    case "walk":
      return { icon: "fa-person-walking-dog", bg: "bg-blue-50", text: "text-pw-primary" };
    case "vaccine":
      return { icon: "fa-syringe", bg: "bg-orange-50", text: "text-pw-accent" };
    case "food":
      return { icon: "fa-bone", bg: "bg-green-50", text: "text-pw-secondary" };
    case "vet":
      return { icon: "fa-user-doctor", bg: "bg-purple-50", text: "text-purple-500" };
    default:
      return { icon: "fa-clock", bg: "bg-slate-50", text: "text-slate-500" };
  }
}

export function autoReminderDescription(type: string): string {
  switch (type) {
    case "vaccine":
      return "Veteriner kliniğinde aşı randevusu";
    case "food":
      return "Mama saatini unutma";
    case "walk":
      return "Birlikte yürüyüşe çıkın";
    case "vet":
      return "Rutin veteriner kontrolü";
    default:
      return "";
  }
}

export function categoryStyle(category: string) {
  switch (category) {
    case "beslenme":
      return { label: "Beslenme", color: "bg-green-100 text-green-700 border-green-200" };
    case "saglik":
      return { label: "Sağlık", color: "bg-red-100 text-red-700 border-red-200" };
    case "egitim":
      return { label: "Eğitim", color: "bg-blue-100 text-blue-700 border-blue-200" };
    case "hikaye":
    default:
      return { label: "Hikaye", color: "bg-purple-100 text-purple-700 border-purple-200" };
  }
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
