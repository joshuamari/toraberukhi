function getAppVersionUrl() {
  const path = window.location.pathname.replace(/\\/g, "/");
  const isRoot = /\/PCSKHI\/?(index\.html)?$/i.test(path);
  return isRoot ? "api/version.php" : "../api/version.php";
}

function setAppVersion(version) {
  if (!version) return;
  $("#appVersion").text(`v${version}`);
}

function loadAppVersion() {
  $.getJSON(getAppVersionUrl()).done(function (res) {
    const version =
      res && res.success && res.data && res.data.version
        ? String(res.data.version)
        : "";
    setAppVersion(version);
  });
}

$(function () {
  loadAppVersion();
});
