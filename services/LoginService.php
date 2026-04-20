<?php

function encodeKhiSessionId(int $userId): string
{
    return bin2hex(urlencode(base64_encode((string) $userId)));
}

function loginKhiUser(PDO $connpcs, string $khiID): array
{
    $khiID = trim($khiID);

    if ($khiID === '') {
        throw new RuntimeException('User ID is required.', 400);
    }

    if (!ctype_digit($khiID)) {
        throw new RuntimeException('User ID must be numeric.', 400);
    }

    $sql = "
        SELECT
            `number`,
            `surname`,
            `firstname`,
            `group_id`,
            `is_active`
        FROM `khi_details`
        WHERE `number` = :khiID
        LIMIT 1
    ";

    $stmt = $connpcs->prepare($sql);
    $stmt->execute([
        ':khiID' => $khiID,
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new RuntimeException('User ID is not registered.', 404);
    }

    if ((int)($user['is_active'] ?? 0) !== 1) {
        throw new RuntimeException('User account is inactive.', 403);
    }

    $_SESSION['IDKHI'] = encodeKhiSessionId((int)$user['number']);

    return [
        'id' => (int)$user['number'],
        'surname' => $user['surname'],
        'firstname' => $user['firstname'],
        'group_id' => $user['group_id'],
    ];
}