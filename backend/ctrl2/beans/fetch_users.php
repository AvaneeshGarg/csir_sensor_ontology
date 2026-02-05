<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'config.php';

$url = $supabaseUrl . '/rest/v1/users?select=*';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabaseKey",
    "Authorization: Bearer $supabaseKey",
    "Content-Type: application/json",
    "Accept: application/json"
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => curl_error($ch)]);
} else {
    header('Content-Type: application/json');
    echo $response;
}

curl_close($ch);
?>
