import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize user input for use in .ilike() queries.
 * Escapes SQL wildcard characters and limits length.
 */
export function sanitizeSearchInput(input: string, maxLength = 100): string {
  return input
    .slice(0, maxLength)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}
