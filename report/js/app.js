async function initPage() {
  try {
    const emp = await checkAccess();
    state.empDetails = emp;

    fillEmployeeDetails(state.empDetails);

    const [grps, yr] = await Promise.all([getGroups(), getYear()]);
    state.groupList = grps;

    fillYear(yr);
    fillGroups(state.groupList);

    const rep = await getReport();
    createTable(rep);
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED") {
      window.location.href = `${rootFolder}/PCSKHI/Login`;
      return;
    }

    alert(error?.message || "Failed to initialize report page.");
  }
}

$(document).ready(function () {
  initPage();
});