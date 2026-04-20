function initAnimation() {
  const animation = bodymovin.loadAnimation({
    container: document.getElementById("animationContainer"),
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "../animation.json",
    speed: 1,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet",
    },
  });

  animation.addEventListener("loopComplete", function () {
    setTimeout(function () {
      animation.pause();

      setTimeout(function () {
        animation.play();
      }, 3000);
    }, 0);
  });
}

function showToast(type, str) {
  const toast = document.createElement("div");

  if (type === "success") {
    toast.classList.add("toasty", "success");
    toast.innerHTML = `
      <i class='bx bx-check text-xl text-[var(--tertiary)]'></i>
      <div class="flex flex-col py-3">
        <h5 class="text-md font-semibold leading-2">Success</h5>
        <p class="text-gray-600 text-sm">${str}</p>
        <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer'></i></span>
      </div>
    `;
  }

  if (type === "error") {
    toast.classList.add("toasty", "error");
    toast.innerHTML = `
      <i class='bx bx-x text-xl text-[var(--red-color)]'></i>
      <div class="flex flex-col py-3">
        <h5 class="text-md font-semibold leading-2">Error</h5>
        <p class="text-gray-600 text-sm">${str}</p>
        <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer'></i></span>
      </div>
    `;
  }

  if (type === "warn") {
    toast.classList.add("toasty", "warn");
    toast.innerHTML = `
      <i class='bx bx-info-circle text-lg text-[#ffaa33]'></i>
      <div class="flex flex-col py-3">
        <h5 class="text-md font-semibold leading-2">Warning</h5>
        <p class="text-gray-600 text-sm">${str}</p>
        <span><i class='rmvToast bx bx-x absolute top-[10px] right-[10px] text-[16px] cursor-pointer'></i></span>
      </div>
    `;
  }

  $(".toastBox").append(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}