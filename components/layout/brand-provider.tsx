"use client";

/**
 * 客户端品牌上下文（由 layout 注入站点名称）
 * @author 代长亚
 */
import { createContext, useContext } from "react";
import type { CalendarDay } from "@/lib/calendar/types";

export type BrandContextValue = {
  brandName: string;
  brandTagline: string;
  calendarDay?: CalendarDay;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({
  brandName,
  brandTagline,
  calendarDay,
  children,
}: BrandContextValue & { children: React.ReactNode }) {
  return (
    <BrandContext.Provider value={{ brandName, brandTagline, calendarDay }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const value = useContext(BrandContext);
  if (!value) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return value;
}
