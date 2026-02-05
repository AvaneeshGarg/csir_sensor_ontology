<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];

$url = $supabaseUrl . '/rest/v1/users?id=eq.' . $id;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'full_name' => $data['full_name'],
    'email' => $data['email'],
    'role' => $data['role']
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabaseKey",
    "Authorization: Bearer $supabaseKey",
    "Content-Type: application/json",
    "Prefer: return=representation"
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
