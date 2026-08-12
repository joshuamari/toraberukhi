/**
 * Product tour helpers for トラベる (Driver.js + localStorage).
 * v1: Dispatch Request first-run + replay.
 * Copy format: Japanese primary, English underneath.
 */
(function (window) {
  const STORAGE_KEYS = {
    dispatch: "pcsKhi_tour_dispatch_v2",
    requestList: "pcsKhi_tour_requestList_v1",
    changeRequests: "pcsKhi_tour_changeRequests_v1",
  };

  let activeDriver = null;
  let openedNavForTour = false;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Japanese on top, English under. */
  function bilingual(ja, en) {
    return (
      '<span class="pcs-tour-ja" lang="ja">' +
      escapeHtml(ja) +
      '</span><span class="pcs-tour-en">' +
      escapeHtml(en) +
      "</span>"
    );
  }

  function getDriverFactory() {
    return window.driver && window.driver.js && window.driver.js.driver;
  }

  function isDone(key) {
    try {
      return window.localStorage.getItem(key) === "done";
    } catch (e) {
      return true;
    }
  }

  function markDone(key) {
    try {
      window.localStorage.setItem(key, "done");
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function isMobileNav() {
    return window.matchMedia("(max-width: 887px)").matches;
  }

  function openNavForTour() {
    const nav = document.querySelector(".navigation");
    if (!nav || !isMobileNav()) return;
    if (!nav.classList.contains("open")) {
      nav.classList.add("open");
      document.body.classList.add("overflow-hidden");
      openedNavForTour = true;
    }
  }

  function restoreNavAfterTour() {
    if (!openedNavForTour) return;
    const nav = document.querySelector(".navigation");
    if (nav) nav.classList.remove("open");
    document.body.classList.remove("overflow-hidden");
    openedNavForTour = false;
  }

  function setFormStepMode(enabled) {
    document.body.classList.toggle("pcs-tour-form-step", !!enabled);
  }

  function scrollTourTargetIntoView(el) {
    if (!el) return;
    const scroller =
      el.closest(".viewForm") || el.closest("#left") || el.closest(".left");
    if (!scroller) {
      el.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
      return;
    }
    const elRect = el.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    scroller.scrollTop += elRect.top - scrollerRect.top - 12;
  }

  function prepareFormStep(element) {
    setFormStepMode(true);
    scrollTourTargetIntoView(element);
  }

  function prepareContinueStep() {
    setFormStepMode(false);
  }

  function elementExists(selector) {
    if (!selector) return true;
    return !!document.querySelector(selector);
  }

  function getDispatchSteps() {
    return [
      {
        element: "[data-tour='dispatch-welcome']",
        popover: {
          title: bilingual("トラベるへようこそ", "Welcome to トラベる"),
          description: bilingual(
            "ここからKDTへの派遣申請を作成します。このガイドでページの主な部分を案内します。",
            "This is where you create a dispatch request for KDT. A short guide will point out the main parts of this page."
          ),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "[data-tour='nav-main']",
        popover: {
          title: bilingual("メインメニュー", "Main menu"),
          description: bilingual(
            "サイドバー：ここで申請作成、Request Listで追跡、Change Requestsの管理、Dashboardで概要、User Managementで他のKHIメンバー追加、User Manuals。",
            "Sidebar: create requests here, track them in Request List, manage Change Requests, Dashboard for an overview, User Management to add other KHI members, and User Manuals."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: openNavForTour,
      },
      {
        element: "[data-tour='requester-info']",
        popover: {
          title: bilingual("依頼者情報", "Requester information"),
          description: bilingual(
            "会社、部署、氏名、連絡先から入力してください。",
            "Start with your company, department, name, and contact details."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: prepareFormStep,
      },
      {
        element: "[data-tour='employee-info']",
        popover: {
          title: bilingual("派遣社員", "Dispatch employee"),
          description: bilingual(
            "社員グループと派遣する社員を選択してください。",
            "Choose the employee group and the person who will be dispatched."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: prepareFormStep,
      },
      {
        element: "[data-tour='dispatch-schedule']",
        popover: {
          title: bilingual("日程と場所", "Schedule and place"),
          description: bilingual(
            "渡航日、勤務地、具体的な場所を入力してください。続きの項目はフォームをスクロールしてください。",
            "Set the travel dates, place of service, and specific location. Scroll the form for the next fields."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: prepareFormStep,
      },
      {
        element: "[data-tour='dispatch-trip-details']",
        popover: {
          title: bilingual("出張詳細", "Trip details"),
          description: bilingual(
            "招請、ワークオーダー、プロジェクト名、必要なら研修トグルを入力してください。",
            "Fill invitation, work order, project name, and the training toggle if needed."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: prepareFormStep,
      },
      {
        element: "[data-tour='dispatch-copy']",
        popover: {
          title: bilingual("写し", "Copy"),
          description: bilingual(
            "写し先の氏名と電話番号を確認してください。",
            "Confirm the copy-to contact names and numbers."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: prepareFormStep,
      },
      {
        element: "[data-tour='dispatch-work-history']",
        popover: {
          title: bilingual("職歴", "Work history"),
          description: bilingual(
            "右側の職歴を確認してください（社員を選択すると表示されます）。問題なければ「Work History Completed」のトグルをオンにして進みます。",
            "Review the work history on the right (it appears after you select an employee). If it looks correct, toggle on Work History Completed to proceed."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: prepareFormStep,
      },
      {
        element: "[data-tour='dispatch-continue']",
        popover: {
          title: bilingual("続ける", "Continue"),
          description: bilingual(
            "入力が終わったら「Click to Continue」をクリックし、派遣票を確認して申請してください。",
            'When the form is ready, click "Click to Continue" to review the dispatch form and submit your request.'
          ),
          side: "top",
          align: "end",
        },
        onHighlightStarted: prepareContinueStep,
      },
      {
        element: "[data-tour='nav-request-list']",
        popover: {
          title: bilingual("申請の確認", "Track your requests"),
          description: bilingual(
            "送信後は Request List でステータスを確認できます。ガイドはいつでも「ガイド」ボタンから再生できます。",
            "After submitting, open Request List to check status. You can replay this guide anytime with the Guide button."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: function () {
          setFormStepMode(false);
          openNavForTour();
        },
      },
    ];
  }

  const TOUR_BUILDERS = {
    dispatch: getDispatchSteps,
  };

  function startTour(name, options) {
    const opts = options || {};
    const force = !!opts.force;
    const key = STORAGE_KEYS[name];
    const buildSteps = TOUR_BUILDERS[name];

    if (!key || !buildSteps) return false;
    if (!force && isDone(key)) return false;

    const createDriver = getDriverFactory();
    if (typeof createDriver !== "function") {
      console.warn("PcsKhiTour: Driver.js is not loaded.");
      return false;
    }

    if (activeDriver) {
      try {
        activeDriver.destroy();
      } catch (e) {
        /* ignore */
      }
      activeDriver = null;
    }

    const steps = buildSteps().filter(function (step) {
      return elementExists(step.element);
    });

    if (!steps.length) return false;

    openedNavForTour = false;
    setFormStepMode(false);

    const driverObj = createDriver({
      showProgress: true,
      animate: true,
      allowClose: true,
      smoothScroll: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 8,
      popoverClass: "pcs-tour-popover",
      nextBtnText: bilingual("次へ", "Next"),
      prevBtnText: bilingual("戻る", "Back"),
      doneBtnText: bilingual("完了", "Done"),
      progressText: "{{current}} / {{total}}",
      steps: steps,
      onDestroyed: function () {
        markDone(key);
        restoreNavAfterTour();
        setFormStepMode(false);
        activeDriver = null;
      },
    });

    activeDriver = driverObj;
    driverObj.drive();
    return true;
  }

  function maybeStartTour(name) {
    return startTour(name, { force: false });
  }

  function bindReplayButton(selector, tourName) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      startTour(tourName, { force: true });
    });
  }

  window.PcsKhiTour = {
    keys: STORAGE_KEYS,
    start: startTour,
    maybeStart: maybeStartTour,
    bindReplay: bindReplayButton,
  };
})(window);
