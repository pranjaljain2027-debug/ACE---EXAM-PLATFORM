import type { Domain } from './types';

/** Child-friendly domain names. Kept separate so UI code never pulls answer keys into the main bundle. */
export const DOMAIN_TITLES: Record<Domain, string> = {
  rotation: 'Turning',
  reflection: 'Mirrors',
  progression: 'Patterns that grow',
  attributes: 'Colour and more',
};
