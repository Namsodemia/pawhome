"use client";

import { Presentation } from "lucide-react";
import { ButtonLink, Empty, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { EgitimKayit } from "@/lib/types";
import type { Ders, Kurs, Soru } from "@/data/egitim";

export const dersHref = (kursId: string, dersId: string) => `/app/egitim/ders/?k=${encodeURIComponent(kursId)}&d=${encodeURIComponent(dersId)}`;
export const sinavHref = (kursId: string) => `/app/egitim/sinav/?k=${encodeURIComponent(kursId)}`;
export const sertifikaHref = (kursId: string) => `/app/egitim/sertifika/?k=${encodeURIComponent(kursId)}`;

/** Kursa ait ilerleme kaydı (yoksa undefined). */
export function useKayit(kursId: string | undefined): EgitimKayit | undefined {
  return useStore((s) => (kursId ? s.egitimler.find((e) => e.kurs_id === kursId) : undefined));
}

export interface Ilerleme {
  tamam: number;
  toplam: number;
  pct: number;
  /** Henüz tamamlanmamış ilk ders */
  siradaki: Ders | undefined;
  bitti: (dersId: string) => boolean;
}

export function ilerleme(kurs: Kurs, kayit: EgitimKayit | undefined): Ilerleme {
  const set = new Set(kayit?.tamamlanan ?? []);
  const bitti = (id: string) => set.has(id);
  const tamam = kurs.dersler.filter((d) => bitti(d.id)).length;
  const toplam = kurs.dersler.length;
  return { tamam, toplam, pct: toplam ? Math.round((tamam * 100) / toplam) : 0, siradaki: kurs.dersler.find((d) => !bitti(d.id)), bitti };
}

export function dakikaMetni(dk: number): string {
  if (dk < 60) return `${dk} dk`;
  const s = Math.floor(dk / 60);
  const m = dk % 60;
  return m ? `${s} sa ${m} dk` : `${s} saat`;
}

// ---------------------------------------------------------------- karıştırma

export function karistir<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Şıkları karıştırır, doğru cevabın yeni sırasını korur. */
export function sikKaristir(q: Soru): Soru {
  const sira = karistir(q.secenekler.map((_, i) => i));
  return { ...q, secenekler: sira.map((i) => q.secenekler[i]), dogru: sira.indexOf(q.dogru) };
}

// ---------------------------------------------------------------- boş durumlar

export function KursYok() {
  return (
    <div>
      <PageHeader title="Eğitim bulunamadı" back="/app/egitim" />
      <Empty
        icon={Presentation}
        title="Eğitim bulunamadı"
        text="Bağlantı hatalı ya da eğitim artık yayında değil."
        action={
          <ButtonLink href="/app/egitim" small>
            Eğitimlere dön
          </ButtonLink>
        }
      />
    </div>
  );
}
