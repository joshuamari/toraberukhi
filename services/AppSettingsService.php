<?php

function getSetting(PDO $connpcs, string $key, ?string $default = null): ?string
{
    $sql = "
        SELECT setting_value
        FROM app_settings
        WHERE setting_key = :setting_key
        LIMIT 1
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute([
        ':setting_key' => $key,
    ]);

    $value = $stmt->fetchColumn();

    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return (string) $value;
}
