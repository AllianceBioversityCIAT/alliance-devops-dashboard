import type { UpdownCheck } from '../models/updown-check.js';

export interface UpdownCheckStore {
  getByToken(checkToken: string): Promise<UpdownCheck | null>;
  save(check: UpdownCheck): Promise<UpdownCheck>;
}
