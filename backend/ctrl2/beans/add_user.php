<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$full_name = $data['full_name'] ?? '';
$email = $data['email'] ?? '';
$role = $data['role'] ?? 'user';

if (!$email || !$full_name) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

function generatePassword($length = 10) {
    return bin2hex(random_bytes($length / 2)); 
}

$password_plain = generatePassword();
$password_hash = password_hash($password_plain, PASSWORD_BCRYPT);
$now = gmdate('Y-m-d\TH:i:s\Z');


$user_payload = [
    'full_name' => $full_name,
    'email' => $email,
    'role' => $role,
    'password_hash' => $password_hash,
    'created_at' => $now,
    'updated_at' => $now,
    'is_active' => true,
    'login_attempts' => 0
];


$url = $supabaseUrl . '/rest/v1/users';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($user_payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabaseKey",
    "Authorization: Bearer $supabaseKey",
    "Content-Type: application/json",
    "Prefer: return=representation"
]);

$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Step 4: Send email with plain password
if ($statusCode == 201 || $statusCode == 200) {
    $subject = "Your SensorSync Account Credentials";
    $message = "Hello $full_name,\n\nYour account has been created successfully by our Team.\n\nLogin Email: $email\nPassword: $password_plain\n\nPlease login or rest your password from the Portal.\n\nRegards,\nSensorSync Team";
    $headers = "From: no-reply@lostdevs.io\r\nReply-To: no-reply@lostdevs.io\r\n";

    
    mail($email, $subject, $message, $headers);

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'email' => $email, 'password' => $password_plain]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create user']);
}
?>
