<?php

function jsonSuccess($data = null, string $message = 'Success'): void
{
    http_response_code(200);
    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);

    exit;
}

function jsonError(
    string $message = 'Something went wrong.',
    int $statusCode = 500,
    ?string $code = null,
    $extra = null
): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');

    $response = [
        'success' => false,
        'message' => $message,
    ];

    if ($code !== null) {
        $response['code'] = $code;
    }

    if ($extra !== null) {
        $response['data'] = $extra; // optional debug/meta
    }

    echo json_encode($response);
    exit;
}