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
}