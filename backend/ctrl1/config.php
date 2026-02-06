<?php
$base_url = "https://osfxpkpbodcbcofvuxgo.supabase.co";

$supabase_url          = $base_url . "/rest/v1/data_main";
$supabase_audit_url    = $base_url . "/rest/v1/audit_trail";
$supabase_metadata_url = $base_url . "/rest/v1/sensor_metadata";

$supabase_api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZnhwa3Bib2RjYmNvZnZ1eGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTMwNTgsImV4cCI6MjA4NTE2OTA1OH0.LSHNqf_7imj5oJH-MaZC3b-HGORouYFkZOU3CTt9DMM";

$firebase_url = "https://sensor-realtime-data-default-rtdb.asia-southeast1.firebasedatabase.app/";
$firebase_api_key = "AIzaSyD-dMlDF2VteWbsTOJQVd8AK5FHYCWne94";

$valid_secret = "sb_secret_CQrgzzNmsh8hfZGYDpOAzQ_MCj0SvF-";

$required_fields = ['sensor_unique_id', 'Temperature(K)', 'humidity(%)', 'sensor_longitude', 'sensor_latitude', 'receiving_date'];
?>
