const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit,firefox}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');const file=path.join(root,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+'/')){res.writeHead(403);return res.end()}fs.readFile(file,(error,body)=>{if(error){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(body)})});
const devices=[[320,568],[390,664],[430,932],[768,1024],[1024,768],[1440,900],[844,390],[568,320]];
const themes=['dark','light','classic','ocean','forest','sunset','midnight'];
(async()=>{
 await new Promise(r=>server.listen(4196,'127.0.0.1',r));
 for(const [name,type]of Object.entries({chromium,webkit,firefox}).filter(([name])=>!process.env.BROWSERS||process.env.BROWSERS.split(',').includes(name))){
  const browser=await type.launch({headless:true,...(process.env[name.toUpperCase()+'_EXEC']?{executablePath:process.env[name.toUpperCase()+'_EXEC']}:{})});
  try{
   for(const [width,height]of devices){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width<500?3:1,isMobile:name!=='firefox'&&width<900,hasTouch:width<900});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4196/');await page.waitForFunction(()=>typeof PieceArt!=='undefined'&&typeof Academy!=='undefined');
    await page.evaluate(()=>{state.timeControl=0;state.settings.animations=false;startGame('pvp')});
    for(const theme of themes)for(const style of ['classic','modern','outline']){
     const metrics=await page.evaluate(({theme,style})=>{applyTheme(theme);document.body.dataset.pieceStyle=style;renderBoard();const board=document.querySelector('#board').getBoundingClientRect();const geometry=pc=>{const svg=document.querySelector('.piece.'+pc+' .chess-piece-svg');const g=svg.querySelector('g'),b=svg.getBoundingClientRect();return{fill:getComputedStyle(g).fill,width:b.width,height:b.height,shape:g.innerHTML}};return{board:{x:board.x,y:board.y,width:board.width,height:board.height},vw:innerWidth,scroll:document.documentElement.scrollWidth,white:geometry('white.piece-p'),black:geometry('black.piece-p'),queen:geometry('white.piece-q'),count:document.querySelectorAll('#board .chess-piece-svg').length}}, {theme,style});
     assert.equal(metrics.count,32);assert.equal(metrics.white.fill,'rgb(255, 247, 229)');assert.equal(metrics.black.fill,'rgb(32, 42, 49)');assert.equal(metrics.white.shape,metrics.black.shape);assert.ok(Math.abs(metrics.white.height-metrics.black.height)<.1);assert.ok(metrics.white.height<metrics.queen.height);assert.ok(Math.abs(metrics.board.width-metrics.board.height)<1);assert.ok(metrics.board.x>=0&&metrics.board.x+metrics.board.width<=width+1);assert.ok(metrics.scroll<=width+1,`overflow ${name} ${width} ${metrics.scroll}`);
    }
    await page.evaluate(()=>{state.gameMode='ai';state.playerColor='black';renderBoard()});
    assert.equal(await page.locator('#board .square').first().getAttribute('data-row'),'7');
    await page.evaluate(()=>{state.gameMode='pvp';initBoard();renderBoard();executeMove(6,4,4,4);executeMove(1,3,3,3);executeMove(4,4,3,3)});
    assert.equal(await page.locator('#board .chess-piece-svg').count(),31);
    await page.evaluate(()=>undoMove());assert.equal(await page.locator('#board .chess-piece-svg').count(),32);
    const review=await page.evaluate(()=>{GameReview.data={entries:[{fenBefore:boardToFEN(),label:'GOOD',notation:'e4',playedMove:'e2e4',text:'test',playedScore:{type:'cp',value:0},bestScore:{type:'cp',value:0}}],engine:'test'};GameReview.index=0;renderReview();return document.querySelectorAll('#review-board .chess-piece-svg').length});assert.equal(review,32);
    for(const screen of ['menu','academy','review','settings']){
     const overflow=await page.evaluate(screen=>{document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('active'));if(screen==='menu')showMenu();if(screen==='academy')showAcademy('home');if(screen==='review'){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('screen-review').classList.add('active');renderReview()}if(screen==='settings'){showMenu();openModal('modal-settings')}return document.documentElement.scrollWidth>innerWidth+1},screen);assert.equal(overflow,false,`${name} ${width} ${screen} overflow`);
    }
    await page.evaluate(()=>{document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('active'));startGame('pvp');state.timeControl=0});
    assert.deepEqual(errors,[],`${name} ${width}: ${errors}`);
    if(width===320){
     const rules=await page.evaluate(()=>{
      function perft(board,kings,castling,ep,color,depth){if(!depth)return 1;let nodes=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const piece=board[r][c];if(!piece||!isOwnPiece(piece,color))continue;for(const to of getRawMoves(r,c,piece,board,{castling,enPassant:ep})){const next=simulateMove(board,kings,castling,ep,[r,c],to,color);if(isKingInCheck(next.board,next.kings[color],color))continue;const nextEp=typeOf(piece)==='p'&&Math.abs(to[0]-r)===2?[(r+to[0])/2,c]:null;nodes+=perft(next.board,next.kings,next.castling,nextEp,color==='white'?'black':'white',depth-1)}}return nodes}
      initBoard();const counts=[1,2,3].map(d=>perft(state.board,state.kingPositions,state.castling,null,'white',d));
      decodeFEN('4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1');const epPinned=!getValidMoves(3,6).some(([r,c])=>r===2&&c===5);
      decodeFEN('4kr2/8/8/8/8/8/8/4K2R w K - 0 1');const castleBlocked=!getValidMoves(7,4).some(([r,c])=>c===6);
      decodeFEN('7k/P7/8/8/8/8/8/7K w - - 0 1');state.gameMode='pvp';renderBoard();executeMove(1,0,0,0,'n');const underpromotion=state.board[0][0]==='N'&&!!document.querySelector('#piece-0-0 .type-n');
      decodeFEN('4k3/8/8/8/8/8/8/1N2KN2 w - - 0 1');renderBoard();executeMove(7,1,6,3);const notation=state.moveHistory.at(-1).notation;
      decodeFEN('4k3/8/8/7r/8/8/7Q/4K2r w k - 0 1');renderBoard();executeMove(6,7,3,7);const captureRights=state.castling.black.kingside;
      initBoard();renderBoard();executeMove(6,5,5,5);executeMove(1,4,3,4);executeMove(6,6,4,6);executeMove(0,3,4,7);const mateImmediate=state.gameOver&&state.moveHistory.at(-1).notation.endsWith('#');undoMove();const undoMate=!state.gameOver;
      document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('active'));initBoard();renderBoard();return{counts,epPinned,castleBlocked,underpromotion,notation,captureRights,mateImmediate,undoMate};
     });assert.deepEqual(rules,{counts:[20,400,8902],epPinned:true,castleBlocked:true,underpromotion:true,notation:'Nbd2',captureRights:true,mateImmediate:true,undoMate:true});console.log(`PASS ${name}: perft 20/400/8902, en-passant pin, castling/check, underpromotion, SAN disambiguation, rook capture rights, mate/undo`);
    }
    if(width===390){
     const engine=await page.evaluate(async()=>{await StockfishPro.init();const result=await StockfishPro.analyse(boardToFEN(),100);return validCoachMove(uciToMove(result.move))});assert.equal(engine,true);console.log(`PASS ${name}: real Stockfish returns a legal recommendation`);
     const stale=await page.evaluate(async()=>{state.gameMode='pvp';initBoard();renderBoard();const original=StockfishPro.analyse;let resolve;StockfishPro.analyse=()=>new Promise(r=>resolve=r);const hint=coachHint('exact');executeMove(6,4,4,4);resolve({move:'e2e4'});await hint;StockfishPro.analyse=original;return document.querySelectorAll('.coach-arrow-origin,.coach-arrow-target').length});assert.equal(stale,0);
     const animation=await page.evaluate(()=>{initBoard();renderBoard();state.settings.animations=true;executeMove(6,4,4,4);return{count:document.querySelectorAll('.move-ghost .type-p').length,fill:getComputedStyle(document.querySelector('.move-ghost g')).fill}});assert.deepEqual(animation,{count:1,fill:'rgb(255, 247, 229)'});await page.waitForTimeout(800);
     await page.evaluate(()=>{state.settings.animations=false;state.gameMode='pvp';initBoard();renderBoard();updateUI();applyTheme('ocean');document.getElementById('toast').classList.remove('show')});await page.waitForTimeout(600);
     if(name==='webkit')await page.screenshot({path:'/private/tmp/chess-fixed-iphone-webkit.png',fullPage:true});
     await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));localStorage.setItem('qa-preserve','keep')});
     if(name==='chromium'){await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof Academy!=='undefined');assert.equal(await page.evaluate(()=>localStorage.getItem('qa-preserve')),'keep');assert.equal(await page.evaluate(()=>!!PieceArt.markup('Q')),true);await context.setOffline(false);console.log(`PASS ${name}: offline reload and local data preserved`)}
     else console.log('UNVERIFIED WebKit offline reload: installed automation browser reported an internal navigation error in offline mode');
     console.log(`PASS ${name}: stale hint rejected and vector move animation`);
    }
    console.log(`PASS ${name} ${width}x${height}: 7 themes, 3 styles, colour/size, flip, capture/undo, review, no overflow/errors`);
    await context.close();
   }
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
