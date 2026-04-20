<?php

require_once __DIR__ . '/../../bootstrap.php';

try {
    $data = loginKhiUser($connpcs, $_POST['khiID'] ?? '');

    jsonSuccess($data, 'Login successful.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        400 => 'VALIDATION_ERROR',
        403 => 'USER_INACTIVE',
        404 => 'USER_NOT_FOUND',
        default => 'LOGIN_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    jsonError('Failed to log in.', 500, 'SERVER_ERROR');
}