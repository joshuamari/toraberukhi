//#region GLOBALS
const rootFolder = document.location.hostname;
const dispTableID = ["eList", "eListNon"];
let empDetails = [];
let groupList = [];
//#endregion
// checkAccess()
//   .then((acc) => {
//     if (acc) {
//       $(document).ready(function () {
//         Promise.all([getGroups(), getYear()])
//           .then(([grps, yr]) => {
//             fillGroups(grps);
//             fillYear(yr);
//             getReport()
//               .then((rep) => {
//                 createTable(rep);
//               })
//               .catch((error) => {
//                 alert(`${error}`);
//               });
//           })
//           .catch((error) => {
//             alert(`${error}`);
//           });
//       });
//     } else {
//       alert("Access denied");
//       window.location.href = `${rootFolder}/PCSKHI/Login`;
//     }
//   })
//   .catch((error) => {
//     alert(`${error}`);
//   });
checkAccess()
  .then((emp) => {
    if (emp.isSuccess) {
      empDetails = emp.data;
      $(document).ready(function () {
        fillEmployeeDetails();
        Promise.all([getGroups(), getYear()])
          .then(([grps, yr]) => {
            groupList = grps;
            fillYear(yr);
            fillGroups(groupList);
            getReport()
              .then((rep) => {
                console.log(rep);
                createTable(rep);
              })
              .catch((error) => {
                alert(`${error}`);
              });
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
  toggleLoadingAnimation(true);
  getReport()
    .then((rep) => {
      createTable(rep);
      toggleLoadingAnimation(false);
    })
    .catch((error) => {
      alert(`${error}`);
      toggleLoadingAnimation(false);
    });
});
$(document).on("change", "#yearSel", function () {
  toggleLoadingAnimation(true);
  $("#selectedYear").text($(this).val());
  getReport()
    .then((rep) => {
      createTable(rep);
      toggleLoadingAnimation(false);
    })
    .catch((error) => {
      alert(`${error}`);
      toggleLoadingAnimation(false);
    });
});
$(document).on("click", "#btnExport", function () {
  exportTable();
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
function createTable(repData) {
  $("#dataHere").empty();
  Object.entries(repData).forEach(([key, groups]) => {
    $("#dataHere").append(
      `<tr><td colspan=8 class='text-start' data-f-name="Arial" data-f-sz="9"  data-a-h="left" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${key}</td></tr>`
    );
    groups.forEach((element) => {
      var ele = $(element.dispatch);
      var rspan = ele.length;
      var visa = element.visaExpiry;
      var str = "";
      var deets = `
  <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${
        element.empName
      }</td>
  <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${
        element.groupName
      }</td>
  <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${
        visa || "-"
      }</td>
  `;
      var tot = `
  <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${element.totalDays}</td>
  `;

      if (rspan === 0) {
        str += `
  <tr>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000" rowspan="1">${
      element.empName
    }</td>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000" rowspan="1">${
      element.groupName
    }</td>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000" rowspan="1">${
      element.visaExpiry || "-"
    }</td>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">-</td>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">-</td>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">-</td>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">-</td>
    <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000" rowspan="1">-</td>
    
  </tr> 
  `;
      } else {
        element.dispatch.forEach((dispData, index) => {
          var dDeets = "";
          var dTot = "";
          if (index === 0) {
            dDeets = deets;
            dTot = tot;
          }
          str += `<tr>
      ${dDeets}
      <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${dispData.totalPast}</td>
      <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${dispData.dispatch_from}</td>
      <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${dispData.dispatch_to}</td>
      <td data-f-name="Arial" data-f-sz="9"  data-a-h="center" data-a-v="middle" 	data-b-a-s="thin" data-b-a-c="000000">${dispData.duration}</td>
      ${dTot}
      
      </tr>`;
        });
      }

      $("#dataHere").append(str);
    });
  });
}
function getReport() {
  const grpID = $("#grpSel").find("option:selected").attr("grp-id");
  const yr = $("#yearSel").val();
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/get_report.php",
      data: {
        groupID: grpID,
        yearSelected: yr,
      },
      dataType: "json",
      success: function (response) {
        console.log(response);
        const rep = response;
        resolve(rep);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fetching report data.");
        }
      },
    });
  });
}

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
          reject("An unspecified error occurred while fetching group data.");
        }
      },
    });
  });
}
function fillGroups(grps) {
  var grpSelect = $("#grpSel");
  grpSelect.html("<option>Select Group</option>");
  $.each(grps, function (index, item) {
    var option = $("<option>")
      .attr("value", item.id)
      .text(item.abbr)
      .attr("grp-id", item.id);
    grpSelect.append(option);
  });
}
// function checkAccess() {
//   return new Promise((resolve, reject) => {
//     $.ajax({
//       type: "GET",
//       url: "php/check_permission.php",
//       dataType: "json",
//       success: function (data) {
//         const acc = data;
//         resolve(acc);
//       },
//       error: function (xhr, status, error) {
//         if (xhr.status === 404) {
//           reject("Not Found Error: The requested resource was not found.");
//         } else if (xhr.status === 500) {
//           reject("Internal Server Error: There was a server error.");
//         } else {
//           reject("An unspecified error occurred.");
//         }
//       },
//     });
//   });
// }
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
function getYear() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "php/get_year.php",
      dataType: "json",
      success: function (response) {
        const yrs = response;
        resolve(yrs);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred while fecthing year data.");
        }
      },
    });
  });
}
function fillYear(yr) {
  $("#yearSel").empty();
  yr.forEach((element) => {
    $("#yearSel").append(`<option>${element}</option>`);
  });
  const curYear = new Date().getFullYear();
  $("#yearSel").val(curYear);
  $("#selectedYear").text(curYear);
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
