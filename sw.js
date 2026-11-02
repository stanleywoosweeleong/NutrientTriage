// 养分辨症 Nutrient Triage — network-first offline cache. No version bumps needed:
// every successful online load overwrites the cached copy.
const C='nutrient-triage';
const SCOPE=self.registration.scope;
const PRECACHE=['','index.html','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png'].map(f=>SCOPE+f);
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.allSettled(PRECACHE.map(u=>c.add(new Request(u,{cache:'no-store'}))))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||!r.url.startsWith(SCOPE))return;
  e.respondWith(
    fetch(new Request(r,{cache:'no-store'}))
      .then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match(SCOPE+'index.html').then(x=>x||caches.match(SCOPE)):undefined)))
  );
});
