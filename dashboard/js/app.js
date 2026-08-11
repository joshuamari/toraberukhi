async function initPage() {
  try {
    const emp = await checkAccess();

    state.empDetails = emp;
    renderEmployeeDetails(state.empDetails);

    await loadDashboardData();
    bindEvents();
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED" || error?.code === 401) {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
      return;
    }

    alert(error?.message || "Failed to initialize page.");
  }
}

async function loadDashboardData() {
  try {
    const currentYear = getCurrentYear();

    const [requestRes, changeRes, dispatchRes] = await Promise.all([
      softLoad(getRequestListData()),
      softLoad(getChangeRequestData()),
      softLoad(getDispatchlist()),
    ]);

    if (!requestRes.ok) {
      throw requestRes.error || { message: "Failed to load request list." };
    }

    if (!dispatchRes.ok) {
      throw dispatchRes.error || { message: "Failed to load dispatch list." };
    }

    const hasRequestData = requestRes.ok;
    const hasChangeData = changeRes.ok;

    dashboardRequestList = hasRequestData
      ? Array.isArray(requestRes.data)
        ? requestRes.data
        : []
      : [];
    dashboardDispatchList = Array.isArray(dispatchRes.data)
      ? dispatchRes.data
      : [];

    if (hasChangeData) {
      const changeData = changeRes.data || {};
      dashboardCancellations = Array.isArray(changeData.cancellations)
        ? changeData.cancellations
        : [];
      dashboardDateChanges = Array.isArray(changeData.date_changes)
        ? changeData.date_changes
        : [];
    } else {
      dashboardCancellations = [];
      dashboardDateChanges = [];
    }

    if (!hasChangeData) {
      console.warn("Some dashboard sections could not be loaded.", {
        requests: hasRequestData,
        changes: hasChangeData,
      });
    }

    renderDashboard(currentYear, {
      hasChangeData,
      hasRequestData,
    });
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED" || error?.code === 401) {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
      return;
    }

    alert(error?.message || "Failed to load dashboard data.");
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
