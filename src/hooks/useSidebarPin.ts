import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar:pinned";
const EVENT = "sidebar:pinned-changed";

export function useSidebarPin() {
  const [pinned, setPinned] = useState<boolean>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "true";
  });

  useEffect(() => {
    const handler = (e: Event) => {
      // @ts-expect-error custom event detail
      const next = (e.detail as boolean) ?? pinned;
      setPinned(next);
    };
    window.addEventListener(EVENT, handler as EventListener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setPinned(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, handler as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(pinned));
  }, [pinned]);

  const togglePinned = useCallback(() => {
    const next = !pinned;
    setPinned(next);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }, [pinned]);

  return { pinned, setPinned, togglePinned };
}
