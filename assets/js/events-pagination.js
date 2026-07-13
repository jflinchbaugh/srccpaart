(function () {
  const container = document.getElementById("events-list");
  const pager = document.getElementById("pagination");
  if (!container || !pager) return;

  const pageSize = parseInt(container.dataset.pageSize, 10) || 24;
  const events = Array.from(container.children);
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  let currentPage = 1;

  function render() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    events.forEach(function (el, i) {
      el.style.display = (i >= start && i < end) ? "" : "none";
    });
    renderPager();
  }

  function renderPager() {
    pager.innerHTML = "";
    if (totalPages <= 1) return;

    if (currentPage > 1) {
      const prev = document.createElement("a");
      prev.href = "#";
      prev.className = "button";
      prev.textContent = "« Newer";
      prev.addEventListener("click", function (ev) {
        ev.preventDefault();
        currentPage--;
        render();
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pager.appendChild(prev);
    }

    const status = document.createElement("span");
    status.className = "pagination-status";
    status.textContent = `Page ${currentPage} of ${totalPages}`;
    pager.appendChild(status);

    if (currentPage < totalPages) {
      const next = document.createElement("a");
      next.href = "#";
      next.className = "button";
      next.textContent = "Older »";
      next.addEventListener("click", function (ev) {
        ev.preventDefault();
        currentPage++;
        render();
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pager.appendChild(next);
    }
  }

  render();
})();
