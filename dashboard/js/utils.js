// utils.js
function capitalizeWords(str) {
  return String(str)
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInitials(firstname, surname) {
  const firstInitial = String(firstname || "").charAt(0);
  const lastInitial = String(surname || "").charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function formatDays(numberOfDays) {
  if (numberOfDays === 0) return "Expired";

  if (numberOfDays >= 30) {
    const months = Math.floor(numberOfDays / 30);
    return `${months} ${months === 1 ? "Month" : "Months"}`;
  }

  return `${numberOfDays} days`;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function ajaxJsonErrorMessage(xhr, fallbackMessage) {
  if (xhr.status === 404) {
    return "Not Found Error: The requested resource was not found.";
  }

  if (xhr.status === 500) {
    return "Internal Server Error: There was a server error.";
  }

  return fallbackMessage;
}