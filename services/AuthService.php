<?php

function decodeKhiSessionId($encodedValue): int
{
    if (empty($encodedValue) || !is_string($encodedValue)) {
        return 0;
    }

    $decodedHex = @hex2bin($encodedValue);
    if ($decodedHex === false) {
        return 0;
    }

    $decodedBase64 = base64_decode(urldecode($decodedHex), true);
    if ($decodedBase64 === false || $decodedBase64 === '') {
        return 0;
    }

    return (int) $decodedBase64;
}

function encodeKhiSessionId(int $userId): string
{
    return bin2hex(urlencode(base64_encode((string) $userId)));
}

function getCurrentUserId(): int
{
    return decodeKhiSessionId($_SESSION['IDKHI'] ?? '');
}

function requireCurrentUserId(): int
{
    $userId = getCurrentUserId();

    if ($userId <= 0) {
        throw new RuntimeException('Not logged in', 401);
    }

    return $userId;
}

function hasAllGroupAccess(PDO $connpcs, int $empId): bool
{
    $sql = "
        SELECT COUNT(*)
        FROM `khi_user_permissions`
        WHERE `permission_id` = 1
          AND `employee_id` = :emp_id
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute([
        ':emp_id' => $empId
    ]);

    return ((int) $stmt->fetchColumn()) > 0;
}

function getCurrentUserProfile(PDO $connpcs, int $userId): array
{
    $sql = "
        SELECT
            kd.`number` AS `id`,
            kd.`surname`,
            kd.`firstname`,
            kd.`email`
        FROM `khi_details` AS kd
        WHERE kd.`number` = :user_id
          AND kd.`is_active` = 1
        LIMIT 1
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    $employee = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$employee) {
        throw new RuntimeException('User not found or inactive', 403);
    }

    $groups = getAccessibleGroups($connpcs, $userId);
    $mainGroup = getMainGroupFromGroups($groups);

    $employee['id'] = (int) $employee['id'];
    $employee['group'] = $mainGroup ? $mainGroup['name'] : null;
    $employee['groupData'] = $mainGroup;
    $employee['groups'] = $groups;
    $employee['type'] = hasAllGroupAccess($connpcs, $userId) ? 1 : 0;

    return $employee;
}

function getSessionData(PDO $connpcs): array
{
    $userId = requireCurrentUserId();
    return getCurrentUserProfile($connpcs, $userId);
}