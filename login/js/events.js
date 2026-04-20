$(document).on("submit", "#loginForm", async function (event) {
  event.preventDefault();

  const userId = $("#userid").val().trim();

  if (!userId) {
    showToast("warn", "Please enter your User ID.");
    return;
  }

  try {
    await loginUser(userId);

    $("#userid").val("");
    window.location.href = `${rootFolder}/PCSKHI/`;
  } catch (error) {
    showToast("error", error?.message || "Failed to log in.");
    $("#userid").val("");
  }
});

$(document).on("click", ".rmvToast", function () {
  $(this).closest(".toasty").remove();
});