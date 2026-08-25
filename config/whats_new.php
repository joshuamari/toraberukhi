<?php

function getWhatsNewReleases(string $currentVersion = ''): array
{
    $releases = [
        [
            'version' => '1.1.0',
            'date' => '2026-08-25',
            'highlights' => [
                [
                    'type' => 'added',
                    'text' => 'Submit date-change and cancellation requests from Request List (PCS reviews them)',
                ],
                [
                    'type' => 'added',
                    'text' => 'Change Requests page to view your requests and withdraw pending ones',
                ],
                [
                    'type' => 'added',
                    'text' => 'Activity history on Request List',
                ],
                [
                    'type' => 'added',
                    'text' => 'Re-entry permit status on Request List, dashboard, and Report',
                ],
                [
                    'type' => 'added',
                    'text' => 'Dashboard cards for on-process dispatches and expiring passport or visa',
                ],
                [
                    'type' => 'added',
                    'text' => 'In-app guides on Request List and Change Requests',
                ],
                [
                    'type' => 'changed',
                    'text' => 'Dashboard, Request List, and Change Requests layout',
                ],
            ],
        ],
        [
            'version' => '1.0.0',
            'date' => '2024-04-29',
            'highlights' => [
                [
                    'type' => 'added',
                    'text' => 'Initial release',
                ],
            ],
        ],
    ];

    foreach ($releases as &$release) {
        $release['current'] = $release['version'] === $currentVersion;
    }
    unset($release);

    return $releases;
}
