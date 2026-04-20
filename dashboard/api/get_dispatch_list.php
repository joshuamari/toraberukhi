<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    $userId = requireCurrentUserId();
    $data = getDashboardDispatchList($connpcs, $connnew, $userId);

    jsonSuccess($data, 'Dispatch list loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        403 => 'USER_NOT_FOUND',
        default => 'DISPATCH_LIST_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    jsonError('Failed to load dispatch list.', 500, 'SERVER_ERROR');
}