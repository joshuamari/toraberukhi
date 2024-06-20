//#region GLOBALS
switch (document.location.hostname) {
  case "kdt-ph":
    rootFolder = "//kdt-ph/";
    break;
  case "localhost":
    rootFolder = "//localhost/";
    break;
  default:
    rootFolder = "//kdt-ph/";
    break;
}
let empDetails = [];
var dispatch_days = 0;
var to_add = 0;
const full = 183;
var dHistory = [];
//#endregion
checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      console.log(empDetails);
      $(document).ready(function () {
        fillEmployeeDetails();
        getYears();
        getGroups()
          .then((grps) => {
            fillGroups(grps);
            Promise.all([getEmployees(), getLocations()])
              .then(([emps, locs]) => {
                fillEmployees(emps);
                fillLocations(locs);
              })
              .catch((error) => {
                alert(`${error}`);
              });
          })
          .catch(() => {});
      });
    } else {
      alert(emp.message);
      window.location.href = `${rootFolder}`;
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
  ])
    .then(([pass, vsa, dlst, dd, yrl]) => {
      fillPassport(pass);
      fillVisa(vsa);
      dispatch_days = dd;
      dHistory = dlst;
      fillHistory(dHistory);
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
$(document).on("change", "#dToggle", function () {
  getDispatchHistory()
    .then((dlst) => {
      dHistory = dlst;
      fillHistory(dHistory);
    })
    .catch((error) => {
      alert(`${error}`);
    });
});
$(document).on("click", "#btnApply", function () {
  insertDispatch();
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
          fillHistory(dHistory);
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
          fillHistory(dHistory);
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
$(document).on("click", "#btnExport", function () {
  exportTable();
});
$(document).on("click", ".rmvToast", function () {
  $(this).closest(".toasty").remove();
});
$(document).on(
  "click",
  "#grpSel, #empSel, #locSel, #startDate, #endDate",
  function () {
    $(this).removeClass("bg-red-100  border-red-400");
    $(".errTxt").remove();
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
//#endregion

//#region FUNCTIONS
function getGroups() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_groups.php",
      dataType: "json",
      success: function (response) {
        console.log(response);
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
  var grpSelect = $("#grpSel");
  grpSelect.html("<option value='0'>Select Group</option>");
  $.each(grps, function (index, item) {
    var option = $("<option>")
      .attr("value", item.id)
      .text(item.name)
      .attr("grp-id", item.id);
    grpSelect.append(option);
  });
}
function getEmployees() {
  const grpID = $("#grpSel").find("option:selected").attr("grp-id");
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
        console.log(response);
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
      .text(item.name)
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
          reject("An unspecified error occurred while fecthing visa details.");
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
function fillHistory(dlist) {
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
function insertDispatch() {
  const grp = $("#grpSel").find("option:selected").attr("grp-id");
  const empID = $("#empSel").find("option:selected").attr("emp-id");
  const locID = $("#locSel").find("option:selected").attr("loc-id");
  const startD = $("#startDate").val();
  const endD = $("#endDate").val();
  let ctr = 0;
  toggleLoadingAnimation(true);
  if (!grp) {
    $("#grpSel").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!empID) {
    $("#empSel").addClass("bg-red-100  border-red-400");
    ctr++;
  }
  if (!locID) {
    $("#locSel").addClass("bg-red-100  border-red-400");
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
  if (ctr > 0) {
    $(".form").append(`
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
  $.ajax({
    type: "POST",
    url: "php/insert_dispatch.php",
    data: {
      empID: empID,
      locID: locID,
      dateFrom: startD,
      dateTo: endD,
    },
    dataType: "json",
    success: function (response) {
      const isSuccess = response.isSuccess;
      if (!isSuccess) {
        toggleLoadingAnimation(false);
        showToast("error", `${response.error}`);
      } else {
        Promise.all([getDispatchHistory(), getDispatchDays(), getYearly()])
          .then(([dlst, dd, yrl]) => {
            dHistory = dlst;
            fillHistory(dHistory);
            dispatch_days = dd;
            fillYearly(yrl);
            $("#startDate").val("");
            $("#endDate").val("");
            $("#daysCount").text("");
            to_add = 0;
            countTotal();
            showToast("success", "Successfully added a dispatch entry.");
            toggleLoadingAnimation(false);
          })
          .catch((error) => {
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
  $("#grpSel, #empSel, #locSel, #startDate, #endDate").removeClass(
    "bg-red-100  border-red-400"
  );
  $(".errTxt").remove();
  $("#grpSel, #empSel, #locSel").val(0);
  $("#startDate, #endDate").val("");
  to_add = 0;
  $("#daysCount").text("");
  $("#empSel").change();
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
  $("#empLabel").html(`${fName} ${sName}`);
  $("#empInitials").html(`${initials}`);
  $("#grpLabel").html(`${grpName}`);
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
                      <img src="../images/Frame 1.gif" alt="loader" class="w-full" />
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
