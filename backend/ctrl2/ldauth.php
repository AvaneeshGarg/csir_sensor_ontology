<?php
session_start();

/* -- REMOVING THESE TO HANDLE CORS PROBLEM

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

*/

require_once __DIR__ . '/../cors_middleware.php';

header('Content-Type: application/json');

$supabase_url = "https://osfxpkpbodcbcofvuxgo.supabase.co";
$supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZnhwa3Bib2RjYmNvZnZ1eGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTMwNTgsImV4cCI6MjA4NTE2OTA1OH0.LSHNqf_7imj5oJH-MaZC3b-HGORouYFkZOU3CTt9DMM";


// function fetchSupabase($method, $endpoint, $data = null, $prefer = "return=representation") {
//     global $supabase_url, $supabase_key;
//     $ch = curl_init("$supabase_url/rest/v1/$endpoint");
//     $headers = [
//         "apikey: $supabase_key",
//         "Authorization: Bearer $supabase_key",
//         "Content-Type: application/json",
//         "Prefer: $prefer"
//     ];
//     curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
//     curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
//     if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
//     curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
//     $result = curl_exec($ch);
//     $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//     curl_close($ch);
//     echo $result;
//     echo $status;
//     return [$status, json_decode($result, true)];
// }


/* NEW UPDATED FUNCTION */
function fetchSupabase($method, $endpoint, $data = null, $prefer = "return=representation") {
    global $supabase_url, $supabase_key;

    $url = "$supabase_url/rest/v1/$endpoint";
    // Log to error log instead of echoing to output (which breaks JSON)
    error_log("Supabase Connection: $url");

    $ch = curl_init($url);
    
    $headers = [
        "apikey: $supabase_key",
        "Authorization: Bearer $supabase_key",
        "Content-Type: application/json",
        "Prefer: $prefer"
    ];

    // Log Headers
    // error_log("Headers: " . implode(", ", $headers));

    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($data) {
        $json_data = json_encode($data);
        error_log("Payload: $json_data");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
    }
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // Enable capturing response headers
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    // Execute
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    
    if (curl_errno($ch)) {
        error_log("CURL Error: " . curl_error($ch));
    }
    
    curl_close($ch);

    // Split headers and body
    $response_headers = substr($response, 0, $header_size);
    $response_body = substr($response, $header_size);

    error_log("Supabase Response [$status]: $response_body");

    return [$status, json_decode($response_body, true)];
}



function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}
function generateToken($length = 48) {
    return bin2hex(random_bytes($length));
}

$action = $_POST['action'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$fullName = $_POST['fullName'] ?? '';

if ($action === 'register') {
    if (!$email || !$password) {
        http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing parameters']); exit;
    }
    list($status, $existing) = fetchSupabase("GET", "users?email=eq.$email");
    if (!empty($existing)) {
        http_response_code(409); echo json_encode(['success' => false, 'error' => 'Email already exists']); exit;
    }
    $password_hash = hashPassword($password);
    $now = gmdate('Y-m-d\TH:i:s\Z');
    $userData = [
        'email' => $email,
        'password_hash' => $password_hash,
        'full_name' => $fullName,
        'created_at' => $now,
        'updated_at' => $now,
        'is_active' => true,
        'login_attempts' => 0
    ];
    list($status, $resp) = fetchSupabase("POST", "users", $userData);
    if ($status == 201 || $status == 200) {
        $_SESSION['user'] = ['email' => $email, 'name' => $fullName, 'role' => 'user'];
        echo json_encode(['success' => true, 'email' => $email, 'name' => $fullName]);
    } else {
        http_response_code(500); echo json_encode(['success' => false, 'error' => 'Registration failed']);
    }
    exit;
}

if ($action === 'login') {
    if (!$email || !$password) {
        http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing parameters']); exit;
    }
    list($status, $rows) = fetchSupabase("GET", "users?email=eq.$email");
    if (empty($rows)) {
        http_response_code(401); echo json_encode(['success' => false, 'error' => 'Invalid credentials']); exit;
    }
    $user = $rows[0];
    if (!$user['is_active']) {
        http_response_code(403); echo json_encode(['success' => false, 'error' => 'Account is inactive']); exit;
    }
    if (!verifyPassword($password, $user['password_hash'])) {
        $attempts = ($user['login_attempts'] ?? 0) + 1;
        $now = gmdate('Y-m-d\TH:i:s\Z');
        fetchSupabase("PATCH", "users?id=eq.{$user['id']}", [
            'login_attempts' => $attempts,
            'last_failed_login' => $now,
            'updated_at' => $now
        ]);
        http_response_code(401); echo json_encode(['success' => false, 'error' => 'Invalid credentials']); exit;
    }
    $now = gmdate('Y-m-d\TH:i:s\Z');
    fetchSupabase("PATCH", "users?id=eq.{$user['id']}", [
        'last_login' => $now,
        'login_attempts' => 0,
        'updated_at' => $now
    ]);
    $_SESSION['user'] = ['email' => $email, 'name' => $user['full_name'], 'role' => $user['role'] ?? 'user'];
    echo json_encode([
        'success' => true,
        'email' => $email,
        'name' => $user['full_name'],
        'role' => $user['role'] ?? 'user',
        'last_login' => $now
    ]);
    exit;
}

if ($action === 'logout') {
    session_unset();
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'forgot') {
    $email = $_POST['email'] ?? '';
    if (!$email) {
        http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing email']); exit;
    }
    list($status, $users) = fetchSupabase("GET", "users?email=eq.$email");
    if (empty($users)) {
        http_response_code(200); echo json_encode(['success' => true, 'message' => 'If this email exists, a reset link will be sent.']); exit;
    }
    $user = $users[0];
    $reset_token = generateToken(24);
    $reset_expiry = gmdate('Y-m-d\TH:i:s\Z', time() + 60*60*2);
    fetchSupabase("PATCH", "users?id=eq.{$user['id']}", [
        'reset_token' => $reset_token,
        'reset_token_expiry' => $reset_expiry,
        'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
    ]);
    $reset_link = "https://lostdevs.io/ctrl2/reset.html?token=" . urlencode($reset_token);

    $to = $email;
    $subject = "Reset Your SensorSync Portal Password";
    $message = "Hello,\n\nWe received a password reset request for your SensorSync Portal account.\n\n";
    $message .= "To reset your password, click the link below (or copy and paste it into your browser):\n\n";
    $message .= "$reset_link\n\nThis link will expire in 2 hours.\nIf you did not request this, just ignore this email.\n\nRegards,\nSensorSync Portal";
    $headers = "From: no-reply@lostdevs.io\r\nReply-To: no-reply@lostdevs.io\r\n";
    mail($to, $subject, $message, $headers);

    echo json_encode([
        'success' => true,
        'message' => 'If this email exists, a reset link will be sent to it.'
    ]);
    exit;
}

if ($action === 'reset') {
    $token = $_POST['token'] ?? '';
    $newPassword = $_POST['newPassword'] ?? '';
    if (!$token || !$newPassword) {
        http_response_code(400); echo json_encode(['success' => false, 'error' => 'Missing token or password']); exit;
    }
    list($status, $users) = fetchSupabase("GET", "users?reset_token=eq.$token");
    if (empty($users)) {
        http_response_code(400); echo json_encode(['success' => false, 'error' => 'Invalid or expired reset link.']); exit;
    }
    $user = $users[0];
    $now = gmdate('Y-m-d\TH:i:s\Z');
    if (empty($user['reset_token_expiry']) || $user['reset_token_expiry'] < $now) {
        http_response_code(400); echo json_encode(['success' => false, 'error' => 'Reset link has expired.']); exit;
    }
    $password_hash = hashPassword($newPassword);
    $updateData = [
        'password_hash' => $password_hash,
        'reset_token' => null,
        'reset_token_expiry' => null,
        'updated_at' => $now
    ];
    list($status2, $resp) = fetchSupabase("PATCH", "users?id=eq.{$user['id']}", $updateData);
    if ($status2 == 200 || $status2 == 204) {
        echo json_encode(['success' => true, 'message' => 'Password reset successful! You can now log in.']);
    } else {
        http_response_code(500); echo json_encode(['success' => false, 'error' => 'Failed to update password.']);
    }
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Invalid action']);
