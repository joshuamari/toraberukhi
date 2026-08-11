// render.js
function renderEmployeeDetails(empDetails) {
  const fName = empDetails.firstname;
  const sName = empDetails.surname;
  const initials = getInitials(fName, sName);
  const grpName = empDetails.group;
  const fullName = capitalizeWords(`${fName} ${sName}`);

  $("#empLabel").html(fullName);
  $("#empInitials").html(initials);
  $("#grpLabel").html(grpName);
}

function destroyChart(instance) {
  if (instance) {
    instance.destroy();
  }
  return null;
}

function renderSubmissionTrendChart(dData) {
  const months = dData.map((data) => data.month);
  const rates = dData.map((data) => Number(data.rate) || 0);
  const canvas = document.getElementById("submissionTrendChart");

  if (!canvas) {
    return;
  }

  submissionTrendChartInstance = destroyChart(submissionTrendChartInstance);

  submissionTrendChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Requests submitted",
          data: rates,
          borderColor: "#212121",
          backgroundColor: "#212121",
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: "#212121",
          tension: 0.25,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: "#8d8d8d",
            font: { size: 11 },
          },
          grid: {
            color: "#efefef",
            drawBorder: false,
          },
        },
        x: {
          ticks: {
            color: "#8d8d8d",
            font: { size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
          grid: {
            display: false,
            drawBorder: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const value = tooltipItem.raw;
              return (
                value +
                " " +
                (value === 1 ? "request submitted" : "requests submitted")
              );
            },
          },
        },
      },
    },
  });

  $("#submissionTrendInsight").text(computeSubmissionTrendInsight(dData));
}

function refreshSubmissionTrendChart() {
  const year = dashboardSubmissionTrendYear || getCurrentYear();
  $("#trendYearValue").text(String(year));

  const dataset = buildSubmissionTrendDataset(
    dashboardRequestList,
    dashboardCancellations,
    dashboardDateChanges,
    year,
  );
  renderSubmissionTrendChart(dataset);
}

function refreshStatusOverviewChart(hasRequestData) {
  const year = dashboardStatusOverviewYear || getCurrentYear();
  $("#statusYearValue").text(String(year));

  if (hasRequestData) {
    renderStatusDonut(getDispatchStatusCounts(dashboardRequestList, year));
    return;
  }

  renderStatusDonut({
    pending: 0,
    approved: 0,
    completed: 0,
    declined: 0,
    cancelled: 0,
    total: 0,
  });
}

function renderStatusDonut(counts) {
  const canvas = document.getElementById("statusDonutChart");

  if (!canvas) {
    return;
  }

  statusChartInstance = destroyChart(statusChartInstance);

  const segments = [
    { key: "pending", label: "Pending", value: counts.pending },
    { key: "approved", label: "Approved", value: counts.approved },
    { key: "completed", label: "Completed", value: counts.completed },
    { key: "declined", label: "Declined", value: counts.declined },
    { key: "cancelled", label: "Cancelled", value: counts.cancelled },
  ].filter((item) => item.value > 0);

  $("#statusDonutTotal").text(String(counts.total || 0));

  const $legend = $("#statusDonutLegend");
  $legend.empty();

  if (!segments.length) {
    $("#statusDonutInsight").text("No dispatch request status data available.");
    return;
  }

  segments.forEach((segment) => {
    $legend.append(`
      <span class="dashboard-donut-legend-item">
        <span class="dashboard-donut-legend-swatch" style="background:${STATUS_CHART_COLORS[segment.key]}"></span>
        ${segment.label} (${segment.value})
      </span>
    `);
  });

  statusChartInstance = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: segments.map((item) => item.label),
      datasets: [
        {
          data: segments.map((item) => item.value),
          backgroundColor: segments.map(
            (item) => STATUS_CHART_COLORS[item.key],
          ),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      cutout: "68%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const value = tooltipItem.raw;
              const total = counts.total || 1;
              const pct = Math.round((value / total) * 100);
              return `${tooltipItem.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
    },
  });

  $("#statusDonutInsight").text(computeStatusInsight(counts));
}

function renderDashboard(year, options) {
  const opts = options || {};
  fillSummaryCards(year, opts);

  const availableYears = getAvailableSubmissionYears(
    opts.hasRequestData ? dashboardRequestList : [],
    opts.hasChangeData ? dashboardCancellations : [],
    opts.hasChangeData ? dashboardDateChanges : [],
  );

  dashboardSubmissionTrendYear = resolveDashboardSelectedYear(
    dashboardSubmissionTrendYear,
    availableYears,
  );
  fillSubmissionTrendYearSelector(
    availableYears,
    dashboardSubmissionTrendYear,
  );
  refreshSubmissionTrendChart();

  dashboardStatusOverviewYear = resolveDashboardSelectedYear(
    dashboardStatusOverviewYear,
    availableYears,
  );
  fillStatusOverviewYearSelector(
    availableYears,
    dashboardStatusOverviewYear,
  );
  refreshStatusOverviewChart(!!opts.hasRequestData);

  dashboardActivityItems = buildActivityFeed(
    opts.hasRequestData ? dashboardRequestList : [],
    opts.hasChangeData ? dashboardCancellations : [],
    opts.hasChangeData ? dashboardDateChanges : [],
  );

  activityPaginationState = {
    currentPage: 1,
    itemsPerPage: ACTIVITY_PAGE_SIZE,
    totalItems: dashboardActivityItems.length,
  };

  latestDispatchPaginationState = {
    currentPage: 1,
    itemsPerPage: LATEST_DISPATCH_PAGE_SIZE,
    totalItems: dashboardDispatchList.length,
  };

  fillLatestDispatchTablePage();
  fillActivityTablePage();
}
