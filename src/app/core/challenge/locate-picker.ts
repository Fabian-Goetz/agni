import { Equipment } from '../models/equipment';
import { Selector } from '../util/random';

/**
 * Picks the next item to locate, with an anti-repeat window so the same item
 * isn't asked twice in quick succession. The choice function is injected so
 * tests are deterministic (mirrors the sibling's CardPicker).
 */
export class LocatePicker {
  private recent: string[] = [];

  constructor(
    private readonly select: Selector<Equipment>,
    private readonly recentLimit = 5,
  ) {}

  pick(candidates: Equipment[]): Equipment | null {
    if (candidates.length === 0) return null;
    const fresh = candidates.filter((e) => !this.recent.includes(e.id));
    const options = fresh.length > 0 ? fresh : candidates;
    const chosen = this.select(options);
    this.recent = [...this.recent, chosen.id].slice(-this.recentLimit);
    return chosen;
  }
}
