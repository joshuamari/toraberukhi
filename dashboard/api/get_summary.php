<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    requireCurrentUserId();

    $data = getDashboardSummary($connpcs);

    jsonSuccess($data, 'Dashboard summary loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        403 => 'USER_NOT_FOUND',
        default => 'DASHBOARD_SUMMARY_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    jsonError('Failed to load dashboard summary.', 500, 'SERVER_ERROR');
}