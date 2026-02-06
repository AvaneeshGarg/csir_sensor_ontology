<?php
// test_secret.php - Tests master.php with the correct secret key
$url = 'http://127.0.0.1/backend/ctrl1/master.php';
$secret = 'sb_secret_CQrgzzNmsh8hfZGYDpOAzQ_MCj0SvF-';

$data = [
    'secret' => $secret,
    'sensor_unique_id' => 'TEST_SENSOR_001',
    'Temperature(K)' => 300.15,
    'humidity(%)' => 50,
    'sensor_longitude' => 77.12345,
    'sensor_latitude' => 28.54321,
    'receiving_date' => date('Y-m-d H:i:s'),
    'rdf_metadata' => 'test',
    'download_metadata' => 'test'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
?>
