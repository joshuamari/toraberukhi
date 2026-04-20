// ui.js
function openNavigation() {
  $(".navigation").addClass("open");
  $("body").addClass("overflow-hidden");
}

function closeNavigation() {
  $(".navigation").removeClass("open");
  $("body").removeClass("overflow-hidden");
}

function openReportDialog() {
  if (!state.isSentryModalOpen) {
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

  state.isSentryModalOpen = true;
}

function closeReportDialogState() {
  state.isSentryModalOpen = false;
}