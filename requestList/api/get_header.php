<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    requireCurrentUserId();
    $data = getRequestListHeaderData($connpcs, $connnew);

    jsonSuccess($data, 'Header data loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        403 => 'USER_NOT_FOUND',
        default => 'HEADER_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    error_log('requestList/api/get_header.php failed: ' . $e->getMessage());
    jsonError('Failed to load header data.', 500, 'SERVER_ERROR');
}
