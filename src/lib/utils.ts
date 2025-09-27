import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRange(min: number, max: number, unit: string): string {
  return `${min.toLocaleString()} - ${max.toLocaleString()} ${unit}`;
}
