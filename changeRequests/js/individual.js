//#region GLOBALS
const USE_CHANGE_REQUEST_MOCKS = true;
const REQUESTS_PER_PAGE = 10;

const rootFolder = `//${document.location.hostname}`;

const monthNames = [
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

let empDetails = [];
let groupList = [];

const allDateChangeRequests = [];
const allCancellationRequests = [];

const dateChangeState = {
  filteredRequests: [],
  currentPage: 1,
};

const cancellationState = {
  filteredRequests: [],
  currentPage: 1,
};

let dateChangeModalReturnTrigger = null;
let cancellationModalReturnTrigger = null;
//#endregion

//#region ADAPTERS
async function loadDateChangeRequests() {
  if (USE_CHANGE_REQUEST_MOCKS) {
    return [...window.mockDateChangeRequests];
  }

  throw new Error("Date Change Request API is not connected.");
}

async function loadCancellationRequests() {
  if (USE_CHANGE_REQUEST_MOCKS) {
    return [...window.mockCancellationRequests];
  }

  throw new Error("Cancellation Request API is not connected.");
}

function loadLiveDispatchRequests() {
  return new Promise((resolve) => {
    $.ajax({
      type: "GET",
      url: "../requestList/php/get_requests.php",
      dataType: "json",
      success: function (response) {
        if (response?.isSuccess && Array.isArray(response.data)) {
          resolve(response.data);
          return;
        }

        resolve([]);
      },
      error: function () {
        resolve([]);
      },
    });
  });
}

function bindDispatchRequestIds(requests, dispatchRequests) {
  if (!dispatchRequests.length) {
    return requests;
  }

  const validIds = new Set(
    dispatchRequests.map((request) => String(request.req_id))
  );

  return requests.map((request, index) => {
    if (validIds.has(String(request.dispatch_request_id))) {
      return request;
    }

    const dispatchRequest =
      dispatchRequests[index % dispatchRequests.length];

    return {
      ...request,
      dispatch_request_id: dispatchRequest.req_id,
    };
  });
}
//#endregion

checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      $(document).ready(function () {
        fillEmployeeDetails();
        const initialLoaders = [
          getGroups(),
          loadDateChangeRequests(),
          loadCancellationRequests(),
        ];

        if (USE_CHANGE_REQUEST_MOCKS) {
          initialLoaders.push(loadLiveDispatchRequests());
        }

        Promise.all(initialLoaders)
          .then((results) => {
            const groups = results[0];
            let dateChanges = results[1];
            let cancellations = results[2];
            const liveDispatchRequests = USE_CHANGE_REQUEST_MOCKS
              ? results[3]
              : [];

            if (USE_CHANGE_REQUEST_MOCKS && liveDispatchRequests.length) {
              dateChanges = bindDispatchRequestIds(
                dateChanges,
                liveDispatchRequests
              );
              cancellations = bindDispatchRequestIds(
                cancellations,
                liveDispatchRequests
              );
            }

            groupList = groups;
            fillGroups("dcGrpSel");
            fillGroups("crGrpSel");

            allDateChangeRequests.length = 0;
            allDateChangeRequests.push(...dateChanges);

            allCancellationRequests.length = 0;
            allCancellationRequests.push(...cancellations);

            initSectionTabs("dateChange");
            initSectionTabs("cancellation");

            applyDateChangeFilters(true);
            applyCancellationFilters(true);
            openChangeRequestFromDeepLink();
          })
          .catch((error) => {
            alert(`${error}`);
          });
      });
    } else {
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

bindSectionFilters("dateChange", applyDateChangeFilters);
bindSectionFilters("cancellation", applyCancellationFilters);

$(document)
  .off("click.dateChangeRow", ".date-change-request-row")
  .on("click.dateChangeRow", ".date-change-request-row", function (event) {
    if (
      $(event.target).closest("button, a, input, select, textarea, label")
        .length
    ) {
      return;
    }

    openDateChangeRequestById($(this).data("request-id"), event.currentTarget);
  });

$(document)
  .off("click.dateChangeDetails", ".view-date-change-request")
  .on("click.dateChangeDetails", ".view-date-change-request", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const requestId =
      $(this).data("request-id") ||
      $(this).closest(".date-change-request-row").data("request-id");

    openDateChangeRequestById(requestId, event.currentTarget);
  });

$(document)
  .off("click.cancellationRow", ".cancellation-request-row")
  .on("click.cancellationRow", ".cancellation-request-row", function (event) {
    if (
      $(event.target).closest("button, a, input, select, textarea, label")
        .length
    ) {
      return;
    }

    openCancellationRequestById(
      $(this).data("request-id"),
      event.currentTarget
    );
  });

$(document)
  .off("click.cancellationDetails", ".view-cancellation-request")
  .on(
    "click.cancellationDetails",
    ".view-cancellation-request",
    function (event) {
      event.preventDefault();
      event.stopPropagation();

      const requestId =
        $(this).data("request-id") ||
        $(this).closest(".cancellation-request-row").data("request-id");

      openCancellationRequestById(requestId, event.currentTarget);
    }
  );

$(document).on(
  "click",
  "#dateChangeRequestDetailsModal .btn-close, #dateChangeRequestDetailsModal [data-bs-dismiss='modal']",
  function () {
    const modalElement = document.getElementById(
      "dateChangeRequestDetailsModal"
    );
    if (modalElement) {
      blurFocusedDescendant(modalElement);
    }
  }
);

$(document).on(
  "click",
  "#cancellationRequestDetailsModal .btn-close, #cancellationRequestDetailsModal [data-bs-dismiss='modal']",
  function () {
    const modalElement = document.getElementById(
      "cancellationRequestDetailsModal"
    );
    if (modalElement) {
      blurFocusedDescendant(modalElement);
    }
  }
);

const dateChangeDetailsModalElement = document.getElementById(
  "dateChangeRequestDetailsModal"
);
if (dateChangeDetailsModalElement) {
  dateChangeDetailsModalElement.addEventListener("shown.bs.modal", function () {
    focusInitialModalControl(dateChangeDetailsModalElement);
  });
  dateChangeDetailsModalElement.addEventListener("hidden.bs.modal", function () {
    if (dateChangeModalReturnTrigger) {
      dateChangeModalReturnTrigger.focus();
      dateChangeModalReturnTrigger = null;
    }
  });
}

const cancellationDetailsModalElement = document.getElementById(
  "cancellationRequestDetailsModal"
);
if (cancellationDetailsModalElement) {
  cancellationDetailsModalElement.addEventListener("shown.bs.modal", function () {
    renderPaginationIcons();
    focusInitialModalControl(cancellationDetailsModalElement);
  });
  cancellationDetailsModalElement.addEventListener("hidden.bs.modal", function () {
    if (cancellationModalReturnTrigger) {
      cancellationModalReturnTrigger.focus();
      cancellationModalReturnTrigger = null;
    }
  });
}
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
    activeElement &&
    modalElement &&
    modalElement.contains(activeElement)
  ) {
    activeElement.blur();
  }
}

function focusInitialModalControl(modalElement) {
  const closeButton = modalElement.querySelector(".btn-close");

  if (closeButton) {
    closeButton.focus();
  }
}

function checkAccess() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "../global/check_login.php",
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function () {
        reject("Failed to verify user session.");
      },
    });
  });
}

function logOut() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "../global/logout.php",
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function () {
        reject("Failed to log out.");
      },
    });
  });
}

function fillEmployeeDetails() {
  const fName = empDetails.firstname;
  const sName = empDetails.surname;
  const initials = getInitials(fName, sName);
  const grpName = empDetails.group;
  const fullName = capitalizeWords(`${fName} ${sName}`);

  $("#empLabel").html(fullName);
  $("#empInitials").html(initials);
  $("#grpLabel").html(grpName || "");
}

function capitalizeWords(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInitials(firstname, surname) {
  const firstInitial = firstname.charAt(0);
  const lastInitial = surname.charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function getGroups() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "../requestList/php/get_groups.php",
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function () {
        reject("Failed to load groups.");
      },
    });
  });
}

function fillGroups(selectId) {
  const $select = $(`#${selectId}`);
  const groupIDS = groupList.map((obj) => obj.id);

  $select.html(`<option value="${groupIDS.toString()}">All Groups</option>`);

  groupList.forEach((group) => {
    $select.append(
      $("<option>").attr("value", group.id).text(group.abbr).attr("grp-id", group.id)
    );
  });
}

function getSectionPrefix(section) {
  return section === "dateChange" ? "dc" : "cr";
}

function initSectionTabs(section) {
  const prefix = getSectionPrefix(section);
  const $firstTab = $(`#${prefix}-tab-1`);

  if ($firstTab.length) {
    moveTabIndicator($firstTab);
    $firstTab.find("span").addClass("font-semibold text-[var(--dark)] active");
  }
}

function moveTabIndicator($tab) {
  const $tabsContainer = $tab.closest(".tabs");
  const indicator = $tabsContainer.find(".indicator")[0];

  if (!indicator) {
    return;
  }

  const rect = $tab[0].getBoundingClientRect();
  const parentRect = $tabsContainer[0].getBoundingClientRect();

  indicator.style.width = `${rect.width}px`;
  indicator.style.left = `${rect.left - parentRect.left}px`;
}

function bindSectionFilters(section, applyFn) {
  const prefix = getSectionPrefix(section);

  $(document).on("input", `#${prefix}Searchbar`, function () {
    applyFn(true);
  });

  $(document).on("click", `#${prefix}Tabs .tab`, function () {
    const $this = $(this);
    moveTabIndicator($this);
    $(`#${prefix}Tabs .tab span`).removeClass(
      "font-semibold text-[var(--dark)] active"
    );
    $this.find("span").addClass("font-semibold text-[var(--dark)] active");
    applyFn(true);
  });

  $(document).on("change", `#${prefix}GrpSel`, function () {
    const sel = $(`#${prefix}GrpSel option:selected`).text();
    const grp = $(this).val().split(",").length;

    if (grp === 1) {
      $(this).addClass("active");
    } else {
      $(this).removeClass("active");
    }

    $(`.${prefix}GrpCont`).html(
      `<i class='bx bx-group'></i>
        <span id="${prefix}LblGrp">${sel}</span>
        <i class='bx bx-x text-[18px] ml-3 z-[100]' data-remove-group="${prefix}'></i>`
    );
    applyFn(true);
  });

  $(document).on("click", `[data-remove-group='${prefix}']`, function () {
    $(`#${prefix}GrpSel`).removeClass("active");
    $(`.${prefix}GrpCont`).html(
      `<i class='bx bx-group'></i>
        <span id="${prefix}LblGrp">All Groups</span>
        <i class='bx bx-chevron-down text-[18px] ml-3'></i>`
    );
    $(`#${prefix}GrpSel`).val($(`#${prefix}GrpSel option:first`).val());
    $(`#${prefix}GrpSel`).change();
  });

  $(document).on("input", `#${prefix}MonthSel`, function () {
    const [year, month] = $(this).val().split("-");
    $(this).removeClass("active");

    let display = "Requested Month";
    let iClass = `<i class='bx bx-chevron-down text-[18px] ml-3'></i>`;

    if (month) {
      const monthName = monthNames[parseInt(month, 10) - 1];
      $(this).addClass("active");
      display = `${monthName} ${year}`;
      iClass = `<i class='bx bx-x text-[18px] ml-3 z-[100]' data-remove-month="${prefix}'></i>`;
    }

    $(`.${prefix}MonthCont`).html(
      `<i class='bx bx-calendar'></i>
        <span id="${prefix}MonthLabel">${display}</span>
        ${iClass}`
    );
    applyFn(true);
  });

  $(document).on("click", `[data-remove-month='${prefix}']`, function () {
    $(`#${prefix}MonthSel`).removeClass("active");
    $(`.${prefix}MonthCont`).html(
      `<i class='bx bx-calendar'></i>
        <span id="${prefix}MonthLabel">Requested Month</span>
        <i class='bx bx-chevron-down text-[18px] ml-3'></i>`
    );
    $(`#${prefix}MonthSel`).val("");
    applyFn(true);
  });

  $(document).on("click", `#${prefix}PaginationPrev`, function () {
    const state = section === "dateChange" ? dateChangeState : cancellationState;
    if (state.currentPage > 1) {
      state.currentPage -= 1;
      renderSectionTable(section);
    }
  });

  $(document).on("click", `#${prefix}PaginationNext`, function () {
    const state = section === "dateChange" ? dateChangeState : cancellationState;
    const totalPages = getSectionTotalPages(state.filteredRequests.length);
    if (state.currentPage < totalPages) {
      state.currentPage += 1;
      renderSectionTable(section);
    }
  });

  $(document).on("click", `#${prefix}PaginationPages .request-pagination__page`, function () {
    const state = section === "dateChange" ? dateChangeState : cancellationState;
    const page = parseInt($(this).attr("data-page"), 10);

    if (!isNaN(page) && page !== state.currentPage) {
      state.currentPage = page;
      renderSectionTable(section);
    }
  });
}

function getSelectedStatus(prefix) {
  const $activeTab = $(`#${prefix}Tabs button.tab`)
    .filter(function () {
      return $(this).find("span").hasClass("active");
    })
    .first();
  const status = $activeTab.data("status");

  if (!status || status === "all") {
    return undefined;
  }

  return status;
}

function applyDateChangeFilters(resetPage) {
  if (resetPage) {
    dateChangeState.currentPage = 1;
  }

  const keyword = $("#dcSearchbar").val().toLowerCase().trim();
  const grps = $("#dcGrpSel").val().split(",").map(Number);
  const dateFilter = $("#dcMonthSel").val();
  const selectedStatus = getSelectedStatus("dc");

  const results = allDateChangeRequests.filter((item) => {
    const searchMatch =
      item.request_id.toLowerCase().includes(keyword) ||
      item.employee_name.toLowerCase().includes(keyword) ||
      item.requested_by.toLowerCase().includes(keyword) ||
      item.reason.toLowerCase().includes(keyword);

    const groupMatch = grps.includes(parseInt(item.group_id, 10));
    const dateMatch = dateFilter
      ? item.date_requested.startsWith(dateFilter)
      : true;
    const statusMatch =
      selectedStatus === undefined || item.status === selectedStatus;

    return searchMatch && groupMatch && dateMatch && statusMatch;
  });

  dateChangeState.filteredRequests = [...results];
  renderSectionTable("dateChange");
}

function applyCancellationFilters(resetPage) {
  if (resetPage) {
    cancellationState.currentPage = 1;
  }

  const keyword = $("#crSearchbar").val().toLowerCase().trim();
  const grps = $("#crGrpSel").val().split(",").map(Number);
  const dateFilter = $("#crMonthSel").val();
  const selectedStatus = getSelectedStatus("cr");

  const results = allCancellationRequests.filter((item) => {
    const searchMatch =
      item.request_id.toLowerCase().includes(keyword) ||
      item.employee_name.toLowerCase().includes(keyword) ||
      item.requested_by.toLowerCase().includes(keyword) ||
      item.reason.toLowerCase().includes(keyword);

    const groupMatch = grps.includes(parseInt(item.group_id, 10));
    const dateMatch = dateFilter
      ? item.date_requested.startsWith(dateFilter)
      : true;
    const statusMatch =
      selectedStatus === undefined || item.status === selectedStatus;

    return searchMatch && groupMatch && dateMatch && statusMatch;
  });

  cancellationState.filteredRequests = [...results];
  renderSectionTable("cancellation");
}

function formatDate(dateStr) {
  if (!dateStr) {
    return "—";
  }

  const date = new Date(`${dateStr}T00:00:00`);
  const month = monthNames[date.getMonth()].slice(0, 3);
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

function formatDateRange(start, end) {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

function getChangeRequestStatusBadgeHtml(status, large) {
  const statusConfig = {
    pending: { label: "Pending", className: "pending" },
    accepted: { label: "Accepted", className: "accepted" },
    rejected: { label: "Rejected", className: "rejected" },
  };

  const config = statusConfig[status] || {
    label: status || "Unknown",
    className: "",
  };
  const lgClass = large ? " lg" : "";

  return `<span class="change-request-status${lgClass} ${config.className}">${config.label}</span>`;
}

function getSectionTotalPages(totalItems) {
  return Math.max(1, Math.ceil(totalItems / REQUESTS_PER_PAGE));
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 1) {
    return [1];
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

function renderPaginationIcons() {
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

function renderSectionPagination(section) {
  const prefix = getSectionPrefix(section);
  const state =
    section === "dateChange" ? dateChangeState : cancellationState;
  const totalItems = state.filteredRequests.length;
  const totalPages = getSectionTotalPages(totalItems);

  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }
  if (state.currentPage < 1) {
    state.currentPage = 1;
  }

  const startIndex = (state.currentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = Math.min(startIndex + REQUESTS_PER_PAGE, totalItems);
  const rangeStart = totalItems > 0 ? startIndex + 1 : 0;
  const rangeEnd = totalItems > 0 ? endIndex : 0;

  $(`#${prefix}PaginationInfo`).text(
    `Showing ${rangeStart} to ${rangeEnd} of ${totalItems} requests`
  );

  $(`#${prefix}PaginationPrev`).prop("disabled", state.currentPage <= 1);
  $(`#${prefix}PaginationNext`).prop(
    "disabled",
    totalItems === 0 || state.currentPage >= totalPages
  );

  const pagesMarkup = getPageNumbers(state.currentPage, totalPages)
    .map((page) => {
      if (typeof page === "string") {
        return `<span class="request-pagination__ellipsis">...</span>`;
      }

      const isActive = page === state.currentPage;
      return `<button type="button" class="request-pagination__page${
        isActive ? " is-active" : ""
      }" data-page="${page}">${page}</button>`;
    })
    .join("");

  $(`#${prefix}PaginationPages`).html(pagesMarkup);
  renderPaginationIcons();
}

function getOpenIconMarkup(requestId, viewClass) {
  return `<div class="openIcon ${viewClass}" title="Open item" data-request-id="${requestId}">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="144px" height="144px">
      <path d="M 41.470703 4.9863281 A 1.50015 1.50015 0 0 0 41.308594 5 L 27.5 5 A 1.50015 1.50015 0 1 0 27.5 8 L 37.878906 8 L 22.439453 23.439453 A 1.50015 1.50015 0 1 0 24.560547 25.560547 L 40 10.121094 L 40 20.5 A 1.50015 1.50015 0 1 0 43 20.5 L 43 6.6894531 A 1.50015 1.50015 0 0 0 41.470703 4.9863281 z M 12.5 8 C 8.3754991 8 5 11.375499 5 15.5 L 5 35.5 C 5 39.624501 8.3754991 43 12.5 43 L 32.5 43 C 36.624501 43 40 39.624501 40 35.5 L 40 25.5 A 1.50015 1.50015 0 1 0 37 25.5 L 37 35.5 C 37 38.003499 35.003499 40 32.5 40 L 12.5 40 C 9.9965009 40 8 38.003499 8 35.5 L 8 15.5 C 8 12.996501 9.9965009 11 12.5 11 L 22.5 11 A 1.50015 1.50015 0 1 0 22.5 8 L 12.5 8 z" fill="rgba(85, 85, 85, 0.5)" stroke="rgba(85, 85, 85, 0.5)" stroke-width="1"/>
    </svg>
  </div>`;
}

function renderDateChangeTableBody(pageItems) {
  const $tbody = $("#dcTableBody");
  $tbody.empty();

  if (pageItems.length === 0) {
    $tbody.append(`
      <tr>
        <td colspan="9" class="h-[280px]">
          <div class="flex items-center justify-center flex-col gap-3 py-20">
            <img src="../images/empty.png" class="w-[150px] h-auto opacity-[0.75] pt-20" alt="empty">
            <h5 class="font-semibold text-[16px] text-[var(--gray-text)]">No requests found</h5>
            <p class="text-[var(--gray-text)] pb-20">Try adjusting your search or filters.</p>
          </div>
        </td>
      </tr>
    `);
    return;
  }

  pageItems.forEach((item) => {
    $tbody.append(`
      <tr class="date-change-request-row change-request-row" data-request-id="${item.id}">
        <td>${item.request_id}</td>
        <td>${item.employee_name}</td>
        <td>${formatDateRange(item.current_start, item.current_end)}</td>
        <td>${formatDateRange(item.proposed_start, item.proposed_end)}</td>
        <td>${item.net_change}</td>
        <td>${formatDate(item.date_requested)}</td>
        <td>${item.requested_by}</td>
        <td>${getChangeRequestStatusBadgeHtml(item.status)}</td>
        <td>${getOpenIconMarkup(item.id, "view-date-change-request")}</td>
      </tr>
    `);
  });
}

function renderCancellationTableBody(pageItems) {
  const $tbody = $("#crTableBody");
  $tbody.empty();

  if (pageItems.length === 0) {
    $tbody.append(`
      <tr>
        <td colspan="8" class="h-[280px]">
          <div class="flex items-center justify-center flex-col gap-3 py-20">
            <img src="../images/empty.png" class="w-[150px] h-auto opacity-[0.75] pt-20" alt="empty">
            <h5 class="font-semibold text-[16px] text-[var(--gray-text)]">No requests found</h5>
            <p class="text-[var(--gray-text)] pb-20">Try adjusting your search or filters.</p>
          </div>
        </td>
      </tr>
    `);
    return;
  }

  pageItems.forEach((item) => {
    $tbody.append(`
      <tr class="cancellation-request-row change-request-row" data-request-id="${item.id}">
        <td>${item.request_id}</td>
        <td>${item.employee_name}</td>
        <td>${formatDateRange(item.dispatch_start, item.dispatch_end)}</td>
        <td>${item.reason}</td>
        <td>${formatDate(item.date_requested)}</td>
        <td>${item.requested_by}</td>
        <td>${getChangeRequestStatusBadgeHtml(item.status)}</td>
        <td>${getOpenIconMarkup(item.id, "view-cancellation-request")}</td>
      </tr>
    `);
  });
}

function renderSectionTable(section) {
  const state =
    section === "dateChange" ? dateChangeState : cancellationState;
  const totalItems = state.filteredRequests.length;
  const totalPages = getSectionTotalPages(totalItems);

  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }
  if (state.currentPage < 1) {
    state.currentPage = 1;
  }

  const startIndex = (state.currentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = Math.min(startIndex + REQUESTS_PER_PAGE, totalItems);
  const pageItems = state.filteredRequests.slice(startIndex, endIndex);

  if (section === "dateChange") {
    renderDateChangeTableBody(pageItems);
  } else {
    renderCancellationTableBody(pageItems);
  }

  renderSectionPagination(section);
}

function openDateChangeRequestById(requestId, triggerElement) {
  const request = allDateChangeRequests.find(
    (item) => String(item.id) === String(requestId)
  );

  if (!request) {
    return false;
  }

  dateChangeModalReturnTrigger = triggerElement || null;
  populateDateChangeDetailsModal(request);

  const { element, instance } = getBootstrapModal("dateChangeRequestDetailsModal");

  if (element && instance) {
    instance.show();
    return true;
  }

  return false;
}

function openCancellationRequestById(requestId, triggerElement) {
  const request = allCancellationRequests.find(
    (item) => String(item.id) === String(requestId)
  );

  if (!request) {
    return false;
  }

  cancellationModalReturnTrigger = triggerElement || null;
  populateCancellationDetailsModal(request);

  const { element, instance } = getBootstrapModal(
    "cancellationRequestDetailsModal"
  );

  if (element && instance) {
    instance.show();
    return true;
  }

  return false;
}

function getDeepLinkedChangeRequestParams() {
  const params = new URLSearchParams(window.location.search);
  const rawType = String(params.get("type") || "")
    .trim()
    .toLowerCase();
  const openChangeRequestId = String(
    params.get("openChangeRequestId") || ""
  ).trim();

  if (!openChangeRequestId) {
    return null;
  }

  let type = rawType;

  if (
    type === "datechange" ||
    type === "date-change" ||
    type === "date_change"
  ) {
    type = "date_change";
  }

  if (type !== "cancellation" && type !== "date_change") {
    return null;
  }

  return {
    type,
    openChangeRequestId,
  };
}

function clearDeepLinkChangeRequestParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("type");
  url.searchParams.delete("openChangeRequestId");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function openChangeRequestFromDeepLink() {
  const deepLink = getDeepLinkedChangeRequestParams();

  if (!deepLink) {
    return;
  }

  let opened = false;

  if (deepLink.type === "cancellation") {
    opened = openCancellationRequestById(deepLink.openChangeRequestId, null);
  } else if (deepLink.type === "date_change") {
    opened = openDateChangeRequestById(deepLink.openChangeRequestId, null);
  }

  if (opened) {
    clearDeepLinkChangeRequestParams();
  } else {
    console.warn(
      "Unable to open deep-linked change request:",
      deepLink
    );
  }
}

function setDetailValue(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = value || "—";
  }
}

function buildRequestListDispatchUrl(dispatchRequestId) {
  return `../requestList/?request_id=${encodeURIComponent(dispatchRequestId)}`;
}

function getDispatchRequestListId(request) {
  return request.dispatch_request_id ?? request.req_id ?? null;
}

function setDispatchRequestLink(elementId, request) {
  const el = document.getElementById(elementId);

  if (!el) {
    return;
  }

  const displayId = request.original_dispatch_request_id || "—";
  const dispatchRequestId = getDispatchRequestListId(request);

  if (!dispatchRequestId) {
    el.textContent = displayId;
    return;
  }

  const url = buildRequestListDispatchUrl(dispatchRequestId);
  el.innerHTML = `<a href="${url}" data-original-dispatch-link data-request-id="${dispatchRequestId}" target="_blank" rel="noopener noreferrer" class="inline-block cursor-pointer underline decoration-2 decoration-[var(--secondary)] text-[var(--dark)] hover:text-[var(--tertiary)] transition font-semibold">${displayId}</a>`;
}

function populateDateChangeDetailsModal(request) {
  $("#dcDetailModalTitle").html(
    `${request.request_id} ${getChangeRequestStatusBadgeHtml(request.status, true)}`
  );
  setDetailValue("dcDetailEmployee", request.employee_name);
  setDetailValue("dcDetailEmployeeId", request.employee_id);
  setDetailValue("dcDetailGroup", request.group_name);
  setDispatchRequestLink("dcDetailDispatchId", request);
  setDetailValue(
    "dcDetailCurrentDates",
    formatDateRange(request.current_start, request.current_end)
  );
  setDetailValue(
    "dcDetailProposedDates",
    formatDateRange(request.proposed_start, request.proposed_end)
  );
  setDetailValue("dcDetailCurrentDays", `${request.current_total_days} days`);
  setDetailValue("dcDetailProposedDays", `${request.proposed_total_days} days`);
  setDetailValue("dcDetailNetChange", request.net_change);
  setDetailValue("dcDetailReason", request.reason);
  setDetailValue("dcDetailRequestedBy", request.requested_by);
  setDetailValue("dcDetailDateRequested", formatDate(request.date_requested));

  const withdrawSection = document.getElementById("dcDetailWithdrawSection");
  if (withdrawSection) {
    withdrawSection.classList.toggle("d-none", request.status !== "pending");
  }
}

function populateCancellationDetailsModal(request) {
  $("#crDetailModalTitle").html(
    `<span class="cr-detail-request-id">${request.request_id}</span>${getChangeRequestStatusBadgeHtml(request.status, true)}`
  );
  setDetailValue("crDetailEmployee", request.employee_name);
  setDetailValue("crDetailEmployeeId", request.employee_id);
  setDetailValue("crDetailGroup", request.group_name);
  setDispatchRequestLink("crDetailDispatchId", request);
  setDetailValue(
    "crDetailDispatchDates",
    formatDateRange(request.dispatch_start, request.dispatch_end)
  );
  setDetailValue("crDetailReason", request.reason);
  setDetailValue("crDetailRequestedBy", request.requested_by);
  setDetailValue("crDetailDateRequested", formatDate(request.date_requested));

  const withdrawSection = document.getElementById("crDetailWithdrawSection");
  if (withdrawSection) {
    withdrawSection.classList.toggle("d-none", request.status !== "pending");
  }
}
//#endregion
