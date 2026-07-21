import { Directive, computed, input } from '@angular/core';
import type { ClassValue } from 'clsx';
import { hlm } from './cn';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

const VARIANT = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow hover:bg-destructive/90',
  outline: 'border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

const SIZE = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-6 text-lg',
  icon: 'h-10 w-10',
} as const;

/**
 * spartan-ng helm button. Apply to a native button/anchor:
 *   <button hlmBtn variant="outline" size="lg">…</button>
 */
@Directive({
  selector: '[hlmBtn]',
  host: { '[class]': '_computed()' },
})
export class HlmButton {
  readonly variant = input<keyof typeof VARIANT>('default');
  readonly size = input<keyof typeof SIZE>('default');
  readonly userClass = input<ClassValue>('', { alias: 'class' });

  protected readonly _computed = computed(() =>
    hlm(BASE, VARIANT[this.variant()], SIZE[this.size()], this.userClass()),
  );
}
