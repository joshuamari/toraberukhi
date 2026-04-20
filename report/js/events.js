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
      alert(error?.message || "Failed to load report data.");
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
      alert(error?.message || "Failed to load report data.");
      toggleLoadingAnimation(false);
    });
});

$(document).on("click", "#btnExport", function () {
  exportTable();
});

$(document).on("click", "#logoutBtn", function () {
  logOut()
    .then(() => {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
    })
    .catch((error) => {
      alert(error?.message || "Failed to log out.");
    });
});
