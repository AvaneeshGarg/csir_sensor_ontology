<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'config.php';

$url = $supabaseUrl . '/rest/v1/data_main?select=id,sensor_latitude,sensor_longitude';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabaseKey",
    "Authorization: Bearer $supabaseKey",
    "Content-Type: application/json",
    "Prefer: return=representation"
]);

$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($statusCode == 200) {
    header('Content-Type: application/json');
    echo $response;
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch sensor data']);
}
?>
