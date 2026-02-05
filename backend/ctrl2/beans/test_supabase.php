<?php
include 'config.php';

function test_supabase($url, $key, $name) {
    echo "<h2>Testing $name</h2>";
    echo "URL: $url<br>";
    
    $ch = curl_init();
    // Try to hit the root or a table.
    curl_setopt($ch, CURLOPT_URL, $url . '/rest/v1/');
    
    $headers = [
        "apikey: $key",
        "Authorization: Bearer $key"
    ];
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "<div style='color:red'>Connection Failed: $error</div>";
    } else {
        echo "<div>HTTP Code: $httpcode</div>";
        echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "</pre>";
        
        if ($httpcode >= 200 && $httpcode < 300) {
            echo "<div style='color:green'><strong>Success! Connected to Supabase.</strong></div>";
        } else {
            echo "<div style='color:orange'>Connected but received error status. Check API Key or Table permissions.</div>";
        }
    }
    echo "<hr>";
}

if (isset($supabaseUrl) && isset($supabaseKey)) {
    test_supabase($supabaseUrl, $supabaseKey, "Config 2 (wfjy...)");
} else {
    echo "Variables from config.php not found.";
}
?>
