<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/config.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    if (!isset($_GET['filename'])) {
        throw new Exception("Missing filename parameter.");
    }

    $sourceFile = basename($_GET['filename']);
    $sourcePath = FILES_PATH . $sourceFile;

    if (!file_exists($sourcePath)) {
        throw new Exception("File not found on server: " . $sourceFile);
    }

    $data = [];

    if (pathinfo($sourceFile, PATHINFO_EXTENSION) === 'csv') {
        
        if (($handle = fopen($sourcePath, 'r')) !== false) {
            while (($row = fgetcsv($handle)) !== false) {
                $data[] = $row;
            }
            fclose($handle);
        } else {
            throw new Exception("Failed to open CSV file: " . $sourceFile);
        }
    } else if (pathinfo($sourceFile, PATHINFO_EXTENSION) === 'xlsx') {
        // Read XLSX Data sheet
        $spreadsheet = IOFactory::load($sourcePath);
        $mainSheet = $spreadsheet->getSheet(0); // First sheet by default
        $data = $mainSheet->toArray();
    } else {
        throw new Exception("Unsupported file type: " . pathinfo($sourceFile, PATHINFO_EXTENSION));
    }

    
    $dataString = '';
    foreach ($data as $row) {
        $dataString .= implode(',', $row);
    }
    $fileHash = hash('sha256', $dataString);

    
    $spreadsheet = new Spreadsheet();

    
    $dataSheet = $spreadsheet->getActiveSheet();
    $dataSheet->setTitle('Data');
    $dataSheet->fromArray($data);

    
    $metaSheet = new Worksheet($spreadsheet, 'MetaData');
    $spreadsheet->addSheet($metaSheet);
    $metaSheet->setCellValue('A1', 'DataHash');
    $metaSheet->setCellValue('B1', $fileHash);

    
    $file_id = uniqid('file_', true);
    $metaSheet->setCellValue('A2', 'FileID');
    $metaSheet->setCellValue('B2', $file_id);

    $metaSheet->setSheetState(Worksheet::SHEETSTATE_VERYHIDDEN);

    
    $finalFilename = 'lostdevs_csir_downloaded.xlsx';

    $postData = [
        'file_id' => $file_id,
        'file_hash' => $fileHash,
        'filename' => $finalFilename
    ];

    $ch = curl_init(SUPABASE_URL . "/rest/v1/" . SUPABASE_TABLE);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "apikey: " . SUPABASE_API_KEY,
        "Authorization: Bearer " . SUPABASE_API_KEY,
        "Prefer: return=representation"
    ]);
    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception('Curl error: ' . curl_error($ch));
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 300) {
        throw new Exception("Supabase insert failed. HTTP code: $httpCode. Response: $response");
    }

    
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header("Content-Disposition: attachment;filename=\"$finalFilename\"");
    header('Cache-Control: max-age=0');

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');

} catch (Exception $e) {
    
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
?>
