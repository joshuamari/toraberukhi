function getJson(url, fallbackMessage) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      success: function (response) {
        if (!response.success) {
          reject({
            message: response.message || fallbackMessage,
            code: response.code || null,
          });
          return;
        }

        resolve(response.data);
      },
      error: function (xhr) {
        reject({
          message:
            xhr.responseJSON?.message ||
            ajaxJsonErrorMessage(xhr, fallbackMessage),
          code:
            xhr.responseJSON?.code ||
            xhr.status ||
            null,
        });
      },
    });
  });
}

function postJson(url, data, fallbackMessage) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: url,
      data: data,
      dataType: "json",
      success: function (response) {
        if (!response.success) {
          reject({
            message: response.message || fallbackMessage,
            code: response.code || null,
          });
          return;
        }

        resolve(response.data);
      },
      error: function (xhr) {
        reject({
          message:
            xhr.responseJSON?.message ||
            ajaxJsonErrorMessage(xhr, fallbackMessage),
          code:
            xhr.responseJSON?.code ||
            xhr.status ||
            null,
        });
      },
    });
  });
}

function checkAccess() {
  return getJson(
    "../api/session.php",
    "Failed to verify login session."
  );
}

function loginUser(userId) {
  return postJson(
    "api/login.php",
    { khiID: userId },
    "Failed to log in."
  );
}