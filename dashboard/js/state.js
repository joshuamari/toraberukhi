// state.js
const rootFolder = `//${document.location.hostname}`;

const state = {
  empDetails: null,
};

let dashboardRequestList = [];
let dashboardCancellations = [];
let dashboardDateChanges = [];
let dashboardActivityItems = [];
let dashboardDispatchList = [];

let submissionTrendChartInstance = null;
let statusChartInstance = null;
let dashboardSubmissionTrendYear = null;
let dashboardStatusOverviewYear = null;

const ACTIVITY_PAGE_SIZE = 10;
let activityPaginationState = {
  currentPage: 1,
  itemsPerPage: ACTIVITY_PAGE_SIZE,
  totalItems: 0,
};

const LATEST_DISPATCH_PAGE_SIZE = 10;
let latestDispatchPaginationState = {
  currentPage: 1,
  itemsPerPage: LATEST_DISPATCH_PAGE_SIZE,
  totalItems: 0,
};

/* Status chart colors — match existing status badge tokens */
const STATUS_CHART_COLORS = {
  pending: "#be860b",
  approved: "#0e9c42",
  completed: "#22c55e",
  declined: "#ec8f5e",
  cancelled: "#f06970",
};

const monthNames2 = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const monthNamesFull = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
