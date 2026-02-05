<?php
// Set timezone to IST for all date/time operations
date_default_timezone_set('Asia/Kolkata');

class ErrorHandler {
    private static $log_file = 'error.log';

    public static function logErrorToFile($error_code, $message, $context = []) {
        // Use IST time
        $date = date('Y-m-d H:i:s');
        $entry = "[$date IST] $error_code: $message";
        if (!empty($context)) $entry .= ' | Context: ' . json_encode($context);
        file_put_contents(self::$log_file, $entry.PHP_EOL, FILE_APPEND);
    }

    public static function logErrorToAuditTrail($supabase_audit_url, $supabase_api_key, $error_code, $message, $table_name, $record_id, $field_name = '', $old_value = '', $new_value = '', $changed_by = '', $ip_address = '', $description = '') {
        $data = [
            "action"      => $error_code,
            "table_name"  => $table_name,
            "record_id"   => $record_id,
            "field_name"  => $field_name,
            "old_value"   => $old_value,
            "new_value"   => $new_value,
            "changed_by"  => $changed_by,
            // "changed_on" uses ISO 8601 in IST
            "changed_on"  => date('c'),
            "ip_address"  => $ip_address,
            "description" => $description ?: $message
        ];
        $ch = curl_init($supabase_audit_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "apikey: $supabase_api_key",
            "Authorization: Bearer $supabase_api_key"
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_exec($ch);
        curl_close($ch);
    }

    public static function handle($error_code, $message, $supabase_audit_url, $supabase_api_key, $table_name, $record_id, $context = []) {
        self::logErrorToFile($error_code, $message, $context);
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        self::logErrorToAuditTrail(
            $supabase_audit_url,
            $supabase_api_key,
            $error_code,
            $message,
            $table_name,
            $record_id,
            $context['field_name'] ?? '',
            $context['old_value'] ?? '',
            $context['new_value'] ?? '',
            $context['changed_by'] ?? '',
            $ip_address,
            $context['description'] ?? ''
        );
    }
}
?>
