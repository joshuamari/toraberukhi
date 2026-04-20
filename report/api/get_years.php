<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    $userId = requireCurrentUserId(); // just to enforce session

    $years = getAvailableReportYears($connpcs);

    jsonSuccess($years, 'Years loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        default => 'YEARS_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    error_log('api/get_years.php failed: ' . $e->getMessage());
    jsonError('Failed to load years.', 500, 'SERVER_ERROR');
}