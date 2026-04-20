<?php

require_once __DIR__ . '/../bootstrap.php';

try {
    $data = getSessionData($connpcs);
    jsonSuccess($data, 'Session loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        403 => 'USER_NOT_FOUND',
        default => 'SESSION_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    jsonError('Failed to load session data.', 500, 'SERVER_ERROR');
}