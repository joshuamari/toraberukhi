<?php

try {
    $host = envRequired('DB_NEW_HOST');
    $port = env('DB_NEW_PORT', '3306');
    $dbname = envRequired('DB_NEW_NAME');
    $charset = env('DB_NEW_CHARSET', 'utf8mb4');
    $username = envRequired('DB_NEW_USER');
    $password = env('DB_NEW_PASS', '');

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

    $connnew = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    error_log('DB_NEW connection failed: ' . $e->getMessage());

    if (isDevelopment()) {
        throw new RuntimeException('NEW DB connection failed: ' . $e->getMessage(), 0, $e);
    }

    throw new RuntimeException('Database connection failed.');
}