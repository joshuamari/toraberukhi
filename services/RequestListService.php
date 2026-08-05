<?php

function getPresidentDisplayData(PDO $connnew): array
{
    $sql = "
        SELECT id, firstname, surname, email, gender
        FROM employee_list
        WHERE designation = 29
          AND (
                resignation_date IS NULL
                OR resignation_date = '0000-00-00'
                OR resignation_date > CURDATE()
              )
        LIMIT 1
    ";

    $stmt = $connnew->prepare($sql);
    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return [
            'emp_id' => null,
            'name' => '',
            'prefix' => '',
        ];
    }

    $prefix = ((int) $row['gender'] === 0) ? 'MR.' : 'Ms.';

    return [
        'emp_id' => (int) $row['id'],
        'name' => ucwords(strtolower(trim($row['firstname'] . ' ' . $row['surname']))),
        'prefix' => $prefix,
    ];
}

function getRequestListHeaderData(PDO $connpcs, PDO $connnew): array
{
    $president = getPresidentDisplayData($connnew);

    $coEmp = getSetting($connpcs, 'requestlist_co_emp');
    $coEmpId = $coEmp !== null ? (int) $coEmp : 0;

    $careOf = [
        'emp_id' => null,
        'name' => '',
        'prefix' => '',
    ];

    if ($coEmpId > 0) {
        $sql = "
            SELECT firstname, surname, gender
            FROM employee_list
            WHERE id = :id
            LIMIT 1
        ";

        $stmt = $connnew->prepare($sql);
        $stmt->execute([':id' => $coEmpId]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $careOf = [
                'emp_id' => $coEmpId,
                'name' => ucwords(strtolower(trim($row['firstname'] . ' ' . $row['surname']))),
                'prefix' => ((int) $row['gender'] === 0) ? 'MR.' : 'Ms.',
            ];
        }
    }

    return [
        'president' => $president,
        'care_of' => $careOf,
    ];
}
