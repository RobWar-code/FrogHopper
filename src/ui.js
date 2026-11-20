const overlay=document.getElementById('overlay');const title=document.getElementById('overlayTitle');const body=document.getElementById('overlayBody');const button=document.getElementById('overlayButton');
export function status(score,attempt,message){document.getElementById('score').textContent=`Score: ${score}`;document.getElementById('attempts').textContent=`Frog: ${Math.min(attempt,12)} / 12`;document.getElementById('message').textContent=message;}
export function showOverlay(heading,html,buttonText,callback){title.textContent=heading;body.innerHTML=html;button.textContent=buttonText;button.onclick=()=>{hideOverlay();callback?.()};overlay.hidden=false;}
export function hideOverlay(){overlay.hidden=true;}
export function isOverlayOpen(){return !overlay.hidden;}
export function scoresTable(scores){if(!scores.length)return '<p>No completed games this session.</p>';return '<table><thead><tr><th>#</th><th>Points</th><th>Runs</th></tr></thead><tbody>'+scores.map((s,i)=>`<tr><td>${i+1}</td><td>${Number(s.score)||0}</td><td>${Number(s.completed)||0}</td></tr>`).join('')+'</tbody></table>';}
