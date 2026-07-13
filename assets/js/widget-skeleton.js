(function () {
  const skeleton = document.getElementById("events-skeleton");
  const target = document.getElementById("eventGridElementId1");
  if (!skeleton || !target) return;

  function hideSkeleton() {
    skeleton.style.display = "none";
  }

  const observer = new MutationObserver(function () {
    if (target.children.length > 0) {
      hideSkeleton();
      observer.disconnect();
    }
  });
  observer.observe(target, { childList: true });

  // Safety net: hide after 10s regardless, so a slow/failed widget load
  // doesn't leave the skeleton showing forever.
  setTimeout(function () {
    hideSkeleton();
    observer.disconnect();
  }, 10000);
})();
