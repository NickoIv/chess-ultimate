/* Chess Ultimate Pro — final engine, network, sound and motion layer. */
state.settings.volume=Number.isFinite(state.settings.volume)?state.settings.volume:.65;
state.online=null;
state.onlineConnected=false;
state.applyingRemote=false;

const AI_LEVELS={
  1:{skill:0,time:90,name:'Новичок'},
  2:{skill:5,time:340,name:'Любитель'},
  3:{skill:15,time:1200,name:'Сильный игрок'},
  4:{skill:20,time:2600,name:'Мастер'}
};

const StockfishPro={
  worker:null,ready:false,failed:false,initPromise:null,pending:null,
  setStatus(text,kind='loading'){
    const label=document.getElementById('engine-status'),dot=document.querySelector('.engine-dot');
    if(label)label.textContent=text;
    if(dot){dot.classList.toggle('ready',kind==='ready');dot.classList.toggle('fallback',kind==='fallback')}
  },
  init(){
    if(this.initPromise)return this.initPromise;
    this.initPromise=new Promise((resolve,reject)=>{
      let timeout=setTimeout(()=>{this.failed=true;this.setStatus('Резервный ИИ активен','fallback');reject(new Error('Stockfish timeout'))},10000);
      try{
        this.worker=new Worker('./vendor/stockfish/stockfish-19-lite-single.js');
        this.worker.onmessage=event=>{
          const line=String(event.data||'');
          if(line==='uciok'){this.worker.postMessage('setoption name Hash value 16');this.worker.postMessage('isready')}
          if(line==='readyok'&&!this.ready){clearTimeout(timeout);this.ready=true;this.failed=false;this.setStatus('Stockfish 19 готов','ready');resolve(true)}
          if(line.startsWith('info ')&&this.pending?.analysis){
            const match=line.match(/\bscore\s+(cp|mate)\s+(-?\d+).*?\bpv\s+([^\s]+)/);
            if(match)this.pending.info={type:match[1],value:Number(match[2]),pv:match[3]};
          }
          if(line.startsWith('bestmove ')&&this.pending){const move=line.split(/\s+/)[1],pending=this.pending;this.pending=null;clearTimeout(pending.timeout);pending.resolve(pending.analysis?{move,score:pending.info||{type:'cp',value:0,pv:''}}:move)}
        };
        this.worker.onerror=error=>{clearTimeout(timeout);this.failed=true;this.setStatus('Резервный ИИ активен','fallback');reject(error)};
        this.worker.postMessage('uci');
      }catch(error){clearTimeout(timeout);this.failed=true;this.setStatus('Резервный ИИ активен','fallback');reject(error)}
    });
    return this.initPromise;
  },
  async bestMove(fen,level){
    await this.init();const profile=AI_LEVELS[level]||AI_LEVELS[2];
    if(this.pending){this.worker.postMessage('stop');this.pending.reject(new Error('Search replaced'));this.pending=null}
    this.worker.postMessage('setoption name Skill Level value '+profile.skill);
    this.worker.postMessage('position fen '+fen);
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{this.worker.postMessage('stop');this.pending=null;reject(new Error('Search timeout'))},Math.max(5000,profile.time+3000));
      this.pending={resolve,reject,timeout};this.worker.postMessage('go movetime '+profile.time);
    });
  },
  async analyse(fen,time=520){
    await this.init();
    if(this.pending){this.worker.postMessage('stop');throw new Error('Движок занят другим поиском')}
    this.worker.postMessage('setoption name Skill Level value 20');
    this.worker.postMessage('position fen '+fen);
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{this.worker.postMessage('stop');this.pending=null;reject(new Error('Превышено время анализа'))},Math.max(5000,time+3500));
      this.pending={resolve,reject,timeout,analysis:true,info:null};this.worker.postMessage('go movetime '+time);
    });
  }
};

function uciToMove(uci){
  if(!uci||uci==='(none)'||uci.length<4)return null;
  const file=s=>s.charCodeAt(0)-97,rank=s=>8-Number(s);
  return{from:[rank(uci[1]),file(uci[0])],to:[rank(uci[3]),file(uci[2])],promotion:uci[4]||undefined};
}

/* Skill 0 still sees too much tactical detail. A novice therefore chooses a legal,
   usually sensible move from a broad pool, while upper levels remain engine-led. */
function friendlyAIMove(){
  const moves=getAllValidMoves(state.turn);if(!moves.length)return null;
  const scored=moves.map(move=>{const simulated=simulateMove(state.board,state.kingPositions,state.castling,state.enPassant,move.from,move.to,state.turn);const victim=state.board[move.to[0]][move.to[1]];let score=evaluateBoard(simulated.board,state.turn)+(victim?PIECE_VALUES[typeOf(victim)]*.12:0);return{move,score}}).sort((a,b)=>b.score-a.score);
  /* Keep the move legal and avoid routine self-destruction, but allow human inaccuracies. */
  const pool=scored.slice(0,Math.max(4,Math.ceil(scored.length*.55)));return pool[Math.floor(Math.random()*pool.length)].move;
}

makeAIMove=async function(){
  if(state.gameOver||state.gameMode!=='ai'||state.turn===state.playerColor)return;
  const thinking=document.getElementById('ai-thinking');thinking.classList.add('active');
  const expectedTurn=state.turn;
  try{
    if(state.difficulty===1&&Math.random()<.72){const friendly=friendlyAIMove();if(friendly){executeMove(friendly.from[0],friendly.from[1],friendly.to[0],friendly.to[1],friendly.promotion);return}}
    const uci=await StockfishPro.bestMove(boardToFEN(),state.difficulty),move=uciToMove(uci);
    if(!move||state.gameOver||state.turn!==expectedTurn)throw new Error('Stale engine move');
    const legal=getValidMoves(move.from[0],move.from[1]).some(([r,c])=>r===move.to[0]&&c===move.to[1]);
    if(!legal)throw new Error('Illegal engine move');
    executeMove(move.from[0],move.from[1],move.to[0],move.to[1],move.promotion);
  }catch(error){
    if(!state.gameOver&&state.turn===expectedTurn){const profile=AI_LEVELS[state.difficulty]||AI_LEVELS[2],fallback=findBestMove(profile.skill<5?2:profile.skill<12?3:4);if(fallback)executeMove(fallback.from[0],fallback.from[1],fallback.to[0],fallback.to[1])}
  }finally{thinking.classList.remove('active')}
};

EloSystem.getAIElo=level=>({1:700,2:1200,3:1800,4:2450}[level]||1200);
StockfishPro.init().catch(()=>{});

function setGameVolume(value){state.settings.volume=Math.max(0,Math.min(1,Number(value)/100));Storage.setSettings(state.settings)}
const volumeSlider=document.getElementById('sound-volume');if(volumeSlider)volumeSlider.value=Math.round(state.settings.volume*100);

AudioEngine.play=function(type){
  if(!this.enabled||state.settings.volume<=0)return;
  try{this.init();if(this.ctx.state==='suspended')this.ctx.resume();const ctx=this.ctx,now=ctx.currentTime,master=state.settings.volume;
    const tone=(frequency,duration,volume=.12,wave='sine',delay=0,endFrequency=frequency)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=wave;osc.frequency.setValueAtTime(frequency,now+delay);osc.frequency.exponentialRampToValueAtTime(Math.max(40,endFrequency),now+delay+duration);gain.gain.setValueAtTime(Math.max(.0001,volume*master),now+delay);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);osc.connect(gain).connect(ctx.destination);osc.start(now+delay);osc.stop(now+delay+duration+.02)};
    const noise=(duration=.09,volume=.09,delay=0,cutoff=900)=>{const length=Math.floor(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/length,2);const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.setValueAtTime(volume*master,now+delay);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);source.connect(filter).connect(gain).connect(ctx.destination);source.start(now+delay)};
    if(type==='select'){tone(720,.045,.045,'sine',0,980);return}
    if(type==='move'){noise(.065,.09,0,720);tone(150,.075,.075,'triangle',0,92);tone(620,.045,.025,'sine',.018,470);return}
    if(type==='capture'){noise(.18,.18,0,1250);tone(210,.18,.16,'sawtooth',0,62);tone(760,.09,.07,'square',.015,230);return}
    if(type==='castle'){noise(.065,.085,0,700);tone(170,.08,.08,'triangle',0,100);noise(.065,.085,.105,700);tone(190,.09,.08,'triangle',.105,110);return}
    if(type==='check'){tone(660,.16,.1,'sine',0,660);tone(990,.22,.08,'sine',.08,880);return}
    if(type==='promotion'){[440,554,659,880].forEach((f,i)=>tone(f,.22,.065,'sine',i*.075,f*1.02));return}
    if(type==='checkmate'){noise(.25,.13,0,750);[523,392,262,131].forEach((f,i)=>tone(f,.34,.085,'triangle',i*.11,f*.82));return}
    if(type==='save'){[520,660,880].forEach((f,i)=>tone(f,.16,.055,'sine',i*.06,f));return}
  }catch(error){}
};

function captureMoveVisual(fromRow,fromCol,toRow,toCol){
  /* The in-game switch is the authority: enabled game effects must stay visible. */
  if(!state.settings.animations||state.importing)return null;
  const from=document.querySelector(`.square[data-row="${fromRow}"][data-col="${fromCol}"]`),to=document.querySelector(`.square[data-row="${toRow}"][data-col="${toCol}"]`);if(!from||!to)return null;
  const moving=from.querySelector('.piece');if(!moving)return null;let captured=to.querySelector('.piece'),captureRect=to.getBoundingClientRect();
  const piece=state.board[fromRow][fromCol];if(!captured&&typeOf(piece)==='p'&&fromCol!==toCol){const epRow=piece===piece.toUpperCase()?toRow+1:toRow-1,ep=document.querySelector(`.square[data-row="${epRow}"][data-col="${toCol}"]`);if(ep){captured=ep.querySelector('.piece');captureRect=ep.getBoundingClientRect()}}
  return{from:from.getBoundingClientRect(),to:to.getBoundingClientRect(),captureRect,movingText:moving.textContent,movingClass:moving.className,capturedText:captured&&captured.textContent,capturedClass:captured&&captured.className,isCapture:!!captured};
}

function spawnCaptureBurst(rect){
  const x=rect.left+rect.width/2,y=rect.top+rect.height/2,ring=document.createElement('div');ring.className='impact-ring';ring.style.left=x+'px';ring.style.top=y+'px';document.body.appendChild(ring);setTimeout(()=>ring.remove(),930);
  for(let i=0;i<20;i++){const shard=document.createElement('i');shard.className='capture-burst';shard.style.left=(x-4)+'px';shard.style.top=(y-4)+'px';shard.style.setProperty('--burst-color',i%3===0?'#fff1b6':i%2?'#d7b56d':'#8fb9a1');document.body.appendChild(shard);const angle=Math.PI*2*i/20+(Math.random()-.5)*.35,distance=38+Math.random()*62;shard.animate([{transform:'translate(0,0) rotate(0) scale(1)',opacity:1},{transform:`translate(${Math.cos(angle)*distance*.3}px,${Math.sin(angle)*distance*.3}px) rotate(80deg) scale(1.25)`,opacity:1,offset:.22},{transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance}px) rotate(${160+Math.random()*360}deg) scale(.1)`,opacity:0}],{duration:640+Math.random()*240,easing:'cubic-bezier(.15,.7,.2,1)'}).finished.finally(()=>shard.remove())}
}

function announceMoveVisual(visual,toRow,toCol){
  const board=document.getElementById('board');if(!board)return;const square=String.fromCharCode(97+toCol)+(8-toRow),callout=document.createElement('div');callout.className='move-callout '+(visual?.isCapture?'capture-callout':'');callout.innerHTML=visual?.isCapture?`<strong>ВЗЯТИЕ</strong><span>${visual.movingText} забирает фигуру на ${square}</span>`:`<strong>ХОД</strong><span>${visual?.movingText||''} → ${square}</span>`;board.appendChild(callout);setTimeout(()=>callout.remove(),visual?.isCapture?1450:950);
}

function animateMoveVisual(visual,toRow,toCol){
  if(!visual)return;const targetSquare=document.querySelector(`.square[data-row="${toRow}"][data-col="${toCol}"]`),target=targetSquare?.querySelector('.piece'),ghost=document.createElement('div');ghost.className='move-ghost '+(visual.movingClass.includes('white')?'white':'black');ghost.textContent=visual.movingText;ghost.style.cssText+=`left:${visual.from.left}px;top:${visual.from.top}px;width:${visual.from.width}px;height:${visual.from.height}px;font-size:${Math.max(28,visual.from.width*.72)}px`;document.body.appendChild(ghost);if(target)target.style.opacity='0';if(targetSquare)targetSquare.classList.add(visual.isCapture?'capture-target':'arrival-target');
  if(visual.isCapture&&visual.capturedText){const victim=document.createElement('div');victim.className='capture-ghost';victim.textContent=visual.capturedText;victim.style.cssText=`left:${visual.captureRect.left}px;top:${visual.captureRect.top}px;width:${visual.captureRect.width}px;height:${visual.captureRect.height}px;font-size:${Math.max(28,visual.captureRect.width*.72)}px`;document.body.appendChild(victim);victim.animate([{transform:'scale(1) rotate(0)',filter:'blur(0)',opacity:1},{transform:'translateX(-4px) scale(1.12) rotate(-7deg)',filter:'brightness(1.9)',opacity:1,offset:.32},{transform:'translateX(7px) scale(1.32) rotate(12deg)',filter:'brightness(2.4)',opacity:.78,offset:.54},{transform:'scale(.08) rotate(44deg)',filter:'blur(5px)',opacity:0}],{duration:790,easing:'cubic-bezier(.22,.76,.22,1)'}).finished.finally(()=>victim.remove())}
  const dx=visual.to.left-visual.from.left,dy=visual.to.top-visual.from.top,duration=visual.isCapture?720:510;ghost.animate([{transform:'translate(0,0) scale(1)',filter:'brightness(1)'},{transform:`translate(${dx*.48}px,${dy*.48}px) scale(${visual.isCapture?1.1:1.05})`,filter:'brightness(1.16)',offset:.48},{transform:`translate(${dx*.86}px,${dy*.86}px) scale(${visual.isCapture?1.28:1.1})`,filter:'brightness(1.35)',offset:visual.isCapture ? .78 : .8},{transform:`translate(${dx}px,${dy}px) scale(1)`,filter:'brightness(1)'}],{duration,easing:'cubic-bezier(.18,.74,.2,1)'}).finished.finally(()=>{ghost.remove();if(target)target.style.opacity='';if(targetSquare)targetSquare.classList.remove('capture-target','arrival-target');if(visual.isCapture)spawnCaptureBurst(visual.to)});
}

const executeWithRules=executeMove;
executeMove=function(fromRow,fromCol,toRow,toCol,promotionChoice){
  const before=state.moveHistory.length,visual=captureMoveVisual(fromRow,fromCol,toRow,toCol);executeWithRules(fromRow,fromCol,toRow,toCol,promotionChoice);
  if(state.moveHistory.length===before)return;announceMoveVisual(visual,toRow,toCol);animateMoveVisual(visual,toRow,toCol);
  const king=state.kingPositions[state.turn],kingSquare=document.querySelector(`.square[data-row="${king[0]}"][data-col="${king[1]}"]`);if(kingSquare&&isInCheck(state.turn)){const wave=document.createElement('span');wave.className='check-wave';kingSquare.appendChild(wave);setTimeout(()=>wave.remove(),700)}
  if(state.gameMode==='online'&&state.onlineConnected&&!state.applyingRemote&&state.online?.conn?.open){state.online.conn.send({type:'move',ply:state.moveHistory.length,from:[fromRow,fromCol],to:[toRow,toCol],promotion:promotionChoice||null})}
};

const handleSquareWithRules=handleSquareClick;
handleSquareClick=function(row,col){
  if(state.gameMode==='online'&&(!state.onlineConnected||state.turn!==state.playerColor)){showToast(state.onlineConnected?'⏳ Сейчас ход соперника':'⚠️ Соединение с соперником потеряно');return}
  handleSquareWithRules(row,col);
};

function onlineStatus(text){const el=document.getElementById('online-progress-text');if(el)el.textContent=text}
function roomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join('')}
function cleanupOnline(){try{state.online?.conn?.close()}catch(e){}try{state.online?.peer?.destroy()}catch(e){}state.online=null;state.onlineConnected=false}

function openOnlineLobby(){
  if(typeof Peer==='undefined'){showToast('❌ Сетевой модуль не загрузился');return}
  cleanupOnline();document.getElementById('room-created').classList.remove('visible');document.getElementById('room-code-input').value='';onlineStatus('Готово к подключению');openModal('modal-online');
}

function attachPeerErrors(peer){peer.on('error',error=>{const messages={'unavailable-id':'Этот код уже занят — создайте другую комнату','peer-unavailable':'Комната не найдена или уже закрыта',network:'Ошибка сети — проверьте интернет','server-error':'Сервис комнат временно недоступен'};onlineStatus(messages[error.type]||'Не удалось подключиться: '+(error.type||'ошибка'));showToast('⚠️ '+(messages[error.type]||'Ошибка сетевого соединения'))})}

function setupOnlineConnection(conn,isHost){
  if(state.online?.conn&&state.online.conn.open){conn.close();return}state.online.conn=conn;
  conn.on('open',()=>{state.onlineConnected=true;startOnlineGame(isHost?'white':'black');if(isHost)conn.send({type:'hello',timeControl:state.timeControl,room:state.online.code});showToast('✅ Соперник подключён')});
  conn.on('data',data=>handleOnlineData(data));
  conn.on('close',()=>{state.onlineConnected=false;updateUI();if(!state.gameOver)showToast('⚠️ Соперник отключился')});
  conn.on('error',()=>{state.onlineConnected=false;updateUI();showToast('⚠️ Ошибка соединения с соперником')});
}

function createOnlineRoom(){
  cleanupOnline();const code=roomCode(),peer=new Peer('cup-'+code.toLowerCase(),{debug:1});state.online={peer,conn:null,host:true,code};onlineStatus('Создаём защищённую комнату…');attachPeerErrors(peer);
  peer.on('open',()=>{document.getElementById('room-code-display').textContent=code;document.getElementById('room-created').classList.add('visible');onlineStatus('Ожидаем подключения соперника…')});
  peer.on('connection',conn=>setupOnlineConnection(conn,true));
}

function joinOnlineRoom(){
  const code=document.getElementById('room-code-input').value.trim().toUpperCase();if(code.length!==6){showToast('Введите шестизначный код комнаты');return}
  cleanupOnline();const peer=new Peer(undefined,{debug:1});state.online={peer,conn:null,host:false,code};onlineStatus('Ищем комнату '+code+'…');attachPeerErrors(peer);
  peer.on('open',()=>{const conn=peer.connect('cup-'+code.toLowerCase(),{reliable:true,metadata:{game:'chess-ultimate-pro'}});setupOnlineConnection(conn,false)});
}

function startOnlineGame(color){
  closeModal('modal-online');state.gameMode='online';state.playerColor=color;initBoard();document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('screen-game').classList.add('active');renderBoard();updateUI();
}

function handleOnlineData(data){
  if(!data||typeof data!=='object')return;
  if(data.type==='hello'){if(Number.isFinite(data.timeControl)){state.timeControl=data.timeControl;state.timers={white:data.timeControl*60,black:data.timeControl*60}}updateUI();return}
  if(data.type==='move'){
    if(data.ply!==state.moveHistory.length+1||!Array.isArray(data.from)||!Array.isArray(data.to)){showToast('⚠️ Ходы рассинхронизированы');return}
    const legal=getValidMoves(data.from[0],data.from[1]).some(([r,c])=>r===data.to[0]&&c===data.to[1]);if(!legal){showToast('⚠️ Получен некорректный сетевой ход');return}
    state.applyingRemote=true;executeMove(data.from[0],data.from[1],data.to[0],data.to[1],data.promotion||undefined);state.applyingRemote=false;return;
  }
  if(data.type==='resign'){state.applyingRemote=true;endGame('resign',state.playerColor);state.applyingRemote=false;return}
  if(data.type==='draw-offer'){if(confirm('Соперник предлагает ничью. Принять?')){state.online.conn.send({type:'draw-accept'});state.applyingRemote=true;endGame('draw');state.applyingRemote=false}else state.online.conn.send({type:'draw-decline'});return}
  if(data.type==='draw-accept'){state.applyingRemote=true;endGame('draw');state.applyingRemote=false;return}
  if(data.type==='draw-decline')showToast('Соперник отказался от ничьей');
}

function copyOnlineCode(){const code=document.getElementById('room-code-display').textContent;navigator.clipboard.writeText(code).then(()=>showToast('📋 Код комнаты скопирован')).catch(()=>showToast('Код: '+code))}
function cancelOnlineLobby(){cleanupOnline();closeModal('modal-online')}

const updateWithFinalFeatures=updateUI;
updateUI=function(){
  updateWithFinalFeatures();const chip=document.getElementById('network-chip');
  if(state.gameMode==='online'){chip.classList.add('visible');chip.classList.toggle('disconnected',!state.onlineConnected);chip.textContent=state.onlineConnected?'● Соперник подключён · '+(state.online?.code||''):'● Соединение потеряно';document.getElementById('name-white').textContent=state.playerColor==='white'?'Вы · Белые':'Соперник · Белые';document.getElementById('name-black').textContent=state.playerColor==='black'?'Вы · Чёрные':'Соперник · Чёрные';document.getElementById('status-white').textContent=state.turn==='white'?(state.playerColor==='white'?'Ваш ход':'Ход соперника'):'Ожидание…';document.getElementById('status-black').textContent=state.turn==='black'?(state.playerColor==='black'?'Ваш ход':'Ход соперника'):'Ожидание…'}else{chip.classList.remove('visible');document.getElementById('name-white').textContent='Белые';document.getElementById('name-black').textContent='Чёрные'}
};

const undoWithRules=undoMove;
undoMove=function(){if(state.gameMode==='online'){showToast('↩️ Отмена хода недоступна в сетевой партии');return}undoWithRules()};
const drawWithRules=offerDraw;
offerDraw=function(){if(state.gameMode==='online'){if(state.onlineConnected&&state.online?.conn?.open){state.online.conn.send({type:'draw-offer'});showToast('🤝 Предложение ничьей отправлено')}return}drawWithRules()};
const resignWithRules=resignGame;
resignGame=function(){if(state.gameMode==='online'){if(confirm('Вы уверены, что хотите сдаться?')){if(state.online?.conn?.open)state.online.conn.send({type:'resign'});endGame('resign',state.turn==='white'?'black':'white')}return}resignWithRules()};

const exitWithCleanup=doExitToMenu;
doExitToMenu=function(){const wasOnline=state.gameMode==='online';exitWithCleanup();if(wasOnline)cleanupOnline()};

const renderWithOrientation=renderBoard;
renderBoard=function(){
  const originalMode=state.gameMode;if(state.gameMode==='online'&&state.playerColor==='black')state.gameMode='ai';renderWithOrientation();state.gameMode=originalMode;
};

document.querySelectorAll('.menu-card[role="button"]').forEach(card=>{if(!card.dataset.finalKeyboard){card.dataset.finalKeyboard='1';card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click()}})}});
