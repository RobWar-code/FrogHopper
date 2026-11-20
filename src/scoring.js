const KEY='frogHopperScores';
export function timeBonus(seconds){return Math.max(0,Math.floor((90-seconds)/5));}
export function readScores(){try{const v=JSON.parse(sessionStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
export function saveScore(score,completed){const all=[...readScores(),{score,completed}].sort((a,b)=>b.score-a.score||b.completed-a.completed).slice(0,10);try{sessionStorage.setItem(KEY,JSON.stringify(all))}catch{}return all;}
