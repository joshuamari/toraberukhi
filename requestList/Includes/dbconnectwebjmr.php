<?php
$config = [
  'host' => 'localhost',
  'port' => 3306,
  'dbname' => 'webjmrdb',
  'charset' => 'utf8mb4'
];
$username = 'root';
$password = '';
$dsn = 'mysql:' . http_build_query($config, '', ';');
try {
  $connwebjmr = new PDO($dsn, $username, $password, [
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
  ]);
  $excludeGroups = ['SHI', 'INT', 'SYS', 'TEG', 'ADM', 'ACT', 'MNG', 'DXT', 'IT'];
} catch (PDOException $e) {
  echo "Connection failed: " . $e->getMessage();
}
