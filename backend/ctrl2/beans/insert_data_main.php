<?php
header("Content-Type: application/json");
require 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$insertData = [
    [
        'humidity(%)' => $data['humidity'],
        'Temperature(K)' => $data['temperature'],
        'receiving_date' => $data['timestamp'],
        'spike' => $data['spike'],
        'sensor_longitude' => $data['sensor_longitude'] ?? '',
        'sensor_latitude' => $data['sensor_latitude'] ?? '',
        'rdf_metadata' => $data['rdf_metadata'] ?? '',
        'download_metadata' => $data['download_metadata'] ?? '',
        'expected_noise' => $data['expected_noise'] ?? ''
    ]
];

$ch = curl_init("$supabaseUrl/rest/v1/data_main");

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabaseKey",
    "Authorization: Bearer $supabaseKey",
    "Content-Type: application/json",
    "Prefer: return=minimal"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($insertData));

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo json_encode([
    "status" => $http_code,
    "response" => $response
]);
?>
