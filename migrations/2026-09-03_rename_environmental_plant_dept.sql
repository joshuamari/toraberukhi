-- Rename Environmental Plant Dept. to Environmental Equipment Dept.
-- Table: requesters_dep (PCS DB)
-- Safe to re-run: only updates id 7 when the old name is still present.

UPDATE `requesters_dep`
SET `department_name` = 'Environmental Equipment Dept.'
WHERE `id` = 7
  AND `department_name` = 'Environmental Plant Dept.';
