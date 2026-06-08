/**
 * 统一输入框
 * @author 代长亚
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("jx-input jx-ui-shell", className)} {...props} />
));
Input.displayName = "Input";
