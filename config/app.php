<?php

function getAppConfig(): array
{
    return [
        'env' => appEnv(),
        'debug' => envBool('APP_DEBUG', false),

        'email_enabled' => isEmailEnabled(),
        'mail_from_address' => env('MAIL_FROM_ADDRESS', ''),
        'mail_from_name' => env('MAIL_FROM_NAME', 'PCSKHI System'),
        'mail_force_to' => env('MAIL_FORCE_TO', ''),
        'mail_force_cc' => env('MAIL_FORCE_CC', ''),
    ];
}