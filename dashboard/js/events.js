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

  $(document).on(
    "click",
    "#latestDispatchTableBody tr[data-request-id]",
    function () {
      const requestId = $(this).data("request-id");
      if (requestId === undefined || requestId === null || requestId === "") {
        return;
      }

      window.location.href = `../requestList/?request_id=${encodeURIComponent(requestId)}`;
    },
  );

  $(document).on(
    "click",
    "#latestDispatchPagination [data-role='prev']",
    function () {
      if ($(this).prop("disabled")) {
        return;
      }
      setLatestDispatchPage(latestDispatchPaginationState.currentPage - 1);
    },
  );

  $(document).on(
    "click",
    "#latestDispatchPagination [data-role='next']",
    function () {
      if ($(this).prop("disabled")) {
        return;
      }
      setLatestDispatchPage(latestDispatchPaginationState.currentPage + 1);
    },
  );

  $(document).on(
    "click",
    "#latestDispatchPagination [data-page]",
    function () {
      const page = Number($(this).attr("data-page"));
      if (!Number.isFinite(page)) {
        return;
      }
      setLatestDispatchPage(page);
    },
  );

  $(document).on("change", "#submissionTrendYearSel", function () {
    const year = Number($(this).val());
    if (!Number.isFinite(year)) {
      return;
    }
    dashboardSubmissionTrendYear = year;
    refreshSubmissionTrendChart();
  });

  $(document).on("change", "#statusOverviewYearSel", function () {
    const year = Number($(this).val());
    if (!Number.isFinite(year)) {
      return;
    }
    dashboardStatusOverviewYear = year;
    refreshStatusOverviewChart(true);
  });
}
