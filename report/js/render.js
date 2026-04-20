function createTable(repData) {
  $("#dataHere").empty();

  Object.entries(repData).forEach(([key, groups]) => {
    $("#dataHere").append(
      `<tr><td colspan="8" class="text-start" data-f-name="Arial" data-f-sz="9" data-a-h="left" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${key}</td></tr>`
    );

    groups.forEach((element) => {
      const rspan = element.dispatch.length;
      const visa = element.visaExpiry;
      const reentry = element.reentryExpiry;
      let str = "";

      const deets = `
        <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${element.empName}</td>
        <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${element.groupName}</td>
        <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${visa || "-"}</td>
        <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${reentry || "-"}</td>
      `;

      const tot = `
        <td rowspan="${rspan}" data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${element.totalDays}</td>
      `;

      if (rspan === 0) {
        str += `
          <tr>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${element.empName}</td>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${element.groupName}</td>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${element.visaExpiry || "-"}</td>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${element.reentryExpiry || "-"}</td>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">-</td>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">-</td>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">-</td>
            <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">-</td>
          </tr>
        `;
      } else {
        element.dispatch.forEach((dispData, index) => {
          let dDeets = "";
          let dTot = "";

          if (index === 0) {
            dDeets = deets;
            dTot = tot;
          }

          str += `
            <tr>
              ${dDeets}
              <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${dispData.dispatch_from}</td>
              <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${dispData.dispatch_to}</td>
              <td data-f-name="Arial" data-f-sz="9" data-a-h="center" data-a-v="middle" data-b-a-s="thin" data-b-a-c="000000">${dispData.duration}</td>
              ${dTot}
            </tr>
          `;
        });
      }

      $("#dataHere").append(str);
    });
  });
}