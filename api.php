<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$prompt = $_GET['prompt'] ?? '';
if (empty($prompt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Prompt is required']);
    exit;
}

// Hide the actual API endpoint
$api_url = 'https://duck.gpt-api.workers.dev/chat/';
$params = [
    'prompt' => $prompt,
    'model' => 'gpt-4o-mini'
];

$ch = curl_init($api_url . '?' . http_build_query($params));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status === 200) {
    echo $response;
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'response' => 'Error processing request'
    ]);
}
