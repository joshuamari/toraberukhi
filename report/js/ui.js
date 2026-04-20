function fillGroups(grps) {
  const grpSelect = $("#grpSel");
  grpSelect.html("<option>Select Group</option>");

  $.each(grps, function (_, item) {
    const option = $("<option>")
      .attr("value", item.id)
      .attr("grp-id", item.id)
      .text(item.abbr);

    grpSelect.append(option);
  });
}

function fillEmployeeDetails(empDetails) {
  const fName = empDetails.firstname;
  const sName = empDetails.surname;
  const initials = getInitials(fName, sName);
  const grpName = empDetails.group;
  const fullName = capitalizeWords(`${fName} ${sName}`);

  $("#empLabel").html(fullName);
  $("#empInitials").html(initials);
  $("#grpLabel").html(grpName);
}

function fillYear(years) {
  $("#yearSel").empty();

  years.forEach((element) => {
    $("#yearSel").append(`<option>${element}</option>`);
  });

  const curYear = new Date().getFullYear();
  $("#yearSel").val(curYear);
  $("#selectedYear").text(curYear);
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

function capitalizeWords(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInitials(firstname, surname) {
  return `${firstname.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}