// ui.js
function openNavigation() {
  $(".navigation").addClass("open");
  $("body").addClass("overflow-hidden");
}

function closeNavigation() {
  $(".navigation").removeClass("open");
  $("body").removeClass("overflow-hidden");
}

function fillSummaryCards(year, options) {
  const hasRequestData = !!(options && options.hasRequestData);
  const hasChangeData = !!(options && options.hasChangeData);

  if (hasRequestData) {
    const statusCounts = getDispatchStatusCounts(dashboardRequestList);
    const upcomingCount = getApprovedUpcomingRequests(dashboardRequestList)
      .length;

    $("#cardPendingDispatch").text(String(statusCounts.pending));
    $("#cardApprovedUpcoming").text(String(upcomingCount));
    $("#cardCompletedYear").text(
      String(countCompletedThisYear(dashboardRequestList, year)),
    );
  } else {
    $("#cardPendingDispatch").text("—");
    $("#cardApprovedUpcoming").text("—");
    $("#cardCompletedYear").text("—");
  }

  if (hasChangeData) {
    $("#cardPendingChange").text(
      String(
        countPendingChangeRequests(
          dashboardCancellations,
          dashboardDateChanges,
        ),
      ),
    );
  } else {
    $("#cardPendingChange").text("—");
  }

  $("#completedYearValue").text(String(year));
}

function fillUpcomingDispatchesList() {
  const $list = $("#upcomingDispatchesList");
  const $viewAll = $("#upcomingViewAllLink");
  $list.empty();

  if (!dashboardUpcomingItems.length) {
    $list.html(`<p class="dashboard-upcoming-empty">No upcoming dispatches.</p>`);
    $viewAll.removeClass("is-hidden");
    return;
  }

  $viewAll.removeClass("is-hidden");

  dashboardUpcomingItems.forEach((item) => {
    const $row = $(`
      <div class="dashboard-upcoming-row" role="button" tabindex="0" data-request-id="${item.id}">
        <span class="upcoming-icon" aria-hidden="true">
          <i class="bx bxs-user"></i>
        </span>
        <div class="upcoming-body">
          <div class="upcoming-top">
            <p class="upcoming-name"></p>
            <span class="upcoming-timing-badge"></span>
          </div>
          <span class="upcoming-group-badge"></span>
          <p class="upcoming-dates"></p>
        </div>
      </div>
    `);

    $row.find(".upcoming-name").text(item.empName || "—");
    $row.find(".upcoming-group-badge").text(item.groupLabel || "—");
    $row.find(".upcoming-dates").text(item.datesLabel || "—");
    $row
      .find(".upcoming-timing-badge")
      .addClass(item.timingClass || "upcoming")
      .text(item.timingLabel || "Upcoming");

    $list.append($row);
  });
}

function fillActivityTablePage() {
  const $body = $("#activityTableBody");
  $body.empty();

  const pagination = renderPaginationBar(
    $("#activityPagination"),
    activityPaginationState,
    "activities",
  );

  activityPaginationState.currentPage = pagination.currentPage;

  const pageItems = dashboardActivityItems.slice(
    pagination.startIndex,
    pagination.endIndex,
  );

  if (!pageItems.length) {
    $body.append(`
      <tr>
        <td colspan="6">
          <div class="py-4 text-center text-[var(--gray-text)]">
            No recent request activity found.
          </div>
        </td>
      </tr>
    `);
    return;
  }

  pageItems.forEach((item) => {
    const typeClass =
      item.type === "cancellation"
        ? "cancellation"
        : item.type === "date_change"
          ? "date-change"
          : "dispatch";

    const $row = $(`
      <tr data-activity-type="${item.type}" data-activity-id="${item.id}">
        <td>
          <span class="activity-id-badge ${typeClass}"></span>
        </td>
        <td><span class="activity-type-label"></span></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `);

    $row.find(".activity-id-badge").text(item.displayId);
    $row.find(".activity-type-label").text(item.typeLabel);
    $row.children().eq(2).text(item.empName || "—");
    $row.children().eq(3).text(formatDate(item.reqDate));
    $row
      .children()
      .eq(4)
      .text(formatDispatchDateRange(item.from, item.to));
    $row.children().eq(5).html(item.statusHtml);

    $body.append($row);
  });
}

function setActivityPage(page) {
  activityPaginationState.currentPage = page;
  fillActivityTablePage();
}

function fillDashboardYearSelector(selector, years, selectedYear) {
  const $sel = $(selector);
  if (!$sel.length) {
    return;
  }

  const options = (years || []).map(
    (year) =>
      `<option value="${year}"${Number(year) === Number(selectedYear) ? " selected" : ""}>${year}</option>`,
  );

  $sel.html(options.join(""));
}

function fillSubmissionTrendYearSelector(years, selectedYear) {
  fillDashboardYearSelector("#submissionTrendYearSel", years, selectedYear);
}

function resolveDashboardSelectedYear(selectedYear, availableYears) {
  const currentYear = getCurrentYear();
  let year = selectedYear == null ? currentYear : Number(selectedYear);

  if (!Number.isFinite(year)) {
    year = currentYear;
  }

  if (!(availableYears || []).includes(year)) {
    year = (availableYears && availableYears[0]) || currentYear;
  }

  return year;
}
