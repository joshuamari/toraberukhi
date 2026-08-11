// events.js
function bindEvents() {
  $(document).on("click", "#menu", function () {
    openNavigation();
  });

  $(document).on("click", "#closeNav", function () {
    closeNavigation();
  });

  $(document).on("click", "#logoutBtn", function () {
    handleLogout();
  });

  $(document).on("click", "#activityTableBody tr[data-activity-id]", function () {
    const type = $(this).data("activity-type");
    const id = $(this).data("activity-id");
    const item = dashboardActivityItems.find(
      (entry) =>
        String(entry.id) === String(id) && String(entry.type) === String(type),
    );

    if (!item) {
      return;
    }

    window.location.href = getActivityHref(item);
  });

  $(document).on("click", ".dashboard-upcoming-row[data-request-id]", function () {
    const id = $(this).data("request-id");
    if (id === undefined || id === null || id === "") {
      return;
    }

    window.location.href = getUpcomingHref({ id });
  });

  $(document).on(
    "keydown",
    ".dashboard-upcoming-row[data-request-id]",
    function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const id = $(this).data("request-id");
      if (id === undefined || id === null || id === "") {
        return;
      }

      event.preventDefault();
      window.location.href = getUpcomingHref({ id });
    },
  );

  $(document).on("click", "#activityPagination [data-role='prev']", function () {
    if ($(this).prop("disabled")) {
      return;
    }
    setActivityPage(activityPaginationState.currentPage - 1);
  });

  $(document).on("click", "#activityPagination [data-role='next']", function () {
    if ($(this).prop("disabled")) {
      return;
    }
    setActivityPage(activityPaginationState.currentPage + 1);
  });

  $(document).on("click", "#activityPagination [data-page]", function () {
    const page = Number($(this).attr("data-page"));
    if (!Number.isFinite(page)) {
      return;
    }
    setActivityPage(page);
  });

  $(document).on("change", "#submissionTrendYearSel", function () {
    const year = Number($(this).val());
    if (!Number.isFinite(year)) {
      return;
    }
    dashboardSubmissionTrendYear = year;
    refreshSubmissionTrendChart();
  });
}
