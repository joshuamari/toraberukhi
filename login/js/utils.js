function ajaxJsonErrorMessage(xhr, fallbackMessage) {
  if (xhr.status === 404) {
    return "Not Found Error: The requested resource was not found.";
  }

  if (xhr.status === 500) {
    return "Internal Server Error: There was a server error.";
  }

  return fallbackMessage;
}