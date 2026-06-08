/**
 * 阅读笔记（localStorage）
 * @author 代长亚
 */
export type AnnotationEntry = {
  id: string;
  sutraId: string;
  paragraphId: string;
  note: string;
  createdAt: number;
};

const KEY = "jingxin:annotations";

export function listAnnotations(sutraId?: string): AnnotationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as AnnotationEntry[]) : [];
    return sutraId ? all.filter((a) => a.sutraId === sutraId) : all;
  } catch {
    return [];
  }
}

export function saveAnnotation(entry: Omit<AnnotationEntry, "id" | "createdAt">): AnnotationEntry {
  const item: AnnotationEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const all = listAnnotations();
  all.push(item);
  localStorage.setItem(KEY, JSON.stringify(all));
  return item;
}

export function removeAnnotation(id: string): void {
  const all = listAnnotations().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
