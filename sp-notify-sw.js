/* Isolated Study Planner notification helper. No fetch caching or interception. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const url = new URL('./studyplanner.html', self.location.href).href;
    const target = clientsList.find(client => client.url.startsWith(url));
    if (target) await target.focus();
    else await self.clients.openWindow(url);
  })());
});
