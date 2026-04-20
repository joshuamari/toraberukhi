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
            ajaxErrorMessage(xhr, fallbackMessage),
          code: xhr.responseJSON?.code || xhr.status || null,
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
            ajaxErrorMessage(xhr, fallbackMessage),
          code: xhr.responseJSON?.code || xhr.status || null,
        });
      },
    });
  });
}

function getReport() {
  const grpID = $("#grpSel").find("option:selected").attr("grp-id");
  const yr = $("#yearSel").val();

  return postJson(
    "api/get_report.php",
    {
      groupID: grpID,
      yearSelected: yr,
    },
    "Failed to fetch report data."
  );
}

function getGroups() {
  return getJson(
    "../api/groups.php",
    "Failed to fetch group data."
  );
}

function getYear() {
  return getJson(
    "api/get_years.php",
    "Failed to fetch year data."
  );
}

function checkAccess() {
  return getJson(
    "../api/session.php",
    "Failed to verify user session."
  );
}

function logOut() {
  return getJson(
    "../api/logout.php",
    "Failed to log out."
  );
}