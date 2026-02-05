<?php
// cors_middleware.php
// Centralized CORS handling for Supabase/XAMPP/Vite setup

// 1. Remove potentially conflicting headers set by Server/Defaults
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Credentials');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');

// 2. Set Dynamic Origin
// If an Origin header is present, allow it.
// This is safer than '*' because it allows credentials (cookies).
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cache for 1 day
} else {
    // Fallback for non-browser testing tools if needed, or just default to * (without credentials)
    // But usually for APIs interacting with a browser, we stick to the above.
}

// 3. Handle Preflight Options Request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS");         

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    // End execution immediately for OPTIONS requests
    exit(0);
}

// 4. Set Content-Type generally (can be overridden later if needed)
header('Content-Type: application/json');
?>
