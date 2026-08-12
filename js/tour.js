/**
 * Product tour helpers for トラベる (Driver.js + localStorage).
 * Tours: Dispatch Request, Request List, request-detail modal (activity + approved actions).
 * Copy format: Japanese primary, English underneath.
 */
(function (window) {
  const STORAGE_KEYS = {
    dispatch: "pcsKhi_tour_dispatch_v2",
    requestList: "pcsKhi_tour_requestList_v1",
    requestActivity: "pcsKhi_tour_requestActivity_v1",
    approvedModal: "pcsKhi_tour_approvedModal_v1",
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

  function elementVisible(selector) {
    if (!selector) return true;
    const el = document.querySelector(selector);
    if (!el) return false;
    if (el.hidden) return false;
    if (el.classList.contains("d-none")) return false;
    if (el.closest(".d-none,[hidden]")) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function scrollModalTourTarget(element) {
    if (!element) return;
    const scroller =
      element.closest(".modal-body") ||
      element.closest(".dispatch-activity-scroll");
    if (!scroller) {
      element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
      return;
    }
    const elRect = element.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    scroller.scrollTop += elRect.top - scrollerRect.top - 12;
  }

  function prepareModalStep(element) {
    scrollModalTourTarget(element);
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

  function getRequestListSteps() {
    return [
      {
        element: "[data-tour='requestList-welcome']",
        popover: {
          title: bilingual("申請一覧", "Request List"),
          description: bilingual(
            "KDTへ送った派遣申請をここで確認・管理します。このガイドで主な操作を案内します。",
            "Track and manage dispatch requests you sent to KDT. This short guide covers the main parts of this page."
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
            "サイドバーから派遣申請の作成、申請一覧、Change Requests、Dashboard、User Management、User Manualsへ移動できます。",
            "Use the sidebar to create dispatch requests, open Request List, manage Change Requests, view the Dashboard, User Management, and User Manuals."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: openNavForTour,
      },
      {
        element: "[data-tour='requestList-cards']",
        popover: {
          title: bilingual("件数サマリー", "Status summary"),
          description: bilingual(
            "保留・承認・却下・キャンセル・完了・合計の件数をすばやく確認できます。",
            "Quickly see counts for pending, approved, declined, cancelled, completed, and total requests."
          ),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "[data-tour='requestList-status-tabs']",
        popover: {
          title: bilingual("ステータス絞り込み", "Filter by status"),
          description: bilingual(
            "タブで一覧をステータスごとに絞り込めます（すべて／保留／承認など）。",
            "Use these tabs to filter the list by status (All, Pending, Approved, and so on)."
          ),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "[data-tour='requestList-status-guide']",
        popover: {
          title: bilingual("ステータスの説明", "Status meanings"),
          description: bilingual(
            "？ボタンで各ステータスの意味（日本語・英語）を確認できます。",
            "Tap the help button anytime to read what each status means in Japanese and English."
          ),
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "[data-tour='requestList-filters']",
        popover: {
          title: bilingual("検索とフィルタ", "Search and filters"),
          description: bilingual(
            "キーワード検索、申請月、グループで一覧をさらに絞り込めます。",
            "Narrow the list further with keyword search, requested month, and employee group."
          ),
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "[data-tour='requestList-table']",
        popover: {
          title: bilingual("申請テーブル", "Requests table"),
          description: bilingual(
            "各行に申請ID、社員、申請日、派遣期間、ステータス、パスポート／ビザの有効性が表示されます。",
            "Each row shows request ID, employee, date requested, dispatch dates, status, and passport/visa validity."
          ),
          side: "top",
          align: "start",
        },
      },
      {
        element: "[data-tour='requestList-open']",
        popover: {
          title: bilingual("詳細を開く", "Open details"),
          description: bilingual(
            "行または開くアイコンをクリックすると、申請内容・添付・Activity History を確認できます。",
            "Click a row or the open icon to view details, attachments, and Activity History."
          ),
          side: "left",
          align: "start",
        },
      },
      {
        element: "[data-tour='nav-change-requests']",
        popover: {
          title: bilingual("変更申請", "Change Requests"),
          description: bilingual(
            "日付変更やキャンセルの申請状況は Change Requests で追跡できます。ガイドはいつでも「ガイド」ボタンから再生できます。",
            "Track date-change and cancellation requests in Change Requests. Replay this guide anytime with the Guide button."
          ),
          side: "right",
          align: "start",
        },
        onHighlightStarted: openNavForTour,
      },
    ];
  }

  function getRequestActivitySteps() {
    return [
      {
        element: "[data-tour='requestList-activity-history']",
        popover: {
          title: bilingual("新機能：履歴", "New: Activity History"),
          description: bilingual(
            "申請の提出・承認・変更など、これまでの経緯を時系列で確認できます。どのステータスでも表示されます。",
            "See the timeline of this request—submission, approval, changes, and more. Available for every status."
          ),
          side: "left",
          align: "start",
        },
        onHighlightStarted: prepareModalStep,
      },
    ];
  }

  function getApprovedModalSteps() {
    return [
      {
        element: "[data-tour='requestList-change-actions']",
        popover: {
          title: bilingual("新機能：変更申請", "New: change requests"),
          description: bilingual(
            "承認済みの派遣について、ここから日付変更またはキャンセルをKDTへ申請できます。",
            "For an approved dispatch, you can request a date change or cancellation to KDT from here."
          ),
          side: "top",
          align: "center",
        },
        onHighlightStarted: prepareModalStep,
      },
      {
        element: "[data-tour='requestList-date-change']",
        popover: {
          title: bilingual("日付変更を申請", "Request date change"),
          description: bilingual(
            "派遣期間を変更したい場合に使います。提案日程と理由を入力して送信します。",
            "Use this when you need to adjust the dispatch period. Enter proposed dates and a reason, then submit."
          ),
          side: "top",
          align: "center",
        },
        onHighlightStarted: prepareModalStep,
      },
      {
        element: "[data-tour='requestList-cancellation']",
        popover: {
          title: bilingual("キャンセルを申請", "Request cancellation"),
          description: bilingual(
            "派遣自体を取り消したい場合に使います。KDTが承認するまで現行の派遣は有効のままです。進捗は Change Requests で確認できます。",
            "Use this to cancel the dispatch. It stays active until KDT approves. Track progress under Change Requests."
          ),
          side: "top",
          align: "center",
        },
        onHighlightStarted: prepareModalStep,
      },
    ];
  }

  const TOUR_BUILDERS = {
    dispatch: getDispatchSteps,
    requestList: getRequestListSteps,
    requestActivity: getRequestActivitySteps,
    approvedModal: getApprovedModalSteps,
  };

  function startTour(name, options) {
    const opts = options || {};
    const force = !!opts.force;
    const visibleOnly = !!opts.visibleOnly;
    const onDestroyedExtra =
      typeof opts.onDestroyed === "function" ? opts.onDestroyed : null;
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
      return visibleOnly
        ? elementVisible(step.element)
        : elementExists(step.element);
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
        if (onDestroyedExtra) {
          try {
            onDestroyedExtra();
          } catch (e) {
            /* ignore callback errors */
          }
        }
      },
    });

    activeDriver = driverObj;
    driverObj.drive();
    return true;
  }

  function maybeStartTour(name, options) {
    return startTour(name, Object.assign({}, options || {}, { force: false }));
  }

  function isTourActive() {
    return !!activeDriver;
  }

  function stopTour() {
    if (!activeDriver) return;
    try {
      activeDriver.destroy();
    } catch (e) {
      /* ignore */
    }
    activeDriver = null;
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
    isActive: isTourActive,
    stop: stopTour,
    bindReplay: bindReplayButton,
  };
})(window);
