<?php
// master.php - Debug Version
$log = __DIR__ . '/master_debug.log';
file_put_contents($log, date('H:i:s') . " - Step 0: Start\n", FILE_APPEND);

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../cors_middleware.php';
file_put_contents($log, "Step 1: CORS Loaded\n", FILE_APPEND);

require_once __DIR__ . '/config.php';
file_put_contents($log, "Step 2: Config Loaded\n", FILE_APPEND);

require_once __DIR__ . '/beans/errorhandler.php';
require_once __DIR__ . '/beans/authenticator.php';
require_once __DIR__ . '/beans/validator.php';
require_once __DIR__ . '/beans/sensor.php';
require_once __DIR__ . '/beans/noiselogic.php';
require_once __DIR__ . '/beans/rdf.php';
file_put_contents($log, "Step 3: Beans Loaded\n", FILE_APPEND);

// 1. Security checks
file_put_contents($log, "Step 4: Checking HTTPS\n", FILE_APPEND);
Authenticator::enforceHTTPS();

file_put_contents($log, "Step 5: Checking Secret\n", FILE_APPEND);
Authenticator::checkSecret($_POST['secret'] ?? '');

// 2. Validate and sanitize
file_put_contents($log, "Step 6: Validating Fields\n", FILE_APPEND);
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
file_put_contents($log, "Step 7: Validation Success\n", FILE_APPEND);

// 3. Fetch sensor metadata
/*
file_put_contents($log, "Step 8: Fetching Metadata for ID: " . $data['sensor_unique_id'] . "\n", FILE_APPEND);
$sensor_meta = Sensor::fetchMetadata($data['sensor_unique_id']);
$sensor_name = $sensor_meta['sensor_name'];
file_put_contents($log, "Step 9: Metadata Found: $sensor_name\n", FILE_APPEND);
*/
// BYPASS: Use default metadata since Supabase table is missing
$sensor_name = "DHT11_Sensor";
$sensor_meta = [
    "sensor_name" => $sensor_name,
    "sensor_type" => "DHT11",
    "sensor_location" => "Unknown",
    "accuracy_temperature" => 0.5,
    "resolution_temperature" => 0.1,
    "accuracy_humidity" => 2,
    "resolution_humidity" => 1,
    // Add missing keys to prevent crashes/warnings
    "manufacturer" => "Generic",
    "calibration_status" => "Calibrated",
    "interface_type" => "Digital",
    "sampling_rate" => "1Hz",
    "data_format" => "JSON",
    "voltage" => 5.0,
    "power" => 0.1,
    "deployment" => "Test Deployment",
    "platform" => "Arduino",
    "min_temperature" => 0,
    "max_temperature" => 50,
    "min_humidity" => 20,
    "max_humidity" => 90
];
file_put_contents($log, "Step 8-9: Metadata Bypassed (Using Full Defaults)\n", FILE_APPEND);

// 4. Spike/Noise logic
list($expected_noise, $spike) = Noiselogic::checkHybrid(
    $data['sensor_unique_id'],
    $supabase_url,
    $supabase_api_key,
    floatval($data['Temperature(K)']),
    floatval($data['humidity(%)'])
);
file_put_contents($log, "Step 10: Noise Logic Done\n", FILE_APPEND);


// 5. RDF Generation
$rdf_metadata = "";
$ttl_download_url = "";
try {
    list($rdf_metadata, $ttl_download_url) = RDFGenerator::generate(
        $sensor_name,
        floatval($data['Temperature(K)']),
        floatval($data['humidity(%)']),
        $data['sensor_latitude'],
        $data['sensor_longitude'],
        $data['receiving_date'],
        $sensor_meta
    );
    file_put_contents($log, "Step 11: RDF Generated\n", FILE_APPEND);
} catch (Throwable $e) {
    file_put_contents($log, "Step 11 ERROR: RDF Generation Failed: " . $e->getMessage() . "\n", FILE_APPEND);
    // Proceed without RDF (optional) or let empty strings trigger defaults
}

// 6. Prepare and store in Supabase
$main_data = [
    "id" => $data['sensor_unique_id'],
    "Temperature(K)" => floatval($data['Temperature(K)']),
    "humidity(%)" => floatval($data['humidity(%)']),
    "sensor_longitude" => $data['sensor_longitude'],
    "sensor_latitude" => $data['sensor_latitude'],
    "receiving_date" => $data['receiving_date'],
    "rdf_metadata" => $rdf_metadata,
    "download_metadata" => $ttl_download_url,
    // "expected_noise" => $expected_noise, // Column missing in DB
    // "spike" => $spike // Column missing in DB
];

file_put_contents($log, "Step 12: Sending to Supabase\n", FILE_APPEND);
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

file_put_contents($log, "Step 13: Supabase Response: $httpcode\n", FILE_APPEND);

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
file_put_contents($log, "Step 14: Sending to Firebase\n", FILE_APPEND);
$firebase_path = "sensor/{$sensor_name}/latest.json?auth=$firebase_api_key";
$ch_fb = curl_init($firebase_url . $firebase_path);
curl_setopt($ch_fb, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_fb, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch_fb, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($ch_fb, CURLOPT_POSTFIELDS, json_encode($main_data));
$firebase_response = curl_exec($ch_fb);
$firebase_code = curl_getinfo($ch_fb, CURLINFO_HTTP_CODE);
curl_close($ch_fb);

file_put_contents($log, "Step 15: Firebase Response: $firebase_code\n", FILE_APPEND);

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

// 8. Success response
file_put_contents($log, "Step 16: Success!\n", FILE_APPEND);
Authenticator::send_response(200, [
    "success" => true,
    "forwarded" => true,
    "ttl_download_url" => $ttl_download_url,
    "message" => "The data has been uploaded to both the databases, Lost Devs.io"
]);
?>
