<?php
// list_sensors.php
require_once __DIR__ . '/config.php';

$url = $supabase_metadata_url . "?select=*";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabase_api_key",
    "Authorization: Bearer $supabase_api_key",
    "Accept: application/json"
]);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (is_array($data)) {
    echo "Found " . count($data) . " sensors:\n";
    foreach ($data as $sensor) {
        // Adapt 'sensor_unique_id' or 'id' depending on column name
        $id = $sensor['sensor_unique_id'] ?? $sensor['id'] ?? 'UNKNOWN';
        $name = $sensor['sensor_name'] ?? 'UNKNOWN';
        echo "- ID: $id | Name: $name\n";
    }
} else {
    echo "Failed to fetch: $response\n";
}
?>
