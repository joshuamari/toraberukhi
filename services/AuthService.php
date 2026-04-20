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

function getUserGroups(PDO $connpcs, int $empId): array
{
    $sql = "
        SELECT
            gl.`id`,
            gl.`name`,
            gl.`abbreviation` AS `abbr`
        FROM `pcosdb`.`khi_user_groups` AS kug
        INNER JOIN `kdtphdb_new`.`group_list` AS gl
            ON gl.`id` = kug.`group_id`
        WHERE kug.`user_id` = :emp_id
        ORDER BY kug.`id` ASC
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute([
        ':emp_id' => $empId
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        return [];
    }

    return array_map(function ($row) {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'abbr' => $row['abbr'],
        ];
    }, $rows);
}

function getMainGroupFromGroups(array $groups): ?array
{
    return !empty($groups) ? $groups[0] : null;
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

    $groups = getUserGroups($connpcs, $userId);
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