"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Quiz from "@/components/Quiz";
import { Button, Loading, PageHeader } from "@/components/ui";
import { confirmDialog } from "@/components/feedback";
import { karisikSorular, useQuestionBank, type KarisikSoru } from "@/lib/sinav";

export default function DenemePage() {
  return (
    <Suspense fallback={<Loading />}>
      <Deneme />
    </Suspense>
  );
}

function Deneme() {
  const router = useRouter();
  const sp = useSearchParams();
  const n = Math.max(5, Math.min(200, Number(sp.get("n")) || 25));
  const { dersler, loading } = useQuestionBank();
  const [qs, setQs] = useState<KarisikSoru[] | null>(null);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    setQs(karisikSorular(dersler, n));
    setRun((r) => r + 1);
    setDone(false);
  }, [loading, dersler, n]);

  const adlar = useMemo(() => Object.fromEntries(dersler.map((d) => [d.sira, d.ad])), [dersler]);
  const exit = useCallback(() => router.push("/app/sinav"), [router]);
  const newSet = useCallback(() => {
    setQs(karisikSorular(dersler, n));
    setRun((r) => r + 1);
    setDone(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dersler, n]);

  async function askExit() {
    if (!done) {
      const ok = await confirmDialog({ title: "Denemeden çık", text: "Yarım kalan deneme kaydedilmez. Çıkmak istiyor musunuz?", okLabel: "Çık", cancelLabel: "Devam et" });
      if (!ok) return;
    }
    exit();
  }

  if (loading || !qs) return <Loading text="Sorular hazırlanıyor…" />;

  return (
    <div>
      <PageHeader
        title={`Deneme Sınavı · ${qs.length} soru`}
        subtitle="Tüm derslerden rastgele seçilmiş sorular · şıklar karıştırılır · geçme notu 70"
        actions={
          <Button kind="ghost" small icon={X} onClick={() => void askExit()}>
            {done ? "Derslere dön" : "Denemeden çık"}
          </Button>
        }
      />
      <Quiz
        key={run}
        questions={qs}
        dersSira={null}
        tur="karisik"
        dersAdlari={adlar}
        onExit={exit}
        exitLabel="Derslere dön"
        onNewSet={newSet}
        onFinishedChange={setDone}
      />
    </div>
  );
}
