<?php

require_once __DIR__ . '/../bootstrap.php';

try {
    session_destroy();

    jsonSuccess(null, 'Logged out successfully.');
} catch (Throwable $e) {
    jsonError('Failed to log out.', 500, 'LOGOUT_ERROR');
}