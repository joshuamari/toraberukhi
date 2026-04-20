<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    $userId = requireCurrentUserId();

    $data = getExpiringPassports($connpcs, $connnew, $userId);

    jsonSuccess($data, 'Expiring passports loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        403 => 'USER_NOT_FOUND',
        default => 'EXPIRING_PASSPORT_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    jsonError('Failed to load expiring passports.', 500, 'SERVER_ERROR');
}