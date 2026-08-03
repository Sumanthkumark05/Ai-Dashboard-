import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats byte values into automatic human-readable units (B, KB, MB, GB, TB).
 * Examples: 140 -> "140 B", 23800 -> "23.2 KB", 5242880 -> "5.0 MB", 10737418240 -> "10.00 GB"
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes <= 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  if (gb < 1024) {
    return `${gb.toFixed(2)} GB`;
  }
  const tb = gb / 1024;
  return `${tb.toFixed(2)} TB`;
}

/**
 * Formats a storage usage percentage with adaptive precision.
 * Shows "<0.01%" for very small usage (0 < value < 0.01), otherwise rounds to 2 decimal places.
 *
 *   >= 1%         → "12.45%"  (or "75.8%")
 *   0.01 – <1%    → "0.15%"   (2 decimal places)
 *   < 0.01%       → "<0.01%"  (instead of "0.000%")
 *   0 / null      → "0%"
 *
 * @param value  The percentage value in the range 0–100 (e.g. 0.000002, 0.15, 12.45)
 */
export function formatStoragePercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return "0%";
  }
  if (value >= 1) {
    return `${value.toFixed(value < 10 ? 2 : 1)}%`;
  }
  if (value >= 0.01) {
    return `${value.toFixed(2)}%`;
  }
  // Real usage exists but is below 0.01%
  return "<0.01%";
}

