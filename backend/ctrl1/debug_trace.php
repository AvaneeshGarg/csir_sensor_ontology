<?php
// debug_trace.php
header("Access-Control-Allow-Origin: *");
$logBase = __DIR__ . '/trace.log';
$timestamp = date('Y-m-d H:i:s');
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents('php://input');
$post = print_r($_POST, true);

$entry = "[$timestamp] Method: $method | IP: {$_SERVER['REMOTE_ADDR']}\nBody: $body\nPOST: $post\n-------------------\n";
file_put_contents($logBase, $entry, FILE_APPEND);

echo "Trace Logged. Hello from server.";
?>
