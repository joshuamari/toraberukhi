let appVersionReleases = [];
let versionHistoryEventsBound = false;

function getAppVersionUrl() {
  const parts = window.location.pathname.replace(/\\/g, "/").split("/");
  const appIdx = parts.findIndex((part) => part.toLowerCase() === "pcskhi");
  if (appIdx === -1) {
    return "api/version.php";
  }
  return `${parts.slice(0, appIdx + 1).join("/")}/api/version.php`;
}

function setAppVersion(version) {
  if (!version) {
    return;
  }
  const label = `v${version}`;
  const apply = function () {
    const $el = $("#appVersion");
    if (!$el.length) {
      return;
    }
    $el.text(label);
    $el.addClass("app-version-trigger");
    $el.attr({
      role: "button",
      tabindex: "0",
      title: "View version history",
      "aria-label": `Version ${version}. View version history`,
    });
  };
  if ($("#appVersion").length) {
    apply();
    return;
  }
  $(apply);
}

function loadAppVersion() {
  $.getJSON(getAppVersionUrl()).done(function (res) {
    const data = res && res.success && res.data ? res.data : {};
    const version = data.version ? String(data.version) : "";
    appVersionReleases = Array.isArray(data.releases) ? data.releases : [];
    setAppVersion(version);
    ensureVersionHistoryModal();
    renderVersionHistory(version, appVersionReleases);
  });
}

function bindVersionHistoryEvents() {
  if (versionHistoryEventsBound) {
    return;
  }
  versionHistoryEventsBound = true;

  $(document).on("click", "#appVersion", function (event) {
    event.preventDefault();
    openVersionHistoryModal();
  });

  $(document).on("keydown", "#appVersion", function (event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    openVersionHistoryModal();
  });

  $(document).on("click", ".version-history-toggle", function () {
    const $release = $(this).closest(".version-history-release");
    const willOpen = !$release.hasClass("is-open");
    $("#versionHistoryList .version-history-release")
      .removeClass("is-open")
      .find(".version-history-toggle")
      .attr("aria-expanded", "false");
    if (willOpen) {
      $release.addClass("is-open");
      $(this).attr("aria-expanded", "true");
    }
  });
}

function ensureVersionHistoryModal() {
  if ($("#versionHistoryModal").length) {
    return;
  }

  $("body").append(`
    <div class="modal fade" id="versionHistoryModal" tabindex="-1" aria-labelledby="versionHistoryTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content version-history-modal">
          <div class="modal-header border-0">
            <div>
              <h1 class="modal-title m-0" id="versionHistoryTitle">Version history</h1>
              <p class="version-history-subtitle m-0">What's new in PCSKHI</p>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-0">
            <div id="versionHistoryList"></div>
          </div>
        </div>
      </div>
    </div>
  `);
}

function openVersionHistoryModal() {
  ensureVersionHistoryModal();
  renderVersionHistory($("#appVersion").text().replace(/^v/i, ""), appVersionReleases);

  $(".navigation").removeClass("open");
  $("body").removeClass("overflow-hidden");

  const modalEl = document.getElementById("versionHistoryModal");
  if (!modalEl) {
    return;
  }

  if (window.bootstrap && bootstrap.Modal) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    return;
  }

  $(modalEl).modal("show");
}

function renderVersionHistory(currentVersion, releases) {
  const $list = $("#versionHistoryList");
  if (!$list.length) {
    return;
  }

  if (!Array.isArray(releases) || !releases.length) {
    $list.html(
      `<p class="version-history-empty">No version notes are available yet.</p>`,
    );
    return;
  }

  const html = releases
    .map(function (release, index) {
      return renderVersionRelease(release, currentVersion, index === 0);
    })
    .join("");

  $list.html(html);
}

function renderVersionRelease(release, currentVersion, isFirst) {
  const version = String((release && release.version) || "");
  const isCurrent =
    release && typeof release.current === "boolean"
      ? release.current
      : version !== "" && version === String(currentVersion || "");
  const isOpen = isCurrent || (isFirst && !currentVersion);
  const dateLabel = formatReleaseDate(release && release.date);
  const highlights = Array.isArray(release && release.highlights)
    ? release.highlights
    : [];
  const panelId = `versionHistory-${version.replace(/[^a-z0-9.-]/gi, "-") || "unknown"}`;
  const currentBadge = isCurrent
    ? `<span class="version-history-badge">Current</span>`
    : "";
  const dateHtml = dateLabel
    ? `<span class="version-history-date">${escapeHtml(dateLabel)}</span>`
    : "";

  return `
    <section class="version-history-release${isOpen ? " is-open" : ""}">
      <button
        type="button"
        class="version-history-toggle"
        aria-expanded="${isOpen ? "true" : "false"}"
        aria-controls="${panelId}"
      >
        <span class="version-history-heading">
          <span class="version-history-version">v${escapeHtml(version)}</span>
          ${currentBadge}
        </span>
        ${dateHtml}
        <i class="bx bx-chevron-down" aria-hidden="true"></i>
      </button>
      <div class="version-history-panel" id="${panelId}">
        ${renderVersionHighlights(highlights)}
      </div>
    </section>
  `;
}

function renderVersionHighlights(highlights) {
  if (!highlights.length) {
    return `<p class="version-history-empty">No notes for this version.</p>`;
  }

  const groups = [];
  const seen = {};

  highlights.forEach(function (item) {
    const type = String((item && item.type) || "added").toLowerCase();
    if (!seen[type]) {
      seen[type] = [];
      groups.push({ type: type, items: seen[type] });
    }
    seen[type].push(item);
  });

  return groups
    .map(function (group) {
      const items = group.items
        .map(function (item) {
          const text = String((item && item.text) || "").trim();
          if (!text) {
            return "";
          }
          return `<li>${escapeHtml(text)}</li>`;
        })
        .filter(Boolean)
        .join("");

      if (!items) {
        return "";
      }

      return `
        <div class="version-history-group">
          <p class="version-history-type is-${escapeHtml(group.type)}">${escapeHtml(
            formatHighlightType(group.type),
          )}</p>
          <ul class="version-history-list">${items}</ul>
        </div>
      `;
    })
    .join("");
}

function formatHighlightType(type) {
  const labels = {
    added: "Added",
    changed: "Changed",
    fixed: "Fixed",
    removed: "Removed",
  };
  return labels[type] || "Updates";
}

function formatReleaseDate(isoDate) {
  if (!isoDate) {
    return "";
  }
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(isoDate);
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

$(function () {
  bindVersionHistoryEvents();
  loadAppVersion();
});
