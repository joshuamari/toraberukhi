<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from the command line.\n");
    exit(1);
}

require_once __DIR__ . '/../bootstrap.php';

$deptId = 7;
$oldName = 'Environmental Plant Dept.';
$newName = 'Environmental Equipment Dept.';

$select = $connpcs->prepare(
    'SELECT id, department_name FROM requesters_dep WHERE id = :id'
);
$select->execute([':id' => $deptId]);
$row = $select->fetch();

if (!$row) {
    fwrite(STDERR, "Department id {$deptId} was not found in requesters_dep.\n");
    exit(1);
}

$current = $row['department_name'];

if ($current === $newName) {
    echo "Already applied: requesters_dep id {$deptId} is already \"{$newName}\".\n";
    exit(0);
}

if ($current !== $oldName) {
    fwrite(STDERR, "Unexpected name for requesters_dep id {$deptId}: \"{$current}\". Expected \"{$oldName}\".\n");
    exit(1);
}

$update = $connpcs->prepare(
    'UPDATE requesters_dep
     SET department_name = :new
     WHERE id = :id AND department_name = :old'
);
$update->execute([
    ':new' => $newName,
    ':id' => $deptId,
    ':old' => $oldName,
]);

echo "Updated requesters_dep id {$deptId}: \"{$oldName}\" -> \"{$newName}\" ({$update->rowCount()} row).\n";
