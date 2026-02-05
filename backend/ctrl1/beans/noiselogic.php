<?php
class Noiselogic {
    // Calculate Z-score and detect spike/noise
    public static function checkZScore($current_value, $last_values, $spike_thresh = 3.5, $noise_thresh = 2.5) {
        if (!is_array($last_values) || count($last_values) < 2) {
            // Not enough data to compute z-score
            return ['unknown', 'unknown'];
        }
        $mean = array_sum($last_values) / count($last_values);
        $sum = 0;
        foreach ($last_values as $v) $sum += pow($v - $mean, 2);
        $stddev = sqrt($sum / (count($last_values) - 1));
        $z = $stddev > 0 ? abs(($current_value - $mean) / $stddev) : 0;
        $spike = $z > $spike_thresh ? "yes" : "no";
        $noise = ($z > $noise_thresh && $spike === "no") ? "yes" : "no";
        return [$noise, $spike];
    }

    // Main entry point: sensor_unique_id, supabase params, current value
    public static function checkHybrid($sensor_unique_id, $supabase_url, $supabase_api_key, $current_temp, $current_humidity) {
        // 1. Fetch last N temperature values for this sensor from Supabase
        $last_temps = self::fetch_last_values_supabase($sensor_unique_id, $supabase_url, $supabase_api_key, "Temperature(K)");
        // You can extend for humidity as needed
        return self::checkZScore($current_temp, $last_temps);
    }

    // Fetch last N values for a column from Supabase for a sensor
    private static function fetch_last_values_supabase($sensor_unique_id, $supabase_url, $supabase_api_key, $column = "Temperature(K)", $window_size = 20) {
        // Compose the Supabase REST query for last N values for this sensor
        // Example: /rest/v1/Data_Main?sensor_unique_id=eq.1&select=Temperature(K)&order=receiving_date.desc&limit=20
        $url = $supabase_url . "?sensor_unique_id=eq.$sensor_unique_id&select=$column&order=receiving_date.desc&limit=$window_size";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: $supabase_api_key",
            "Authorization: Bearer $supabase_api_key",
            "Content-Type: application/json"
        ]);
        $result = curl_exec($ch);
        curl_close($ch);

        if ($result === false) return [];
        $arr = json_decode($result, true);
        if (!is_array($arr)) return [];

        // Get just the values as a numeric array, oldest first
        $values = [];
        foreach (array_reverse($arr) as $row) {
            if (isset($row[$column]) && is_numeric($row[$column])) {
                $values[] = floatval($row[$column]);
            }
        }
        return $values;
    }
}
?>
