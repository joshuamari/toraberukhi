<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Method not allowed.', 405, 'METHOD_NOT_ALLOWED');
    }

    $userId = requireCurrentUserId();

    $selectedYear = isset($_POST['yearSelected'])
        ? trim((string) $_POST['yearSelected'])
        : date('Y');

    $groupId = isset($_POST['groupID'])
        ? trim((string) $_POST['groupID'])
        : null;

    $report = getDispatchReport(
        $connpcs,
        $connnew,
        $userId,
        $selectedYear,
        $groupId
    );

    jsonSuccess($report, 'Report loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        400 => 'VALIDATION_ERROR',
        401 => 'SESSION_EXPIRED',
        403 => 'ACCESS_DENIED',
        405 => 'METHOD_NOT_ALLOWED',
        default => 'REPORT_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    error_log('api/get_report.php failed: ' . $e->getMessage());
    jsonError('Failed to load report.', 500, 'SERVER_ERROR');
}