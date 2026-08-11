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
          message: ajaxJsonErrorMessage(xhr, fallbackMessage),
          code: xhr.status || null,
        });
      },
    });
  });
}

function getLegacyJson(url, fallbackMessage) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      success: function (response) {
        if (response && response.isSuccess === false) {
          reject({
            message: response.message || fallbackMessage,
            code: null,
          });
          return;
        }
        resolve(response);
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

function softLoad(promise) {
  return promise.then(
    (data) => ({ ok: true, data }),
    (error) => ({ ok: false, error }),
  );
}

function checkAccess() {
  return getJson("../api/session.php", "Failed to verify user session.");
}

function getRequestListData() {
  return getLegacyJson(
    "../requestList/php/get_requests.php",
    "Failed to load request list.",
  ).then((response) => (Array.isArray(response?.data) ? response.data : []));
}

function getRequestListGroups() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "../requestList/php/get_groups.php",
      dataType: "json",
      success: function (response) {
        resolve(Array.isArray(response) ? response : []);
      },
      error: function (xhr) {
        reject({
          message: ajaxJsonErrorMessage(xhr, "Failed to load groups."),
          code: xhr.status || null,
        });
      },
    });
  });
}

function getChangeRequestData() {
  return getLegacyJson(
    "../changeRequests/php/get_change_requests.php",
    "Failed to load change requests.",
  ).then((response) => {
    const data = response?.data || {};
    return {
      cancellations: Array.isArray(data.cancellations) ? data.cancellations : [],
      date_changes: Array.isArray(data.date_changes) ? data.date_changes : [],
    };
  });
}

function logOut() {
  return getJson("../api/logout.php", "Failed to log out.");
}
