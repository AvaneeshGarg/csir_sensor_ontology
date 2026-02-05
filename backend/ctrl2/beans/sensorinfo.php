<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');


$supabase_url = 'https://wfjydarftmzffohawlaj.supabase.co/rest/v1/sensor_metadata'; 
$supabase_api_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmanlkYXJmdG16ZmZvaGF3bGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4OTI3OTIsImV4cCI6MjA2MzQ2ODc5Mn0.6_3uUuiHfw7h0ttVKE-LsA-B4yS9CLu6niFCEcP1XKI'; 


$options = [
    "http" => [
        "header"  => "apikey: $supabase_api_key\r\nAuthorization: Bearer $supabase_api_key\r\n",
        "method"  => "GET"
    ]
];

$context  = stream_context_create($options);
$response = file_get_contents($supabase_url, false, $context);

if ($response === FALSE) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to fetch data from Supabase"]);
    exit;
}


echo $response;
