(function () {
  const container = document.getElementById("events-list");
  const pager = document.getElementById("pagination");
  const searchInput = document.getElementById("events-search");
  if (!container || !pager) return;

  const pageSize = parseInt(container.dataset.pageSize, 10) || 24;
  const allEvents = Array.from(container.children);
  let filteredEvents = allEvents;
  let currentPage = 1;

  function applyFilter() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    filteredEvents = query
      ? allEvents.filter(function (el) {
          return el.textContent.toLowerCase().includes(query);
        })
      : allEvents;
    currentPage = 1;
    render();
  }

  function render() {
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    allEvents.forEach(function (el) {
      el.style.display = "none";
    });
    filteredEvents.forEach(function (el, i) {
      el.style.display = (i >= start && i < end) ? "" : "none";
    });

    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    pager.innerHTML = "";

    if (filteredEvents.length === 0) {
      const empty = document.createElement("span");
      empty.className = "pagination-status";
      empty.textContent = "No events match your search.";
      pager.appendChild(empty);
      return;
    }

    if (totalPages <= 1) {
      const status = document.createElement("span");
      status.className = "pagination-status";
      status.textContent = filteredEvents.length === 1
        ? "1 event"
        : `${filteredEvents.length} events`;
      pager.appendChild(status);
      return;
    }

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

  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
  }

  render();
})();
