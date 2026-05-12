"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl cursor-pointer select-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-sm hover:shadow-md hover:from-brand-500 hover:to-brand-400 active:from-brand-700 active:to-brand-600",
    secondary:
      "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
    outline:
      "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
    ghost:
      "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  };
  return <button className={cn(base, sizes[size], variants[variant], className)} {...props} />;
}

/* ---------- Card ---------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        "dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-3", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50",
        className
      )}
      {...props}
    />
  );
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-600 dark:text-slate-400", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-3", className)} {...props} />;
}

/* ---------- Input / Textarea / Select ---------- */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
          "focus:border-brand-500 transition-colors",
          "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed",
          "focus:border-brand-500 transition-colors resize-y min-h-[100px]",
          "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
          className
        )}
        {...props}
      />
    );
  }
);

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900",
        "focus:border-brand-500 transition-colors cursor-pointer",
        "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5",
        className
      )}
      {...props}
    />
  );
}

/* ---------- Badge ---------- */
type BadgeTone = "brand" | "amber" | "emerald" | "rose" | "slate" | "violet";
export function Badge({
  tone = "slate",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    brand: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    amber: "bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

/* ---------- Checkbox ---------- */
export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
          checked
            ? "bg-brand-600 border-brand-600"
            : "border-slate-300 bg-white group-hover:border-brand-400 dark:border-slate-700 dark:bg-slate-950 dark:group-hover:border-brand-500"
        )}
      >
        {checked && (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-sm text-slate-700 dark:text-slate-300 select-none">{label}</span>
    </label>
  );
}

/* ---------- Section heading ---------- */
export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 animate-fade-in-up">
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
