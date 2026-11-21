/** Fish encounters are independent Bernoulli trials on eligible hops. */
export const FISH_PROBABILITY = 0.20;
export const FISH_DISPLAY_MS = 650;

/** An eligible hop rises more than 20 degrees above the horizontal. */
export function isFishEligible(dx, dy) {
  return dy < 0 && Math.atan2(-dy, Math.abs(dx)) > (20 * Math.PI) / 180;
}

export function isFishIntercepted(dx, dy, random = Math.random) {
  return isFishEligible(dx, dy) && random() < FISH_PROBABILITY;
}
