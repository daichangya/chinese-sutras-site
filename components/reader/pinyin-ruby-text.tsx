"use client";

import { useEffect, useRef, useState } from "react";
import { GaijiText } from "@/components/reader/gaiji-text";
import type { CharReading } from "@/lib/pinyin/types";

type Props = {
  text: string;
  canonicalId?: string;
  script?: "traditional" | "simplified";
};

export function PinyinRubyText({ text, canonicalId, script = "traditional" }: Props) {
  const [readings, setReadings] = useState<CharReading[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    setReadings(null);
    setError(null);
    fetchedRef.current = false;
  }, [text, canonicalId, script]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || fetchedRef.current) return;
        fetchedRef.current = true;

        fetch("/api/pinyin/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, canonicalId, script }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const j = (await res.json()) as { error?: string };
              throw new Error(j.error ?? res.statusText);
            }
            return res.json() as Promise<{ readings: CharReading[] }>;
          })
          .then((data) => setReadings(data.readings))
          .catch((e) => setError(e instanceof Error ? e.message : String(e)));
      },
      { rootMargin: "120px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [text, canonicalId, script]);

  if (error) {
    return <GaijiText text={text} />;
  }

  if (!readings) {
    return (
      <span ref={rootRef}>
        <GaijiText text={text} />
      </span>
    );
  }

  return (
    <span ref={rootRef} className="jx-ruby">
      {readings.map((r, i) =>
        r.pinyin ? (
          <ruby key={`${i}-${r.char}`}>
            {r.char}
            <rt>{r.pinyin}</rt>
          </ruby>
        ) : (
          <span key={`${i}-${r.char}`}>{r.char}</span>
        ),
      )}
    </span>
  );
}
