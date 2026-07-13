(function () {
  const skeleton = document.getElementById("events-skeleton");
  const target = document.getElementById("eventGridElementId1");

  function reportHeight() {
    parent.postMessage(
      { type: "venuepilot-embed-height", height: document.body.scrollHeight },
      window.location.origin
    );
  }

  function hideSkeleton() {
    if (skeleton) skeleton.style.display = "none";
  }

  if (skeleton && target) {
    const contentObserver = new MutationObserver(function () {
      if (target.children.length > 0) {
        hideSkeleton();
        contentObserver.disconnect();
      }
    });
    contentObserver.observe(target, { childList: true });

    // Safety net: hide after 10s regardless, so a slow/failed widget load
    // doesn't leave the skeleton showing forever.
    setTimeout(function () {
      hideSkeleton();
      contentObserver.disconnect();
    }, 10000);
  }

  // Keep the parent iframe sized to whatever this page's content actually
  // needs, since the widget's height is dynamic and not known in advance.
  const resizeObserver = new ResizeObserver(reportHeight);
  resizeObserver.observe(document.body);
  window.addEventListener("load", reportHeight);
  reportHeight();
})();
