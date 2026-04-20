// render.js
function renderEmployeeDetails(empDetails) {
  const fName = empDetails.firstname;
  const sName = empDetails.surname;
  const initials = getInitials(fName, sName);
  const grpName = empDetails.group;
  const fullName = capitalizeWords(`${fName} ${sName}`);

  $("#empLabel").html(fullName);
  $("#empInitials").html(initials);
  $("#grpLabel").html(grpName);
}

function renderDispatchList(dlist) {
  const tableBody = $("#dlist");
  tableBody.empty();

  if (!dlist || dlist.length === 0) {
    tableBody.append(
      "<tr><td colspan='7' class='text-center'>No data found</td></tr>"
    );
    return;
  }

  function getStatusBadge(status) {
    switch (status) {
      case "valid":
        return {
          className: "bg-success",
          label: "Valid",
        };
      case "valid_expiring":
        return {
          className: "bg-info",
          label: "Valid",
        };
      case "on_process":
        return {
          className: "bg-warning text-dark",
          label: "On Process",
        };
      default:
        return {
          className: "bg-danger",
          label: "Invalid",
        };
    }
  }

  $.each(dlist, function (_, item) {
    const passportBadge = getStatusBadge(item.passportStatus);
    const visaBadge = getStatusBadge(item.visaStatus);
    const reentryBadge = getStatusBadge(item.reentryStatus);

    const row = $("<tr>");
    row.append(`<td>${capitalizeWords(item.name)}</td>`);
    row.append(`<td>${item.location}</td>`);
    row.append(`<td>${item.from}</td>`);
    row.append(`<td>${item.to}</td>`);
    row.append(
      `<td><span class="badge ${passportBadge.className}">${passportBadge.label}</span></td>`
    );
    row.append(
      `<td><span class="badge ${visaBadge.className}">${visaBadge.label}</span></td>`
    );
    row.append(
      `<td><span class="badge ${reentryBadge.className}">${reentryBadge.label}</span></td>`
    );

    tableBody.append(row);
  });
}

function renderPassportList(eplist) {
  const tableBody = $("#eplist");
  tableBody.empty();

  if (!eplist || eplist.length === 0) {
    tableBody.append(
      "<tr><td colspan='2' class='text-center'>No expiring passports</td></tr>"
    );
    return;
  }

  $.each(eplist, function (_, item) {
    const untilText = formatDays(item.until);
    const isShort = item.until < 300 ? "short" : "";
    const row = $(`<tr class="rowEmp" emp-id="${item.id}">`);
    row.append(`<td>${capitalizeWords(item.name)}</td>`);
    row.append(`<td class="expire ${isShort}">${untilText}</td>`);
    tableBody.append(row);
  });
}

function renderVisaList(evlist) {
  const tableBody = $("#evlist");
  tableBody.empty();

  if (!evlist || evlist.length === 0) {
    tableBody.append(
      "<tr><td colspan='2' class='text-center'>No expiring visa</td></tr>"
    );
    return;
  }

  $.each(evlist, function (_, item) {
    const untilText = formatDays(item.until);
    const isShort = item.until < 210 ? "short" : "";
    const row = $(`<tr class="rowEmp" emp-id="${item.id}">`);
    row.append(`<td>${capitalizeWords(item.name)}</td>`);
    row.append(`<td class="expire ${isShort}">${untilText}</td>`);
    tableBody.append(row);
  });
}

let dispatchChartInstance = null;

function renderDispatchGraph(dData) {
  const months = dData.map((data) => data.month);
  const rates = dData.map((data) => data.rate);

  const canvas = document.getElementById("dispatchChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (dispatchChartInstance) {
    dispatchChartInstance.destroy();
  }

  dispatchChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          data: rates,
          backgroundColor: "#dcfce7",
          borderColor: "#22c55e",
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
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const value = tooltipItem.raw;
              return `${value} ${
                value > 1 ? "dispatch members" : "dispatch member"
              }`;
            },
          },
        },
      },
    },
  });
}

function renderCurrentYear(year) {
  $(".crrntYear").text(`(${year})`);
}