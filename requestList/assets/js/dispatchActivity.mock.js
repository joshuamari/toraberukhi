/**
 * Isolated development fixtures for Dispatch Request Activity History.
 * Keyed by numeric dispatch request ID (data-request-id / req_id).
 * Not stored in localStorage. Does not modify live dispatch records.
 *
 * Temporary showcase only for the selected approved sample:
 * data-request-id="232" (Tamayo / Boiler Group / 30 Mar 2026 — 19 Jun 2026).
 */
window.mockDispatchActivity = {
  "232": [
    {
      activityId: "ACT-232-001",
      eventType: "dispatch_submitted",
      occurredAt: "2026-02-20T09:15:00+08:00",
      actorName: "Sakai, Eichi",
      description: "The dispatch request was submitted.",
    },
    {
      activityId: "ACT-232-002",
      eventType: "dispatch_approved",
      occurredAt: "2026-02-28T14:10:00+08:00",
      actorName: "KDT President",
      description: "The dispatch request was approved.",
    },
    {
      activityId: "ACT-232-003",
      eventType: "date_change_requested",
      occurredAt: "2026-07-02T09:30:00+08:00",
      actorName: "Sakai, Eichi",
      description: "A date-change request was submitted.",
      changeRequestType: "date_change",
      changeRequestId: "DCR-2026-015",
      changeRequestReference: "DCR-2026-015",
    },
    {
      activityId: "ACT-232-004",
      eventType: "date_change_accepted",
      occurredAt: "2026-07-05T16:20:00+08:00",
      actorName: "KDT President",
      description: "The proposed dispatch dates were accepted.",
      changeRequestType: "date_change",
      changeRequestId: "DCR-2026-015",
      changeRequestReference: "DCR-2026-015",
    },
  ],
};
