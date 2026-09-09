/* David Jack Personal — service worker
   TROQUE A VERSÃO A CADA PUBLICAÇÃO. É o que faz o celular do David e o dos
   alunos baixarem a versão nova em vez de continuar servindo a antiga do cache. */
const VERSAO = "v1";
const CACHE = "djp-" + VERSAO;
const ARQUIVOS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png", "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* HTML pela rede primeiro (para a versão nova chegar assim que houver internet);
   o resto pelo cache primeiro (para abrir na academia sem sinal). */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const ehPagina = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (ehPagina) {
    e.respondWith(
      fetch(req)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      if (resp && resp.status === 200 && resp.type === "basic") {
        const c = resp.clone(); caches.open(CACHE).then(x => x.put(req, c));
      }
      return resp;
    }).catch(() => new Response("", { status: 504, statusText: "sem conexão" })))
  );
});
