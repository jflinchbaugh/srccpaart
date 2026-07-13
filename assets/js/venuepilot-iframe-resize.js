(function () {
  const frame = document.getElementById("venuepilot-frame");
  if (!frame) return;

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== "venuepilot-embed-height") return;
    frame.style.height = event.data.height + "px";
  });
})();
