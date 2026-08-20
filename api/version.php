<?php

require_once __DIR__ . '/../helpers/env.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/whats_new.php';

header('Content-Type: application/json; charset=UTF-8');

$version = getAppConfig()['version'] ?? '';

jsonSuccess([
    'version' => $version,
    'releases' => getWhatsNewReleases($version),
], 'Version loaded successfully.');
