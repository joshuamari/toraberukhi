<?php

require_once __DIR__ . '/../bootstrap.php';

try {
    $userId = requireCurrentUserId();
    $groups = getAccessibleGroups($connpcs, $userId);

    jsonSuccess($groups, 'Groups loaded successfully.');
} catch (RuntimeException $e) {
    $statusCode = $e->getCode() ?: 400;

    $errorCode = match ($statusCode) {
        401 => 'SESSION_EXPIRED',
        403 => 'USER_NOT_FOUND',
        default => 'GROUPS_ERROR',
    };

    jsonError($e->getMessage(), $statusCode, $errorCode);
} catch (Throwable $e) {
    jsonError('Failed to load groups.', 500, 'SERVER_ERROR');
}