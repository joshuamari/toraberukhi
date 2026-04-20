// api.js
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
          message: fallbackMessage,
          code: xhr.status || null,
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
          message: ajaxJsonErrorMessage(xhr, fallbackMessage),
          code: xhr.status || null,
        });
      },
    });
  });
}
function checkAccess() {
  return getJson(
    "../api/session.php",
    "Failed to verify user session."
  );
}

function getDispatchList() {
  return getJson(
    "api/get_dispatch_list.php",
    "Failed to fetch dispatch list."
  );
}

function getExpiringPassport() {
  return getJson(
    "api/get_expiring_passport.php",
    "Failed to fetch passport details."
  );
}

function getExpiringVisa() {
  return getJson(
    "api/get_expiring_visa.php",
    "Failed to fetch visa details."
  );
}

function getGraphData() {
  return getJson(
    "api/get_summary.php",
    "Failed to fetch graph data."
  );
}

function logOut() {
  return getJson(
    "../api/logout.php",
    "Failed to log out."
  );
}