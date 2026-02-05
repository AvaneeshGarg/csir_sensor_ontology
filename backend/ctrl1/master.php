<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../cors_middleware.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/beans/errorhandler.php';
require_once __DIR__ . '/beans/authenticator.php';
require_once __DIR__ . '/beans/validator.php';
require_once __DIR__ . '/beans/sensor.php';
require_once __DIR__ . '/beans/noiselogic.php';
require_once __DIR__ . '/beans/rdf.php';

// 1. Security checks
Authenticator::enforceHTTPS();
Authenticator::checkSecret($_POST['secret'] ?? '');

// 2. Validate and sanitize
$required_fields = [
    "sensor_unique_id",
    "Temperature(K)",
    "humidity(%)",
    "sensor_longitude",
    "sensor_latitude",
    "receiving_date"
];
Validator::validateFields($_POST, $required_fields);
$data = Validator::sanitize($_POST);

// 3. Fetch sensor metadata
$sensor_meta = Sensor::fetchMetadata($data['sensor_unique_id']);
$sensor_name = $sensor_meta['sensor_name'];

// 4. Spike/Noise logic (simple z-score using last N values, no metadata needed)
list($expected_noise, $spike) = Noiselogic::checkHybrid(
    $data['sensor_unique_id'],
    $supabase_url,
    $supabase_api_key,
    floatval($data['Temperature(K)']),
    floatval($data['humidity(%)'])
);


// 5. RDF Generation
list($rdf_metadata, $ttl_download_url) = RDFGenerator::generate(
    $sensor_name,
    floatval($data['Temperature(K)']),
    floatval($data['humidity(%)']),
    $data['sensor_latitude'],
    $data['sensor_longitude'],
    $data['receiving_date'],
    $sensor_meta
);

// 6. Prepare and store in Supabase (with upsert)
$main_data = [
    "id" => $data['sensor_unique_id'],
    "Temperature(K)" => floatval($data['Temperature(K)']),
    "humidity(%)" => floatval($data['humidity(%)']),
    "sensor_longitude" => $data['sensor_longitude'],
    "sensor_latitude" => $data['sensor_latitude'],
    "receiving_date" => $data['receiving_date'],
    "rdf_metadata" => $rdf_metadata,
    "download_metadata" => $ttl_download_url,
    "expected_noise" => $expected_noise,
    "spike" => $spike // Make sure column name matches your DB
];
$ch = curl_init($supabase_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "apikey: $supabase_api_key",
    "Authorization: Bearer $supabase_api_key",
    "Prefer: resolution=merge-duplicates"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($main_data));
$supabase_response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error || !in_array($httpcode, [200, 201])) {
    ErrorHandler::handle(
        "LDNPL109d",
        "Supabase Error",
        $supabase_audit_url,
        $supabase_api_key,
        "data_main",
        $data['sensor_unique_id'],
        [
            "description" => $supabase_response,
            "http_code" => $httpcode,
            "curl_error" => $curl_error
        ]
    );
    Authenticator::send_response(502, [
        "error_code" => "LDNPL109d",
        "message" => "Supabase Error",
        "response" => $supabase_response,
        "http_code" => $httpcode,
        "curl_error" => $curl_error
    ]);
}

// 7. Store in Firebase
$firebase_path = "sensor/{$sensor_name}/latest.json?auth=$firebase_api_key";
$ch_fb = curl_init($firebase_url . $firebase_path);
curl_setopt($ch_fb, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_fb, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch_fb, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($ch_fb, CURLOPT_POSTFIELDS, json_encode($main_data));
$firebase_response = curl_exec($ch_fb);
$firebase_code = curl_getinfo($ch_fb, CURLINFO_HTTP_CODE);
curl_close($ch_fb);

if (curl_errno($ch_fb) || $firebase_code != 200) {
    ErrorHandler::handle(
        "LDNPL100",
        "Firebase Error",
        $supabase_audit_url,
        $supabase_api_key,
        "data_main",
        $data['sensor_unique_id'],
        [
            "description" => $firebase_response,
            "http_code" => $firebase_code
        ]
    );
    Authenticator::send_response(502, [
        "error_code" => "LDNPL100",
        "message" => "Firebase Error",
        "response" => $firebase_response,
        "http_code" => $firebase_code
    ]);
}

// 8. Success response with extra text/info
Authenticator::send_response(200, [
    "success" => true,
    "forwarded" => true,
    "ttl_download_url" => $ttl_download_url,
    "message" => "The data has been uploaded to both the databases, Lost Devs.io"
]);
?>
