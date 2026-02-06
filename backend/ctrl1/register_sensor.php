<?php
// register_sensor.php
require_once __DIR__ . '/config.php';

$url = $supabase_metadata_url;
$sensor_data = [
    "sensor_unique_id" => 1, // Integer
    "sensor_name" => "DHT11_Sensor",
    "sensor_type" => "DHT11",
    "sensor_location" => "Lab 1",
    "sensor_description" => "Default Test Sensor"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabase_api_key",
    "Authorization: Bearer $supabase_api_key",
    "Content-Type: application/json",
    "Prefer: resolution=merge-duplicates"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sensor_data));
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpcode\n";
echo "Response: $response\n";
?>
