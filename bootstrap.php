<?php

date_default_timezone_set('Asia/Manila');

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/helpers/env.php';
require_once __DIR__ . '/helpers/response.php';

require_once __DIR__ . '/config/app.php';

require_once __DIR__ . '/dbconn_new/dbconnectkdtph.php';
require_once __DIR__ . '/dbconn_new/dbconnectpcs.php';
require_once __DIR__ . '/dbconn_new/dbconnectnew.php';

require_once __DIR__ . '/global/globalFunctions.php';

require_once __DIR__ . '/services/AuthService.php';
require_once __DIR__ . '/services/DashboardService.php';

require_once __DIR__ . '/services/LoginService.php';
$appConfig = getAppConfig();