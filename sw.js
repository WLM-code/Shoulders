// Shoulders service worker: alleen voor pushmeldingen en het bolletje op het icoon.
// Er wordt niets gecachet, dus een nieuwe versie op GitHub is meteen zichtbaar.

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

async function updateBadge(){
  try{
    var list = await self.registration.getNotifications();
    if (self.navigator && self.navigator.setAppBadge){
      list.length ? self.navigator.setAppBadge(list.length) : self.navigator.clearAppBadge();
    }
  }catch(e){}
}

self.addEventListener('push', function(e){
  var d = {};
  try{ d = e.data ? e.data.json() : {}; }catch(err){ d = {title:'Shoulders', body: e.data ? e.data.text() : ''}; }
  e.waitUntil((async function(){
    // Zit je al in deze chat met de app open? Dan geen melding.
    var wins = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    var watching = wins.some(function(w){ return w.visibilityState === 'visible' && w.focused; });
    wins.forEach(function(w){ w.postMessage({type:'push', room:d.room}); });
    if (watching) return;
    await self.registration.showNotification(d.title || 'Shoulders', {
      body: d.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: {room: d.room || null}
    });
    await updateBadge();
  })());
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var room = e.notification.data && e.notification.data.room;
  var target = new URL(room ? './?room=' + room : './', self.registration.scope).href;
  e.waitUntil((async function(){
    var wins = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (var i = 0; i < wins.length; i++){
      var w = wins[i];
      if (w.url.indexOf(self.registration.scope) === 0){
        w.postMessage({type:'open', room: room});
        try{ await w.focus(); }catch(err){}
        await updateBadge();
        return;
      }
    }
    await self.clients.openWindow(target);
    await updateBadge();
  })());
});

self.addEventListener('notificationclose', function(){ updateBadge(); });
