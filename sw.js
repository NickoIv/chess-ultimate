const CACHE='chess-grandmaster-v16-solid-pieces';
const ASSETS=['./','./index.html','./piece-art.js?v=16','./responsive.css?v=16','./manifest.webmanifest','./icon.svg','./final-features.css','./final-features.js','./academy.css','./academy-puzzles.js','./review-core.js','./commercial.js','./academy.js','./vendor/peerjs/peerjs.min.js','./vendor/stockfish/stockfish-19-lite-single.js','./vendor/stockfish/stockfish-19-lite-single.wasm'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('chess-grandmaster-')&&key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   try{const response=await fetch(event.request);if(response.ok)await cache.put('./index.html',response.clone());return response}
   catch(error){return(await cache.match('./index.html'))||Response.error()}
  }
  const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;
  try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response}
  catch(error){return Response.error()}
 })());
});
