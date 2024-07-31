//#region GLOBALS
const rootFolder = `//${document.location.hostname}`;
let empDetails = [];
var dispatch_days = 0;
var to_add = 0;
const full = 183;
var dHistory = [];
var wHistory = [];
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
//#endregion
checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      $(document).ready(function () {
        fillEmployeeDetails();
        getYears();
        getGroups()
          .then((grps) => {
            fillGroups(grps);
            Promise.all([getEmployees(), getLocations(), getInviteTypes()])
              .then(([emps, locs, invs]) => {
                fillEmployees(emps);
                fillLocations(locs);
                fillInvitations(invs);
              })
              .catch((error) => {
                alert(`${error}`);
              });
          })
          .catch(() => {});
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
  getEmployees().then((emps) => {
    fillEmployees(emps);
  });
});
$(document).on("click", ".btn-close", function () {
  $(this).closest(".modal").find("input").attr("disabled", true);
  $("#btn-saveEntry").attr("e-id", 0);
});
$(document).on("click", ".btn-cancel", function () {
  $(this).closest(".modal").find(".btn-close").click();
});
$(document).on("click", ".btn-wh-close", function () {
  $(this).closest(".modal").find("input").attr("disabled", true);
  $("#btn-updateWorkEntry").attr("e-wh-id", 0);
  $("small").removeClass("block");
  $("small").addClass("hidden");
  removeOutline();
});
$(document).on("click", ".btn-wh-cancel", function () {
  $(this).closest(".modal").find(".btn-wh-close").click();
});
$(document).on("change", ".ddates", function () {
  var startD = $("#startDate").val();
  var endD = $("#endDate").val();

  if (!startD || !endD) {
    return;
  }
  countDays(startD, endD)
    .then((cd) => {
      displayDays(cd);
      countTotal();
    })
    .catch((error) => {
      alert(`${error}`);
    });
});
$(document).on("change", "#empSel", function () {
  toggleLoadingAnimation(true);
  Promise.all([
    getPassport(),
    getVisa(),
    getDispatchHistory(),
    getDispatchDays(),
    getYearly(),
    getWorkHistory(),
  ])
    .then(([pass, vsa, dlst, dd, yrl, wlst]) => {
      fillPassport(pass);
      fillVisa(vsa);
      dispatch_days = dd;
      dHistory = dlst;
      fillDispatchHistory(dHistory);
      wHistory = wlst;
      fillWorkHistory(wHistory);
      countTotal();
      fillYearly(yrl);
      toggleLoadingAnimation(false);
    })
    .catch((error) => {
      alert(`${error}`);
      toggleLoadingAnimation(false);
    });
  if ($(this).val() === 0) {
    $("#empDetails__name").text("");
    $(".emptyState").removeClass("d-none");
    $(".withContent").addClass("d-none");
  } else {
    const empID = $("#empSel").find("option:selected").attr("emp-id");
    $("#empDetails__id").text(empID);
    $("#empDetails__name").text($("#empSel option:selected").text());
    $(".emptyState").addClass("d-none");
    $(".withContent").removeClass("d-none");
  }
});
$(document).on("click", "#btnApply", function () {
  checkDispatch();
});
$(document).on("click", ".btn-clear", function () {
  dispatch_days = 0;
  clearInput();

  $(".emptyState").removeClass("d-none");
  $(".withContent").addClass("d-none");
});

$(document).on("click", ".btn-delete", function () {
  var num = $(this).closest("tr").find("td:first-of-type").html();

  var trID = $(this).closest("tr").attr("d-id");
  $("#storeId").html(num);
  $("#storeId").attr("del-id", trID);
});
$(document).on("click", "#btn-deleteEntry", function () {
  deleteDispatch().then((res) => {
    if (res.isSuccess) {
      showToast("success", res.error);
      Promise.all([getDispatchHistory(), getDispatchDays(), getYearly()])
        .then(([dlst, dd, yrl]) => {
          dHistory = dlst;
          fillDispatchHistory(dHistory);
          dispatch_days = dd;
          fillYearly(yrl);
          countTotal();
          $("#deleteEntry .btn-close").click();
        })
        .catch((error) => {
          showToast("error", error);
        });
    } else {
      showToast("error", res.error);
    }
  });
});
$(document).on("click", ".btn-delete-work", function () {
  var num = $(this).closest("tr").find("td:first-of-type").html();

  var WHtrID = $(this).closest("tr").attr("wh-id");
  $("#storeWorkId").html(num);
  $("#storeWorkId").attr("del-work-id", WHtrID);
});
$(document).on("click", "#btn-deleteWorkHistory", function () {
  deleteWork().then((res) => {
    if (res.isSuccess) {
      showToast("success", res.error);
      getWorkHistory()
        .then((wlst) => {
          wHistory = wlst;
          fillWorkHistory(wHistory);
          $("#btn-deleteWorkHistory")
            .closest(".modal")
            .find(".btn-wh-close")
            .click();
        })
        .catch((error) => {
          showToast("error", error);
        });
    } else {
      showToast("error", res.error);
    }
  });
});
$(document).on("click", "#updateEmp", function () {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  if (!empID) {
    return;
  } else {
    window.location.href = `../empDetails?id=${empID}`;
  }
});

$(document).on("click", "#btn-saveEntry", function () {
  saveEditEntry().then((res) => {
    if (res.isSuccess) {
      showToast("success", res.error);
      Promise.all([getDispatchHistory(), getDispatchDays(), getYearly()])
        .then(([dlst, dd, yrl]) => {
          dHistory = dlst;
          fillDispatchHistory(dHistory);
          dispatch_days = dd;
          fillYearly(yrl);
          countTotal();
          $("#btn-saveEntry").closest(".modal").find(".btn-close").click();
        })
        .catch((error) => {
          showToast("error", error);
        });
    } else {
      showToast("error", res.error);
    }
  });
});
$(document).on("click", "#btn-updateWorkEntry", function () {
  saveEditWorkHistEntry()
    .then((res) => {
      if (res.isSuccess) {
        showToast("success", res.error);
        getWorkHistory()
          .then((wlst) => {
            wHistory = wlst;
            fillWorkHistory(wHistory);
            $("#btn-updateWorkEntry")
              .closest(".modal")
              .find(".btn-wh-close")
              .click();
          })
          .catch((error) => {
            showToast("error", error);
          });
      } else {
        showToast("error", res.error);
      }
    })
    .catch((error) => {
      showToast("error", error);
    });
});
$(document).on("change", ".edit-date", function () {
  computeTotalDays();
});
$(document).on("change", "#editentryDateP", function () {
  $("#editentryDateJ").attr("max", $(this).val());
});
$(document).on("change", "#editentryDateJ", function () {
  $("#editentryDateP").attr("min", $(this).val());
});
$(document).on("click", ".btn-edit", function () {
  var trID = parseInt($(this).closest("tr").attr("d-id"));
  getEditDetails(trID);
  $("#editentryDateP, #editentryDateJ").prop("disabled", false);
  $("#editEntry").modal("show");
  $("#btn-saveEntry").attr("e-id", trID);
});
$(document).on("click", ".add-work", function () {
  $(
    "#addcompanyName, #addStartMonthYear, #addEndMonthYear, #addcompanyBusiness, #addbusinessContent, #addworkLocation"
  ).prop("disabled", false);
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  $("#addNewWork").modal("show");
});
$(document).on("click", "#btn-addWorkEntry", function () {
  addWorkHistory()
    .then((res) => {
      if (!res.isSuccess) {
        showToast("error", `${res.error}`);
      } else {
        getWorkHistory()
          .then((wlst) => {
            wHistory = wlst;
            fillWorkHistory(wHistory);
            clearAddWorkInputs();
            $("#btn-addWorkEntry")
              .closest(".modal")
              .find(".btn-wh-close")
              .click();
          })
          .catch((error) => {
            showToast("error", error);
          });
        showToast("success", "Successfully Added Work History");
      }
    })
    .catch((error) => {
      showToast("error", error);
    });
});
$(document).on("click", ".btn-edit-work", function () {
  var WHtrID = parseInt($(this).closest("tr").attr("wh-id"));
  getEditWorkHistDetails(WHtrID);
  $(
    "#edit-companyName, #edit-StartMonthYear, #edit-EndMonthYear, #edit-companyBusiness, #edit-businessContent, #edit-workLocation"
  ).prop("disabled", false);
  $("#editWorkHistory").modal("show");
  $("#btn-updateWorkEntry").attr("e-wh-id", WHtrID);
});
$(document).on("click", "#btnExport", function () {
  exportTable();
});
$(document).on("click", ".rmvToast", function () {
  $(this).closest(".toasty").remove();
});
$(document).on(
  "click",
  "#reqDeptInput, #reqNameInput, #grpSel, #empSel, #startDate, #endDate, #locSel, #specLocInput, #inviteSel, #workOrder, #projName, #allowance",
  function () {
    $(this).removeClass("bg-red-100  border-red-400");
    $(".errTxt").remove();
  }
);
$(document).on(
  "click",
  "#addcompanyName, #addStartMonthYear, #addEndMonthYear, #addcompanyBusiness, #addbusinessContent, #addworkLocation",
  function () {
    $(this).removeClass("bg-red-100  border-red-400");
    if ($(this).hasClass("company-name")) {
      $(".compNameError").removeClass("block");
      $(".compNameError").addClass("hidden");
    } else if ($(this).hasClass("company-business")) {
      $(".BusiError").removeClass("block");
      $(".BusiError").addClass("hidden");
    } else if ($(this).hasClass("business-content")) {
      $(".ContentError").removeClass("block");
      $(".ContentError").addClass("hidden");
    } else if ($(this).hasClass("work-location")) {
      $(".LocError").removeClass("block");
      $(".LocError").addClass("hidden");
    } else {
      $(".dateError").removeClass("block");
      $(".dateError").addClass("hidden");
    }
  }
);
$(document).on(
  "click",
  "#edit-companyName, #edit-StartMonthYear, #edit-EndMonthYear, #edit-companyBusiness, #edit-businessContent, #edit-workLocation",
  function () {
    $(this).removeClass("bg-red-100  border-red-400");
    if ($(this).hasClass("company-name")) {
      $(".compNameError").removeClass("block");
      $(".compNameError").addClass("hidden");
    } else if ($(this).hasClass("company-business")) {
      $(".BusiError").removeClass("block");
      $(".BusiError").addClass("hidden");
    } else if ($(this).hasClass("business-content")) {
      $(".ContentError").removeClass("block");
      $(".ContentError").addClass("hidden");
    } else if ($(this).hasClass("work-location")) {
      $(".LocError").removeClass("block");
      $(".LocError").addClass("hidden");
    } else {
      $(".dateError").removeClass("block");
      $(".dateError").addClass("hidden");
    }
  }
);
$(document).on("change", "#startDate", function () {
  const sdate = $(this).val();
  $("#endDate").attr("min", sdate);
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
$(document).on("keydown", "#allowance", function (e) {
  if (e.which === 38 || e.which === 40 || e.which === 189) {
    e.preventDefault();
  }
});

// $(document).on("click", "#btnNext", function () {
//   $("#attachmentModal").modal("hide");
//   fillAttachment2();
// });
// $(document).on("click", "#btnBack", function () {
//   $("#attachmentModal2").modal("hide");
//   $("#attachmentModal").modal("show");
// });
$(document).on("click", "#btnSend", function () {
  insertDispatch();
});

$(".lbl-viewForm").click(function () {
  $(this).text(
    $(this).text() == "Hide Dispatch Form"
      ? "View Dispatch Form"
      : "Hide Dispatch Form"
  );
  // $(this).html($(this).html() == `▼` ? `▲` : `▼`);

  // $(".sample").addClass("hidden");

  $("#left").toggleClass("changeSize");
  $(".sticky-buttons").toggleClass("appear");
  $(".viewForm").toggleClass("bgChange");

  const checking = $("#check").is(":checked");
});

//#endregion

//#region FUNCTIONS
function formatName(name) {
  const [last, given] = name.split(",");
  const surname = last.toUpperCase();
  return given + " " + surname;
}
function fillAttachment() {
  const reqDept = $("#reqDeptInput").val();
  const reqName = $("#reqNameInput").val();
  const grp = $("#grpSel").find("option:selected").text();
  const emp = $("#empSel").find("option:selected").text();
  const startD = $("#startDate").val();
  const endD = $("#endDate").val();
  const locID = $("#locSel").find("option:selected").attr("loc-id");
  const specLoc = $("#specLocInput").val();
  const inviteID = $("#inviteSel").find("option:selected").attr("inv-id");
  const workOrder = $("#workOrder").val();
  const projName = $("#projName").val();
  const allowance = $("#allowance").val();
  const siteDispatch = $("#siteDispatch").is(":checked");

  $("#printBU").text(reqDept);
  $("#printKHI").text(reqName);
  $("#printName").text(formatName(emp));
  $("#printFrom").text(formatDate(startD));
  $("#printTo").text(formatDate(endD));
  if (locID == 1) {
    insertIconCountry(1);
    $("#printJap").text(specLoc);
  }
  if (locID == 2) {
    insertIconCountry(2);
    $("#printPh").text(specLoc);
  }
  if (locID == 3) {
    insertIconCountry(3);
    $("#printThird").text(specLoc);
  }
  if (inviteID == 1) {
    insertIconInvitation(1);
  }
  if (inviteID == 2) {
    insertIconInvitation(2);
  }
  if (inviteID == 3) {
    insertIconInvitation(3);
  }
  if (siteDispatch === true) {
    $(".siteDispatch").html(`<i class="bx bx-x down"></i>`);
  }
  if (siteDispatch === false) {
    $(".siteDispatch").empty();
  }
  $("#printSalary").text(allowance);
  $("#printWO").text(workOrder);
  $("#printProject").text(projName);

  var today = new Date();
  var day = today.getDate();
  var month = today.getMonth() + 1;
  var year = today.getFullYear();

  if (day < 10) {
    day = "0" + day;
  }
  if (month < 10) {
    month = "0" + month;
  }
  var month;
  var str = year + "-" + month + "-" + day;
  $("#printDate").text(formatDate(str));
  $("#attachmentModal").modal("show");
}
function formatDate(date) {
  var [year, month, day] = date.split("-");
  monthName = monthNames2[parseInt(month) - 1];

  return day + " " + monthName + " " + year;
}

// function fillAttachment2() {
//   const emp = $("#empSel").find("option:selected").text();
//   var today = new Date();
//   var day = today.getDate();
//   var month = today.getMonth() + 1;
//   var year = today.getFullYear();

//   if (day < 10) {
//     day = "0" + day;
//   }
//   if (month < 10) {
//     month = "0" + month;
//   }

//   $("#whYear").text(year);
//   $("#whMonth").text(month);
//   $("#whDay").text(day);
//   $("#whName").text(emp);

//   $("#attachmentModal2").modal("show");
// }

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
          reject("An unspecified error occurred while fetching groups.");
        }
      },
    });
  });
}
function fillGroups(grps) {
  const groupIDS = grps.map((obj) => obj.id);
  var grpSelect = $("#grpSel");
  grpSelect.html(`<option value=${groupIDS.toString()}>Select Group</option>`);
  $.each(grps, function (index, item) {
    var option = $("<option>")
      .attr("value", item.id)
      .text(item.name)
      .attr("grp-id", item.id);
    grpSelect.append(option);
  });
}
function getEmployees() {
  const grpID = $("#grpSel").val();
  dispatch_days = 0;
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/get_employees.php",
      data: {
        grpID: grpID,
      },
      dataType: "json",
      success: function (response) {
        const emps = response;
        resolve(emps);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred fetching employee list.");
        }
      },
    });
  });
}
function fillEmployees(emps) {
  var empSelect = $("#empSel");
  empSelect.html("<option value='0' hidden>Select Employee</option>");
  $.each(emps, function (index, item) {
    var option = $("<option>")
      // .attr("value", item.id)
      .text(capitalizeWords(item.name))
      .attr("emp-id", item.id);
    empSelect.append(option);
  });
}
function countDays(strt, end) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/check_add_duration.php",
      data: {
        dateFrom: strt,
        dateTo: end,
      },
      dataType: "json",
      success: function (response) {
        const countDays = response;
        resolve(countDays);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while checking add duration.");
        }
      },
    });
  });
}
function displayDays(cdays) {
  if (cdays.difference === 1) {
    $("#daysCount").text(" 1 day.");
  } else {
    $("#daysCount").text(`${cdays.difference} days`);
  }
  to_add = cdays.toAdd;
}
function getPassport() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const sDate = $("#startDate").val();
  const eDate = $("#endDate").val();

  return new Promise((resolve, reject) => {
    if (empID === undefined) {
      resolve([]);
    }
    $.ajax({
      type: "POST",
      url: "php/get_passport.php",
      data: {
        empID: empID,
        sDate: sDate,
        eDate: eDate,
      },
      dataType: "json",
      success: function (response) {
        const pport = response;
        resolve(pport);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject(
            "An unspecified error occurred while fetching passport details."
          );
        }
      },
    });
  });
}
function fillPassport(pport) {
  if (Object.keys(pport).length > 0) {
    const pnum = pport.number;
    const pbday = pport.bday;
    const pissue = pport.issue;
    const pexpiry = pport.expiry;
    const pvalid = pport.valid;
    $("#passNo").text(pnum);
    $("#passBday").text(pbday);
    $("#passIssue").text(pissue);
    $("#passExp").text(pexpiry);
    if (pvalid) {
      $("#passStatus").removeClass("bg-danger");
      $("#passStatus").addClass("bg-[var(--tertiary)]");
      $("#passStatus").text("Valid");
    } else {
      $("#passStatus").removeClass("bg-[var(--tertiary)]");
      $("#passStatus").addClass("bg-danger");
      $("#passStatus").text("Expired");
    }
    $("#passDeets").removeClass("d-none");
    $("#passEmpty").addClass("d-none");
  } else {
    $("#passDeets").addClass("d-none");
    $("#passEmpty").removeClass("d-none");
  }
}
function getVisa() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const sDate = $("#startDate").val();
  const eDate = $("#endDate").val();
  return new Promise((resolve, reject) => {
    if (empID === undefined) {
      resolve([]);
    }
    $.ajax({
      type: "POST",
      url: "php/get_visa.php",
      data: {
        empID: empID,
        sDate: sDate,
        eDate: eDate,
      },
      dataType: "json",
      success: function (response) {
        const visa = response;
        resolve(visa);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching visa details.");
        }
      },
    });
  });
}
function fillVisa(vsa) {
  if (Object.keys(vsa).length > 0) {
    const vnum = vsa.number;
    const vissue = vsa.issue;
    const vexpiry = vsa.expiry;
    const vvalid = vsa.valid;
    $("#visaNo").text(vnum);
    $("#visaIssue").text(vissue);
    $("#visaExp").text(vexpiry);
    if (vvalid) {
      $("#visaStatus").removeClass("bg-danger");
      $("#visaStatus").addClass("bg-[var(--tertiary)]");
      $("#visaStatus").text("Valid");
    } else {
      $("#visaStatus").removeClass("bg-[var(--tertiary)]");
      $("#visaStatus").addClass("bg-danger");
      $("#visaStatus").text("Expired");
    }
    $("#visaDeets").removeClass("d-none");
    $("#visaEmpty").addClass("d-none");
  } else {
    $("#visaDeets").addClass("d-none");
    $("#visaEmpty").removeClass("d-none");
  }
}
function getWorkHistory() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  // const yScope = $("#dToggle").val();
  return new Promise((resolve, reject) => {
    if (empID === undefined) {
      resolve([]);
    }
    $.ajax({
      type: "POST",
      url: "php/get_work_history.php",
      data: {
        empID: empID,
        // yScope: yScope,
      },
      dataType: "json",
      success: function (response) {
        const wList = response.result;
        resolve(wList);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching work history.");
        }
      },
    });
  });
}
function fillWorkHistory(wList) {
  var tableBody = $("#wList");
  tableBody.empty();
  if (wList.length === 0) {
    var addDataRow = $(
      "<tr> <td colspan='10' class='add-work text-center text-[var(--gray-text)] '> + Add New Item</td></tr>"
    );
    tableBody.append(addDataRow);
  } else {
    $.each(wList, function (index, item) {
      var row = $(`<tr wh-id=${item.id}>`);
      row.append(`<td data-exclude='true'>${index + 1}</td>`);
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.start_year}</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.start_month}</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${
          item.end_year ? item.end_year : ""
        }</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${
          item.end_month ? item.end_month : ""
        }</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.comp_name}</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.comp_business}</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.business_cont}</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.work_loc}</td>`
      );

      row.append(`<td data-exclude='true'>
        <div class="d-flex gap-2">
        <button
          class="btn-edit-work"
          title="Edit Work Entry"
          
        >
        <i class='bx bxs-edit fs-5' ></i>
        </button>
        <button
          class="btn-delete-work"
          title="Delete Work Entry"
          data-bs-toggle="modal"
          data-bs-target="#deleteWorkHistory"
        >
          <i class="bx bx-trash fs-5"></i>
        </button>
      </div></td>`);

      tableBody.append(row);
    });
    var addDataRow = $(
      "<tr> <td colspan='10' class='add-work text-center text-[var(--gray-text)] bg-[var(--white)]'> + Add New Item</td></tr>"
    );
    tableBody.append(addDataRow);
  }
}
function getDispatchHistory() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const yScope = $("#dToggle").val();
  return new Promise((resolve, reject) => {
    if (empID === undefined) {
      resolve([]);
    }
    $.ajax({
      type: "POST",
      url: "php/get_dispatch_history.php",
      data: {
        empID: empID,
        yScope: yScope,
      },
      dataType: "json",
      success: function (response) {
        const dList = response;
        resolve(dList);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject(
            "An unspecified error occurred while fetching dispatch history."
          );
        }
      },
    });
  });
}
function fillDispatchHistory(dlist) {
  var tableBody = $("#dList");
  tableBody.empty();
  if (dlist.length === 0) {
    var noDataRow = $(
      "<tr><td colspan='7' class='text-center'>No data found</td></tr>"
    );
    tableBody.append(noDataRow);
  } else {
    $.each(dlist, function (index, item) {
      var row = $(`<tr d-id=${item.id}>`);
      row.append(`<td data-exclude='true'>${index + 1}</td>`);
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.locationName}</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.fromDate}</td>`
      );
      row.append(
        `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.toDate}</td>`
      );
      if (item.duration > 183) {
        row.append(
          `<td class="redText" data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000" data-f-color="FFFF0000">${item.duration}</td>`
        );
      } else {
        row.append(
          `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${item.duration}</td>`
        );
      }

      if (item.pastOne > 183) {
        row.append(
          `<td class="redText" data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000" data-f-color="FFFF0000">${item.pastOne}</td>`
        );
      } else {
        row.append(
          `<td  data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000" >${item.pastOne}</td>`
        );
      }

      row.append(`<td data-exclude='true'>
        <div class="d-flex gap-2">
        <button
          class="btn-edit"
          title="Edit Entry"
          
        >
        <i class='bx bxs-edit fs-5' ></i>
        </button>
        <button
          class="btn-delete"
          title="Delete Entry"
          data-bs-toggle="modal"
          data-bs-target="#deleteEntry"
        >
          <i class="bx bx-trash fs-5"></i>
        </button>
      </div></td>`);

      tableBody.append(row);
    });
  }
}
function getDispatchDays() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  return new Promise((resolve, reject) => {
    if (empID === undefined) {
      resolve(0);
    }
    $.ajax({
      type: "POST",
      url: "php/check_duration.php",
      data: {
        empID: empID,
      },
      success: function (response) {
        const dDays = response;
        resolve(dDays);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred checking duration.");
        }
      },
    });
  });
}
function countTotal() {
  const daysCount = parseInt(to_add, 10);
  const dispDays = parseInt(dispatch_days, 10);
  var countText = "";
  const dd = daysCount + dispDays;
  if (dd == 1) {
    countText = `1 day`;
  } else {
    if (dd > 183) {
      $("#rangeCount").addClass("redText");
      countText = `${dd} days`;
      console.log("lagpas");
    } else {
      $("#rangeCount").removeClass("redText");
      countText = `${dd} days`;
    }
  }

  $("#rangeCount").text(countText);

  setBar(dd);
  colorBar(dd);
}
function setBar(dd) {
  const wd = (dd / full) * 100;
  $("#progBar").css("width", `${wd}%`);
}
function colorBar(dd) {
  $("#daysWarning span").text(
    "Warning: Total dispatch days exceeds 183 days for this year."
  );
  $("#daysWarning").addClass("d-none");
  if (dd >= full) {
    $("#progBar")
      .addClass("bg-danger")
      .removeClass("bg-[var(--tertiary)] bg-warning");

    if (dd > full) {
      $("#daysWarning").removeClass("d-none");
    }
  } else if (dd >= 150 && dd < full) {
    $("#progBar")
      .addClass("bg-warning")
      .removeClass("bg-[var(--tertiary)] bg-danger");
  } else {
    $("#progBar")
      .addClass("bg-[var(--tertiary)]")
      .removeClass("bg-warning bg-danger");
  }
}
function removeOutline() {
  $("#edit-companyName").removeClass("bg-red-100  border-red-400");
  $("#edit-StartMonthYear").removeClass("bg-red-100  border-red-400");
  $("#edit-EndMonthYear").removeClass("bg-red-100  border-red-400");
  $("#edit-companyBusiness").removeClass("bg-red-100  border-red-400");
  $("#edit-businessContent").removeClass("bg-red-100  border-red-400");
  $("#edit-workLocation").removeClass("bg-red-100  border-red-400");
  $("#addcompanyName").removeClass("bg-red-100  border-red-400");
  $("#addStartMonthYear").removeClass("bg-red-100  border-red-400");
  $("#addEndMonthYear").removeClass("bg-red-100  border-red-400");
  $("#addcompanyBusiness").removeClass("bg-red-100  border-red-400");
  $("#addbusinessContent").removeClass("bg-red-100  border-red-400");
  $("#addworkLocation").removeClass("bg-red-100  border-red-400");
}
function checkDispatch() {
  const reqDept = $("#reqDeptInput").val();
  const reqName = $("#reqNameInput").val();
  const grp = $("#grpSel").find("option:selected").attr("grp-id");
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const startD = $("#startDate").val();
  const endD = $("#endDate").val();
  const locID = $("#locSel").find("option:selected").attr("loc-id");
  const specLoc = $("#specLocInput").val();
  const inviteID = $("#inviteSel").find("option:selected").attr("inv-id");
  const workOrder = $("#workOrder").val();
  const projName = $("#projName").val();
  const allowance = $("#allowance").val();
  const siteDispatch = $("#siteDispatch").is(":checked");
  let ctr = 0;

  toggleLoadingAnimation(true);
  if (!reqDept) {
    $("#reqDeptInput").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!reqName) {
    $("#reqNameInput").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!grp) {
    $("#grpSel").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!empID) {
    $("#empSel").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!startD) {
    $("#startDate").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!endD) {
    $("#endDate").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!locID) {
    $("#locSel").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!specLoc) {
    $("#specLocInput").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!inviteID) {
    $("#inviteSel").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!workOrder) {
    $("#workOrder").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!projName) {
    $("#projName").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!allowance) {
    $("#allowance").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (ctr > 0) {
    $(".error-msg").html(`
    <div class="errTxt mb-3 flex items-center gap-1">
    <i class='bx bx-info-circle text-red-600'></i>
    <p class="text-red-600">Please complete all fields.</p>
    </div>`);
    console.log("complete required fields");
    toggleLoadingAnimation(false);
    return;
  }
  const startDate = new Date(startD);
  const endDate = new Date(endD);
  if (endDate < startDate) {
    alert("End date must not be earlier than start date.");
    $("#endDate").val("");
    to_add = 0;
    countTotal();
    $("#daysCount").text("");
    toggleLoadingAnimation(false);
    return;
  }
  toggleLoadingAnimation(false);
  fillAttachment();
}
function insertDispatch() {
  const reqDept = $("#reqDeptInput").val();
  const reqName = $("#reqNameInput").val();
  const grp = $("#grpSel").find("option:selected").attr("grp-id");
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const startD = $("#startDate").val();
  const endD = $("#endDate").val();
  const locID = $("#locSel").find("option:selected").attr("loc-id");
  const specLoc = $("#specLocInput").val();
  const inviteID = $("#inviteSel").find("option:selected").attr("inv-id");
  const workOrder = $("#workOrder").val();
  const projName = $("#projName").val();
  const allowance = $("#allowance").val();
  const siteDispatch = $("#siteDispatch").is(":checked");

  toggleLoadingAnimation(true);

  $.ajax({
    type: "POST",
    url: "php/insert_request.php",
    data: {
      request_dept: reqDept,
      request_name: reqName,
      empID: empID,
      dateFrom: startD,
      dateTo: endD,
      locID: locID,
      spec_loc: specLoc,
      inviID: inviteID,
      workOrder: workOrder,
      project_name: projName,
      allowance: allowance,
      site_dispatch: siteDispatch,
    },
    dataType: "json",
    success: function (response) {
      const isSuccess = response.isSuccess;
      if (!isSuccess) {
        $("#attachmentModal .btn-close").click();
        toggleLoadingAnimation(false);
        showToast("error", `${response.error}`);
      } else {
        Promise.all([getDispatchHistory(), getDispatchDays(), getYearly()])
          .then(([dlst, dd, yrl]) => {
            dHistory = dlst;
            fillDispatchHistory(dHistory);
            dispatch_days = dd;
            fillYearly(yrl);
            $("#reqDeptInput").val("");
            $("#reqNameInput").val("");
            $("#grpSel").val(0);
            $("#empSel").val(0);
            $("#startDate").val("");
            $("#endDate").val("");
            $("#daysCount").text("0 Day");
            $("#locSel").val(0);
            $("#specLocInput").val("");
            $("#inviteSel").val(0);
            $("#workOrder").val("");
            $("#projName").val("");
            $("#allowance").val("0");
            to_add = 0;
            countTotal();
            $("#attachmentModal .btn-close").click();
            showToast("success", "Successfully added a dispatch entry.");
            toggleLoadingAnimation(false);
          })
          .catch((error) => {
            $("#attachmentModal .btn-close").click();
            toggleLoadingAnimation(false);
            alert(`${error}`);
          });
      }
    },
    error: function (xhr, status, error) {
      if (xhr.status === 404) {
        alert("Not Found Error: The requested resource was not found.");
      } else if (xhr.status === 500) {
        alert("Internal Server Error: There was a server error.");
      } else {
        alert("An unspecified error occurred while adding dispatch data.");
      }
    },
  });
}
function clearInput() {
  $(
    "#reqDeptInput, #reqNameInput, #grpSel, #empSel, #startDate, #endDate, #locSel, #specLocInput, #inviteSel, #workOrder, #projName, #allowance"
  ).removeClass("bg-red-100  border-red-400");
  $(".errTxt").remove();
  $("#grpSel, #empSel, #locSel, #inviteSel").val(0);
  $(
    "#reqDeptInput, #reqNameInput, #startDate, #endDate, #specLocInput, #workOrder, #projName"
  ).val("");
  $("#allowance").val("0");
  to_add = 0;
  $("#daysCount").text("0 Day");
  $("#empSel").change();
}
function clearAddWorkInputs() {
  $(
    "#addcompanyName, #addStartMonthYear, #addEndMonthYear, #addcompanyBusiness, #addbusinessContent, #addworkLocation"
  ).removeClass("bg-red-100  border-red-400");
  $(
    "#addcompanyName, #addStartMonthYear, #addEndMonthYear, #addcompanyBusiness, #addbusinessContent, #addworkLocation"
  ).val("");
}

function getLocations() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_location.php",
      dataType: "json",
      success: function (response) {
        const locs = response;
        resolve(locs);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred fetching locations.");
        }
      },
    });
  });
}
function fillLocations(locs) {
  var locSelect = $("#locSel");
  locSelect.html("<option value='0'>Select Location</option>");
  $("#editentryLocation").empty();
  $.each(locs, function (index, item) {
    var option = $("<option>")
      .attr("value", item.id)
      .text(item.name)
      .attr("loc-id", item.id);
    locSelect.append(option);
    $("#editentryLocation").append(option.clone());
  });
}
function getInviteTypes() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_invitation.php",
      dataType: "json",
      success: function (response) {
        const invis = response;
        resolve(invis);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred fetching invitation types.");
        }
      },
    });
  });
}
function fillInvitations(invis) {
  var invSelect = $("#inviteSel");
  invSelect.html("<option value='0'>Select Invitation Type</option>");
  $("#editentryInvite").empty();
  $.each(invis, function (index, item) {
    var option = $("<option>")
      .attr("value", item.id)
      .text(item.type)
      .attr("inv-id", item.id);
    invSelect.append(option);
    $("#editentryInvite").append(option.clone());
  });
}
function deleteDispatch() {
  const delID = $("#storeId").attr("del-id");
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/delete_dispatch_history.php",
      dataType: "json",
      data: {
        dispatchID: delID,
      },
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
          reject(
            "An unspecified error occurred while deleting dispatch history."
          );
        }
      },
    });
  });
}
function deleteWork() {
  const delWorkID = $("#storeWorkId").attr("del-work-id");
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/delete_work_history.php",
      dataType: "json",
      data: {
        work_histID: delWorkID,
      },
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
          reject(
            "An unspecified error occurred while deleting dispatch history."
          );
        }
      },
    });
  });
}
function addWorkHistory() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const comp_name = $("#addcompanyName").val();
  const startMonthYear = $("#addStartMonthYear").val();
  const endMonthYear = $("#addEndMonthYear").val();
  const comp_business = $("#addcompanyBusiness").val();
  const business_cont = $("#addbusinessContent").val();
  const work_loc = $("#addworkLocation").val();
  let errcount = 0;

  if (!comp_name) {
    $("#addcompanyName").addClass("bg-red-100  border-red-400");
    $(".compNameError").removeClass("hidden");
    $(".compNameError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!startMonthYear) {
    $("#addStartMonthYear").addClass("bg-red-100  border-red-400");
    $(".dateError").removeClass("hidden");
    $(".dateError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!comp_business) {
    $("#addcompanyBusiness").addClass("bg-red-100  border-red-400");
    $(".BusiError").removeClass("hidden");
    $(".BusiError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!business_cont) {
    $("#addbusinessContent").addClass("bg-red-100  border-red-400");
    $(".ContentError").removeClass("hidden");
    $(".ContentError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!work_loc) {
    $("#addworkLocation").addClass("bg-red-100  border-red-400");
    $(".LocError").removeClass("hidden");
    $(".LocError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  return new Promise((resolve, reject) => {
    if (endMonthYear && endMonthYear < startMonthYear) {
      $("#addEndMonthYear").val("");
      $("#addStartMonthYear").val("");
      $("#addEndMonthYear").addClass("bg-red-100  border-red-400");
      $("#addStartMonthYear").addClass("bg-red-100  border-red-400");
      $(".dateError").removeClass("hidden");
      $(".dateError").addClass("block flex items-center gap-1 text-red-600");
      $(".dateError").text(
        "Invalid Date. End date must not be earlier than Start date."
      );
      reject("Invalid Date. End date must not be earlier than Start date.");
    }
    if (errcount > 0) {
      reject("Complete all fields.");
    }
    $.ajax({
      type: "POST",
      url: "php/insert_work_history.php",
      data: {
        empID: empID,
        comp_name: comp_name,
        date_monthYearStart: startMonthYear,
        date_monthYearEnd: endMonthYear,
        comp_business: comp_business,
        business_cont: business_cont,
        work_loc: work_loc,
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
          reject("An unspecified error occurred while inserting work history.");
        }
      },
    });
  });
}

function checkAccess() {
  // const response = {
  //   isSuccess: true,
  //   data: {
  //     id: 6969,
  //     group: "Systems Group",
  //     empname: {
  //       firstname: "Korin Kitto",
  //       surname: "Medurano",
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
      url: "global/check_login.php",
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
          reject("An unspecified error occurred while checking login details.");
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

function saveEditEntry() {
  var loc = $("#editentryLocation").val();
  var dateJapan = $("#editentryDateJ").val();
  var datePh = $("#editentryDateP").val();
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const editID = $("#btn-saveEntry").attr("e-id");
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/update_dispatch_history.php",
      data: {
        dispatchID: editID,
        locID: loc,
        dateFrom: dateJapan,
        dateTo: datePh,
        empID: empID,
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
          reject("An unspecified error occurred while updating dispatch data.");
        }
      },
    });
  });
}
function saveEditWorkHistEntry() {
  var startMonthYear = $("#edit-StartMonthYear").val();
  var endMonthYear = $("#edit-EndMonthYear").val();
  var compName = $("#edit-companyName").val();
  var compBusiness = $("#edit-companyBusiness").val();
  var businesscont = $("#edit-businessContent").val();
  var workloc = $("#edit-workLocation").val();
  // const empID = $("#empSel").find("option:selected").attr("emp-id");
  const editID = $("#btn-updateWorkEntry").attr("e-wh-id");
  let errcount = 0;

  if (!compName) {
    $("#edit-companyName").addClass("bg-red-100  border-red-400");
    $(".compNameError").removeClass("hidden");
    $(".compNameError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!startMonthYear) {
    $("#edit-StartMonthYear").addClass("bg-red-100  border-red-400");
    $(".dateError").removeClass("hidden");
    $(".dateError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!compBusiness) {
    $("#edit-companyBusiness").addClass("bg-red-100  border-red-400");
    $(".BusiError").removeClass("hidden");
    $(".BusiError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!businesscont) {
    $("#edit-businessContent").addClass("bg-red-100  border-red-400");
    $(".ContentError").removeClass("hidden");
    $(".ContentError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }
  if (!workloc) {
    $("#edit-workLocation").addClass("bg-red-100  border-red-400");
    $(".LocError").removeClass("hidden");
    $(".LocError").addClass("block flex items-center gap-1 text-red-600");
    errcount++;
  }

  return new Promise((resolve, reject) => {
    if (endMonthYear && endMonthYear < startMonthYear) {
      $("#addEndMonthYear").val("");
      $("#addStartMonthYear").val("");
      $("#addEndMonthYear").addClass("bg-red-100  border-red-400");
      $("#addStartMonthYear").addClass("bg-red-100  border-red-400");
      $(".dateError").removeClass("hidden");
      $(".dateError").addClass("block flex items-center gap-1 text-red-600");
      $(".dateError").text(
        "Invalid Date. End date must not be earlier than Start date."
      );
      reject("Invalid Date. End date must not be earlier than Start date.");
    }
    if (errcount > 0) {
      reject("Complete all fields");
    }
    $.ajax({
      type: "POST",
      url: "php/update_work_history.php",
      data: {
        date_monthYearStart: startMonthYear,
        date_monthYearEnd: endMonthYear,
        comp_name: compName,
        comp_business: compBusiness,
        business_cont: businesscont,
        work_loc: workloc,
        work_histID: editID,
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
          reject("An unspecified error occurred while updating dispatch data.");
        }
      },
    });
  });
}

function computeTotalDays() {
  var from = new Date($("#editentryDateJ").val());
  var to = new Date($("#editentryDateP").val());

  if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
    var differenceInTime = to.getTime() - from.getTime();
    var differenceInDays =
      Math.round(differenceInTime / (1000 * 3600 * 24)) + 1;

    $("#editentryDays").html(differenceInDays);
  }
}
function getEditDetails(editID) {
  const editItem = dHistory.find((item) => parseInt(item.id) === editID);
  var loc = editItem["locationName"];
  var japan = editItem["fromDate"];
  var parsedDateJap = new Date(japan);

  var formattedDateJap =
    parsedDateJap.getFullYear() +
    "-" +
    ("0" + (parsedDateJap.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + parsedDateJap.getDate()).slice(-2);
  var ph = editItem["toDate"];
  var parsedDatePh = new Date(ph);
  var formattedDatePh =
    parsedDatePh.getFullYear() +
    "-" +
    ("0" + (parsedDatePh.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + parsedDatePh.getDate()).slice(-2);

  var total = editItem["duration"];

  $("#editentryDateJ").val(formattedDateJap);
  $("#editentryDateJ").attr("max", formattedDatePh);
  $("#editentryDateP").val(formattedDatePh);
  $("#editentryDateP").attr("min", formattedDateJap);
  $("#editentryLocation option:contains(" + loc + ")").prop("selected", true);
  $(" #editentryDays").html(total);
}
function getEditWorkHistDetails(editworkID) {
  const editItem = wHistory.find((item) => parseInt(item.id) === editworkID);
  var st_year = editItem["start_year"];
  var st_month = editItem["start_month"];
  var end_year = editItem["end_year"];
  var end_month = editItem["end_month"];
  var comp_name = editItem["comp_name"];
  var comp_business = editItem["comp_business"];
  var business_cont = editItem["business_cont"];
  var work_loc = editItem["work_loc"];
  let newStMonth = "";
  let newEndMonth = "";

  if (st_month < 10) {
    newStMonth = "0" + st_month;
  } else {
    newStMonth = st_month;
  }
  if (end_month < 10) {
    newEndMonth = "0" + end_month;
  } else {
    newEndMonth = end_month;
  }
  const stMonthYear = `${st_year}-${newStMonth}`;
  const endMonthYear = `${end_year}-${newEndMonth}`;
  $("#edit-StartMonthYear").val(stMonthYear);
  $("#edit-EndMonthYear").val(endMonthYear);
  $("#edit-companyName").val(comp_name);
  $("#edit-companyBusiness").val(comp_business);
  $("#edit-businessContent").val(business_cont);
  $("#edit-workLocation").val(work_loc);
}
function getYearly() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  return new Promise((resolve, reject) => {
    if (empID === undefined) {
      resolve([]);
    }
    $.ajax({
      type: "POST",
      url: "php/get_yearly.php",
      data: {
        empID: empID,
      },
      dataType: "json",
      success: function (response) {
        const yrly = response;
        resolve(yrly);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching yearly data.");
        }
      },
    });
  });
}

function fillYearly(yrl) {
  var x = 1;
  var yrRow = `<tr class='d-none'></tr><tr class='d-none'>
  <tr class='d-none'><td data-f-name='Arial' data-f-sz='9' data-f-bold='true' data-a-h='center' data-a-v='middle' data-b-a-s='thin' data-b-a-c='000000'>Year</td>
  <td data-f-name="Arial" data-f-sz="9" data-f-bold="true" data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">Total Days in Japan</td> </tr>`;
  Object.entries(yrl).forEach(([key, value]) => {
    $(`#y${x}`).text(key);

    $(`#y${x}-days`).text(value);
    if (value > 183) {
      $(`#y${x}-days`).addClass("redText");
      yrRow += `<tr class='d-none'><td data-f-name='Arial' data-f-sz='9' data-a-h='center' data-a-v='middle' data-b-a-s='thin' data-b-a-c='000000'>${key}</td><td data-f-name='Arial' data-f-sz='9' data-a-h='center' data-a-v='middle' data-b-a-s='thin' data-b-a-c='000000' data-f-color='FFFF0000'>${value}</td></tr>`;
    } else {
      $(`#y${x}-days`).removeClass("redText");
      yrRow += `<tr class='d-none'><td data-f-name='Arial' data-f-sz='9' data-a-h='center' data-a-v='middle' data-b-a-s='thin' data-b-a-c='000000'>${key}</td><td data-f-name='Arial' data-f-sz='9' data-a-h='center' data-a-v='middle' data-b-a-s='thin' data-b-a-c='000000'>${value}</td></tr>`;
    }

    x++;
  });
  $("#histTable").append(yrRow);
}
function getYears() {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const nextYear = currentYear + 1;
  $("#y1").text(previousYear);
  $("#y2").text(currentYear);
  $("#y3").text(nextYear);
}
function exportTable() {
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const ename = arrangeName($("#empSel").val());
  TableToExcel.convert(document.getElementById("histTable"), {
    name: `Dispatch_History_${empID}.xlsx`,
    sheet: {
      name: `${ename}`,
    },
  });
}
function arrangeName(nme) {
  let rearrangedName = "";
  let nameParts = nme.split(", "); // Split the string into an array using ', ' as the separator
  rearrangedName = nameParts[1] + " " + nameParts[0]; // Concatenate the parts in the desired order
  return rearrangedName;
}
function toggleLoadingAnimation(show) {
  if (show) {
    $("#appendHere").append(`
          <div class="top-0 backdrop-blur-sm bg-gray/30 h-full flex justify-center items-center flex-col pb-5 absolute w-full" id="loadingAnimation">
              <div class="relative">
                  <div class="grayscale-[70%] w-[400px]">
                      <img src="images/Frame 1.gif" alt="loader" class="w-full" />
                  </div>
                  <div class="absolute bottom-0 flex-col w-full text-center flex justify-center items-center gap-2">
                      <div class="title fw-semibold fs-5">
                          Loading data . . .
                      </div>
                      <div class="text">
                          Please wait while we fetch the employee details.
                      </div>
                  </div>
              </div>
          </div>
      `);
  } else {
    $("#loadingAnimation").remove();
  }
}
//3 TYPES OF TOAST TO USE(success, error, warn)
//EXAMPLE showToast("error", "error message eto")
function showToast(type, str) {
  let toast = document.createElement("div");
  if (type === "success") {
    toast.classList.add("toasty");
    toast.classList.add("success");
    toast.innerHTML = `
    <i class='bx bx-check text-xl text-[var(--tertiary)]'></i>
  <div class="flex flex-col py-3">
    <h5 class="text-md font-semibold leading-2">Success</h5>
    <p class="text-gray-600 text-sm">${str}</p>
    <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
  </div>
    `;
  }
  if (type === "error") {
    toast.classList.add("toasty");
    toast.classList.add("error");
    toast.innerHTML = `
    <i class='bx bx-x text-xl text-[var(--red-color)]'></i>
  <div class="flex flex-col py-3">
    <h5 class="text-md font-semibold leading-2">Error</h5>
    <p class="text-gray-600 text-sm">${str}</p>
    <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
  </div>
    `;
  }
  if (type === "warn") {
    toast.classList.add("toasty");
    toast.classList.add("warn");
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
  }, 3000);
}
function logOut() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "global/logout.php",
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
