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
//#endregion
checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      $(document).ready(function () {
        fillEmployeeDetails();
        Promise.all([getGroups(), getRequests(), getCount()])
          .then(([grps, reqs, counts]) => {
            groupList = grps;
            fillGroups(groupList);
            reqList = reqs["data"];
            allRequests = [...reqs["data"]];
            cardData = counts;
            fillCards();
            $(".tab")[0].click();
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
$(document).on("click", "td", function () {
  var rowID = $(this).closest("tr").attr("req-id");
  fillOpenModal(rowID);
  getRequestData(rowID)
    .then((res) => {
      if (res.isSuccess) {
        printData = res.data;
      }
    })
    .catch((error) => {
      alert(`Error: ${error}`);
    });
});
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
  openAttachmentModalFromRequest("attachmentModal", function () {
    fillAttachment(printData);
  });
});
$(document).on("click", "#attachment2", function (event) {
  requestModalReturnTrigger = event.currentTarget;
  openAttachmentModalFromRequest("attachmentModal2", function () {
    fillAttachment2(printData);
  });
});
$(document).on("click", "#btnBack", function () {
  returnToRequestModalFromAttachment("attachmentModal");
});
$(document).on("click", "#btnBack2", function () {
  returnToRequestModalFromAttachment("attachmentModal2");
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

function getRawDispatchStatus(request) {
  return request.status;
}

function normalizeDispatchStatus(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return "pending";
  }

  const value = String(rawValue).trim().toLowerCase();

  const statusMap = {
    pending: "pending",
    approved: "accepted",
    accepted: "accepted",
    cancelled: "cancelled",
    canceled: "cancelled",
    "0": "cancelled",
    "1": "accepted",
  };

  const normalized = statusMap[value];

  if (!normalized) {
    console.warn("Unknown dispatch status:", rawValue);
    return "unknown";
  }

  return normalized;
}

function getStatusBadgeHtml(normalizedStatus) {
  const statusConfig = {
    pending: { label: "Pending", className: "pending" },
    accepted: { label: "Accepted", className: "accepted" },
    cancelled: { label: "Cancelled", className: "cancelled" },
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
    accepted: 0,
    cancelled: 0,
    total: requests.length,
    todaytotal: 0,
    todayaccept: 0,
  };

  const today = new Date().toISOString().slice(0, 10);

  requests.forEach((request) => {
    const status = normalizeDispatchStatus(getRawDispatchStatus(request));

    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }

    if (request.req_date === today) {
      counts.todaytotal += 1;
    }

    if (status === "accepted" && request.modified) {
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
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_request_data.php",
      data: {
        request_id: req_id,
      },
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
          reject("An unspecified error occurred while fetching request data.");
        }
      },
    });
  });
}
function formatDate(date) {
  var [year, month, day] = date.split("-");
  monthName = monthNames2[parseInt(month) - 1];

  return day + " " + monthName + " " + year;
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
  const accepted = counts.accepted;
  const cancelled = counts.cancelled;
  const todayTotal = counts.todaytotal;
  const todayAccept = counts.todayaccept;
  const total = counts.total;

  if (pending != 0) {
    $("#tab-2").append(`
         <small
                      class="rounded-full w-[14px] h-[14px] bg-[var(--dark)] text-white text-[8px] flex items-center justify-content-center font-semibold" >${pending}</small>
      `);
  }
  $("#cardPending").text(pending);
  $("#cardAccepted").text(accepted);
  if (todayAccept != 0) {
    $("#cardTodayAccepted").html(
      `<small class="font-semibold" >+${todayAccept} today</small>`
    );
  }
  $("#cardCancelled").text(cancelled);
  if (todayTotal != 0) {
    $("#cardTodayTotal").html(
      `<small class="font-semibold" >+${todayTotal} today</small>`
    );
  }
  $("#cardTotal").text(total);
}

function fillOpenModal(trID) {
  const req = allRequests.find((req) => req.req_id == trID);
  const name = req.emp_name;
  const grp = req.group_name;
  const passValidity = req.passValid;
  const visaValidity = req.visaValid;
  const startDate = req.from;
  const endDate = req.to;
  const reqName = req.requester_name;
  const reqDate = req.req_date;
  const normalizedStatus = normalizeDispatchStatus(getRawDispatchStatus(req));
  const location = req.specific_loc;
  const country = req.location;
  const duration = req.duration;
  const reqGrp = req.requester_group;
  const modi = req.modified;

  const empnum = req.emp_number;
  const [last, given] = name.split(",");
  const surname = last.toUpperCase();
  const first = given.replace(/\s+/g, "");
  formatStatus(normalizedStatus);
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

  if (!modi) {
    $("#modalModiDate").text("");
  } else {
    var [date, time] = modi.split(" ");
    $("#modalModiDate").text(formatDate(date) + " " + time);
  }

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
  if (normalizedStatus === "pending") {
    $("#modifyFooter").addClass("d-none");
  } else {
    $("#modifyFooter").removeClass("d-none");
  }
  showRequestModal();
}
function formatDate(date) {
  var [year, month, day] = date.split("-");
  monthName = monthNames2[parseInt(month) - 1];

  return day + " " + monthName + " " + year;
}
function formatStatus(normalizedStatus) {
  const statusLabels = {
    pending: "pending",
    accepted: "accepted",
    cancelled: "cancelled",
    unknown: "unknown",
  };
  const statusString = statusLabels[normalizedStatus] || statusLabels.unknown;
  $("#openModalTitle").html(
    `  Dispatch Request<span class="status lg ${statusString} ms-3">${statusString}</span>`
  );
  $("#modiLabel").text(`${statusString}`);
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
      str = `
    <tr req-id="${item.req_id}">
      <td>${item.emp_name}</td>
      <td>${formatDate(item.req_date)}</td>
      <td>${formatDate(item.from)}</td>
      <td>${formatDate(item.to)}</td>
      <td>${item.requester_name}</td>
      <td>${getStatusBadgeHtml(
        normalizeDispatchStatus(getRawDispatchStatus(item))
      )}</td>
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
        <div class="openIcon " title="Open item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"   width="144px" height="144px">
            <path d="M 41.470703 4.9863281 A 1.50015 1.50015 0 0 0 41.308594 5 L 27.5 5 A 1.50015 1.50015 0 1 0 27.5 8 L 37.878906 8 L 22.439453 23.439453 A 1.50015 1.50015 0 1 0 24.560547 25.560547 L 40 10.121094 L 40 20.5 A 1.50015 1.50015 0 1 0 43 20.5 L 43 6.6894531 A 1.50015 1.50015 0 0 0 41.470703 4.9863281 z M 12.5 8 C 8.3754991 8 5 11.375499 5 15.5 L 5 35.5 C 5 39.624501 8.3754991 43 12.5 43 L 32.5 43 C 36.624501 43 40 39.624501 40 35.5 L 40 25.5 A 1.50015 1.50015 0 1 0 37 25.5 L 37 35.5 C 37 38.003499 35.003499 40 32.5 40 L 12.5 40 C 9.9965009 40 8 38.003499 8 35.5 L 8 15.5 C 8 12.996501 9.9965009 11 12.5 11 L 22.5 11 A 1.50015 1.50015 0 1 0 22.5 8 L 12.5 8 z" fill="rgba(85, 85, 85, 0.5)"  stroke="rgba(85, 85, 85, 0.5)" stroke-width="1"/>
          </svg>
        </div>
      </td>
    </tr>`;

      $("#tableBody").append(str);
    });
  } else {
    str = `<td colspan="12" class="h-[280px]"><div class="flex items-center justify-center flex-col gap-3 py-20"><img src="../images/empty.png"   class="w-[150px] h-auto opacity-[0.75] pt-20" alt="empty">
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
    "tab-3": "accepted",
    "tab-4": "cancelled",
  };
  const selectedStatus = tabFilters[activeTabId];
  const results = req_list.filter((emp) => {
    const searchMatch =
      emp.emp_name.toLowerCase().includes(keyword) ||
      emp.requester_name.toLowerCase().includes(keyword);

    const groupMatch = grps.includes(parseInt(emp.group_id));

    const dateMatch = dateFilter ? emp.req_date.startsWith(dateFilter) : true;

    const normalizedStatus = normalizeDispatchStatus(
      getRawDispatchStatus(emp)
    );
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
//#endregion
