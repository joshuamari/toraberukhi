<?php

function sendHtmlNoCacheHeaders(): void
{
    if (headers_sent()) {
        return;
    }

    header('Cache-Control: no-cache, must-revalidate');
}

function asset(string $path): string
{
    $urlPath = $path;
    $queryPos = strpos($urlPath, '?');
    if ($queryPos !== false) {
        $urlPath = substr($urlPath, 0, $queryPos);
    }

    $scriptFile = $_SERVER['SCRIPT_FILENAME'] ?? __FILE__;
    $baseDir = dirname((string) $scriptFile);
    $fullPath = $baseDir . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $urlPath);
    $realPath = realpath($fullPath);
    $version = ($realPath !== false && is_file($realPath)) ? (string) filemtime($realPath) : (string) time();

    return htmlspecialchars($urlPath, ENT_QUOTES, 'UTF-8') . '?v=' . $version;
}
