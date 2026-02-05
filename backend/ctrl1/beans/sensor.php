<?php
class Sensor {
    public static function fetchMetadata($sensor_unique_id) {
        $url = $GLOBALS['supabase_metadata_url'] . "?select=*&id=eq." . intval($sensor_unique_id);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: {$GLOBALS['supabase_api_key']}",
            "Authorization: Bearer {$GLOBALS['supabase_api_key']}",
            "Accept: application/json"
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        $data = json_decode($response, true);
        if (!$data || !isset($data[0])) {
            ErrorHandler::handle("LDNPL404", "Sensor metadata not found for id: $sensor_unique_id", $GLOBALS['supabase_audit_url'], $GLOBALS['supabase_api_key'], "sensor_metadata", $sensor_unique_id);
            Authenticator::send_response(404, ["error_code" => "LDNPL404", "message" => "Sensor metadata not found"]);
        }
        return $data[0];
    }
}
?>
