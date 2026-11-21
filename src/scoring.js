const STORAGE_KEY = 'frogHopperScores';
const MAX_HIGH_SCORES = 10;

/** Whole five-second intervals remaining before the 90-second threshold. */
export function timeBonus(seconds) {
  return Math.max(0, Math.floor((90 - seconds) / 5));
}

export function readScores() {
  try {
    const scores = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(scores) ? scores : [];
  } catch {
    return [];
  }
}

/** Keep only the ten highest-scoring completed games in this tab session. */
export function saveScore(score, completed) {
  const scores = [...readScores(), {score, completed}]
    .sort((a, b) => b.score - a.score || b.completed - a.completed)
    .slice(0, MAX_HIGH_SCORES);

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Private browsing modes may disallow session storage.
  }
  return scores;
}
