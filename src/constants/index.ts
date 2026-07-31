// Global application version & shared constants
export const APP_VERSION = "v2.4.0" as const;
export const APP_BUILD = "2026.07.29-production" as const;
export const APP_NAME = "NeuroDesk AI" as const;
export const APP_DESCRIPTION = "Enterprise Autonomous AI Intelligence Dashboard & Workspace" as const;

// Animation timing tokens (shared Framer Motion presets)
export const ANIMATION = {
  duration: {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
  },
  ease: {
    out: "easeOut" as const,
    in: "easeIn" as const,
    inOut: "easeInOut" as const,
  },
  spring: {
    snappy: { type: "spring" as const, stiffness: 300, damping: 30 },
    smooth: { type: "spring" as const, stiffness: 200, damping: 25 },
    gentle: { type: "spring" as const, stiffness: 150, damping: 20 },
  },
} as const;

// Page fade-in animation preset (used across all dashboard pages)
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: ANIMATION.duration.base, ease: ANIMATION.ease.out },
} as const;

// Section entrance animation preset (used inside pages)
export const SECTION_TRANSITION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: ANIMATION.duration.fast, ease: ANIMATION.ease.out },
} as const;

// Shared avatar fallback initials utility
export function getInitials(name?: string | null, fallback = "ND"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Greeting based on current time of day
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Format bytes to readable string
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// Format number with comma separators
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

// Truncate a long string with ellipsis
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

// Debounce utility for search inputs
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
