import { Directive, computed, input } from '@angular/core';
import type { ClassValue } from 'clsx';
import { hlm } from './cn';

/** spartan-ng helm card surface. Apply to any container: <section hlmCard>…</section> */
@Directive({
  selector: '[hlmCard]',
  host: { '[class]': '_computed()' },
})
export class HlmCard {
  readonly userClass = input<ClassValue>('', { alias: 'class' });

  protected readonly _computed = computed(() =>
    hlm('rounded-lg border border-border bg-card text-card-foreground shadow-sm', this.userClass()),
  );
}
