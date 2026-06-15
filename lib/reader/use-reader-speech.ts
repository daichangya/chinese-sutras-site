/**
 * 阅读器朗读 React Hook
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReaderSpeechController } from "@/lib/reader/speech/reader-speech-controller";
import type { SpeechViewContext } from "@/lib/reader/speech/text-normalizer";
import {
  cycleSpeechRate,
  loadSpeechEngine,
  loadSpeechRate,
  saveSpeechEngine,
  saveSpeechRate,
} from "@/lib/reader/speech/prefs";
import type { SpeechEngine, SpeechRate, SpeechState } from "@/lib/reader/speech/types";
import { resetAmbientSpeech } from "@/lib/reader/speech/reset-ambient-speech";
import { primeSpeechSynthesis } from "@/lib/reader/speech/web-speech-adapter";
import { scrollToParagraphElement } from "@/lib/reader/paragraph-navigation";
import type { ParagraphRow } from "@/lib/sutra/queries";

export function useReaderSpeech({
  paragraphs,
  viewContext,
  activeParagraphId,
  onActiveParagraphChange,
  sutraTitle,
}: {
  paragraphs: ParagraphRow[];
  viewContext: SpeechViewContext;
  activeParagraphId?: string;
  onActiveParagraphChange: (id: string) => void;
  sutraTitle: string;
}) {
  const controllerRef = useRef<ReaderSpeechController | null>(null);
  const userInitiatedRef = useRef(false);
  const paragraphsRef = useRef(paragraphs);
  paragraphsRef.current = paragraphs;

  const [state, setState] = useState<SpeechState>("idle");
  const [engine, setEngineState] = useState<SpeechEngine>("browser");
  const [rate, setRateState] = useState<SpeechRate>(1);
  const [currentParagraphId, setCurrentParagraphId] = useState<string | undefined>();
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const [cloudAvailable, setCloudAvailable] = useState(true);

  useEffect(() => {
    resetAmbientSpeech();
    setEngineState(loadSpeechEngine());
    setRateState(loadSpeechRate());
    primeSpeechSynthesis();

    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      userInitiatedRef.current = false;
      controllerRef.current?.stop();
      resetAmbientSpeech();
    }

    window.addEventListener("pageshow", onPageShow);
    fetch("/api/reader/tts")
      .then((r) => r.json())
      .then((d: { available?: boolean }) => {
        const available = Boolean(d.available);
        setCloudAvailable(available);
        if (!available && loadSpeechEngine() === "cloud") {
          saveSpeechEngine("browser");
          setEngineState("browser");
          controllerRef.current?.setEngine("browser");
        }
      })
      .catch(() => setCloudAvailable(false));

    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    const controller = new ReaderSpeechController({
      onStateChange: setState,
      onParagraphChange: (id) => {
        setCurrentParagraphId(id);
        onActiveParagraphChange(id);
        const seq = paragraphsRef.current.find((p) => p.id === id)?.seq;
        if (seq != null) {
          scrollToParagraphElement(seq, { behavior: "smooth", block: "center" });
        }
      },
      onIndexChange: (index, total) => setProgress({ index, total }),
      onError: (message) => setFallbackNote(message),
      onEngineFallback: () => {
        setEngineState("browser");
        saveSpeechEngine("browser");
        setFallbackNote("高品质不可用，已切换为浏览器朗读");
      },
    });
    controllerRef.current = controller;
    controller.setEngine(loadSpeechEngine());
    controller.setRate(loadSpeechRate());

    return () => {
      controller.stop();
      controllerRef.current = null;
    };
  }, [onActiveParagraphChange]);

  const play = useCallback(() => {
    if (!userInitiatedRef.current) return;
    setFallbackNote(null);
    const c = controllerRef.current;
    if (!c) return;
    const eng = loadSpeechEngine();
    const r = loadSpeechRate();
    setEngineState(eng);
    setRateState(r);
    c.setEngine(eng);
    c.setRate(r);
    primeSpeechSynthesis();
    void c.play(paragraphsRef.current, activeParagraphId, viewContext, sutraTitle);
  }, [activeParagraphId, viewContext, sutraTitle]);

  const pause = useCallback(() => controllerRef.current?.pause(), []);
  const resume = useCallback(() => controllerRef.current?.resume(), []);
  const stop = useCallback(() => {
    userInitiatedRef.current = false;
    setFallbackNote(null);
    controllerRef.current?.stop();
    resetAmbientSpeech();
  }, []);
  const togglePause = useCallback(() => controllerRef.current?.togglePause(), []);
  const skipNext = useCallback(() => controllerRef.current?.skipNext(), []);
  const skipPrev = useCallback(() => controllerRef.current?.skipPrev(), []);

  const setEngine = useCallback((next: SpeechEngine) => {
    setEngineState(next);
    saveSpeechEngine(next);
    controllerRef.current?.setEngine(next);
  }, []);

  const cycleRate = useCallback(() => {
    const next = cycleSpeechRate(rate);
    setRateState(next);
    controllerRef.current?.setRate(next);
    return next;
  }, [rate]);

  const setRate = useCallback((next: SpeechRate) => {
    setRateState(next);
    saveSpeechRate(next);
    controllerRef.current?.setRate(next);
  }, []);

  const isActive = state !== "idle";

  const requestPlay = useCallback(() => {
    userInitiatedRef.current = true;
    play();
  }, [play]);

  const playFromParagraph = useCallback(
    (paragraphId: string) => {
      userInitiatedRef.current = true;
      onActiveParagraphChange(paragraphId);
      const c = controllerRef.current;
      if (!c) return;
      const eng = loadSpeechEngine();
      const r = loadSpeechRate();
      setEngineState(eng);
      setRateState(r);
      c.setEngine(eng);
      c.setRate(r);
      primeSpeechSynthesis();
      void c.play(paragraphsRef.current, paragraphId, viewContext, sutraTitle);
    },
    [onActiveParagraphChange, viewContext, sutraTitle],
  );

  return {
    state,
    engine,
    rate,
    currentParagraphId,
    progress,
    fallbackNote,
    cloudAvailable,
    isActive,
    play: requestPlay,
    playFromParagraph,
    pause,
    resume,
    stop,
    togglePause,
    skipNext,
    skipPrev,
    setEngine,
    cycleRate,
    setRate,
  };
}
