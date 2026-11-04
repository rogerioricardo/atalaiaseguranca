<?php
/**
 * Atalaia Segurança - Whaticket Proxy Catch-All (PHP)
 * 
 * Captura requisições para /whaticket-proxy/* na hospedagem de produção (cPanel / Apache)
 * e encaminha para o backend do Whaticket na VPS sem restrições de CORS.
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-target-url, x-token');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Corpo da requisição vazio ou inválido']);
    exit;
}

// Determinar o caminho de destino
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);
// Ex: /whaticket-proxy/api/messages/send -> /api/messages/send
$subPath = preg_replace('#^.*?whaticket-proxy#', '', $path);
if (empty($subPath) || $subPath === '/') {
    $subPath = '/api/messages/send';
}

$targetUrl = 'https://whatsapp.alienmonitoramento.com.br/backend' . $subPath;

// Formatar número
if (isset($data['number'])) {
    $clean = preg_replace('/\D/', '', (string)$data['number']);
    if (strlen($clean) === 10 || strlen($clean) === 11) {
        $clean = '55' . $clean;
    } elseif (strpos($clean, '550') === 0) {
        $clean = '55' . substr($clean, 3);
    }
    $data['number'] = $clean;
}

$token = $data['token'] ?? 'HSYumH8GyDXc90Bb1ZcBoVMBjatynktt';
$apiKey = $data['apiKey'] ?? (!empty($_SERVER['HTTP_APIKEY']) ? $_SERVER['HTTP_APIKEY'] : 'Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp');
$authHeader = !empty($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : "Bearer {$token}";
if (strpos($authHeader, 'Bearer ') !== 0) {
    $authHeader = "Bearer {$token}";
}

$payload = json_encode([
    'number' => $data['number'] ?? '',
    'body' => $data['body'] ?? $data['message'] ?? ''
]);

$headers = [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($payload),
    'Authorization: ' . $authHeader,
    'User-Agent: Atalaia-Proxy/1.0'
];
if (!empty($apiKey)) {
    $headers[] = 'apikey: ' . $apiKey;
}

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 8);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($response !== false) {
        http_response_code($httpCode ?: 200);
        echo $response;
        exit;
    }
}

// Fallback stream
$opts = [
    'http' => [
        'method'  => 'POST',
        'header'  => implode("\r\n", $headers),
        'content' => $payload,
        'timeout' => 15,
        'ignore_errors' => true
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
];
$res = @file_get_contents($targetUrl, false, stream_context_create($opts));
if ($res !== false) {
    http_response_code(200);
    echo $res;
    exit;
}

http_response_code(502);
echo json_encode(['success' => false, 'error' => 'Falha ao conectar ao Whaticket']);
