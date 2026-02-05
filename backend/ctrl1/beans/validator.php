<?php
class Validator {
    public static function validateFields($post, $required_fields) {
        foreach ($required_fields as $field) {
            if (!isset($post[$field]) || $post[$field] === '') {
                ErrorHandler::handle("LDNPL102", "Missing field: $field", $GLOBALS['supabase_audit_url'], $GLOBALS['supabase_api_key'], "Data_Main", "", ["field_name" => $field]);
                Authenticator::send_response(422, ["error_code" => "LDNPL102", "message" => "Missing field: $field"]);
            }
        }
    }
    public static function sanitize($arr) {
        $clean = [];
        foreach ($arr as $k => $v) {
            $clean[$k] = htmlspecialchars(strip_tags(trim($v)));
        }
        return $clean;
    }
}
?>
