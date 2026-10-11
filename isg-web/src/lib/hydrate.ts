"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";

/** IndexedDB'deki veriler belleğe yüklenene kadar false döner (yükleme öncesi yazmaları engellemek için). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    else void useStore.persist.rehydrate();
    return unsub;
  }, []);
  return hydrated;
}
