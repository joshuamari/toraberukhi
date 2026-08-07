// Sentry.init({
//   dsn: "http://996e6a7f7f64d413dd43124ae5dece7e@o4507730788483072.ingest.us.sentry.io/4507767647436800",
// });
// try {
//   // Your code that might throw an error
//   throw new Error("Test error for user feedback");
// } catch (error) {
//   // Capture the exception and get the event ID
//   const eventId = Sentry.captureException(error);

//   // Show the user feedback dialog
//   Sentry.showReportDialog({
//     eventId: eventId, // Use the captured event ID here
//     title: "We're sorry about that!",
//     subtitle: "Please provide us with some feedback so we can fix the issue.",
//     subtitle2: "We appreciate your help!",
//     labelName: "Name",
//     labelEmail: "Email",
//     labelComments: "Anyare?",
//     labelSubmit: "Send Feedback",
//     successMessage: "Thank you for your feedback!",
//     // You can add your branding or message here if needed
//   });
// }
//#region GLOBALS
const rootFolder = `//${document.location.hostname}`;
const USE_DISPATCH_ACTIVITY_MOCKS = false;
const dispTableID = ["eList", "eListNon"];
let empDetails = [];
let groupList = [];
let monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let monthNames2 = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
let reqList = [];
let allRequests = [];
let cardData = [];
let requestCurrentPage = 1;
let filteredRequests = [];
const REQUESTS_PER_PAGE = 10;
let isSentryModalOpen = false;
let printData = {};
let sortDateAsc = false;
let requestModalReturnTrigger = null;
let openingDispatchRequestId = null;
let selectedDispatchRequest = null;
let pendingChangeRequestType = null;
let changeRequestTriggerElement = null;
let isChangeRequestSubmitting = false;
//#endregion
checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      $(document).ready(function () {
        fillEmployeeDetails();
        Promise.all([getGroups(), getRequests(), getCount(), getHeader()])
          .then(([grps, reqs, counts, header]) => {
            groupList = grps;
            fillGroups(groupList);
            reqList = reqs["data"];
            allRequests = [...reqs["data"]];
            cardData = counts;
            fillCards();
            renderHeader(header);
            renderSalutation(header);
            $(".tab")[0].click();

            const deepLinkedRequestId = getDeepLinkedRequestId();
            if (deepLinkedRequestId) {
              openDispatchRequestFromDeepLink(deepLinkedRequestId);
              clearDeepLinkRequestId();
            }
          })
          .catch((error) => {
            alert(`${error}`);
          });
      });
    } else {
      alert(emp.message);
      window.location.href = `${rootFolder}/PCSKHI/Login`;
    }
  })
  .catch((error) => {
    alert(`${error}`);
  });
//#region BINDS
$(document).on("click", "#menu", function () {
  $(".navigation").addClass("open");
  $("body").addClass("overflow-hidden");
});
$(document).on("click", "#closeNav", function () {
  $(".navigation").removeClass("open");
  $("body").removeClass("overflow-hidden");
});

function isStatusGuideOpen() {
  const popover = document.getElementById("statusGuidePopover");
  return Boolean(popover && !popover.classList.contains("d-none"));
}

function setStatusGuideOpen(isOpen) {
  const button = document.getElementById("dispatch-status-guide-trigger");
  const popover = document.getElementById("statusGuidePopover");

  if (!button || !popover) {
    return;
  }

  button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  popover.classList.toggle("d-none", !isOpen);
  popover.hidden = !isOpen;
}

function toggleStatusGuide(forceOpen) {
  const shouldOpen =
    typeof forceOpen === "boolean" ? forceOpen : !isStatusGuideOpen();
  setStatusGuideOpen(shouldOpen);

  if (shouldOpen) {
    renderStatusGuideIcons();
  }
}

function renderStatusGuideIcons() {
  if (!window.lucide || typeof window.lucide.createIcons !== "function") {
    return;
  }

  window.lucide.createIcons({
    attrs: {
      width: 14,
      height: 14,
      "stroke-width": 2,
    },
  });
}

$(document).on("click", "#dispatch-status-guide-trigger", function (event) {
  event.preventDefault();
  event.stopPropagation();
  toggleStatusGuide();
});

$(document).on("click", function (event) {
  if (!isStatusGuideOpen()) {
    return;
  }

  const wrap = document.getElementById("request-status-group");
  if (wrap && wrap.contains(event.target)) {
    return;
  }

  setStatusGuideOpen(false);
});

$(document).on("keydown", function (event) {
  if (event.key === "Escape" && isStatusGuideOpen()) {
    setStatusGuideOpen(false);
  }
});

$(document).ready(function () {
  renderStatusGuideIcons();
});

$(document).on("change", "#grpSel", function () {
  var sel = $("#grpSel option:selected").text();
  var grp = $(this).val().split(",").length;

  if (grp === 1) {
    $(this).addClass("active");
  } else {
    $(this).removeClass("active");
  }
  $(".grpCont").html(
    `<i class='bx bx-group'></i>
      <span id="lblGrp">${sel}</span>
      <i class='bx bx-x text-[18px] ml-3 z-[100]' id="removeGroup"></i>`
  );
  toggleLoadingAnimation(true);
  requestCurrentPage = 1;
  searchFilter(allRequests, true);
});
$(document).on("click", "#removeGroup", function () {
  $("#grpSel").removeClass("active");
  $(".grpCont").html(
    `   <i class='bx bx-group'></i>
        <span id="lblGrp">All Groups</span>
        <i class='bx bx-chevron-down text-[18px] ml-3'></i>`
  );
  $("#grpSel").val($("#grpSel option:first").val());
  $("#grpSel").change();
});

$(document).on("input", "#monthSel", function () {
  var [year, month] = $(this).val().split("-");
  $(this).removeClass("active");
  var monthName = monthNames[parseInt(month) - 1];
  let display = `Requested Month`;
  let iClass = `<i class='bx bx-chevron-down text-[18px] ml-3'></i>`;
  if (monthName) {
    $(this).addClass("active");
    display = `${monthName} ${year}`;
    iClass = `<i class='bx bx-x text-[18px] ml-3 z-[100]' id="removeMonth"></i>`;
  }
  $(".monthCont").html(`<i class='bx bx-calendar'></i>
                      <span class="" id="monthLabel">${display}</span>
                      ${iClass}
                      `);
  searchFilter(allRequests, true);
});
$(document).on("click", "#removeMonth", function () {
  $("#monthSel").removeClass("active");
  $(".monthCont").html(`<i class='bx bx-calendar'></i>
                      <span class="" id="monthLabel">Requested Month</span>
                      <i class='bx bx-chevron-down text-[18px] ml-3'></i>`);
  $("#monthSel").val("");
  searchFilter(allRequests, true);
});
$(document).on("click", ".tab", function () {
  var indicator = document.querySelector(".indicator");
  var $this = $(this);
  var rect = $this[0].getBoundingClientRect(); // Convert jQuery object to DOM element
  var parentRect = $this.parent()[0].getBoundingClientRect(); // Convert parent jQuery object to DOM element

  indicator.style.width = rect.width + "px";
  indicator.style.left = rect.left - parentRect.left + "px";
  $(".tab span").removeClass("font-semibold text-[var(--dark)] active");
  $(this).find("span").addClass("font-semibold text-[var(--dark)] active");

  searchFilter(allRequests, true);
});
$(document)
  .off("click.dispatchRequestRow", ".dispatch-request-row")
  .on("click.dispatchRequestRow", ".dispatch-request-row", function (event) {
    if (
      $(event.target).closest("button, a, input, select, textarea, label")
        .length
    ) {
      return;
    }

    const requestId = $(this).data("request-id");
    openDispatchRequestById(requestId);
  });
$(document)
  .off("click.dispatchRequestDetails", ".view-dispatch-request")
  .on(
    "click.dispatchRequestDetails",
    ".view-dispatch-request",
    function (event) {
      event.preventDefault();
      event.stopPropagation();

      const requestId =
        $(this).data("request-id") ||
        $(this).closest(".dispatch-request-row").data("request-id");

      openDispatchRequestById(requestId);
    }
  );
$(document).on("input", "#searchbar", function () {
  searchFilter(allRequests, true);
});
$(document).on("click", "#logoutBtn", function () {
  logOut()
    .then((res) => {
      if (res.isSuccess) {
        window.location.href = `${rootFolder}/PCSKHI/Login`;
      }
    })
    .catch((error) => {
      alert(`${error}`);
    });
});

$(document).on("click", ".btn-bug", function () {
  openReport();
});
$(document).on("click", ".sentry-error-embed-wrapper", function () {
  isSentryModalOpen = false;
});

$(document).on("click", "#sortDate", function () {
  sortDateAsc = !sortDateAsc;
  searchFilter(allRequests);
});
$(document).on("click", "#requestPaginationPrev", function () {
  if (requestCurrentPage > 1) {
    requestCurrentPage -= 1;
    renderRequestTable();
  }
});
$(document).on("click", "#requestPaginationNext", function () {
  const totalPages = getRequestTotalPages();
  if (requestCurrentPage < totalPages) {
    requestCurrentPage += 1;
    renderRequestTable();
  }
});
$(document).on("click", ".request-pagination__page", function () {
  const page = parseInt($(this).attr("data-page"), 10);
  if (!isNaN(page) && page !== requestCurrentPage) {
    requestCurrentPage = page;
    renderRequestTable();
  }
});
$(document).on("click", "#attachment", function (event) {
  requestModalReturnTrigger = event.currentTarget;
  openAttachmentForSelectedRequest("attachmentModal", fillAttachment);
});
$(document).on("click", "#attachment2", function (event) {
  requestModalReturnTrigger = event.currentTarget;
  openAttachmentForSelectedRequest("attachmentModal2", fillAttachment2);
});
$(document).on("click", "#btnBack", function () {
  returnToRequestModalFromAttachment("attachmentModal");
});
$(document).on("click", "#btnBack2", function () {
  returnToRequestModalFromAttachment("attachmentModal2");
});
$(document).on("click", "#btnRequestDateChange", function (event) {
  changeRequestTriggerElement = event.currentTarget;
  pendingChangeRequestType = "date_change";
  openChangeRequestModalFromRequest("dateChangeRequestModal", function () {
    populateDateChangeRequestForm(selectedDispatchRequest);
  });
});
$(document).on("click", "#btnRequestCancellation", function (event) {
  changeRequestTriggerElement = event.currentTarget;
  pendingChangeRequestType = "cancellation";
  openChangeRequestModalFromRequest("cancellationRequestModal", function () {
    populateCancellationRequestForm(selectedDispatchRequest);
  });
});
$(document).on("click", "#btnDateChangeBack", function () {
  returnToRequestModalFromChangeRequest("dateChangeRequestModal");
});
$(document).on("click", "#btnCancellationBack", function () {
  returnToRequestModalFromChangeRequest("cancellationRequestModal");
});
$(document).on("click", "#btnSubmitDateChange", function () {
  handleDateChangeSubmit();
});
$(document).on("click", "#btnSubmitCancellation", function () {
  handleCancellationSubmit();
});
$(document).on(
  "input change blur",
  "#dcProposedStartDate, #dcProposedEndDate",
  function () {
    updateDateChangeScheduleComparison();
    validateDateChangeDateFields();
  }
);
$(document).on("input blur", "#dcReason", function () {
  validateDateChangeReasonField();
});
$(document).on("submit", "#dateChangeRequestForm", function (event) {
  event.preventDefault();
  handleDateChangeSubmit();
});
$(document).on("click", "#btnDateChangeClose", function () {
  returnToRequestModalFromChangeRequest("dateChangeRequestModal");
});
$(document).on("click", "#btnCancellationClose", function () {
  returnToRequestModalFromChangeRequest("cancellationRequestModal");
});
$(document).on("click", ".rmvToast", function () {
  $(this).closest(".toasty").remove();
});
//#endregion

//#region FUNCTIONS
function getBootstrapModal(elementId) {
  const element = document.getElementById(elementId);

  if (!element || !window.bootstrap) {
    return { element: null, instance: null };
  }

  return {
    element,
    instance: bootstrap.Modal.getOrCreateInstance(element),
  };
}

function blurFocusedDescendant(modalElement) {
  const activeElement = document.activeElement;

  if (
    activeElement instanceof HTMLElement &&
    modalElement.contains(activeElement)
  ) {
    activeElement.blur();
  }
}

function focusInitialModalControl(modalElement) {
  const focusTarget = modalElement.querySelector(".btn-close");

  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }
}

function openAttachmentModalFromRequest(attachmentModalId, beforeShow) {
  const requestModalElement = document.getElementById("openModal");
  const attachmentModalElement = document.getElementById(attachmentModalId);

  if (!requestModalElement || !attachmentModalElement || !window.bootstrap) {
    return;
  }

  const requestModal =
    bootstrap.Modal.getOrCreateInstance(requestModalElement);
  const attachmentModal =
    bootstrap.Modal.getOrCreateInstance(attachmentModalElement);

  const onRequestHidden = function () {
    requestModalElement.removeEventListener("hidden.bs.modal", onRequestHidden);

    if (typeof beforeShow === "function") {
      beforeShow();
    }

    const onAttachmentShown = function () {
      attachmentModalElement.removeEventListener(
        "shown.bs.modal",
        onAttachmentShown
      );
      focusInitialModalControl(attachmentModalElement);
    };

    attachmentModalElement.addEventListener(
      "shown.bs.modal",
      onAttachmentShown
    );
    attachmentModal.show();
  };

  requestModalElement.addEventListener("hidden.bs.modal", onRequestHidden);
  requestModal.hide();
}

function returnToRequestModalFromAttachment(attachmentModalId) {
  const requestModalElement = document.getElementById("openModal");
  const attachmentModalElement = document.getElementById(attachmentModalId);

  if (!requestModalElement || !attachmentModalElement || !window.bootstrap) {
    return;
  }

  const requestModal =
    bootstrap.Modal.getOrCreateInstance(requestModalElement);
  const attachmentModal =
    bootstrap.Modal.getOrCreateInstance(attachmentModalElement);

  blurFocusedDescendant(attachmentModalElement);

  const onAttachmentHidden = function () {
    attachmentModalElement.removeEventListener(
      "hidden.bs.modal",
      onAttachmentHidden
    );

    const onRequestShown = function () {
      requestModalElement.removeEventListener("shown.bs.modal", onRequestShown);

      if (requestModalReturnTrigger instanceof HTMLElement) {
        requestModalReturnTrigger.focus();
      }
    };

    requestModalElement.addEventListener("shown.bs.modal", onRequestShown);
    requestModal.show();
  };

  attachmentModalElement.addEventListener(
    "hidden.bs.modal",
    onAttachmentHidden
  );
  attachmentModal.hide();
}

function showRequestModal() {
  const requestModalElement = document.getElementById("openModal");

  if (!requestModalElement || !window.bootstrap) {
    return;
  }

  bootstrap.Modal.getOrCreateInstance(requestModalElement).show();
}

/** User-facing request reference only. Does not change real IDs. */
function formatRequestReference(requestId, prefix = "REQ") {
  const digits = String(requestId ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedPrefix = String(prefix ?? "REQ").trim().toUpperCase() || "REQ";
  return `${normalizedPrefix}-${digits.padStart(5, "0")}`;
}

function formatDispatchRequestReference(requestId) {
  return formatRequestReference(requestId, "REQ");
}

function getRawDispatchStatus(request) {
  return request.status;
}

function normalizeDispatchStatus(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return "pending";
  }

  const status = String(rawValue).trim().toLowerCase();

  if (!status) {
    return "pending";
  }

  const map = {
    pending: "pending",

    accepted: "approved",
    approved: "approved",

    declined: "declined",
    rejected: "declined",
    denied: "declined",

    cancelled: "cancelled",
    canceled: "cancelled",

    completed: "completed",

    "0": "cancelled",
    "1": "approved",
  };

  const normalized = map[status];

  if (!normalized) {
    console.warn("Unknown dispatch status:", rawValue);
    return "unknown";
  }

  return normalized;
}

function getTodayDateString() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch (e) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

function getDispatchEndDateString(request) {
  const end = String(request?.to || "").trim();
  if (!end) {
    return "";
  }
  return end.slice(0, 10);
}

function isDispatchPeriodPast(request) {
  const endDate = getDispatchEndDateString(request);
  if (!endDate) {
    return false;
  }
  return endDate < getTodayDateString();
}

/** Approved requests whose dispatch end date is already past count as completed. */
function getEffectiveDispatchStatus(request) {
  const base = normalizeDispatchStatus(getRawDispatchStatus(request));
  if (base === "approved" && isDispatchPeriodPast(request)) {
    return "completed";
  }
  return base;
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

  return `<span class=" status ${config.className} ">
                        ${config.label}
                      </span>`;
}

function getDispatchStatusCounts(requests) {
  const counts = {
    pending: 0,
    approved: 0,
    declined: 0,
    cancelled: 0,
    completed: 0,
    total: requests.length,
    todaytotal: 0,
    todayaccept: 0,
  };

  const today = getTodayDateString();

  requests.forEach((request) => {
    const status = getEffectiveDispatchStatus(request);

    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }

    if (request.req_date === today) {
      counts.todaytotal += 1;
    }

    if (status === "approved" && request.modified) {
      const modifiedDate = String(request.modified).split(" ")[0];
      if (modifiedDate === today) {
        counts.todayaccept += 1;
      }
    }
  });

  return counts;
}

function openReport() {
  if (!isSentryModalOpen) {
    const eventId = Sentry.captureException(new Error("Error report"));

    Sentry.showReportDialog({
      eventId: eventId,
      title: "We're sorry about that!",
      subtitle: "Please provide us with some feedback so we can fix the issue.",
      subtitle2: "We appreciate your help!",
      labelName: "Name",
      labelEmail: "Email",
      labelComments: "What process did you do?",
      labelSubmit: "Send Feedback",
      successMessage: "Thank you for your feedback!",
    });
  }
  isSentryModalOpen = true;
}
function getRequestData(req_id) {
  return fetchDispatchRequest(req_id);
}

function normalizeRequestId(value) {
  const requestId = String(value ?? "").trim();

  if (!requestId) {
    throw new Error("Missing dispatch request ID.");
  }

  return requestId;
}

function getDeepLinkedRequestId() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("request_id");

  if (!requestId || !/^\d+$/.test(requestId)) {
    return null;
  }

  return requestId;
}

function clearDeepLinkRequestId() {
  const url = new URL(window.location.href);
  url.searchParams.delete("request_id");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function openDispatchRequestFromDeepLink(rawRequestId) {
  let requestId;

  try {
    requestId = normalizeRequestId(rawRequestId);
  } catch (error) {
    showRequestLoadError(error.message);
    return;
  }

  const $matchingRow = $(".dispatch-request-row").filter(function () {
    return String($(this).data("request-id")) === String(requestId);
  });

  if ($matchingRow.length) {
    $matchingRow.first().trigger("click");
    return;
  }

  openDispatchRequestById(requestId);
}

function fetchDispatchRequest(requestId) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_request_data.php",
      data: {
        request_id: requestId,
      },
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function (xhr, textStatus) {
        if (textStatus === "parsererror") {
          reject(new Error("The server returned an invalid response."));
          return;
        }

        if (xhr.status === 404) {
          reject(
            new Error("Not Found Error: The requested resource was not found.")
          );
          return;
        }

        if (xhr.status === 500) {
          reject(new Error("Internal Server Error: There was a server error."));
          return;
        }

        const payload = xhr.responseJSON;
        reject(
          new Error(
            (payload && payload.message) ||
              "An error occurred while fetching request data."
          )
        );
      },
    });
  });
}

function clearDispatchRequestModal() {
  $("#openModalTitle").html("Dispatch Request");
  $("#openModalRequestId").text("");
  $("#modalEmpName, #modalGroup, #modalDateFrom, #modalDateTo").text("");
  $("#modalReqName, #modalReqDate, #modalLoc, #modalCountry, #modalReqGrp").text(
    ""
  );
  $("#attachment, #attachment2").text("");
  $("#modalPassport, #modalVisa").empty();
  $("#modalDuration").html(
    `<span class="text-[16px] font-semibold"></span><p>days in total</p>`
  );
  clearDispatchActivityTimeline();
  $("#changeRequestActions").addClass("d-none");
}

function showRequestLoadError(message) {
  showToast("error", message);
}

function findDispatchRequestById(requestId) {
  return allRequests.find((req) => String(req.req_id) === String(requestId));
}

async function openDispatchRequestById(rawRequestId) {
  let requestId;

  try {
    requestId = normalizeRequestId(rawRequestId);
  } catch (error) {
    showRequestLoadError(error.message);
    return;
  }

  if (openingDispatchRequestId === requestId) {
    return;
  }

  openingDispatchRequestId = requestId;

  try {
    clearDispatchRequestModal();
    printData = {};

    const listRequest = findDispatchRequestById(requestId);

    if (!listRequest) {
      throw new Error("Dispatch request not found.");
    }

    selectedDispatchRequest = listRequest;
    populateDispatchRequestModal(listRequest);
    showRequestModal();
  } catch (error) {
    selectedDispatchRequest = null;
    printData = {};
    console.error("Failed to open Dispatch Request:", {
      requestId,
      error,
    });
    showRequestLoadError(
      error.message || "Unable to load the dispatch request."
    );
  } finally {
    openingDispatchRequestId = null;
  }
}

async function loadAttachmentData(requestId) {
  const normalizedId = normalizeRequestId(requestId);
  const cachedRequestId =
    printData &&
    printData.dispatch_request &&
    String(printData.dispatch_request.request_id);

  if (cachedRequestId === normalizedId) {
    return printData;
  }

  const response = await fetchDispatchRequest(normalizedId);

  if (!response || !response.isSuccess || !response.data) {
    throw new Error(
      (response && response.message) ||
        "Unable to load dispatch request attachments."
    );
  }

  printData = response.data;
  return printData;
}

async function openAttachmentForSelectedRequest(attachmentModalId, fillFn) {
  if (!selectedDispatchRequest) {
    showRequestLoadError("No dispatch request is selected.");
    return;
  }

  try {
    const data = await loadAttachmentData(selectedDispatchRequest.req_id);
    openAttachmentModalFromRequest(attachmentModalId, function () {
      fillFn(data);
    });
  } catch (error) {
    console.error("Failed to load attachment data:", {
      requestId: selectedDispatchRequest.req_id,
      error,
    });
    showRequestLoadError(
      error.message || "Unable to load dispatch request attachments."
    );
  }
}

//#region DISPATCH ACTIVITY HISTORY
const DISPATCH_ACTIVITY_EVENT_LABELS = {
  dispatch_submitted: "Dispatch Request Submitted",
  dispatch_approved: "Dispatch Approved",
  dispatch_declined: "Dispatch Declined",
  date_change_requested: "Date Change Request Submitted",
  date_change_accepted: "Date Change Request Accepted",
  date_change_rejected: "Date Change Request Rejected",
  cancellation_requested: "Cancellation Request Submitted",
  cancellation_accepted: "Cancellation Request Accepted",
  cancellation_rejected: "Cancellation Request Rejected",
  dispatch_cancelled: "Dispatch Cancelled",
  dispatch_completed: "Dispatch Completed",
};

const DISPATCH_ACTIVITY_ACTOR_PREFIXES = {
  dispatch_submitted: "Submitted by",
  dispatch_approved: "Approved by",
  dispatch_declined: "Declined by",
  date_change_requested: "Requested by",
  date_change_accepted: "Accepted by",
  date_change_rejected: "Rejected by",
  cancellation_requested: "Requested by",
  cancellation_accepted: "Accepted by",
  cancellation_rejected: "Rejected by",
  dispatch_cancelled: "Cancelled by",
  dispatch_completed: "Completed by",
};

const DISPATCH_ACTIVITY_VISIBLE_STATUSES = [
  "approved",
  "declined",
  "cancelled",
  "completed",
];

const DISPATCH_ACTIVITY_MINIMUM_EVENT_TYPES = {
  approved: ["dispatch_submitted", "dispatch_approved"],
  declined: ["dispatch_submitted", "dispatch_declined"],
  cancelled: ["dispatch_submitted"],
  completed: [
    "dispatch_submitted",
    "dispatch_approved",
    "dispatch_completed",
  ],
};

const DISPATCH_ACTIVITY_EVENT_SORT_ORDER = {
  dispatch_submitted: 10,
  dispatch_approved: 20,
  dispatch_declined: 20,
  date_change_requested: 30,
  date_change_accepted: 40,
  date_change_rejected: 40,
  cancellation_requested: 50,
  cancellation_accepted: 60,
  cancellation_rejected: 60,
  dispatch_cancelled: 70,
  dispatch_completed: 80,
};

const DISPATCH_ACTIVITY_MINIMUM_DESCRIPTIONS = {
  dispatch_submitted: "The dispatch request was submitted.",
  dispatch_approved: "The dispatch request was approved.",
  dispatch_declined: "The dispatch request was declined.",
  dispatch_cancelled: "The dispatch request was cancelled.",
  dispatch_completed: "The dispatch period has ended.",
};

function getDispatchActivity(dispatchRequest) {
  const requestId = String(dispatchRequest?.req_id ?? "").trim();

  if (!requestId) {
    return [];
  }

  if (USE_DISPATCH_ACTIVITY_MOCKS && window.mockDispatchActivity) {
    return [...(window.mockDispatchActivity[requestId] || [])];
  }

  return Array.isArray(dispatchRequest.activityLog)
    ? [...dispatchRequest.activityLog]
    : [];
}

function shouldShowDispatchActivity(normalizedStatus) {
  return DISPATCH_ACTIVITY_VISIBLE_STATUSES.includes(normalizedStatus);
}

function getMinimumDispatchActivityEventTypes(normalizedStatus) {
  return DISPATCH_ACTIVITY_MINIMUM_EVENT_TYPES[normalizedStatus] || [];
}

function normalizeActivityTimestampInput(value, fallbackTime) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T${fallbackTime}`;
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    return raw.replace(" ", "T");
  }

  return raw;
}

function getDispatchSubmittedTimestamp(dispatchRequest) {
  return normalizeActivityTimestampInput(
    dispatchRequest?.req_date,
    "09:15:00+08:00"
  );
}

function getDispatchDecisionTimestamp(dispatchRequest) {
  const modified = normalizeActivityTimestampInput(
    dispatchRequest?.modified,
    "14:10:00+08:00"
  );

  if (modified) {
    return modified;
  }

  return normalizeActivityTimestampInput(
    dispatchRequest?.req_date,
    "14:10:00+08:00"
  );
}

function createMinimumDispatchActivityEvent(dispatchRequest, eventType) {
  const requestId = String(dispatchRequest?.req_id ?? "").trim() || "unknown";
  const requesterName = String(dispatchRequest?.requester_name || "").trim();

  if (eventType === "dispatch_submitted") {
    return {
      activityId: `MIN-${requestId}-dispatch_submitted`,
      eventType: "dispatch_submitted",
      occurredAt: getDispatchSubmittedTimestamp(dispatchRequest),
      actorName: requesterName,
      description: DISPATCH_ACTIVITY_MINIMUM_DESCRIPTIONS.dispatch_submitted,
    };
  }

  const decisionTimestamp = getDispatchDecisionTimestamp(dispatchRequest);

  if (eventType === "dispatch_approved") {
    return {
      activityId: `MIN-${requestId}-dispatch_approved`,
      eventType: "dispatch_approved",
      occurredAt: decisionTimestamp,
      actorName: "KDT President",
      description: DISPATCH_ACTIVITY_MINIMUM_DESCRIPTIONS.dispatch_approved,
    };
  }

  if (eventType === "dispatch_declined") {
    return {
      activityId: `MIN-${requestId}-dispatch_declined`,
      eventType: "dispatch_declined",
      occurredAt: decisionTimestamp,
      actorName: "KDT President",
      description: DISPATCH_ACTIVITY_MINIMUM_DESCRIPTIONS.dispatch_declined,
    };
  }

  if (eventType === "dispatch_completed") {
    const completedTimestamp =
      normalizeActivityTimestampInput(
        dispatchRequest?.to,
        "17:00:00+08:00"
      ) || decisionTimestamp;

    return {
      activityId: `MIN-${requestId}-dispatch_completed`,
      eventType: "dispatch_completed",
      occurredAt: completedTimestamp,
      actorName: "",
      description: DISPATCH_ACTIVITY_MINIMUM_DESCRIPTIONS.dispatch_completed,
    };
  }

  return null;
}

function ensureMinimumDispatchActivity(
  dispatchRequest,
  normalizedStatus,
  events
) {
  const requiredTypes = [
    ...getMinimumDispatchActivityEventTypes(normalizedStatus),
  ];
  const presentTypes = new Set(
    (events || [])
      .map((event) => event?.eventType)
      .filter(Boolean)
  );

  if (normalizedStatus === "cancelled") {
    const hasDecisionEvent = [
      "dispatch_approved",
      "dispatch_declined",
      "dispatch_cancelled",
      "cancellation_accepted",
    ].some((eventType) => presentTypes.has(eventType));

    if (!hasDecisionEvent) {
      requiredTypes.push("dispatch_approved");
    }
  }

  const synthesized = [];

  requiredTypes.forEach((eventType) => {
    if (presentTypes.has(eventType)) {
      return;
    }

    const minimumEvent = createMinimumDispatchActivityEvent(
      dispatchRequest,
      eventType
    );

    if (minimumEvent) {
      presentTypes.add(eventType);
      synthesized.push(minimumEvent);
    }
  });

  return [...(events || []), ...synthesized];
}

function resolveDispatchActivity(dispatchRequest) {
  const normalizedStatus = getEffectiveDispatchStatus(dispatchRequest);

  if (!shouldShowDispatchActivity(normalizedStatus)) {
    return [];
  }

  const sourceEvents = getDispatchActivity(dispatchRequest);
  return ensureMinimumDispatchActivity(
    dispatchRequest,
    normalizedStatus,
    sourceEvents
  );
}

function parseActivityTimestamp(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getActivityEventSortOrder(eventType) {
  return DISPATCH_ACTIVITY_EVENT_SORT_ORDER[eventType] || 100;
}

function sortDispatchActivity(events) {
  return [...events].sort((a, b) => {
    const dateA = parseActivityTimestamp(a?.occurredAt);
    const dateB = parseActivityTimestamp(b?.occurredAt);

    if (!dateA && !dateB) {
      console.warn("Invalid activity timestamps:", a?.occurredAt, b?.occurredAt);
      return (
        getActivityEventSortOrder(a?.eventType) -
        getActivityEventSortOrder(b?.eventType)
      );
    }

    if (!dateA) {
      console.warn("Invalid activity timestamp:", a?.occurredAt);
      return 1;
    }

    if (!dateB) {
      console.warn("Invalid activity timestamp:", b?.occurredAt);
      return -1;
    }

    const timeDiff = dateA - dateB;
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return (
      getActivityEventSortOrder(a?.eventType) -
      getActivityEventSortOrder(b?.eventType)
    );
  });
}

function formatActivityDateTime(occurredAt) {
  const date = parseActivityTimestamp(occurredAt);

  if (!date) {
    return occurredAt || "—";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = monthNames2[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }

  return `${day} ${month} ${year}, ${hours}:${minutes} ${meridiem}`;
}

function getActivityEventLabel(eventType) {
  return DISPATCH_ACTIVITY_EVENT_LABELS[eventType] || "Activity Event";
}

function getActivityActorText(event) {
  const actorName = String(event?.actorName || "").trim();

  if (!actorName) {
    return "";
  }

  const prefix =
    DISPATCH_ACTIVITY_ACTOR_PREFIXES[event.eventType] || "Updated by";
  return `${prefix} ${actorName}`;
}

function buildChangeRequestDeepLinkUrl(event) {
  const changeRequestId = event?.changeRequestId;
  const changeRequestType = String(event?.changeRequestType || "")
    .trim()
    .toLowerCase();

  if (
    changeRequestId === null ||
    changeRequestId === undefined ||
    String(changeRequestId).trim() === "" ||
    !changeRequestType
  ) {
    return null;
  }

  let typeParam = changeRequestType;

  if (
    changeRequestType === "datechange" ||
    changeRequestType === "date-change"
  ) {
    typeParam = "date_change";
  }

  if (typeParam !== "cancellation" && typeParam !== "date_change") {
    return null;
  }

  return `../changeRequests/?type=${encodeURIComponent(
    typeParam
  )}&openChangeRequestId=${encodeURIComponent(String(changeRequestId).trim())}`;
}

function escapeActivityHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildActivityEventMarkup(event) {
  const eventType = event?.eventType || "";
  const title = escapeActivityHtml(getActivityEventLabel(eventType));
  const occurredAt = escapeActivityHtml(formatActivityDateTime(event?.occurredAt));
  const actorText = getActivityActorText(event);
  const description = String(event?.description || "").trim();
  const reference = String(
    event?.changeRequestReference || event?.changeRequestId || ""
  ).trim();
  const deepLinkUrl = buildChangeRequestDeepLinkUrl(event);

  let actorMarkup = "";
  if (actorText) {
    actorMarkup = `<p class="dispatch-activity-actor">${escapeActivityHtml(
      actorText
    )}</p>`;
  }

  let descriptionMarkup = "";
  if (description) {
    descriptionMarkup = `<p class="dispatch-activity-description">${escapeActivityHtml(
      description
    )}</p>`;
  }

  let referenceMarkup = "";
  if (reference && deepLinkUrl) {
    const linkClass =
      "underline decoration-2 decoration-[var(--secondary)] text-[var(--dark)] hover:text-[var(--tertiary)] transition";
    referenceMarkup = `<p class="dispatch-activity-reference"><a href="${escapeActivityHtml(
      deepLinkUrl
    )}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${escapeActivityHtml(
      reference
    )}</a></p>`;
  } else if (reference) {
    referenceMarkup = `<p class="dispatch-activity-reference">${escapeActivityHtml(
      reference
    )}</p>`;
  }

  return `
    <div class="dispatch-activity-item">
      <div class="dispatch-activity-rail" aria-hidden="true">
        <span class="dispatch-activity-marker"></span>
        <span class="dispatch-activity-line"></span>
      </div>
      <div class="dispatch-activity-content">
        <p class="dispatch-activity-title">${title}</p>
        <p class="dispatch-activity-meta">${occurredAt}</p>
        ${actorMarkup}
        ${descriptionMarkup}
        ${referenceMarkup}
      </div>
    </div>
  `;
}

function setDispatchModalActivityLayout(hasActivity) {
  const modalDialog = document.querySelector("#openModal .modal-dialog");
  const bodyLayout = document.getElementById("dispatchModalBodyLayout");
  const activitySection = document.getElementById("dispatchActivityHistory");

  if (modalDialog) {
    modalDialog.classList.toggle(
      "dispatch-modal-dialog--with-activity",
      hasActivity
    );
  }

  if (bodyLayout) {
    bodyLayout.classList.toggle("has-activity", hasActivity);
  }

  if (activitySection) {
    activitySection.classList.toggle("d-none", !hasActivity);
    activitySection.hidden = !hasActivity;
  }
}

function clearDispatchActivityTimeline() {
  const $timeline = $("#dispatchActivityTimeline");

  if ($timeline.length) {
    $timeline.empty();
  }

  setDispatchModalActivityLayout(false);
}

function renderDispatchActivityHistory(dispatchRequest) {
  const $timeline = $("#dispatchActivityTimeline");

  if (!$timeline.length) {
    setDispatchModalActivityLayout(false);
    return;
  }

  const activityEvents = sortDispatchActivity(
    resolveDispatchActivity(dispatchRequest)
  );

  if (!activityEvents.length) {
    clearDispatchActivityTimeline();
    return;
  }

  setDispatchModalActivityLayout(true);
  $timeline.html(activityEvents.map(buildActivityEventMarkup).join(""));
}
//#endregion

function populateDispatchRequestModal(req) {
  const name = req.emp_name;
  const grp = req.group_name;
  const passValidity = req.passValid;
  const visaValidity = req.visaValid;
  const startDate = req.from;
  const endDate = req.to;
  const reqName = req.requester_name;
  const reqDate = req.req_date;
  const normalizedStatus = getEffectiveDispatchStatus(req);
  const location = req.specific_loc;
  const country = req.location;
  const duration = req.duration;
  const reqGrp = req.requester_group;

  const empnum = req.emp_number;
  const [last, given] = name.split(",");
  const surname = last.toUpperCase();
  const first = given.replace(/\s+/g, "");
  formatStatus(normalizedStatus);
  $("#openModalRequestId").text(
    formatRequestReference(req.req_id, "REQ") || "—"
  );
  formatVisaPassport(visaValidity, passValidity);
  $("#modalEmpName").text(name);
  $("#modalGroup").text(grp);
  $("#modalDateFrom").text(formatDate(startDate));
  $("#modalDateTo").text(formatDate(endDate));
  $("#modalReqName").text(reqName);
  $("#modalReqDate").text(formatDate(reqDate));
  $("#modalLoc").text(location);
  $("#modalCountry").text(country);
  $("#modalReqGrp").text(reqGrp);

  $("#attachment").text(`${empnum}_${surname}${first}_DispatchRequest`);
  $("#attachment2").text(`${empnum}_${surname}${first}_WorkHistory`);

  if (duration > 1) {
    $("#modalDuration").html(
      `<span class="text-[16px] font-semibold" >${duration}</span>
       <p>days in total</p>`
    );
  } else {
    $("#modalDuration").html(
      `<span class="text-[16px] font-semibold" >${duration}</span>
       <p>day in total</p>`
    );
  }
  renderDispatchActivityHistory(req);
  updateChangeRequestActionsVisibility(req);
}

function fillOpenModal(trID) {
  openDispatchRequestById(trID);
}

function fillAttachment(data) {
  $(".siteDispatch").empty();
  $("#printJap, #printPh, #printThird").text("");
  let date = data.dispatch_request.dh_date;
  let company = data.dispatch_request.company_name;
  const departmentSelected = data.dispatch_request.dept_id;
  let khi = data.dispatch_request.req_name;
  let khibu = data.dispatch_request.request_dept;
  let name = data.dispatch_request.emp_name;
  let from = data.dispatch_request.start;
  let to = data.dispatch_request.end;
  let country = data.dispatch_request.location_id;
  let loc = data.dispatch_request.specific_loc;
  let invitation = data.dispatch_request.invitation_id;
  let workOrder = data.dispatch_request.work_order;
  let project = data.dispatch_request.project_name;
  let siteDispatch = data.dispatch_request.site_dispatch;
  let salary = data.dispatch_request.allowance[0].amount;
  let salaryOthers = data.dispatch_request.allowance[1].amount;
  let khiTel = data.dispatch_request.req_tel;
  let khiFax = data.dispatch_request.req_fax;
  let gap = data.dispatch_request.gap_name;
  let cdcp = data.dispatch_request.cdcp_name;
  let gap_tel = data.dispatch_request.gap_tel;
  let cdcp_tel = data.dispatch_request.cdcp_tel;

  if (country === 1) {
    insertIconCountry(1);
    $("#printJap").text(loc);
  }
  if (country === 2) {
    insertIconCountry(2);
    $("#printPh").text(loc);
  }
  if (country === 3) {
    insertIconCountry(3);
    $("#printThird").text(loc);
  }
  if (invitation === 1) {
    insertIconInvitation(1);
  }
  if (invitation === 2) {
    insertIconInvitation(2);
  }
  if (invitation === 3) {
    insertIconInvitation(3);
  }
  if (siteDispatch === 1) {
    $(".siteDispatch").html(`<i class="bx bx-x down"></i>`);
  }
  if (siteDispatch === 0) {
    $(".siteDispatch").empty();
  }
  $("#printCompany").text(company);
  $("#printKHI").text(khi);
  $("#printBU").text(khibu);
  $("#printName").text(formatName(name));
  $("#printFrom").text(from);
  $("#printTo").text(to);
  $("#printWO").text(workOrder);
  $("#printProject").text(project);
  $("#printSalary").text(salary);
  $("#printSalaryOthers").text(salaryOthers);
  $("#printDate").text(date);
  $("#printTel").text(khiTel);
  $("#printFax").text(khiFax);
  $("#printGAPName").text(gap);
  $("#printCDCPName").text(cdcp);
  $("#printGAPNumber").text(gap_tel);
  $("#printCDCPNumber").text(cdcp_tel);

  if (departmentSelected == 15) {
    const newAddress = ": 1, Kawasaki cho, Sakaide city, Kagawa 762-8507 Japan";
    $("#disAddress").html(
      '<span id="location" class="font-semibold text-[10px]">SAKAIDE</span>' +
        newAddress
    );
    $("#disPhone").text("Phone: 81-(0)877-46-0315");
    $("#disFax").text("Facsimile: 81-(0)877-46-4397");
    $("#printCopyInfoLabelOne")[0].firstChild.nodeValue =
      "Sakaide Personnel and Labor Sec., Ship&Offshore:";
    $("#printCopyInfoLabelTwo")[0].firstChild.nodeValue =
      "General Affairs & Personal Gr.:";
  } else {
    const newAddress =
      ": 1-1, Higashikawasaki 3-Chome, Chuo-ku, KOBE 650-8670 Japan";
    $("#disAddress").html(
      '<span id="location" class="font-semibold text-[10px]">KOBE</span>' +
        newAddress
    );
    $("#disPhone").text("Phone: 81-(0)78-682-5202");
    $("#disFax").text("Facsimile:81-(0)78-682-5574");
    $("#printCopyInfoLabelOne")[0].firstChild.nodeValue =
      "General Affairs & Personal Gr.:";
    $("#printCopyInfoLabelTwo")[0].firstChild.nodeValue =
      "Control Dept Corporate Planning Gr.:";
  }
}

function formatDate(date) {
  var [year, month, day] = date.split("-");
  monthName = monthNames2[parseInt(month) - 1];

  return day + " " + monthName + " " + year;
}

function formatDateRange(start, end) {
  if (!start && !end) {
    return "—";
  }

  if (!start) {
    return formatDate(end);
  }

  if (!end) {
    return formatDate(start);
  }

  return `${formatDate(start)} — ${formatDate(end)}`;
}

function formatName(name) {
  const [last, given] = name.split(",");
  const surname = last.toUpperCase();
  return given + " " + surname;
}
function fillAttachment2(data) {
  var dates = data.dispatch_request.date_request;
  var name = data.dispatch_request.emp_name;
  const departmentSelected = data.dispatch_request.dept_id;
  const company_desc =
    departmentSelected != 15 ? data.dispatch_request.company_desc : "坂出工場";
  const comp_loc =
    departmentSelected != 15 ? "大阪入国管理局　様" : "高松入国管理局　様";
  const [day, monthName, year] = dates.split(" ");
  const month = monthNames2.indexOf(monthName);
  var str = "";
  $("#workHistoryTable tbody").empty();
  if (data.work_history.length != 0) {
    $.each(data.work_history, function (index, item) {
      if (item.end_year == null) {
        item.end_year = "";
      }
      if (item.end_month == null) {
        item.end_month = "";
      }
      if (item.end_year == "-0001") {
        item.end_year = "";
      }
      if (item.end_month == "11") {
        item.end_month = "";
      }
      str = `
      <tr>
        <td>${item.start_year}</td>
        <td>${item.start_month}</td>
        <td>${item.end_year}</td>
        <td>${item.end_month}</td>
        <td>${item.company_name}</td>
        <td>${item.company_business}</td>
        <td>${item.business_content}</td>
        <td>${item.location}</td>
      </tr>
    `;
      $("#workHistoryTable tbody").append(str);
    });
  } else {
    str = `
    <tr>
      <td colspan="9" class="text-center">
        No data found.
      </td>
    </tr>
    `;

    $("#workHistoryTable tbody").append(str);
  }

  $("#whYear").text(year);
  $("#whMonth").text(month + 1);
  $("#whDay").text(day);
  $("#whName").text(name);
  $("#whBusiness").text(data.dispatch_request.business);
  $("#dic").text(data.dispatch_request.dept_in_charge);
  $("#dic_name").text(data.dispatch_request.dic_name);
  $("#dic_tel").text(data.dispatch_request.dic_tel);
  $("#comp_jap").text(data.dispatch_request.company_jap);
  $("#comp_desc").text(company_desc);
  $("#comp_loc").text(comp_loc);
  $("#company_n_desc").text(
    `${data.dispatch_request.company_jap} ${data.dispatch_request.company_desc}`
  );
}
function insertIconCountry(id) {
  $(".countries").empty();

  const iconElement = $("<i>").addClass("bx bx-x down");

  const countriesContainers = $(".countries");
  if (id === 1) {
    countriesContainers.eq(0).append(iconElement);
  }
  if (id === 2) {
    countriesContainers.eq(1).append(iconElement);
  }
  if (id === 3) {
    countriesContainers.eq(2).append(iconElement);
  }
}
function insertIconInvitation(id) {
  $(".inv").empty();

  const iconElement = $("<i>").addClass("bx bx-x down");

  const countriesContainers = $(".inv");
  if (id === 1) {
    countriesContainers.eq(0).append(iconElement);
  }
  if (id === 2) {
    countriesContainers.eq(1).append(iconElement);
  }
  if (id === 3) {
    countriesContainers.eq(2).append(iconElement);
  }
}
function getRequests() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_requests.php",
      dataType: "json",
      success: function (response) {
        const req = response;
        resolve(req);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching requests.");
        }
      },
    });
  });
}
function getCount() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_count_requests.php",
      dataType: "json",
      success: function (response) {
        const count = response;
        resolve(count);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching counts.");
        }
      },
    });
  });
}
function fillCards() {
  const counts = getDispatchStatusCounts(allRequests);
  const pending = counts.pending;
  const approved = counts.approved;
  const declined = counts.declined;
  const cancelled = counts.cancelled;
  const completed = counts.completed;
  const todayTotal = counts.todaytotal;
  const todayApproved = counts.todayaccept;
  const total = counts.total;

  $("#tab-2 small").remove();
  if (pending != 0) {
    $("#tab-2").append(`
         <small
                      class="rounded-full w-[14px] h-[14px] bg-[var(--dark)] text-white text-[8px] flex items-center justify-content-center font-semibold" >${pending}</small>
      `);
  }
  $("#cardPending").text(pending);
  $("#cardApproved").text(approved);
  if (todayApproved != 0) {
    $("#cardTodayApproved").html(
      `<small class="font-semibold" >+${todayApproved} today</small>`
    );
  }
  $("#cardDeclined").text(declined);
  $("#cardCancelled").text(cancelled);
  $("#cardCompleted").text(completed);
  if (todayTotal != 0) {
    $("#cardTodayTotal").html(
      `<small class="font-semibold" >+${todayTotal} today</small>`
    );
  }
  $("#cardTotal").text(total);
}

function formatStatus(normalizedStatus) {
  const statusLabels = {
    pending: "Pending",
    approved: "Approved",
    declined: "Declined",
    cancelled: "Cancelled",
    completed: "Completed",
    unknown: "Unknown",
  };
  const statusLabel = statusLabels[normalizedStatus] || statusLabels.unknown;
  const statusClass =
    normalizedStatus === "unknown" ? "unknown" : normalizedStatus;
  $("#openModalTitle").html(
    `  Dispatch Request<span class="status lg ${statusClass} ms-3">${statusLabel}</span>`
  );
}
function formatVisaPassport(visa, passport) {
  function updateModal(id, isValid) {
    const iconClass = isValid
      ? "bx-check text-[var(--darkest-100)]"
      : "bx-x text-[var(--red-200)]";
    const className = isValid
      ? "text-[var(--darkest-100)]"
      : "text-[var(--red-200)]";
    const statusText = isValid ? "Valid" : "Invalid";
    $(id).html(`
      <i class='bx ${iconClass} text-[18px]'></i>
      <p class="text-[14px] ${className}">${statusText} ${
      id === "#modalPassport" ? "Passport" : "Visa"
    }</p>
    `);
  }

  updateModal("#modalPassport", passport);
  updateModal("#modalVisa", visa);
}

function getRequestTotalPages() {
  return Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE));
}

function getRequestPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("ellipsis-start");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis-end");
  }

  pages.push(totalPages);
  return pages;
}

function renderRequestPaginationIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons({
      attrs: {
        width: 16,
        height: 16,
        "stroke-width": 2,
      },
    });
  }
}

function renderRequestPagination() {
  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / REQUESTS_PER_PAGE));

  if (requestCurrentPage > totalPages) {
    requestCurrentPage = totalPages;
  }
  if (requestCurrentPage < 1) {
    requestCurrentPage = 1;
  }

  const startIndex = (requestCurrentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = Math.min(startIndex + REQUESTS_PER_PAGE, totalItems);
  const rangeStart = totalItems > 0 ? startIndex + 1 : 0;
  const rangeEnd = totalItems > 0 ? endIndex : 0;

  $("#requestPaginationInfo").text(
    `Showing ${rangeStart} to ${rangeEnd} of ${totalItems} requests`
  );

  $("#requestPaginationPrev").prop("disabled", requestCurrentPage <= 1);
  $("#requestPaginationNext").prop(
    "disabled",
    totalItems === 0 || requestCurrentPage >= totalPages
  );

  const pagesMarkup = getRequestPageNumbers(requestCurrentPage, totalPages)
    .map((page) => {
      if (typeof page === "string") {
        return `<span class="request-pagination__ellipsis">...</span>`;
      }

      const isActive = page === requestCurrentPage;
      return `<button type="button" class="request-pagination__page${
        isActive ? " is-active" : ""
      }" data-page="${page}">${page}</button>`;
    })
    .join("");

  $("#requestPaginationPages").html(pagesMarkup);
  renderRequestPaginationIcons();
}

function renderRequestTable() {
  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / REQUESTS_PER_PAGE));

  if (requestCurrentPage > totalPages) {
    requestCurrentPage = totalPages;
  }
  if (requestCurrentPage < 1) {
    requestCurrentPage = 1;
  }

  const startIndex = (requestCurrentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = Math.min(startIndex + REQUESTS_PER_PAGE, totalItems);
  const pageItems = filteredRequests.slice(startIndex, endIndex);

  fillTable(pageItems);
  renderRequestPagination();
}

function fillTable(sampleData) {
  $("#tableBody").empty();
  var str = "";
  if (sampleData.length != 0) {
    $.each(sampleData, function (index, item) {
      const requestReference =
        formatRequestReference(item.req_id, "REQ") || "—";
      str = `
    <tr class="dispatch-request-row" data-request-id="${item.req_id}">
      <td class="whitespace-nowrap">${requestReference}</td>
      <td>${item.emp_name}</td>
      <td>${formatDate(item.req_date)}</td>
      <td class="whitespace-nowrap">${formatDateRange(item.from, item.to)}</td>
      <td>${getStatusBadgeHtml(getEffectiveDispatchStatus(item))}</td>
      <td>${
        item.passValid === true
          ? `  <span class="validity "><i class='bx bx-check text-[18px]   font-semibold'></i></span>`
          : ` <span class="validity "><i class='bx bx-x text-[18px] font-semibold'></i></span>`
      }</td>
        <td>${
          item.visaValid === true
            ? `  <span class="validity "><i class='bx bx-check text-[18px]   font-semibold'></i></span>`
            : ` <span class="validity "><i class='bx bx-x text-[18px] font-semibold'></i></span>`
        }</td>
      <td>
        <div class="openIcon view-dispatch-request" title="Open item" data-request-id="${item.req_id}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"   width="144px" height="144px">
            <path d="M 41.470703 4.9863281 A 1.50015 1.50015 0 0 0 41.308594 5 L 27.5 5 A 1.50015 1.50015 0 1 0 27.5 8 L 37.878906 8 L 22.439453 23.439453 A 1.50015 1.50015 0 1 0 24.560547 25.560547 L 40 10.121094 L 40 20.5 A 1.50015 1.50015 0 1 0 43 20.5 L 43 6.6894531 A 1.50015 1.50015 0 0 0 41.470703 4.9863281 z M 12.5 8 C 8.3754991 8 5 11.375499 5 15.5 L 5 35.5 C 5 39.624501 8.3754991 43 12.5 43 L 32.5 43 C 36.624501 43 40 39.624501 40 35.5 L 40 25.5 A 1.50015 1.50015 0 1 0 37 25.5 L 37 35.5 C 37 38.003499 35.003499 40 32.5 40 L 12.5 40 C 9.9965009 40 8 38.003499 8 35.5 L 8 15.5 C 8 12.996501 9.9965009 11 12.5 11 L 22.5 11 A 1.50015 1.50015 0 1 0 22.5 8 L 12.5 8 z" fill="rgba(85, 85, 85, 0.5)"  stroke="rgba(85, 85, 85, 0.5)" stroke-width="1"/>
          </svg>
        </div>
      </td>
    </tr>`;

      $("#tableBody").append(str);
    });
  } else {
    str = `<td colspan="8" class="h-[280px]"><div class="flex items-center justify-center flex-col gap-3 py-20"><img src="../images/empty.png"   class="w-[150px] h-auto opacity-[0.75] pt-20" alt="empty">
    <h5 class="font-semibold text-[16px] text-[var(--gray-text)]">No item found</h5>
    <p class="text-[var(--gray-text)] pb-20">Try adjusting your search or filter to find what you're looking for.</p>
    </div></td>`;
    $("#tableBody").append(str);
  }
}

function searchFilter(req_list, resetPage = false) {
  if (resetPage) {
    requestCurrentPage = 1;
  }

  const keyword = $("#searchbar").val().toLowerCase().trim();
  const grps = $("#grpSel").val().split(",").map(Number);
  const dateFilter = $("#monthSel").val();
  const activeTabId = $("button").has("span.active").attr("id");
  const tabFilters = {
    "tab-2": "pending",
    "tab-3": "approved",
    "tab-4": "declined",
    "tab-5": "cancelled",
    "tab-6": "completed",
  };
  const selectedStatus = tabFilters[activeTabId];
  const results = req_list.filter((emp) => {
    const searchMatch =
      emp.emp_name.toLowerCase().includes(keyword) ||
      emp.requester_name.toLowerCase().includes(keyword);

    const groupMatch = grps.includes(parseInt(emp.group_id));

    const dateMatch = dateFilter ? emp.req_date.startsWith(dateFilter) : true;

    const normalizedStatus = getEffectiveDispatchStatus(emp);
    const statusMatch =
      selectedStatus === undefined || normalizedStatus === selectedStatus;

    return searchMatch && groupMatch && statusMatch && dateMatch;
  });

  results.sort((a, b) => {
    return sortDateAsc
      ? new Date(a.req_date) - new Date(b.req_date)
      : new Date(b.req_date) - new Date(a.req_date);
  });

  filteredRequests = [...results];
  renderRequestTable();
}
function getGroups() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_groups.php",
      dataType: "json",
      success: function (response) {
        const grps = response;
        resolve(grps);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred.");
        }
      },
    });
  });
}
function getHeader() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "api/get_header.php",
      dataType: "json",
      success: function (response) {
        if (!response || !response.success) {
          reject(
            (response && response.message) || "Failed to load header data."
          );
          return;
        }
        resolve(response.data);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while loading header data.");
        }
      },
    });
  });
}
function renderHeader(data) {
  const pres = data?.president;
  const co = data?.care_of;

  if (!pres?.name) {
    $("#requestHeader").empty();
    return;
  }

  $("#requestHeader").html(`
    <p class="font-semibold font-['Arial']">
      ${pres.prefix} ${pres.name} (President)
    </p>
    ${
      co?.name
        ? `<p class="font-semibold font-['Arial']">(c/o ${co.prefix} ${co.name})</p>`
        : ""
    }
  `);
}
function renderSalutation(data) {
  const pres = data?.president;
  let salutation = "Dear Sir,";

  if (pres?.prefix === "Ms.") {
    salutation = "Dear Madam,";
  }

  $("#requestSalutation").text(salutation);
}
function fillGroups(grps) {
  const groupIDS = grps.map((obj) => obj.id);
  var grpSelect = $("#grpSel");
  grpSelect.html(`<option value=${groupIDS.toString()}>All Groups</option>`);
  $.each(grps, function (index, item) {
    var option = $("<option>")
      .attr("value", item.id)
      .text(item.abbr)
      .attr("grp-id", item.id);
    grpSelect.append(option);
  });
}
function checkAccess() {
  // const response = {
  //   isSuccess: true,
  //   data: {
  //     empNum: 464,
  //     empGroup: {
  //       id: 21,
  //       name: "System Group",
  //       acr: "SYS",
  //     },
  //     empName: {
  //       firstname: "Collene Keith",
  //       surname: "Medrano",
  //     },
  //   },
  // };
  // const response = {
  //   isSuccess: false,
  //   message: "Access Denied",
  // };
  // const response = {
  //   isSuccess: false,
  //   message: "Not logged in",
  // };
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "../global/check_login.php",
      dataType: "json",
      success: function (data) {
        const acc = data;
        resolve(acc);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while checking login.");
        }
      },
    });
    // resolve(response);
  });
}
function fillEmployeeDetails() {
  const fName = empDetails.firstname;
  const sName = empDetails.surname;
  const initials = getInitials(fName, sName);
  const grpName = empDetails.group;
  const fullName = capitalizeWords(`${fName} ${sName}`);
  $("#empLabel").html(`${fullName}`);
  $("#empInitials").html(`${initials}`);
  $("#grpLabel").html(`${grpName}`);
}
function capitalizeWords(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
function getInitials(firstname, surname) {
  let initials = "";
  var firstInitial = firstname.charAt(0);
  var lastInitial = surname.charAt(0);
  initials = `${firstInitial}${lastInitial}`;
  return initials.toUpperCase();
}

function exportTable() {
  const yr = $("#yearSel").val();
  TableToExcel.convert(document.getElementById("repTable"), {
    name: `Dispatch_Report_${yr}.xlsx`,
    sheet: {
      name: `${yr}`,
    },
  });
}
function toggleLoadingAnimation(show) {
  if (show) {
    $("#appendHere").append(`
          <div class="top-0 backdrop-blur-sm bg-gray/30 h-full flex justify-center items-center flex-col pb-5 absolute w-full" id="loadingAnimation">
              <div class="relative">
                  <div class="grayscale-[70%] w-[400px]">
                      <img src="../images/Frame 1.gif" alt="loader" class="w-full" />
                  </div>
                  <div class="absolute bottom-0 flex-col w-full text-center flex justify-center items-center gap-2">
                      <div class="title fw-semibold fs-5">
                          Loading data . . .
                      </div>
                      <div class="text">
                          Please wait while we fetch the dispatch report details.
                      </div>
                  </div>
              </div>
          </div>
      `);
  } else {
    $("#loadingAnimation").remove();
  }
}
function logOut() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "../global/logout.php",
      dataType: "json",
      success: function (response) {
        const res = response;
        resolve(res);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while logging out.");
        }
      },
    });
  });
}

//#region CHANGE REQUEST WORKFLOW
const CHANGE_REQUEST_ENDPOINTS = {
  dateChange: "../changeRequests/php/create_change_request.php",
  cancellation: "../changeRequests/php/create_change_request.php",
};

function canRequestDispatchChange(request) {
  // Only an active approved dispatch may initiate date-change / cancellation.
  // pending, declined, cancelled, and completed are read-only.
  const normalizedStatus = getEffectiveDispatchStatus(request);
  return normalizedStatus === "approved";
}

function hasPendingDateChangeRequest(request) {
  return Boolean(request?.pending_date_change_request);
}

function hasPendingCancellationRequest(request) {
  return Boolean(request?.pending_cancellation_request);
}

function hasPendingChangeRequest(request) {
  return (
    hasPendingDateChangeRequest(request) ||
    hasPendingCancellationRequest(request)
  );
}

function updateChangeRequestActionsVisibility(request) {
  const actionsEl = document.getElementById("changeRequestActions");
  const dateChangeBtn = document.getElementById("btnRequestDateChange");
  const cancellationBtn = document.getElementById("btnRequestCancellation");
  const pendingNoteEl = document.getElementById("changeRequestPendingNote");

  if (!actionsEl || !dateChangeBtn || !cancellationBtn) {
    return;
  }

  const eligible = canRequestDispatchChange(request);
  const hasPending = hasPendingChangeRequest(request);
  const disableReason = hasPending
    ? "A change request is already pending review for this dispatch."
    : "";

  if (!eligible) {
    actionsEl.classList.add("d-none");
    dateChangeBtn.disabled = false;
    cancellationBtn.disabled = false;
    dateChangeBtn.removeAttribute("title");
    cancellationBtn.removeAttribute("title");
    dateChangeBtn.removeAttribute("aria-disabled");
    cancellationBtn.removeAttribute("aria-disabled");
    if (pendingNoteEl) {
      pendingNoteEl.classList.add("d-none");
    }
    return;
  }

  actionsEl.classList.remove("d-none");
  dateChangeBtn.classList.remove("d-none");
  cancellationBtn.classList.remove("d-none");

  dateChangeBtn.disabled = hasPending;
  cancellationBtn.disabled = hasPending;
  dateChangeBtn.setAttribute("aria-disabled", hasPending ? "true" : "false");
  cancellationBtn.setAttribute("aria-disabled", hasPending ? "true" : "false");

  if (hasPending) {
    dateChangeBtn.setAttribute("title", disableReason);
    cancellationBtn.setAttribute("title", disableReason);
  } else {
    dateChangeBtn.removeAttribute("title");
    cancellationBtn.removeAttribute("title");
  }

  if (pendingNoteEl) {
    pendingNoteEl.classList.toggle("d-none", !hasPending);
  }

  renderChangeRequestIcons(actionsEl);
}

function calculateInclusiveDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

function formatNetDayChange(currentDays, proposedDays) {
  const net = proposedDays - currentDays;

  if (net > 0) {
    return `+${net} days`;
  }

  if (net < 0) {
    return `${net} days`;
  }

  return "0 days";
}

function formatLocationDisplay(request) {
  const specific = request.specific_loc || "";
  const country = request.location || "";

  if (specific && country) {
    return `${specific}, ${country}`;
  }

  return specific || country || "—";
}

function openChangeRequestModalFromRequest(changeRequestModalId, beforeShow) {
  const requestModalElement = document.getElementById("openModal");
  const changeRequestModalElement = document.getElementById(changeRequestModalId);

  if (!requestModalElement || !changeRequestModalElement || !window.bootstrap) {
    return;
  }

  const requestModal =
    bootstrap.Modal.getOrCreateInstance(requestModalElement);
  const changeRequestModal =
    bootstrap.Modal.getOrCreateInstance(changeRequestModalElement);

  const onRequestHidden = function () {
    requestModalElement.removeEventListener("hidden.bs.modal", onRequestHidden);

    if (typeof beforeShow === "function") {
      beforeShow();
    }

    const onChangeRequestShown = function () {
      changeRequestModalElement.removeEventListener(
        "shown.bs.modal",
        onChangeRequestShown
      );
      focusInitialModalControl(changeRequestModalElement);
      renderChangeRequestIcons(changeRequestModalElement);
    };

    changeRequestModalElement.addEventListener(
      "shown.bs.modal",
      onChangeRequestShown
    );
    changeRequestModal.show();
  };

  requestModalElement.addEventListener("hidden.bs.modal", onRequestHidden);
  requestModal.hide();
}

function returnToRequestModalFromChangeRequest(changeRequestModalId) {
  if (isChangeRequestSubmitting) {
    return;
  }

  const requestModalElement = document.getElementById("openModal");
  const changeRequestModalElement = document.getElementById(changeRequestModalId);

  if (!requestModalElement || !changeRequestModalElement || !window.bootstrap) {
    return;
  }

  const requestModal =
    bootstrap.Modal.getOrCreateInstance(requestModalElement);
  const changeRequestModal =
    bootstrap.Modal.getOrCreateInstance(changeRequestModalElement);

  blurFocusedDescendant(changeRequestModalElement);

  const onChangeRequestHidden = function () {
    changeRequestModalElement.removeEventListener(
      "hidden.bs.modal",
      onChangeRequestHidden
    );

    const onRequestShown = function () {
      requestModalElement.removeEventListener("shown.bs.modal", onRequestShown);

      if (changeRequestTriggerElement instanceof HTMLElement) {
        changeRequestTriggerElement.focus();
      }
    };

    requestModalElement.addEventListener("shown.bs.modal", onRequestShown);
    requestModal.show();
  };

  changeRequestModalElement.addEventListener(
    "hidden.bs.modal",
    onChangeRequestHidden
  );
  changeRequestModal.hide();
}

function renderChangeRequestIcons(container) {
  if (!window.lucide || typeof window.lucide.createIcons !== "function") {
    return;
  }

  window.lucide.createIcons({
    attrs: {
      width: 16,
      height: 16,
      "stroke-width": 2,
    },
  });
}

function resetDateChangeFormState() {
  const form = document.getElementById("dateChangeRequestForm");

  if (!form) {
    return;
  }

  form.reset();
  clearFieldValidation("dcProposedStartDate", "dcProposedStartDateError");
  clearFieldValidation("dcProposedEndDate", "dcProposedEndDateError");
  clearFieldValidation("dcReason", "dcReasonError");
  hideFormLevelError("dateChangeFormError");
  setDateChangeSubmitting(false);
}

function resetCancellationFormState() {
  const form = document.getElementById("cancellationRequestForm");

  if (!form) {
    return;
  }

  form.reset();
  clearFieldValidation("crReason", "crReasonError");
  hideFormLevelError("cancellationFormError");
  setCancellationSubmitting(false);
}

function clearFieldValidation(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);

  if (field) {
    field.classList.remove("is-invalid");
    field.setAttribute("aria-invalid", "false");
  }

  if (error) {
    error.textContent = "";
  }
}

function setFieldValidation(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);

  if (field) {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
  }

  if (error) {
    error.textContent = message;
  }
}

function hideFormLevelError(errorId) {
  const errorEl = document.getElementById(errorId);

  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("d-none");
    errorEl.classList.remove("alert-warning");
    errorEl.classList.add("alert-danger");
  }
}

function showFormLevelError(errorId, message) {
  const errorEl = document.getElementById(errorId);

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("d-none", "alert-warning");
    errorEl.classList.add("alert-danger");
  }
}

function showFormLevelNotice(noticeId, message) {
  const noticeEl = document.getElementById(noticeId);

  if (noticeEl) {
    noticeEl.textContent = message;
    noticeEl.classList.remove("d-none", "alert-danger");
    noticeEl.classList.add("alert-warning");
  }
}

function populateDateChangeRequestForm(request) {
  if (!request) {
    return;
  }

  resetDateChangeFormState();

  const currentDays =
    request.duration || calculateInclusiveDays(request.from, request.to);

  $("#dcEmpName").text(request.emp_name || "—");
  $("#dcEmpNumber").text(request.emp_number ?? "—");
  $("#dcGroupName").text(request.group_name || "—");
  $("#dcRequestId").text(
    formatRequestReference(request.req_id, "REQ") || "—"
  );
  $("#dcCurrentStart").text(formatDate(request.from));
  $("#dcCurrentEnd").text(formatDate(request.to));
  $("#dcCurrentTotalDays").text(currentDays);
  $("#dcLocation").text(formatLocationDisplay(request));
  $("#dcRequestedBy").text(request.requester_name || "—");
  $("#dcScheduleCurrent").text(
    `${formatDate(request.from)} — ${formatDate(request.to)}`
  );
  $("#dcComparisonCurrentDays").text(currentDays);
  $("#dcScheduleProposed").text("—");
  $("#dcComparisonProposedDays").text("—");
  resetNetChangeDisplay();

  updateDateChangeScheduleComparison();
}

function populateCancellationRequestForm(request) {
  if (!request) {
    return;
  }

  resetCancellationFormState();

  $("#crEmpName").text(request.emp_name || "—");
  $("#crEmpNumber").text(request.emp_number ?? "—");
  $("#crGroupName").text(request.group_name || "—");
  $("#crRequestId").text(
    formatRequestReference(request.req_id, "REQ") || "—"
  );
  $("#crCurrentStart").text(formatDate(request.from));
  $("#crCurrentEnd").text(formatDate(request.to));
  $("#crLocation").text(formatLocationDisplay(request));
  $("#crRequestedBy").text(request.requester_name || "—");
}

function updateDateChangeScheduleComparison() {
  const request = selectedDispatchRequest;

  if (!request) {
    return;
  }

  const currentDays =
    request.duration || calculateInclusiveDays(request.from, request.to);
  const proposedStart = $("#dcProposedStartDate").val();
  const proposedEnd = $("#dcProposedEndDate").val();

  if (
    !proposedStart ||
    !proposedEnd ||
    !isValidIsoDateString(proposedStart) ||
    !isValidIsoDateString(proposedEnd) ||
    proposedEnd < proposedStart
  ) {
    $("#dcScheduleProposed").text("—");
    $("#dcComparisonProposedDays").text("—");
    resetNetChangeDisplay();
    return;
  }

  const proposedDays = calculateInclusiveDays(proposedStart, proposedEnd);

  $("#dcScheduleProposed").text(
    `${formatDate(proposedStart)} — ${formatDate(proposedEnd)}`
  );
  $("#dcComparisonProposedDays").text(proposedDays);
  updateNetChangeDisplay(currentDays, proposedDays);
}

function resetNetChangeDisplay() {
  $("#dcComparisonNetChange")
    .removeClass("is-positive is-negative is-neutral")
    .text("—");
}

function updateNetChangeDisplay(currentDays, proposedDays) {
  const netEl = $("#dcComparisonNetChange");
  const net = proposedDays - currentDays;

  netEl
    .removeClass("is-positive is-negative is-neutral")
    .text(formatNetDayChange(currentDays, proposedDays));

  if (net > 0) {
    netEl.addClass("is-positive");
  } else if (net < 0) {
    netEl.addClass("is-negative");
  } else {
    netEl.addClass("is-neutral");
  }
}

function isValidIsoDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getDateChangeFormValues() {
  return {
    proposedStart: String($("#dcProposedStartDate").val() || "").trim(),
    proposedEnd: String($("#dcProposedEndDate").val() || "").trim(),
    reason: String($("#dcReason").val() || "").trim(),
  };
}

function normalizeApprovedDateValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().slice(0, 10);
}

function validateDateChangeDateFields() {
  let isValid = true;

  clearFieldValidation("dcProposedStartDate", "dcProposedStartDateError");
  clearFieldValidation("dcProposedEndDate", "dcProposedEndDateError");

  const { proposedStart, proposedEnd } = getDateChangeFormValues();
  const request = selectedDispatchRequest;
  let startIsValid = false;
  let endIsValid = false;

  if (!proposedStart) {
    setFieldValidation(
      "dcProposedStartDate",
      "dcProposedStartDateError",
      "Proposed start date is required."
    );
    isValid = false;
  } else if (!isValidIsoDateString(proposedStart)) {
    setFieldValidation(
      "dcProposedStartDate",
      "dcProposedStartDateError",
      "Enter a valid proposed start date."
    );
    isValid = false;
  } else {
    startIsValid = true;
  }

  if (!proposedEnd) {
    setFieldValidation(
      "dcProposedEndDate",
      "dcProposedEndDateError",
      "Proposed end date is required."
    );
    isValid = false;
  } else if (!isValidIsoDateString(proposedEnd)) {
    setFieldValidation(
      "dcProposedEndDate",
      "dcProposedEndDateError",
      "Enter a valid proposed end date."
    );
    isValid = false;
  } else {
    endIsValid = true;
  }

  if (startIsValid && endIsValid) {
    if (proposedEnd < proposedStart) {
      setFieldValidation(
        "dcProposedEndDate",
        "dcProposedEndDateError",
        "Proposed end date cannot be earlier than the proposed start date."
      );
      isValid = false;
    } else if (
      request &&
      proposedStart === normalizeApprovedDateValue(request.from) &&
      proposedEnd === normalizeApprovedDateValue(request.to)
    ) {
      setFieldValidation(
        "dcProposedEndDate",
        "dcProposedEndDateError",
        "The proposed schedule must be different from the current approved schedule."
      );
      isValid = false;
    }
  }

  return isValid;
}

function validateDateChangeReasonField() {
  clearFieldValidation("dcReason", "dcReasonError");

  const { reason } = getDateChangeFormValues();

  if (!reason) {
    setFieldValidation(
      "dcReason",
      "dcReasonError",
      "Reason for date change is required."
    );
    return false;
  }

  return true;
}

function validateDateChangeForm() {
  hideFormLevelError("dateChangeFormError");

  const datesValid = validateDateChangeDateFields();
  const reasonValid = validateDateChangeReasonField();
  const { proposedStart, proposedEnd, reason } = getDateChangeFormValues();

  return {
    isValid: datesValid && reasonValid,
    proposedStart,
    proposedEnd,
    reason,
    remarks: "",
  };
}

function validateCancellationForm() {
  let isValid = true;

  clearFieldValidation("crReason", "crReasonError");
  hideFormLevelError("cancellationFormError");

  const reason = String($("#crReason").val() || "").trim();

  if (!reason) {
    setFieldValidation(
      "crReason",
      "crReasonError",
      "Cancellation reason is required."
    );
    const reasonField = document.getElementById("crReason");
    if (reasonField instanceof HTMLElement) {
      reasonField.focus();
    }
    isValid = false;
  }

  return {
    isValid,
    reason,
  };
}

function buildDateChangePayload(request, formValues) {
  return {
    requestType: "date_change",
    dispatchRequestId: request.req_id,
    currentStartDate: request.from,
    currentEndDate: request.to,
    proposedStartDate: formValues.proposedStart,
    proposedEndDate: formValues.proposedEnd,
    reason: formValues.reason,
    remarks: formValues.remarks,
  };
}

function buildCancellationPayload(request, formValues) {
  return {
    requestType: "cancellation",
    dispatchRequestId: request.req_id,
    reason: formValues.reason,
  };
}

function setDateChangeSubmitting(isSubmitting) {
  isChangeRequestSubmitting = isSubmitting;
  $("#btnSubmitDateChange").prop("disabled", isSubmitting);
  $("#btnDateChangeBack").prop("disabled", isSubmitting);
  $("#btnSubmitDateChangeSpinner").toggleClass("d-none", !isSubmitting);
}

function setCancellationSubmitting(isSubmitting) {
  isChangeRequestSubmitting = isSubmitting;
  $("#btnSubmitCancellation").prop("disabled", isSubmitting);
  $("#btnCancellationBack").prop("disabled", isSubmitting);
  $("#btnSubmitCancellationSpinner").toggleClass("d-none", !isSubmitting);
}

async function submitDateChangeRequest(payload) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: CHANGE_REQUEST_ENDPOINTS.dateChange,
      data: JSON.stringify(payload),
      contentType: "application/json",
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function (xhr) {
        const message =
          xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : "An error occurred while submitting the date change request.";
        reject(new Error(message));
      },
    });
  });
}

async function submitCancellationRequest(payload) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: CHANGE_REQUEST_ENDPOINTS.cancellation,
      data: JSON.stringify(payload),
      contentType: "application/json",
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function (xhr) {
        const message =
          xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : "An error occurred while submitting the cancellation request.";
        reject(new Error(message));
      },
    });
  });
}

async function handleDateChangeSubmit() {
  if (isChangeRequestSubmitting || !selectedDispatchRequest) {
    return;
  }

  const validation = validateDateChangeForm();

  if (!validation.isValid) {
    return;
  }

  const payload = buildDateChangePayload(selectedDispatchRequest, validation);

  setDateChangeSubmitting(true);
  hideFormLevelError("dateChangeFormError");

  try {
    const response = await submitDateChangeRequest(payload);

    if (!response || !response.isSuccess) {
      showFormLevelError(
        "dateChangeFormError",
        (response && response.message) ||
          "Unable to submit the date change request."
      );
      return;
    }

    const changeRequestModalElement = document.getElementById(
      "dateChangeRequestModal"
    );

    if (changeRequestModalElement && window.bootstrap) {
      blurFocusedDescendant(changeRequestModalElement);
      bootstrap.Modal.getOrCreateInstance(changeRequestModalElement).hide();
    }

    showToast("success", "Date change request submitted successfully.");
    await refreshRequestsAfterChangeSubmission();
  } catch (error) {
    showFormLevelError(
      "dateChangeFormError",
      error.message || "Unable to submit the date change request."
    );
  } finally {
    setDateChangeSubmitting(false);
  }
}

async function handleCancellationSubmit() {
  if (isChangeRequestSubmitting || !selectedDispatchRequest) {
    return;
  }

  const validation = validateCancellationForm();

  if (!validation.isValid) {
    return;
  }

  const payload = buildCancellationPayload(
    selectedDispatchRequest,
    validation
  );

  setCancellationSubmitting(true);
  hideFormLevelError("cancellationFormError");

  try {
    const response = await submitCancellationRequest(payload);

    if (!response || !response.isSuccess) {
      showFormLevelError(
        "cancellationFormError",
        (response && response.message) ||
          "Unable to submit the cancellation request."
      );
      return;
    }

    const cancellationModalElement = document.getElementById(
      "cancellationRequestModal"
    );

    if (cancellationModalElement && window.bootstrap) {
      blurFocusedDescendant(cancellationModalElement);
      bootstrap.Modal.getOrCreateInstance(cancellationModalElement).hide();
    }

    showToast("success", "Cancellation request submitted successfully.");
    await refreshRequestsAfterChangeSubmission();
  } catch (error) {
    showFormLevelError(
      "cancellationFormError",
      error.message || "Unable to submit the cancellation request."
    );
  } finally {
    setCancellationSubmitting(false);
  }
}

async function refreshRequestsAfterChangeSubmission() {
  try {
    const reqs = await getRequests();

    if (reqs && reqs.data) {
      reqList = reqs.data;
      allRequests = [...reqs.data];
      searchFilter(allRequests, false);

      if (selectedDispatchRequest) {
        const refreshed = allRequests.find(
          (item) => item.req_id === selectedDispatchRequest.req_id
        );

        if (refreshed) {
          selectedDispatchRequest = refreshed;
          renderDispatchActivityHistory(refreshed);
          updateChangeRequestActionsVisibility(refreshed);
        }
      }
    }
  } catch (error) {
    console.warn(
      "[PCSKHI Change Requests] Request list refresh failed after submission:",
      error
    );
  }
}

function showToast(type, str) {
  const toast = document.createElement("div");

  if (type === "success") {
    toast.classList.add("toasty", "success");
    toast.innerHTML = `
    <i class='bx bx-check text-xl text-[var(--tertiary)]'></i>
  <div class="flex flex-col py-3">
    <h5 class="text-md font-semibold leading-2">Success</h5>
    <p class="text-gray-600 text-sm">${str}</p>
    <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
  </div>
    `;
  } else if (type === "error") {
    toast.classList.add("toasty", "error");
    toast.innerHTML = `
    <i class='bx bx-x text-xl text-[var(--red-color)]'></i>
  <div class="flex flex-col py-3">
    <h5 class="text-md font-semibold leading-2">Error</h5>
    <p class="text-gray-600 text-sm">${str}</p>
    <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
  </div>
    `;
  } else if (type === "warn") {
    toast.classList.add("toasty", "warn");
    toast.innerHTML = `
    <i class='bx bx-info-circle text-lg text-[#ffaa33]'></i>
    <div class="flex flex-col py-3">
      <h5 class="text-md font-semibold leading-2">Warning</h5>
      <p class="text-gray-600 text-sm">${str}</p>
      <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
    </div>
      `;
  }

  $(".toastBox").append(toast);

  setTimeout(() => {
    toast.remove();
  }, 8000);
}
//#endregion
