<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['type'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing 'type' parameter."]);
    exit;
}

$sensor_type = preg_replace('/[^\w\-]/', '', $_GET['type']); 

$base_url = 'https://sensor-realtime-data-default-rtdb.asia-southeast1.firebasedatabase.app/';
$path = "sensor/" . rawurlencode($sensor_type) . "/latest.json";
$firebase_url = $base_url . $path;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $firebase_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $httpcode !== 200) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch from Firebase",
        "error" => $error ? $error : "HTTP $httpcode"
    ]);
    exit;
}

$data = json_decode($response, true);

if (!is_array($data) || empty($data)) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "No latest data found for sensor type '$sensor_type'"
    ]);
    exit;
}

$temp_kelvin = isset($data["Temperature(K)"]) ? floatval($data["Temperature(K)"]) : null;
$temp_celsius = is_null($temp_kelvin) ? null : round($temp_kelvin - 273.15, 2);
$humidity = isset($data["humidity(%)"]) ? floatval($data["humidity(%)"]) : null;

// 4. Return structured response
echo json_encode([
    "success"         => true,
    "sensor_type"     => $sensor_type,
    "temperature_K"   => $temp_kelvin,
    "temperature_C"   => $temp_celsius,
    "humidity"        => $humidity,
    "id"              => isset($data["id"]) ? $data["id"] : null,
    "receiving_date"  => isset($data["receiving_date"]) ? $data["receiving_date"] : null,
    "latitude"        => isset($data["sensor_latitude"]) ? $data["sensor_latitude"] : null,
    "download_metadata" => isset($data["download_metadata"]) ? $data["download_metadata"] : null,
    "rdf_metadata"    => isset($data["rdf_metadata"]) ? $data["rdf_metadata"] : null,
    "expected_noise"  => isset($data["expected_noise"]) ? $data["expected_noise"] : null,
    "raw"             => $data
]);
