<?php

function mapGroupRows(array $rows): array
{
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

function getAssignedGroups(PDO $connpcs, int $userId): array
{
    $sql = "
        SELECT
            gl.`id`,
            gl.`name`,
            gl.`abbreviation` AS `abbr`
        FROM `pcosdb`.`khi_user_groups` AS kug
        INNER JOIN `kdtphdb_new`.`group_list` AS gl
            ON gl.`id` = kug.`group_id`
        WHERE kug.`user_id` = :user_id
        ORDER BY kug.`id` ASC
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId
    ]);

    return mapGroupRows($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getAccessibleGroups(PDO $connpcs, int $userId): array
{
    if (!hasAllGroupAccess($connpcs, $userId)) {
        return getAssignedGroups($connpcs, $userId);
    }

    $sql = "
        SELECT
            `id`,
            `name`,
            `abbreviation` AS `abbr`
        FROM `kdtphdb_new`.`group_list`
        ORDER BY `name`
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute();

    return mapGroupRows($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getAccessibleGroupIds(PDO $connpcs, int $userId): array
{
    $groups = getAccessibleGroups($connpcs, $userId);

    return array_map(function ($group) {
        return (int) $group['id'];
    }, $groups);
}

function getMainGroupFromGroups(array $groups): ?array
{
    return !empty($groups) ? $groups[0] : null;
}