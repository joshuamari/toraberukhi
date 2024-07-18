//#region GLOBALS
const rootFolder = `//${document.location.hostname}`;
const dispTableID = ["eList", "eListNon"];
var sortNum = 1;
var sortEmp = 4;
var sortKey = 1;
//#endregion

checkAccess()
  .then((emp) => {
    console.log(emp);
    if (emp.isSuccess) {
      window.location.href = `${rootFolder}/PCSKHI/`;
    } else {
      $(document).ready(function () {
        animation();
      });
    }
  })
  .catch((error) => {
    alert(`${error}`);
  });

// animation();s
//#region BINDS
$(document).on("submit", "#loginForm", function (event) {
  event.preventDefault();
  console.log("gana");
  Login()
    .then((res) => {
      if (res.isSuccess) {
        window.location.href = `${rootFolder}/PCSKHI/`;
        // alert(`${res.message}`);
        $("#userid").val("");
      } else {
        // alert(`${res.message}`);
        showToast("error", `${res.message}`);
        $("#userid").val("");
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
$(document).on("click", ".rmvToast", function () {
  $(this).closest(".toasty").remove();
});
//#endregion

//#region FUNCTIONS
function checkAccess() {
  // const response = {
  //   isSuccess: true,
  //   data: {
  //     empNum: 464,
  //     empGroup: {
  //       id: 21,
  //       name: "System Group",
  //       acr: "SYS",
  //     },
  //     empName: {
  //       firstname: "Collene Keith",
  //       surname: "Medrano",
  //     },
  //   },
  // };
  // const response = {
  //   isSuccess: false,
  //   message: "Access Denied",
  // };
  // const response = {
  //   isSuccess: false,
  //   message: "Not logged in",
  // };
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "GET",
      url: "../global/check_login.php",
      dataType: "json",
      success: function (data) {
        const acc = data;
        resolve(acc);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred.1s");
        }
      },
    });
  });
}
function animation() {
  var animation = bodymovin.loadAnimation({
    container: document.getElementById("animationContainer"),
    renderer: "svg", // Choose the renderer (svg, canvas, html)
    loop: true, // Whether the animation should loop
    autoplay: true, // Whether the animation should start automatically
    path: "../animation.json", // Path to your animation JSON file
    speed: 1, // Adjust animation speed (1 for normal speed)
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet", // Set how the animation fits inside the container
    },
  });

  // Add a delay after each loop completes
  animation.addEventListener("loopComplete", function () {
    setTimeout(function () {
      animation.pause(); // Pause the animation
      setTimeout(function () {
        animation.play(); // Resume the animation after the delay
      }, 3000); // 3-second delay (3000 milliseconds)
    }, 0); // No delay to pause immediately
  });
}
function Login() {
  const userID = $("#userid").val();
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: "php/login.php",
      data: {
        khiID: userID,
      },
      dataType: "json",
      success: function (response) {
        const result = response;
        resolve(result);
      },
      error: function (xhr, status, error) {
        if (xhr.status === 404) {
          reject("Not Found Error: The requested resource was not found.");
        } else if (xhr.status === 500) {
          reject("Internal Server Error: There was a server error.");
        } else {
          reject("An unspecified error occurred.1");
        }
      },
    });
  });
}
//3 TYPES OF TOAST TO USE(success, error, warn)
//EXAMPLE showToast("error", "error message eto")
function showToast(type, str) {
  let toast = document.createElement("div");
  if (type === "success") {
    toast.classList.add("toasty");
    toast.classList.add("success");
    toast.innerHTML = `
    <i class='bx bx-check text-xl text-[var(--tertiary)]'></i>
  <div class="flex flex-col py-3">
    <h5 class="text-md font-semibold leading-2">Success</h5>
    <p class="text-gray-600 text-sm">${str}</p>
    <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
  </div>
    `;
  }
  if (type === "error") {
    toast.classList.add("toasty");
    toast.classList.add("error");
    toast.innerHTML = `
    <i class='bx bx-x text-xl text-[var(--red-color)]'></i>
  <div class="flex flex-col py-3">
    <h5 class="text-md font-semibold leading-2">Error</h5>
    <p class="text-gray-600 text-sm">${str}</p>
    <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
  </div>
    `;
  }
  if (type === "warn") {
    toast.classList.add("toasty");
    toast.classList.add("warn");
    toast.innerHTML = `
    <i class='bx bx-info-circle text-lg text-[#ffaa33]'></i>
    <div class="flex flex-col py-3">
      <h5 class="text-md font-semibold leading-2">Warning</h5>
      <p class="text-gray-600 text-sm">${str}</p>
      <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer' ></i></span>
    </div>
      `;
  }
  $(".toastBox").append(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
//#endregion
