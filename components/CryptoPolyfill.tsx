"use client";
import { useEffect } from "react";

export default function CryptoPolyfill() {
  useEffect(() => {
    try {
      const w = window as any;
      if (w && w.crypto && !w.crypto.randomUUID) {
        if (w.crypto.getRandomValues) {
          w.crypto.randomUUID = () => {
            const bytes = new Uint8Array(16);
            w.crypto.getRandomValues(bytes);
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
            const hex = Array.from(bytes)
              .map((b: number) => b.toString(16).padStart(2, "0"))
              .join("");
            return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
          };
        } else {
          w.crypto.randomUUID = () =>
            "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
        }
        console.log("[P7-DBG] polyfilled crypto.randomUUID");
      }
    } catch (e) {
      console.warn("[P7-DBG] crypto polyfill failed", e);
    }
  }, []);

  return null;
}
