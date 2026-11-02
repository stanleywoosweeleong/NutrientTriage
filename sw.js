// 养分辨症 Nutrient Triage — network-first offline cache. No version bumps needed:
// every successful online load overwrites the cached copy.
const PREFIX='nutrient-triage';
const C=PREFIX+'-v1';  // bump only if the cache layout changes; content updates need no bump
const SCOPE=self.registration.scope;
const CORE=['','index.html','manifest.json'].map(f=>SCOPE+f);
const EXTRA=['icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png'].map(f=>SCOPE+f);
const NET_TIMEOUT=4000; // ms: on a weak signal, fall back to cache instead of hanging
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'no-store'}))))
    .then(()=>Promise.allSettled(EXTRA.map(u=>c.add(new Request(u,{cache:'no-store'})))))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||!r.url.startsWith(SCOPE))return;
  const fromCache=()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match(SCOPE+'index.html').then(x=>x||caches.match(SCOPE)):undefined));
  const net=fetch(new Request(r,{cache:'no-store'})).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;}throw new Error('http '+(res&&res.status));});
  const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),NET_TIMEOUT));
  e.respondWith(Promise.race([net,timeout]).catch(()=>fromCache().then(m=>m||net.catch(()=>new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}})))));
});
