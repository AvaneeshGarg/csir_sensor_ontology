<?php
ini_set('display_errors', 0);
error_reporting(0);

require __DIR__ . '/config.php';

header('Content-Type: application/json');

$files = [];

if ($handle = opendir(FILES_PATH)) {
    while (false !== ($entry = readdir($handle))) {
        if ($entry !== '.' && $entry !== '..' && is_file(FILES_PATH . $entry)) {
            $files[] = $entry;
        }
    }
    closedir($handle);
}

echo json_encode([
    'files' => $files
]);
?>
