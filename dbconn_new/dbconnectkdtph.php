<?php

try {
    $host = envRequired('DB_KDT_HOST');
    $port = env('DB_KDT_PORT', '3306');
    $dbname = envRequired('DB_KDT_NAME');
    $charset = env('DB_KDT_CHARSET', 'utf8mb4');
    $username = envRequired('DB_KDT_USER');
    $password = env('DB_KDT_PASS', '');

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

    $connkdt = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    error_log('DB_KDT connection failed: ' . $e->getMessage());

    if (isDevelopment()) {
        throw new RuntimeException('KDT DB connection failed: ' . $e->getMessage(), 0, $e);
    }

    throw new RuntimeException('Database connection failed.');
}