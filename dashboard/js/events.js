// events.js
function bindEvents() {
  $(document).on("change", "#idYear", function () {
    loadDispatchList();
  });

  $(document).on("click", "#menu", function () {
    openNavigation();
  });

  $(document).on("click", "#closeNav", function () {
    closeNavigation();
  });

  $(document).on("click", "#logoutBtn", function () {
    handleLogout();
  });

  $(document).on("click", ".btn-bug", function () {
    openReportDialog();
  });

  $(document).on("click", ".sentry-error-embed-wrapper", function () {
    closeReportDialogState();
  });
}