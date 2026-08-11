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

function fillLatestDispatchTablePage() {
  const $body = $("#latestDispatchTableBody");
  $body.empty();

  const pagination = renderPaginationBar(
    $("#latestDispatchPagination"),
    latestDispatchPaginationState,
    "dispatches",
  );

  latestDispatchPaginationState.currentPage = pagination.currentPage;

  const pageItems = dashboardDispatchList.slice(
    pagination.startIndex,
    pagination.endIndex,
  );

  if (!pageItems.length) {
    $body.append(`
      <tr>
        <td colspan="5">
          <div class="py-4 text-center text-[var(--gray-text)]">
            No approved dispatches found.
          </div>
        </td>
      </tr>
    `);
    return;
  }

  pageItems.forEach((item) => {
    const requestId = item.requestId;
    const displayId =
      requestId != null && requestId !== ""
        ? formatDispatchRequestId(requestId)
        : "—";
    const hasRequestId = requestId != null && requestId !== "";

    const $row = $(`
      <tr ${hasRequestId ? `data-request-id="${requestId}"` : 'class="is-static"'}>
        <td>
          <span class="activity-id-badge dispatch"></span>
        </td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `);

    $row.find(".activity-id-badge").text(displayId);
    $row.children().eq(1).text(item.name || "—");
    $row.children().eq(2).text(item.location || "—");
    $row
      .children()
      .eq(3)
      .text(formatDispatchDateRange(item.from, item.to));
    $row.children().eq(4).html(getDocumentReadinessHtml(item));

    if (!hasRequestId) {
      $row.find("td").css("cursor", "default");
    }

    $body.append($row);
  });
}

function setLatestDispatchPage(page) {
  latestDispatchPaginationState.currentPage = page;
  fillLatestDispatchTablePage();
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

function fillStatusOverviewYearSelector(years, selectedYear) {
  fillDashboardYearSelector("#statusOverviewYearSel", years, selectedYear);
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
