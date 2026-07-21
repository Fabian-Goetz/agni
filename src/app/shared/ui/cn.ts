import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** spartan-style class combiner: clsx + tailwind-merge (resolves conflicts). */
export function hlm(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
