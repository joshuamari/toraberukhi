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
// const sampleData = [
//   {
//     req_id: 37,
//     emp_name: "Coquia, Joshua Mari",
//     group_id: 16,
//     specific_loc: "Kobe",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Coquia, Joshua Mari",
//     requester_group: "Systems Group",
//     from: "2024-04-04",
//     to: "2024-04-05",
//     duration: 2,
//     req_date: "2024-07-23",
//     passValid: true,
//     visaValid: true,
//     status: 1,
//     modified: "2024-07-29 13:06:18",
//   },
//   {
//     req_id: 23,
//     emp_name: "Herrera, Rhanzces Julia",
//     group_id: 16,
//     specific_loc: "Tokyo Tokyo",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-07-18",
//     to: "2024-07-28",
//     duration: 11,
//     req_date: "2024-07-23",
//     passValid: false,
//     visaValid: false,
//     status: 1,
//     modified: "2024-07-29 13:06:23",
//   },
//   {
//     req_id: 39,
//     emp_name: "Herrera, Rhanzces Julia",
//     group_id: 16,
//     specific_loc: "Tokyo Tokyo",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Becina, Artemio Roel",
//     requester_group: "Electrical Engineering Group",
//     from: "2024-06-01",
//     to: "2024-06-05",
//     duration: 5,
//     req_date: "2024-07-23",
//     passValid: false,
//     visaValid: false,
//     status: null,
//     modified: null,
//   },
//   {
//     req_id: 38,
//     emp_name: "Reyes, Dave",
//     group_id: 16,
//     specific_loc: "gasg",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-05-01",
//     to: "2024-05-03",
//     duration: 3,
//     req_date: "2024-07-19",
//     passValid: false,
//     visaValid: false,
//     status: null,
//     modified: null,
//   },
//   {
//     req_id: 36,
//     emp_name: "Reyes, Dave",
//     group_id: 16,
//     specific_loc: "dsdfsd",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-03-27",
//     to: "2024-03-30",
//     duration: 4,
//     req_date: "2024-07-19",
//     passValid: false,
//     visaValid: false,
//     status: null,
//     modified: null,
//   },
//   {
//     req_id: 35,
//     emp_name: "Coquia, Joshua Mari",
//     group_id: 16,
//     specific_loc: "Tokyo Tokyo",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-02-21",
//     to: "2024-03-01",
//     duration: 10,
//     req_date: "2024-07-19",
//     passValid: true,
//     visaValid: true,
//     status: null,
//     modified: null,
//   },
//   {
//     req_id: 34,
//     emp_name: "Cabiso, Sean Patrick",
//     group_id: 16,
//     specific_loc: "Tokyo Tokyo",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-09-25",
//     to: "2024-09-27",
//     duration: 3,
//     req_date: "2024-07-19",
//     passValid: false,
//     visaValid: false,
//     status: null,
//     modified: null,
//   },
//   {
//     req_id: 29,
//     emp_name: "Reyes, Dave",
//     group_id: 16,
//     specific_loc: "fgsfgsf",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-06-05",
//     to: "2024-06-18",
//     duration: 14,
//     req_date: "2024-07-19",
//     passValid: false,
//     visaValid: false,
//     status: null,
//     modified: null,
//   },
//   {
//     req_id: 24,
//     emp_name: "Herrera, Rhanzces Julia",
//     group_id: 16,
//     specific_loc: "Tokyo Tokyo",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-07-19",
//     to: "2024-07-27",
//     duration: 9,
//     req_date: "2024-07-19",
//     passValid: false,
//     visaValid: false,
//     status: null,
//     modified: null,
//   },
//   {
//     req_id: 20,
//     emp_name: "Reyes, Dave",
//     group_id: 16,
//     specific_loc: "fsdzfsdf",
//     location: "Japan",
//     group_name: "Systems Group",
//     requester_name: "Reyes, Dave",
//     requester_group: "Systems Group",
//     from: "2024-06-26",
//     to: "2024-06-29",
//     duration: 4,
//     req_date: "2024-07-19",
//     passValid: false,
//     visaValid: false,
//     status: null,
//     modified: null,
//   },
// ];
// const cardData = {
//   isSuccess: true,
//   message: "",
//   data: {
//     pending: 27,
//     accepted: 2,
//     cancelled: 0,
//     todaytotal: 1,
//     todayaccept: 2,
//     total: 29,
//   },
// };
let reqList = [];
let cardData = [];

let printData = {};
let sortDateAsc = false;
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
  searchFilter(reqList);
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
  searchFilter(reqList);
});
$(document).on("click", "#removeMonth", function () {
  $("#monthSel").removeClass("active");
  $(".monthCont").html(`<i class='bx bx-calendar'></i>
                      <span class="" id="monthLabel">Requested Month</span>
                      <i class='bx bx-chevron-down text-[18px] ml-3'></i>`);
  $("#monthSel").val("");
  searchFilter(reqList);
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

  searchFilter(reqList);
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
$(document).on("click", "#openModal .btn-close", function () {
  $("#openModal").modal("hide");
});
$(document).on("input", "#searchbar", function () {
  searchFilter(reqList);
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
$(document).on("click", "#sortDate", function () {
  sortDateAsc = !sortDateAsc;
  searchFilter(reqList);
});
$(document).on("click", "#attachment", function () {
  fillAttachment(printData);
  $("#openModal .btn-close").click();
  $("#attachmentModal").modal("show");
});
$(document).on("click", "#attachment2", function () {
  fillAttachment2(printData);
  $("#openModal .btn-close").click();
  $("#attachmentModal2").modal("show");
});
$(document).on("click", "#btnBack", function () {
  $("#attachmentModal .btn-close").click();
  $("#openModal").modal("show");
});
$(document).on("click", "#btnBack2", function () {
  $("#attachmentModal2 .btn-close").click();
  $("#openModal").modal("show");
});
//#endregion

//#region FUNCTIONS
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
  var date = data.date_request;
  var khi = data.dispatch_request.requester_name;
  var khibu = data.dispatch_request.request_by_dept;
  var name = data.dispatch_request.emp_name;
  var from = data.dispatch_request.start;
  var to = data.dispatch_request.end;
  var country = data.dispatch_request.location_id;
  var loc = data.dispatch_request.specific_loc;
  var invitation = data.dispatch_request.invitation_id;
  var workOrder = data.dispatch_request.work_order;
  var project = data.dispatch_request.project_name;
  var siteDispatch = data.dispatch_request.site_dispatch;
  var salary = data.dispatch_request.allowance;

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
  $("#printKHI").text(formatName(khi));
  $("#printBU").text(khibu);
  $("#printName").text(formatName(name));
  $("#printFrom").text(from);
  $("#printTo").text(to);
  $("#printWO").text(workOrder);
  $("#printProject").text(project);
  $("#printSalary").text(salary);
  $("#printDate").text(date);
}
function formatName(name) {
  const [last, given] = name.split(",");
  const surname = last.toUpperCase();
  return given + " " + surname;
}
function fillAttachment2(data) {
  var dates = data.dispatch_request.date_request;
  var name = data.dispatch_request.emp_name;

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
  var pending = cardData.data.pending;
  var accepted = cardData.data.accepted;
  var cancelled = cardData.data.cancelled;
  var todayTotal = cardData.data.todaytotal;
  var todayAccept = cardData.data.todayaccept;

  var total = cardData.data.total;

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
  const req = reqList.find((req) => req.req_id == trID);
  const name = req.emp_name;
  const grp = req.group_name;
  const passValidity = req.passValid;
  const visaValidity = req.visaValid;
  const startDate = req.from;
  const endDate = req.to;
  const reqName = req.requester_name;
  const reqDate = req.req_date;
  const status = parseInt(req.status);
  const location = req.specific_loc;
  const country = req.location;
  const duration = req.duration;
  const reqGrp = req.requester_group;
  const modi = req.modified;

  const empnum = req.emp_number;
  const [last, given] = name.split(",");
  const surname = last.toUpperCase();
  const first = given.replace(/\s+/g, "");
  formatStatus(status);
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
  if (status === null || isNaN(status)) {
    $("#modifyFooter").addClass("d-none");
  } else {
    $("#modifyFooter").removeClass("d-none");
  }
  $("#openModal").modal("show");
}
function formatDate(date) {
  var [year, month, day] = date.split("-");
  monthName = monthNames2[parseInt(month) - 1];

  return day + " " + monthName + " " + year;
}
function formatStatus(status) {
  let statusString =
    isNaN(status) || status === null
      ? "pending"
      : status === 1
      ? "accepted"
      : "cancelled";
  $("#titleModal").html(
    `  Dispatch Request<span class="status lg ${statusString} ms-3">${statusString}</span>`
  );
  if (!isNaN(status) || status === null) {
    $("#modiLabel").text(`${statusString}`);
  }
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
      <td>${
        item.status === null
          ? ` <span class=" status pending ">
                        Pending
                      </span>`
          : item.status == 1
          ? `  <span class=" status accepted ">
                        Accepted
                      </span>`
          : `<span class=" status cancelled ">
                        Cancelled
                      </span>`
      }</td>
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
    str = `<td colspan="12" class="h-[530px]"><div class="flex items-center justify-center flex-col gap-3"><img src="../images/empty.png"   class="w-[150px] h-auto opacity-[0.75]" alt="empty">
    <h5 class="font-semibold text-[16px] text-[var(--gray-text)]">No item found.</h5>
    <p class="text-[var(--gray-text)]">Try adjusting your search or filter to find what you're looking for.</p>
    </div></td>`;
    $("#tableBody").append(str);
  }
}

function searchFilter(req_list) {
  const keyword = $("#searchbar").val().toLowerCase().trim();
  const grps = $("#grpSel").val().split(",").map(Number);
  const dateFilter = $("#monthSel").val();
  const activeTabId = $("button").has("span.active").attr("id");
  const tabFilters = {
    "tab-2": null,
    "tab-3": 1,
    "tab-4": 0,
  };
  const filter =
    tabFilters[activeTabId] !== undefined ? tabFilters[activeTabId] : undefined;
  const results = req_list.filter((emp) => {
    const searchMatch =
      emp.emp_name.toLowerCase().includes(keyword) ||
      emp.requester_name.toLowerCase().includes(keyword);

    const groupMatch = grps.includes(parseInt(emp.group_id));

    const dateMatch = dateFilter ? emp.req_date.startsWith(dateFilter) : true;

    const statusMatch = filter !== undefined ? emp.status == filter : true;

    return searchMatch && groupMatch && statusMatch && dateMatch;
  });

  results.sort((a, b) => {
    return sortDateAsc
      ? new Date(a.req_date) - new Date(b.req_date)
      : new Date(b.req_date) - new Date(a.req_date);
  });

  fillTable(results);
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
        console.log(response);
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
