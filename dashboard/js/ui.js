// ui.js
function openNavigation() {
  $(".navigation").addClass("open");
  $("body").addClass("overflow-hidden");
}

function closeNavigation() {
  $(".navigation").removeClass("open");
  $("body").removeClass("overflow-hidden");
}