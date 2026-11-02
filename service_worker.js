self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SCHEDULE_NOTIFICATION") {
        const { title, body, delay } = event.data;

        event.waitUntil(
            new Promise((resolve) => {
                setTimeout(() => {
                    self.registration.showNotification(title, { body: body });
                    resolve();
                }, delay);
            })
        );
    }
});

const CACHE = "todo-app-v2";
const SHELL = [
    "./",
    "./index.php",
    "./team.php",
    "./offline.php",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/icon-0.png",
    "./icons/icon-1.png"
];

//Install event
self.addEventListener("install", (e) => {
    self.skipWaiting();
    e.waitUntil(
        cache.open(CACHE).then((c) => c.addAll(SHELL))
    );
});

// Activate event
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((ks) =>
            Promise.all(
                ks.filter((k) => k.startsWith("todo-app-") && k !== CACHE).map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch event 
self.addEventListener("fetch", (e) => {
    if(e.request.method !=="GET") return;

    if(e.request.mode === "navigate"){
        e.respondWith(
            fetch(e.request).catch (() => caches.match("./offline.php"))
        );
        return;
    }

    e.respondWith(
        caches.match(e.request).then((r) => r || fetch(e.request))
    );
});