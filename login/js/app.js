const rootFolder = `//${document.location.hostname}`;

async function initPage() {
  try {
    await checkAccess();
    window.location.href = `${rootFolder}/PCSKHI/`;
  } catch (error) {
    initAnimation();
  }
}

$(document).ready(function () {
  initPage();
});