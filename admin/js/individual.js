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
const dispTableID = ["eList"];
let empDetails = [];
let accessTypes = {
  0: "Group Admin",
  1: "Admin (Only for KDT)",
};
let employees = [];
let filtered_employees = [];
let groups = [];
let sortNumAsc = false;
let sortNameAsc = true;
let isSentryModalOpen = false;
let empGroupTom = null;
let editGroupTom = null;
//#endregion
checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      $(document).ready(function () {
        createAccessSelections();
        fillEmployeeDetails();
        initTomSelects();

        Promise.all([getGroups(), getEmployees()])
          .then(([grps, emps]) => {
            groups = grps;
            fillGroups(groups);
            employees = emps;
            searchEmployee(employees);
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
  searchEmployee();
});
$(document).on("input", "#empSearch", function () {
  searchEmployee();
});
$(document).on("click", ".sortEmpNum", function () {
  toggleSortID();
});
$(document).on("click", ".sortEmpName", function () {
  toggleSortName();
});
$(document).on("click", "#addUser", function () {
  addUser()
    .then((res) => {
      if (res.isSuccess) {
        $("#addUserModal .btn-close").click();
        showToast("success", "Added successfully.");
        getEmployees().then((emps) => {
          employees = emps;
          searchEmployee(employees);
        });
      }
    })
    .catch((error) => {
      showToast("error", `${error}`);
    });
});
$(document).on(
  "click input change",
  "#empId, #empFName, #empLName, #empAccess, #empEmail, #empAccessEdit, #empEmailEdit",
  function () {
    $(this).removeClass("border-[var(--red-color)] bg-red-200");
    $(this).siblings("small").addClass("hidden");
  },
);
$(document).on("change", "#empGroup", function () {
  clearGroupValidation("#empGroup");
});
$(document).on("change", "#editGroup", function () {
  clearGroupValidation("#editGroup");
});
$(document).on("click", "#addUserModal .btn-close", function () {
  resetAddModal();
});
$(document).on("click", ".close", function () {
  resetAddModal();
});
$(document).on("click", ".btn-editUser", function () {
  var empnum = $(this).closest("tr").find("td:eq(0)").text();

  fillEditModal(empnum);
});
$(document).on("click", ".btn-removeUser", function () {
  var empnum = $(this).closest("tr").find("td:eq(0)").text();
  var empname = $(this).closest("tr").find("td:eq(1)").text();
  fillRemoveModal(empnum, empname);
});
$(document).on("click", "#removeUser", function () {
  removeUser()
    .then((res) => {
      if (res.isSuccess) {
        getEmployees().then((emps) => {
          employees = emps;
          searchEmployee(employees);
          $(".btn-close").click();
          showToast("success", "Removed successfully.");
        });
      } else {
        showToast("error", `${res.error}`);
      }
    })
    .catch((error) => {
      alert(`${error}`);
    });
});
$(document).on("click", "#saveBtn", function () {
  saveUser()
    .then((res) => {
      if (res.isSuccess) {
        $(".btn-close").click();
        showToast("success", "Saved successfully.");
        Promise.all([getGroups(), getEmployees()]).then(([grps, emps]) => {
          groups = grps;
          fillGroups(groups);
          employees = emps;
          searchEmployee(employees);
        });
      } else {
        showToast("error", `${res.message}`);
      }
    })
    .catch((error) => {
      alert(`${error}`);
      showToast("error", `${error}`);
    });
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

$(document).on("click", ".rmvToast", function () {
  $(this).closest(".toasty").remove();
});
//#endregion

//#region FUNCTIONS
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

function createAccessSelections() {
  let $select = $(".empAccess");
  $select.empty();
  $.each(accessTypes, function (key, value) {
    $select.append(
      $("<option>", {
        value: key,
        text: value,
      }),
    );
  });
}
function getGroups() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/get_groups.php",
      data: {
        empid: empDetails["id"],
      },
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
  const grpSelect = $("#grpSel");
  const addSelect = $("#empGroup");
  const editSelect = $("#editGroup");

  grpSelect.empty();
  addSelect.empty();
  editSelect.empty();

  grpSelect.html("<option value='0'>Select Group</option>");

  $.each(grps, function (index, item) {
    const option = $("<option>")
      .attr("value", item.id)
      .text(item.name)
      .attr("grp-id", item.id);

    grpSelect.append(option.clone());
    addSelect.append(option.clone());
    editSelect.append(option.clone());
  });

  if (empGroupTom) {
    empGroupTom.clear(true);
    empGroupTom.clearOptions();
    $.each(grps, function (index, item) {
      empGroupTom.addOption({
        value: String(item.id),
        text: item.name,
      });
    });
    empGroupTom.refreshOptions(false);
  }

  if (editGroupTom) {
    editGroupTom.clear(true);
    editGroupTom.clearOptions();
    $.each(grps, function (index, item) {
      editGroupTom.addOption({
        value: String(item.id),
        text: item.name,
      });
    });
    editGroupTom.refreshOptions(false);
  }
}

function getEmployees() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/get_employee_list.php",
      data: {
        empid: empDetails["id"],
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
          reject("An unspecified error occurred while fetching employees.");
        }
      },
    });
  });
}
function fillEmployees(emps) {
  var tableFD = $("#eList");
  tableFD.empty();
  $.each(emps, function (index, item) {
    var row = $(`<tr d-id=${item.empID}>`);
    const fullName = capitalizeWords(`${item.sname}, ${item.fname}`);
    const groupText =
      Array.isArray(item.groups) && item.groups.length
        ? item.groups.map((g) => g.abbr).join(", ")
        : item.group
          ? item.group.abbr
          : "-";

    const groupIds = Array.isArray(item.groups)
      ? item.groups.map((g) => g.id).join(",")
      : item.group
        ? item.group.id
        : "";
    row.append(`<td>${item.id}</td>`);
    row.append(`<td>${fullName}</td>`);
    row.append(`<td grp-id='${groupIds}'>${groupText}</td>`);
    if (accessTypes[item.type] === "Admin (Only for KDT)") {
      accessTypes[item.type] = "Admin";
    }
    row.append(`<td>${accessTypes[item.type]}</td>`);
    const options =
      item.type > empDetails["type"]
        ? ``
        : `        <div class="dropdown">
    <button class="" type="button" data-bs-toggle="dropdown" aria-expanded="false">
    <i class='bx bx-dots-vertical-rounded' ></i>
    </button>
    <ul class="dropdown-menu">
     <li><a class="dropdown-item flex gap-2 items-center btn-editUser" ><i class='bx bx-edit-alt' ></i>Edit</a></li>
     <li><a class="dropdown-item flex gap-2 items-center btn-removeUser"><i class='bx bx-trash text-[var(--red-color)]' ></i>Delete</a></li>
    
    </ul>
</div>`;

    row.append(`<td>${options}</td>`);

    tableFD.append(row);
  });
  dispTableID.forEach((element) => {
    checkEmpty(element);
  });
}
function searchEmployee() {
  const keyword = $("#empSearch").val().toLowerCase().trim();
  const grp = $("#grpSel").val();
  const results = employees.filter((emp) => {
    const searchMatch =
      emp.fname.toLowerCase().includes(keyword) ||
      emp.sname.toLowerCase().includes(keyword) ||
      emp.id.toString().includes(keyword);
    const groupMatch =
      grp == 0 ||
      (Array.isArray(emp.groups)
        ? emp.groups.some((g) => String(g.id) === String(grp))
        : emp.group && String(emp.group.id) === String(grp));
    return searchMatch && groupMatch;
  });
  filtered_employees = results;
  fillEmployees(results);
}
function toggleSortID() {
  let sortedList = filtered_employees.slice().sort(function (a, b) {
    return sortNumAsc ? a.id - b.id : b.id - a.id;
  });
  sortNumAsc = !sortNumAsc;
  fillEmployees(sortedList);
}
function toggleSortName() {
  let sortedList = filtered_employees.slice().sort(function (a, b) {
    var nameA = a.sname.toUpperCase() + a.fname.toUpperCase();
    var nameB = b.sname.toUpperCase() + b.fname.toUpperCase();
    if (sortNameAsc) {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
  fillEmployees(sortedList);
  sortNameAsc = !sortNameAsc;
}
function checkEmpty(tbodyID) {
  var tbodySelector = "#" + tbodyID;
  if ($(tbodySelector + " tr").length === 0) {
    var newRow = `<tr><td colspan="6" class="text-center">No data found</td></tr>`;
    $(tbodySelector).append(newRow);
  }
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
  //     type: 1,
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
          reject("An unspecified error occurred.");
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
function addUser() {
  var empId = $("#empId").val();
  var empFName = $("#empFName").val();
  var empLName = $("#empLName").val();
  var empGroup = empGroupTom
    ? empGroupTom.items.slice()
    : $("#empGroup").val() || [];
  var empAccess = $("#empAccessAdd").val();
  var empEMAIL = $("#empEmail").val();
  var ctr = 0;

  if (!empId) {
    $("#empId").addClass("border-[var(--red-color)] bg-red-200");
    $("#empId").siblings("small").removeClass("hidden");
    ctr++;
  }
  if (!empFName) {
    $("#empFName").addClass("border-[var(--red-color)] bg-red-200");
    $("#empFName").siblings("small").removeClass("hidden");
    ctr++;
  }
  if (!empLName) {
    $("#empLName").addClass("border-[var(--red-color)] bg-red-200");
    $("#empLName").siblings("small").removeClass("hidden");
    ctr++;
  }
  if (!empGroup || empGroup.length === 0) {
    markGroupValidationError("#empGroup");
    ctr++;
  }
  if (empAccess == undefined || empAccess === null || empAccess === "") {
    $("#empAccessAdd").addClass("border-[var(--red-color)] bg-red-200");
    $("#empAccessAdd").siblings("small").removeClass("hidden");
    ctr++;
  }
  if (!empEMAIL) {
    $("#empEmail").addClass("border-[var(--red-color)] bg-red-200");
    $("#empEmail").siblings("small").removeClass("hidden");
    ctr++;
  }

  return new Promise((resolve, reject) => {
    if (ctr > 0) {
      resolve({ isSuccess: false, error: "Incomplete Fields" });
    } else {
      $.ajax({
        type: "POST",
        url: "php/add_khi_user.php",
        traditional: true,
        data: {
          empID: empId,
          fname: empFName,
          lname: empLName,
          grpID: empGroup,
          empacc: empAccess,
          empemail: empEMAIL,
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
            reject("An unspecified error occurred while adding KHI member.");
          }
        },
      });
    }
  });
}

function resetAddModal() {
  $("#empId, #empFName, #empLName, #empEmail").val("");

  if (empGroupTom) {
    empGroupTom.clear(true);
  } else {
    $("#empGroup").val([]);
  }

  $("#empAccessAdd").prop("selectedIndex", 0);

  $("#empAccessAdd, #empGroup, #empLName, #empFName, #empId, #empEmail")
    .siblings("small")
    .addClass("hidden");

  $(
    "#empId, #empFName, #empLName, #empGroup, #empAccessAdd, #empEmail",
  ).removeClass("border-[var(--red-color)] bg-red-200");

  clearGroupValidation("#empGroup");
}

function fillEditModal(empnum) {
  $("#empIdEdit").val(empnum);
  let empdeets = employees.find((emp) => emp.id == empnum);

  $("#empFNameEdit").val(capitalizeWords(empdeets.fname));
  $("#empLNameEdit").val(capitalizeWords(empdeets.sname));
  $("#empAccessEdit").val(empdeets.type);
  $("#empEmailEdit").val(empdeets.email);

  if (editGroupTom) {
    editGroupTom.clear(true);

    if (Array.isArray(empdeets.groups) && empdeets.groups.length) {
      editGroupTom.setValue(empdeets.groups.map((g) => String(g.id)));
    } else if (empdeets.group && empdeets.group.id) {
      editGroupTom.setValue([String(empdeets.group.id)]);
    }
  }

  $("#editUserModal").modal("show");
}

function fillRemoveModal(empnum, empname) {
  $("#removeId").text(empnum);
  $("#removeName").text(empname);
  $("#removeUserModal").modal("show");
}
function removeUser() {
  const khiid = $("#removeId").text();
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/remove_khi.php",
      data: {
        empID: khiid,
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
          reject("An unspecified error occurred while removing user.");
        }
      },
    });
  });
}

function saveUser() {
  const empnumber = $("#empIdEdit").val();
  const groupid = editGroupTom
    ? editGroupTom.items.slice()
    : $("#editGroup").val() || [];
  const accessid = $("#empAccessEdit").val();
  const emp_email = $("#empEmailEdit").val();
  console.log(groupid);
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/edit_khit_user.php",
      traditional: true,
      data: {
        empID: empnumber,
        grpID: groupid,
        empacc: accessid,
        empemail: emp_email,
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
          reject("An unspecified error occurred while editing KHI member");
        }
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

function initTomSelects() {
  if ($("#empGroup").length && !empGroupTom) {
    empGroupTom = new TomSelect("#empGroup", {
      plugins: {
        remove_button: { title: "Remove" },
      },
      create: false,
      persist: false,
      maxOptions: 100,
      hideSelected: true,
      closeAfterSelect: false,
      placeholder: "Select one or more groups",
    });

    // REMOVE select styling from TomSelect wrapper
    $("#empGroup").next(".ts-wrapper").removeClass("select");
  }

  if ($("#editGroup").length && !editGroupTom) {
    editGroupTom = new TomSelect("#editGroup", {
      plugins: {
        remove_button: { title: "Remove" },
      },
      create: false,
      persist: false,
      maxOptions: 100,
      hideSelected: true,
      closeAfterSelect: false,
      placeholder: "Select one or more groups",
    });

    $("#editGroup").next(".ts-wrapper").removeClass("select");
  }
}

function clearGroupValidation(selector) {
  const $el = $(selector);
  $el.removeClass("border-[var(--red-color)] bg-red-200");
  $el.siblings("small").addClass("hidden");
  $el.next(".ts-wrapper").removeClass("error");
}

function markGroupValidationError(selector) {
  const $el = $(selector);
  $el.addClass("border-[var(--red-color)] bg-red-200");
  $el.siblings("small").removeClass("hidden");
  $el.next(".ts-wrapper").addClass("error");
}
//#endregion
