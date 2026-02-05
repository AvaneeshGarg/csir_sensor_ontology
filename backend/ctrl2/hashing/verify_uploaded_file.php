<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/config.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $filePath = $_FILES['file']['tmp_name'];
    $filename = $_FILES['file']['name'];

    try {
        $spreadsheet = IOFactory::load($filePath);

        
        $metaSheet = $spreadsheet->getSheetByName('MetaData');
        if ($metaSheet === null) {
            echo json_encode(['error' => 'MetaData sheet not found in uploaded file']);
            exit;
        }

        $hashFromMeta = $metaSheet->getCell('B1')->getValue();
        $fileIdFromMeta = $metaSheet->getCell('B2')->getValue();

        if (!$fileIdFromMeta) {
            echo json_encode(['error' => 'FileID not found in MetaData sheet']);
            exit;
        }

        
        $mainSheet = $spreadsheet->getSheetByName('Data');
        if ($mainSheet === null) {
            echo json_encode(['error' => 'Data sheet not found in uploaded file']);
            exit;
        }

        $data = $mainSheet->toArray();
        $dataString = '';
        foreach ($data as $row) {
            $dataString .= implode(',', $row);
        }
        $computedHash = hash('sha256', $dataString);

        
        $ch = curl_init(SUPABASE_URL . "/rest/v1/" . SUPABASE_TABLE . "?file_id=eq.$fileIdFromMeta");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: " . SUPABASE_API_KEY,
            "Authorization: Bearer " . SUPABASE_API_KEY,
            "Accept: application/json"
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        $dataFromSupabase = json_decode($response, true);
        $storedHash = $dataFromSupabase[0]['file_hash'] ?? null;

        if (!$storedHash) {
            echo json_encode(['error' => 'File ID not found in Supabase', 'file_id' => $fileIdFromMeta]);
            exit;
        }

        
        $valid1 = ($computedHash === $hashFromMeta);
        $valid2 = ($computedHash === $storedHash);

        echo json_encode([
            'computed_hash' => $computedHash,
            'hidden_sheet_hash' => $hashFromMeta,
            'supabase_stored_hash' => $storedHash,
            'file_id_from_hidden_sheet' => $fileIdFromMeta,
            'valid_hidden_sheet' => $valid1,
            'valid_supabase' => $valid2,
            'final_valid' => ($valid1 && $valid2)
        ]);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Exception: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['error' => 'Invalid request. POST with file required.']);
}
?>
