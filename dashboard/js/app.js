async function initPage() {
  try {
    const emp = await checkAccess();

    state.empDetails = emp;
    renderEmployeeDetails(state.empDetails);

    await loadDashboardData();
    bindEvents();
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED") {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
      return;
    }

    alert(error?.message || "Failed to initialize page.");
  }
}

async function loadDashboardData() {
  try {
    const currentYear = getCurrentYear();

    const [dispatchList, expiringPassport, expiringVisa, graphData] =
      await Promise.all([
        getDispatchList(),
        getExpiringPassport(),
        getExpiringVisa(),
        getGraphData(),
      ]);

    renderDispatchList(dispatchList);
    renderPassportList(expiringPassport);
    renderVisaList(expiringVisa);
    renderDispatchGraph(graphData);
    renderCurrentYear(currentYear);
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED") {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
      return;
    }

    alert(error?.message || "Failed to load dashboard data.");
  }
}

async function loadDispatchList() {
  try {
    const dispatchList = await getDispatchList();
    renderDispatchList(dispatchList);
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED") {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
      return;
    }

    alert(error?.message || "Failed to load dispatch list.");
  }
}

async function handleLogout() {
  try {
    await logOut();
    window.location.href = `${rootFolder}/PCSKHI/Login`;
  } catch (error) {
    alert(error?.message || "Failed to log out.");
  }
}

$(document).ready(function () {
  initPage();
});