<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    $userId = requireCurrentUserId();

    $data = getExpiringVisas($connpcs, $connnew, $userId);

    jsonSuccess($data, 'Expiring visas loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        403 => 'USER_NOT_FOUND',
        default => 'EXPIRING_VISA_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    jsonError('Failed to load expiring visas.', 500, 'SERVER_ERROR');
}