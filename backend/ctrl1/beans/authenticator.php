<?php
class Authenticator {
    public static function enforceHTTPS() {
        // Disabled for Local Testing:
        // if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
        //     ErrorHandler::handle("LDNPL105", "Data sent over HTTP instead of HTTPS", $GLOBALS['supabase_audit_url'], $GLOBALS['supabase_api_key'], "Data_Main", "", ["description" => "Attempted HTTP"]);
        //     self::send_response(403, ["error_code" => "LDNPL105", "message" => "HTTPS Required"]);
        // }
    }
    public static function checkSecret($secret) {
        global $valid_secret;
        if (!isset($secret) || $secret !== $valid_secret) {
            ErrorHandler::handle("LDNPL106", "Invalid Secret Key", $GLOBALS['supabase_audit_url'], $GLOBALS['supabase_api_key'], "Data_Main", "", ["description" => "Invalid secret: $secret"]);
            self::send_response(403, ["error_code" => "LDNPL106", "message" => "Invalid Secret Key"]);
        }
    }
    public static function send_response($status, $data = []) {
        http_response_code($status);
        echo json_encode($data);
        exit();
    }
}
?>
