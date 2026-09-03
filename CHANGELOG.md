# Changelog

All notable changes to this project will be documented in this file.

Format is based on a simplified version of Keep a Changelog.
This project uses [Semantic Versioning](https://semver.org/).

---

<!-- Template (for future entries)
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing behavior

### Fixed
- Bug fixes

### Removed
- Removed features or deprecated logic

### Notes
- Optional context, warnings, or migration notes
-->

## [1.1.1] - 2026-09-04

### Added

- CLI/SQL migrations `migrations/2026-09-03_rename_environmental_plant_dept.php` and `migrations/2026-09-03_rename_environmental_plant_dept.sql`

### Changed

- `requesters_dep` id 7 renamed from Environmental Plant Dept. to Environmental Equipment Dept.

### Fixed

- Dashboard and Report navbar showed the first alphabetically accessible group (e.g. Accounting Group) instead of the user's assigned main group for all-access users

### Notes

- **Required after pull:** run `php migrations/2026-09-03_rename_environmental_plant_dept.php` or the SQL in `migrations/2026-09-03_rename_environmental_plant_dept.sql` (renames Environmental Plant Dept. to Environmental Equipment Dept. in `requesters_dep`; safe to re-run)

---

## [1.1.0] - 2026-08-25

Includes all changes from 2026-03-06 through 2026-08-20.

### Added

- API layer under `/api`, `bootstrap.php`, `.env` (dotenv), and service-based architecture (`AuthService`, `LoginService`, `GroupService`, `DashboardService`, `ReportService`, `AppSettingsService`, `RequestListService`)
- New API endpoints: `/api/session.php`, `/api/logout.php`, `/api/groups.php`, `/login/api/login.php`, `/dashboard/api/get_summary.php`, `/dashboard/api/get_dispatch_list.php`, `/dashboard/api/get_expiring_passport.php`, `/dashboard/api/get_expiring_visa.php`, `/report/api/get_report.php`, `/report/api/get_years.php`
- Multi-group assignment on Admin (Tom Select UI) and login/session support for users in more than one group
- Date-change and cancellation request submission from Request List (KHI submits; PCS reviews) *(requested by Kondo-san)*
- Change Requests page to view submitted date-change/cancellation requests and withdraw them
- Request List Activity History (derived from `request_list` + `request_change_list`), including withdraw logs
- Re-entry permit status on the Request List Document column, the dashboard dispatch list, and the Yearly Dispatch Report *(requested by Admin group)*
- HTML email templates and sending for dispatch, date-change, and cancellation **submission** and **withdrawal**
- In-app guides (Request List and Change Requests), with translations
- 183-day dispatch warning on new request
- Dashboard: on-process dispatches, expiring passport/visa, and dispatch list table
- Toast notifications and in-panel withdraw confirm on Change Requests
- This changelog

### Changed

- Dashboard, Login, and Report pages refactored into JS modules (`state`, `api`, `render`, `events`, etc.) and PHP services
- Tailwind moved to npm (`tailwindcss`) with a built `tailwindcss/output.css`; Lucide icons added
- Dashboard redesign (layout, summary cards, pagination, dispatch list table)
- Request List UI: cards, filters, request ID styles, and Document column
- Change Requests UI
- CR / DCR display IDs are now `CR-00001` / `DCR-00001` (no year; 5-digit pad)
- Dispatch-completed activity time set to 17:00; that event no longer shows “System” as actor
- President on dispatch requests is loaded dynamically; email lookup uses the active president only
- Inactive employees removed from email recipients
- Company name in emails updated to KHI Design & Technical Service, Inc.
- Email templates: gray background
- Database connections and passport/visa/re-entry expiry windows now use `.env`
- Loading overlay stacks above Bootstrap modals; dispatch form uses Bootstrap modal helpers
- Department requester names updated (Shigeyuki Oka, Narimichi Oda)
- Loading state when withdraw is clicked

### Fixed

- Multi-group add/edit user and login
- President email lookup no longer uses resigned records

### Removed

- Bundled `tailwindcss.js` / `tailwindcss.min.css` (replaced by the npm Tailwind build)
- Browser `alert()` / `confirm()` on Change Requests withdraw
- “Total Past 1 Year” column on the Yearly Dispatch Report, replaced by the “Re-entry Permit” column (the “Total Days past 1 year” column on the Dispatch Request page is unchanged) *(requested by Admin group)*
- “Open the request using your application” line from emails
- `.env.example` (removed 2026-07-31; recreate `.env` from the keys in Notes)

### Notes

- Requested by Kondo-san: date-change request submission; cancellation request submission
- Requested by Admin group: re-entry permit status; removal of the “Total Past 1 Year” column on the Yearly Dispatch Report
- **Required after pull:** `composer install` and a configured `.env` at the repo root (`.gitignore`d). There is no `.env.example` in the tree. Required DB keys: `DB_KDT_*`, `DB_PCS_*`, `DB_NEW_*`. Also set `APP_ENV`, `APP_DEBUG`, `EMAIL_ENABLED`, and mail keys (`MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_FORCE_TO` / `MAIL_FORCE_CC` as needed).
- **Required after pull:** `npm install` (Lucide, Tom Select, Tailwind). Optional CSS watch: `npm run build-css`
- Existing endpoints under `/php` and `/global` remain for backward compatibility
- Date-change and cancellation requests are submitted from PCSKHI; PCS still reviews/approves them
- `DISPATCH_EMAIL_TEST_MODE` is currently hardcoded `true` in `global/globalFunctions.php` (dev IDs in `DISPATCH_EMAIL_DEV_IDS`). Turn it off before production.

---

## [1.0.0] - 2024-04-29

### Added

- Initial release
