import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../academy-puzzles.js', import.meta.url), 'utf8');
const sandbox = { window: {} }; vm.createContext(sandbox); vm.runInContext(source, sandbox);
const puzzles = sandbox.window.CHESS_ULTIMATE_PUZZLES;
const at = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];
const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const color = p => p === p.toUpperCase() ? 'w' : 'b';
function boardFor(fen) { return fen.split(' ')[0].split('/').map(row => { const out=[]; for (const x of row) /\d/.test(x) ? out.push(...Array(Number(x)).fill(null)) : out.push(x); return out; }); }
function attacks(board, r, c, tr, tc) {
  const p=board[r][c]; if (!p) return false; const t=p.toLowerCase(), dr=tr-r, dc=tc-c, adr=Math.abs(dr), adc=Math.abs(dc);
  if (t==='n') return (adr===1&&adc===2)||(adr===2&&adc===1);
  if (t==='k') return Math.max(adr,adc)===1;
  if (t==='p') return adr===1&&adc===1&&dr===(color(p)==='w'?-1:1);
  const straight=(dr===0||dc===0), diagonal=adr===adc;
  if (!((t==='r'&&straight)||(t==='b'&&diagonal)||(t==='q'&&(straight||diagonal)))) return false;
  const sr=Math.sign(dr),sc=Math.sign(dc); for(let rr=r+sr,cc=c+sc;rr!==tr||cc!==tc;rr+=sr,cc+=sc) if(board[rr][cc]) return false; return true;
}
function inCheck(board, side) { for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]&&color(board[r][c])!==side){const king=side==='w'?'K':'k';for(let kr=0;kr<8;kr++)for(let kc=0;kc<8;kc++)if(board[kr][kc]===king&&attacks(board,r,c,kr,kc))return true;} return false; }
function legalMove(board, from, to, side) { const p=board[from[0]][from[1]]; if(!p||color(p)!==side||!inside(...to)||board[to[0]][to[1]]&&color(board[to[0]][to[1]])===side||!attacks(board,...from,...to))return false; const copy=board.map(row=>[...row]);copy[to[0]][to[1]]=p;copy[from[0]][from[1]]=null;return !inCheck(copy,side); }
function apply(board, from, to) { const next=board.map(row=>[...row]);next[to[0]][to[1]]=next[from[0]][from[1]];next[from[0]][from[1]]=null;return next; }
function hasKingEscape(board, side) { const king=side==='w'?'K':'k'; for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===king)for(let tr=0;tr<8;tr++)for(let tc=0;tc<8;tc++)if(legalMove(board,[r,c],[tr,tc],side))return true; return false; }

let failed=0;
for (const task of puzzles) {
  const [layout, turn] = task.fen.split(' '); const board=boardFor(task.fen), move=task.solution[0], from=at(move.slice(0,2)),to=at(move.slice(2,4)), side=turn;
  const ok=legalMove(board,from,to,side); if(!ok){console.error(`FAIL ${task.id}: solution ${move} is not legal`);failed++;continue;}
  const after=apply(board,from,to), opponent=side==='w'?'b':'w';
  if(task.claim==='mate'&&(!inCheck(after,opponent)||hasKingEscape(after,opponent))){console.error(`FAIL ${task.id}: claimed mate is not checkmate`);failed++;}
  if(task.claim==='fork'){const [kr,kc]=(()=>{for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(after[r][c]===(opponent==='w'?'K':'k'))return[r,c]})(),queen=(()=>{for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(after[r][c]===(opponent==='w'?'Q':'q'))return[r,c]})();if(!inCheck(after,opponent)||!queen||!attacks(after,to[0],to[1],queen[0],queen[1])){console.error(`FAIL ${task.id}: claimed fork does not check king and attack queen`);failed++;}}
  if(layout.split('/').length!==8) { console.error(`FAIL ${task.id}: malformed FEN`); failed++; }
}
if(failed)process.exit(1); console.log(`PASS: ${puzzles.length} Academy puzzles have legal solutions and truthful tactical claims.`);
