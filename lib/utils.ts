import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Use this instead of .toUpperCase() / .toLowerCase() on character or guild names.
 * WoW uses ß Å Ð æ etc as decorative glyphs — case-transforming them mangles display
 * (ß → SS in uppercase, Å → a in lowercase, etc).
 */
export function displayCharName(name: string): string {
  return name
}
