<?php

function env(string $key, $default = null)
{
    if (array_key_exists($key, $_ENV)) {
        return $_ENV[$key];
    }

    if (array_key_exists($key, $_SERVER)) {
        return $_SERVER[$key];
    }

    return $default;
}

function envRequired(string $key): string
{
    $value = env($key);

    if ($value === null || $value === '') {
        throw new RuntimeException("Missing required environment variable: {$key}");
    }

    return (string)$value;
}

function envBool(string $key, bool $default = false): bool
{
    $value = env($key);

    if ($value === null || $value === '') {
        return $default;
    }

    $normalized = strtolower(trim((string)$value));

    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
}

function envInt(string $key, int $default = 0): int
{
    $value = env($key);

    if ($value === null || $value === '') {
        return $default;
    }

    return (int)$value;
}

function appEnv(): string
{
    return strtolower((string)env('APP_ENV', 'production'));
}

function isProduction(): bool
{
    return appEnv() === 'production';
}

function isDevelopment(): bool
{
    return in_array(appEnv(), ['development', 'dev', 'local'], true);
}

function isEmailEnabled(): bool
{
    return envBool('EMAIL_ENABLED', false);
}

function envCsvIntArray(string $key): array
{
    $value = trim((string)env($key, ''));

    if ($value === '') {
        return [];
    }

    $parts = array_map('trim', explode(',', $value));
    $parts = array_filter($parts, fn($item) => $item !== '');

    return array_map('intval', $parts);
}

function envCsvArray(string $key): array
{
    $value = trim((string)env($key, ''));

    if ($value === '') {
        return [];
    }

    $parts = array_map('trim', explode(',', $value));
    return array_values(array_filter($parts, fn($item) => $item !== ''));
}