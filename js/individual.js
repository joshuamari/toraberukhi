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
//#endregion
checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      $(document).ready(function () {
        fillEmployeeDetails();
        Promise.all([
          getDispatchlist(),
          getExpiringPassport(),
          getExpiringVisa(),
          getGraph(),
        ])
          .then(([dList, epList, evList, dData]) => {
            fillDispatchList(dList);
            fillPassport(epList);
            fillVisa(evList);
            dispatchGraph(dData);
          })
          .catch((error) => {
            alert(`${error}`);
          });
      });
    } else {
      alert(emp.message);
      window.location.href = `${rootFolder}/PCSKHI/login`;
    }
  })
  .catch((error) => {
    alert(`${error}`);
  });

//#region BINDS

$(document).on("change", "#idYear", function () {
  getDispatchlist()
    .then((dList) => {
      fillDispatchList(dList);
    })
    .catch((error) => {
      alert(`${error}`);
    });
});
$(document).on("click", "#menu", function () {
  $(".navigation").addClass("open");
  $("body").addClass("overflow-hidden");
});
$(document).on("click", "#closeNav", function () {
  $(".navigation").removeClass("open");
  $("body").removeClass("overflow-hidden");
});
$(document).on("click", "#logoutBtn", function () {
  logOut().then((res) => {
    if (res.isSuccess) {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
    }
  });
});
//#endregion

//#region FUNCTIONS
function getDispatchlist() {
  const ySel = $("#idYear").val();
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/get_dispatch_list.php",
      data: {
        ySelect: ySel,
      },
      dataType: "json",
      success: function (data) {
        console.log(data);
        const dList = data;
        resolve(dList);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching dispatch list.");
        }
      },
    });
  });
}
function fillDispatchList(dlist) {
  var tableBody = $("#dlist");
  tableBody.empty();
  if (dlist.length === 0) {
    var noDataRow = $(
      "<tr><td colspan='7' class='text-center'>No data found</td></tr>"
    );
    tableBody.append(noDataRow);
  } else {
    $.each(dlist, function (index, item) {
      var passClass = "bg-success";
      var passVal = "Valid";
      var visaClass = "bg-success";
      var visaVal = "Valid";
      if (!item.passValid) {
        passClass = "bg-danger";
        passVal = "Invalid";
      }
      if (!item.visaValid) {
        visaClass = "bg-danger";
        visaVal = "Invalid";
      }
      var row = $("<tr>");
      row.append(`<td>${item.name}</td>`);
      row.append(`<td>${item.location}</td>`);
      row.append(`<td>${item.from}</td>`);
      row.append(`<td>${item.to}</td>`);
      row.append(`<td><span class="badge ${passClass}">${passVal}</span></td>`);
      row.append(`<td><span class="badge ${visaClass}">${visaVal}</span></td>`);
      tableBody.append(row);
    });
  }
}
function getExpiringPassport() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_expiring_passport.php",
      dataType: "json",
      success: function (data) {
        const epList = data;
        resolve(epList);
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
function fillPassport(eplist) {
  var tableBody = $("#eplist");
  tableBody.empty();
  if (eplist.length === 0) {
    var noDataRow = $(
      "<tr><td colspan='2' class='text-center'>No expiring passports</td></tr>"
    );
    tableBody.append(noDataRow);
  } else {
    $.each(eplist, function (index, item) {
      var row = $(`<tr class="rowEmp" emp-id="${item.id}">`);
      var untilText = formatDays(item.until);
      var isShort = item.until < 300 ? "short" : "";
      row.append(`<td>${item.name}</td>`);
      row.append(`<td class="expire ${isShort}">${untilText}</td>`);
      tableBody.append(row);
    });
  }
}
function getExpiringVisa() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_expiring_visa.php",
      dataType: "json",
      success: function (data) {
        const evList = data;
        resolve(evList);
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
function fillVisa(evlist) {
  var tableBody = $("#evlist");
  tableBody.empty();
  if (evlist.length === 0) {
    var noDataRow = $(
      "<tr><td colspan='2' class='text-center'>No expiring visa</td></tr>"
    );
    tableBody.append(noDataRow);
  } else {
    $.each(evlist, function (index, item) {
      var row = $(`<tr class="rowEmp" emp-id="${item.id}">`);
      var untilText = formatDays(item.until);
      var isShort = item.until < 210 ? "short" : "";
      row.append(`<td>${item.name}</td>`);
      row.append(`<td class="expire ${isShort}">${untilText}</td>`);
      tableBody.append(row);
    });
  }
}
function formatDays(numberOfDays) {
  if (numberOfDays === 0) {
    return "Expired";
  } else if (numberOfDays >= 30) {
    const months = Math.floor(numberOfDays / 30);

    if (months === 1) {
      return `${months} Month`;
    } else {
      return `${months} Months`;
    }
  } else {
    return `${numberOfDays} days`;
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
        console.log(data);
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

function getGraph() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_summary.php",
      dataType: "json",
      success: function (data) {
        console.log(data);
        const acc = data;
        resolve(acc);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching graph data.");
        }
      },
    });
  });
}
function dispatchGraph(dData) {
  // const dispatchData = [
  //   { month: "January", rate: 5 },
  //   { month: "February", rate: 12 },
  //   { month: "March", rate: 0 },
  //   { month: "April", rate: 0 },
  //   { month: "May", rate: 0 },
  //   { month: "June", rate: 0 },
  //   { month: "July", rate: 0 },
  //   { month: "August", rate: 0 },
  //   { month: "September", rate: 15 },
  //   { month: "October", rate: 0 },
  //   { month: "November", rate: 0 },
  //   { month: "December", rate: 0 },
  // ];

  // Extracting months and rates from the data
  const months = dData.map((data) => data.month);
  const rates = dData.map((data) => data.rate);

  // Creating the line chart
  const ctx = document.getElementById("dispatchChart").getContext("2d");
  const dispatchChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          data: rates,
          backgroundColor: "#dcfce7", // Fill color under the line
          borderColor: "#22c55e", // Line color
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: false, // Disable the legend
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              var value = tooltipItem.raw;
              return (
                value +
                " " +
                (value > 1 ? "dispatch members" : "dispatch member")
              );
            },
          },
        },
      },
    },
  });
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
