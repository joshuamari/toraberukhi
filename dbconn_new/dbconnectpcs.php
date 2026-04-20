<?php

try {
    $host = envRequired('DB_PCS_HOST');
    $port = env('DB_PCS_PORT', '3306');
    $dbname = envRequired('DB_PCS_NAME');
    $charset = env('DB_PCS_CHARSET', 'utf8mb4');
    $username = envRequired('DB_PCS_USER');
    $password = env('DB_PCS_PASS', '');

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

    $connpcs = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    error_log('DB_PCS connection failed: ' . $e->getMessage());

    if (isDevelopment()) {
        throw new RuntimeException('PCS DB connection failed: ' . $e->getMessage(), 0, $e);
    }

    throw new RuntimeException('Database connection failed.');
}