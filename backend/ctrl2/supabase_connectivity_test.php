<?php
// supabase_connectivity_test.php

// Supabase Configuration
$supabase_url = "https://osfxpkpbodcbcofvuxgo.supabase.co";
$supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZnhwa3Bib2RjYmNvZnZ1eGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTMwNTgsImV4cCI6MjA4NTE2OTA1OH0.LSHNqf_7imj5oJH-MaZC3b-HGORouYFkZOU3CTt9DMM";

/**
 * Function to fetch data from Supabase and print headers/connectivity info
 */
function testSupabaseConnection($method, $endpoint, $data = null, $prefer = "return=representation") {
    global $supabase_url, $supabase_key;

    $url = "$supabase_url/rest/v1/$endpoint";
    echo "Testing Connection to: $url\n\n";

    $ch = curl_init($url);
    
    $headers = [
        "apikey: $supabase_key",
        "Authorization: Bearer $supabase_key",
        "Content-Type: application/json",
        "Prefer: $prefer"
    ];

    // Print Request Headers for debugging
    echo "--- Request Headers ---\n";
    foreach ($headers as $header) {
        echo $header . "\n";
    }
    echo "-----------------------\n\n";

    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($data) {
        $json_data = json_encode($data);
        echo "--- Request Body ---\n$json_data\n--------------------\n\n";
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
        echo "CURL Error: " . curl_error($ch) . "\n";
    }
    
    curl_close($ch);

    // Split headers and body
    $response_headers = substr($response, 0, $header_size);
    $response_body = substr($response, $header_size);

    echo "--- Response Headers ---\n";
    echo $response_headers;
    echo "------------------------\n\n";

    echo "--- Response Status ---\n";
    echo "Status Code: $status\n";
    echo "-----------------------\n\n";

    echo "--- Response Body ---\n";
    echo $response_body . "\n";
    echo "---------------------\n";

    return [$status, json_decode($response_body, true)];
}

// Test with a simple GET request (e.g., fetching users or just checking connection)
// Here we try to fetch 1 user to check connectivity
echo "Starting Supabase Connectivity Test...\n\n";
testSupabaseConnection("GET", "users?select=count", null, "count=exact");
// Alternative: testSupabaseConnection("GET", "users?limit=1"); 
?>
