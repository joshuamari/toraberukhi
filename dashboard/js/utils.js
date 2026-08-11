// utils.js
function capitalizeWords(str) {
  return String(str || "")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInitials(firstname, surname) {
  const firstInitial = String(firstname || "").charAt(0);
  const lastInitial = String(surname || "").charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function ajaxJsonErrorMessage(xhr, fallbackMessage) {
  if (xhr.status === 404) {
    return "Not Found Error: The requested resource was not found.";
  }

  if (xhr.status === 500) {
    return "Internal Server Error: There was a server error.";
  }

  return fallbackMessage;
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const raw = String(date).trim().split(/[\sT]/)[0];
  const parts = raw.split("-");

  if (parts.length !== 3) {
    return String(date);
  }

  const [year, month, day] = parts;
  const monthName = monthNames2[parseInt(month, 10) - 1] || month;
  return `${day} ${monthName} ${year}`;
}

function formatDispatchDateRange(startDate, endDate) {
  const start = startDate ? formatDate(startDate) : "";
  const end = endDate ? formatDate(endDate) : "";

  if (!start && !end) {
    return "—";
  }

  if (start && end) {
    return `${start} — ${end}`;
  }

  return start || end;
}

function getLocalTodayDateString() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch (e) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

function getRawDispatchStatus(request) {
  if (!request || typeof request !== "object") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(request, "request_status")) {
    return request.request_status;
  }

  if (Object.prototype.hasOwnProperty.call(request, "status")) {
    return request.status;
  }

  return undefined;
}

function normalizeDispatchStatus(rawStatus) {
  if (rawStatus === null || rawStatus === undefined) {
    return "pending";
  }

  const status = String(rawStatus).trim().toLowerCase();

  if (!status) {
    return "pending";
  }

  const map = {
    pending: "pending",
    accepted: "approved",
    approved: "approved",
    rejected: "declined",
    declined: "declined",
    denied: "declined",
    cancelled: "cancelled",
    canceled: "cancelled",
    completed: "completed",
    "0": "cancelled",
    "1": "approved",
  };

  return map[status] || "unknown";
}

function getDispatchEndDateString(request) {
  if (!request || typeof request !== "object") {
    return null;
  }

  const raw =
    request.to !== undefined && request.to !== null && request.to !== ""
      ? request.to
      : request.dispatch_to;

  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const dateOnly = String(raw).trim().split(/[\sT]/)[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }

  return dateOnly;
}

function getDispatchStartDateString(request) {
  if (!request || typeof request !== "object") {
    return null;
  }

  const raw =
    request.from !== undefined && request.from !== null && request.from !== ""
      ? request.from
      : request.dispatch_from;

  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const dateOnly = String(raw).trim().split(/[\sT]/)[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }

  return dateOnly;
}

/**
 * Same effective status model as Request List:
 * approved + past end date ⇒ completed.
 */
function resolveDispatchDisplayStatus(request) {
  const status = normalizeDispatchStatus(getRawDispatchStatus(request));

  if (status === "approved") {
    const endDate = getDispatchEndDateString(request);
    if (endDate && endDate < getLocalTodayDateString()) {
      return "completed";
    }
  }

  return status;
}

function getStatusBadgeHtml(normalizedStatus) {
  const statusConfig = {
    pending: { label: "Pending", className: "pending" },
    approved: { label: "Approved", className: "approved" },
    declined: { label: "Declined", className: "declined" },
    cancelled: { label: "Cancelled", className: "cancelled" },
    completed: { label: "Completed", className: "completed" },
    unknown: { label: "Unknown", className: "" },
  };

  const config = statusConfig[normalizedStatus] || statusConfig.unknown;

  return `<span class="status ${config.className}">${config.label}</span>`;
}

function getChangeRequestStatusBadgeHtml(rawStatus) {
  const normalized = String(rawStatus || "")
    .trim()
    .toLowerCase();

  if (normalized === "approved" || normalized === "accepted") {
    return `<span class="status accepted">Accepted</span>`;
  }

  if (
    normalized === "denied" ||
    normalized === "cancelled" ||
    normalized === "declined" ||
    normalized === "rejected"
  ) {
    return `<span class="status denied">Rejected</span>`;
  }

  if (normalized === "withdrawn") {
    return `<span class="status cancelled">Withdrawn</span>`;
  }

  return `<span class="status pending">Pending</span>`;
}

function getDispatchStatusCounts(requests, year) {
  const source = (requests || []).filter((request) => {
    if (year == null) {
      return true;
    }
    return getDateYear(request.req_date) === year;
  });

  const counts = {
    pending: 0,
    approved: 0,
    declined: 0,
    cancelled: 0,
    completed: 0,
    total: source.length,
  };

  source.forEach((request) => {
    const status = resolveDispatchDisplayStatus(request);
    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }
  });

  return counts;
}

function getDateYear(dateValue) {
  if (!dateValue) {
    return null;
  }

  const dateOnly = String(dateValue).trim().split(/[\sT]/)[0];
  const year = parseInt(dateOnly.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function getDateMonthIndex(dateValue) {
  if (!dateValue) {
    return null;
  }

  const dateOnly = String(dateValue).trim().split(/[\sT]/)[0];
  const parts = dateOnly.split("-");
  if (parts.length < 2) {
    return null;
  }

  const month = parseInt(parts[1], 10);
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return month - 1;
}

function countPendingChangeRequests(cancellations, dateChanges) {
  const isPending = (item) =>
    String(item?.status || "")
      .trim()
      .toLowerCase() === "pending";

  return (
    (cancellations || []).filter(isPending).length +
    (dateChanges || []).filter(isPending).length
  );
}

function countCompletedThisYear(requests, year) {
  return (requests || []).filter((request) => {
    const status = resolveDispatchDisplayStatus(request);
    if (status !== "completed") {
      return false;
    }

    const endYear = getDateYear(getDispatchEndDateString(request));
    return endYear === year;
  }).length;
}

function getApprovedUpcomingRequests(requests) {
  return (requests || []).filter(
    (request) => resolveDispatchDisplayStatus(request) === "approved",
  );
}

function collectSubmissionDates(requests, cancellations, dateChanges) {
  const dates = [];

  (requests || []).forEach((request) => {
    if (request.req_date) {
      dates.push(request.req_date);
    }
  });

  (cancellations || []).forEach((request) => {
    if (request.date_requested) {
      dates.push(request.date_requested);
    }
  });

  (dateChanges || []).forEach((request) => {
    if (request.date_requested) {
      dates.push(request.date_requested);
    }
  });

  return dates;
}

function getAvailableSubmissionYears(requests, cancellations, dateChanges) {
  const currentYear = getCurrentYear();
  let earliest = currentYear;

  collectSubmissionDates(requests, cancellations, dateChanges).forEach(
    (dateValue) => {
      const year = getDateYear(dateValue);
      if (year != null && year <= currentYear && year < earliest) {
        earliest = year;
      }
    },
  );

  const years = [];
  for (let year = currentYear; year >= earliest; year -= 1) {
    years.push(year);
  }
  return years;
}

/**
 * Count of ALL visible submitted requests (dispatch + date change + cancellation)
 * per month for the selected year.
 */
function buildSubmissionTrendDataset(
  requests,
  cancellations,
  dateChanges,
  year,
) {
  const counts = Array.from({ length: 12 }, () => 0);

  const bump = (dateValue) => {
    if (getDateYear(dateValue) !== year) {
      return;
    }
    const monthIndex = getDateMonthIndex(dateValue);
    if (monthIndex == null) {
      return;
    }
    counts[monthIndex] += 1;
  };

  (requests || []).forEach((request) => bump(request.req_date));
  (cancellations || []).forEach((request) => bump(request.date_requested));
  (dateChanges || []).forEach((request) => bump(request.date_requested));

  return monthNamesFull.map((month, index) => ({
    month,
    rate: counts[index],
  }));
}

function computeSubmissionTrendInsight(trendData) {
  if (!Array.isArray(trendData) || trendData.length === 0) {
    return "No request submission data available.";
  }

  let peak = trendData[0];
  let total = 0;

  trendData.forEach((row) => {
    const rate = Number(row.rate) || 0;
    total += rate;
    if (rate > (Number(peak.rate) || 0)) {
      peak = row;
    }
  });

  const peakRate = Number(peak.rate) || 0;

  if (peakRate === 0) {
    return "No requests were submitted across the year.";
  }

  const average = total / trendData.length;
  return `Peak was ${peak.month} (${peakRate}), averaging ${average.toFixed(1)} requests submitted per month.`;
}

function computeStatusInsight(counts) {
  if (!counts || counts.total === 0) {
    return "No dispatch request status data available.";
  }

  const entries = [
    ["Pending", counts.pending],
    ["Approved", counts.approved],
    ["Completed", counts.completed],
    ["Declined", counts.declined],
    ["Cancelled", counts.cancelled],
  ].filter(([, value]) => value > 0);

  entries.sort((a, b) => b[1] - a[1]);
  const [label, value] = entries[0];
  const share = Math.round((value / counts.total) * 100);

  return `${label} is the largest share at ${value} of ${counts.total} requests (${share}%).`;
}

function formatDispatchRequestId(reqId) {
  return `REQ-${String(reqId).padStart(5, "0")}`;
}

function getDocumentReadinessHtml(item) {
  const badges = [];

  if (Object.prototype.hasOwnProperty.call(item, "passValid")) {
    badges.push(
      item.passValid
        ? `<span class="doc-badge is-ok">Passport OK</span>`
        : `<span class="doc-badge is-missing">Missing Passport</span>`,
    );
  } else if (item.passportStatus) {
    badges.push(documentStatusBadge("Passport", item.passportStatus));
  }

  if (Object.prototype.hasOwnProperty.call(item, "visaValid")) {
    badges.push(
      item.visaValid
        ? `<span class="doc-badge is-ok">Visa OK</span>`
        : `<span class="doc-badge is-missing">Missing Visa</span>`,
    );
  } else if (item.visaStatus) {
    badges.push(documentStatusBadge("Visa", item.visaStatus));
  }

  badges.push(getReentryReadinessBadge(item));

  if (!badges.length) {
    return "—";
  }

  return `<div class="doc-readiness">${badges.join("")}</div>`;
}

function getReentryReadinessBadge(item) {
  const status =
    item && item.reentryStatus != null && item.reentryStatus !== ""
      ? String(item.reentryStatus)
      : "missing";

  if (status === "valid" || status === "valid_expiring") {
    return `<span class="doc-badge is-ok">Re-entry OK</span>`;
  }

  if (status === "on_process") {
    return `<span class="doc-badge is-process">Re-entry On Process</span>`;
  }

  if (status === "invalid") {
    return `<span class="doc-badge is-missing">Re-entry Expired</span>`;
  }

  return `<span class="doc-badge is-missing">Missing Re-entry</span>`;
}

function documentStatusBadge(label, status, isReentry) {
  if (isReentry) {
    return getReentryReadinessBadge({ reentryStatus: status });
  }

  if (status === "valid") {
    return `<span class="doc-badge is-ok">${label} OK</span>`;
  }

  if (status === "valid_expiring") {
    return `<span class="doc-badge is-expiring">${label} Expiring</span>`;
  }

  if (status === "on_process") {
    return `<span class="doc-badge is-process">${label} On Process</span>`;
  }

  return `<span class="doc-badge is-missing">Missing ${label}</span>`;
}

function buildActivityFeed(requests, cancellations, dateChanges) {
  const items = [];

  (requests || []).forEach((request) => {
    items.push({
      type: "dispatch",
      typeLabel: "Dispatch Request",
      id: request.req_id,
      displayId: formatDispatchRequestId(request.req_id),
      empName: request.emp_name,
      reqDate: request.req_date,
      from: request.from,
      to: request.to,
      statusHtml: getStatusBadgeHtml(resolveDispatchDisplayStatus(request)),
      sortDate: request.req_date,
    });
  });

  (cancellations || []).forEach((request) => {
    items.push({
      type: "cancellation",
      typeLabel: "Cancellation Request",
      id: request.id,
      displayId:
        request.request_id || `CR-${String(request.id).padStart(5, "0")}`,
      empName: request.employee_name,
      reqDate: request.date_requested,
      from: request.dispatch_start,
      to: request.dispatch_end,
      statusHtml: getChangeRequestStatusBadgeHtml(request.status),
      sortDate: request.date_requested,
    });
  });

  (dateChanges || []).forEach((request) => {
    items.push({
      type: "date_change",
      typeLabel: "Date Change Request",
      id: request.id,
      displayId:
        request.request_id || `DCR-${String(request.id).padStart(5, "0")}`,
      empName: request.employee_name,
      reqDate: request.date_requested,
      from: request.proposed_start || request.current_start,
      to: request.proposed_end || request.current_end,
      statusHtml: getChangeRequestStatusBadgeHtml(request.status),
      sortDate: request.date_requested,
    });
  });

  items.sort((a, b) => {
    const dateDiff = new Date(b.sortDate) - new Date(a.sortDate);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return String(b.displayId).localeCompare(String(a.displayId));
  });

  return items;
}

function getActivityHref(item) {
  if (item.type === "dispatch") {
    return `../requestList/?request_id=${encodeURIComponent(item.id)}`;
  }

  if (item.type === "cancellation") {
    return `../changeRequests/?type=cancellation&openChangeRequestId=${encodeURIComponent(item.id)}`;
  }

  if (item.type === "date_change") {
    return `../changeRequests/?type=date_change&openChangeRequestId=${encodeURIComponent(item.id)}`;
  }

  return "#";
}
