"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveAnnotation } from "@/lib/annotations/storage";

export function ParagraphNoteButton({
  sutraId,
  paragraphId,
  excerpt,
}: {
  sutraId: string;
  paragraphId: string;
  excerpt: string;
}) {
  const [saved, setSaved] = useState(false);

  function addNote() {
    const note = window.prompt("添加阅读笔记（仅保存在本机）", excerpt.slice(0, 60));
    if (!note?.trim()) return;
    saveAnnotation({ sutraId, paragraphId, note: note.trim() });
    setSaved(true);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="ml-2 h-6 px-1 text-xs opacity-0 group-hover:opacity-100"
      onClick={addNote}
      disabled={saved}
      aria-label={saved ? "已添加笔记" : "为此段添加阅读笔记"}
    >
      {saved ? "已记" : "笔记"}
    </Button>
  );
}
