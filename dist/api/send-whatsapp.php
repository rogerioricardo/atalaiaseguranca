<?php
/**
 * Atalaia Segurança - WhatsApp Whaticket Production Proxy
 * 
 * Permite que a aplicação React/Vite rodando a partir da pasta 'dist' envie
 * mensagens automáticas para a API Whaticket na VPS sem bloqueios de CORS,
 * sem erros de handshake SSL no browser e sem depender do servidor Vite de desenvolvimento.
 */

// Configuração de CORS para permitir requisições da própria aplicação
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, apikey, x-target-url, x-token');
header('Access-Control-Max-Age: 86400');

// Resposta imediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// Apenas aceita método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido. Utilize POST.']);
    exit;
}

// Leitura do corpo JSON da requisição
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Payload JSON inválido ou vazio.']);
    exit;
}

// Obter número e corpo da mensagem
$number = $data['number'] ?? $data['phone'] ?? '';
$body = $data['body'] ?? $data['message'] ?? '';

if (empty($number) || empty($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parâmetros "number" e "body" são obrigatórios.']);
    exit;
}

// Formatação do número de telefone brasileiro
$cleanNumber = preg_replace('/\D/', '', (string)$number);
if (strlen($cleanNumber) === 10 || strlen($cleanNumber) === 11) {
    $cleanNumber = '55' . $cleanNumber;
} elseif (strpos($cleanNumber, '550') === 0) {
    $cleanNumber = '55' . substr($cleanNumber, 3);
}

// Endpoint Whaticket padrão
$defaultUrl = 'https://whatsapp.alienmonitoramento.com.br:443/backend/api/messages/send';
$targetUrl = !empty($data['url']) ? $data['url'] : (!empty($_SERVER['HTTP_X_TARGET_URL']) ? $_SERVER['HTTP_X_TARGET_URL'] : $defaultUrl);

// Se a URL contiver porta :443 redundante com https, podemos normalizar ou manter
$token = !empty($data['token']) ? $data['token'] : (!empty($_SERVER['HTTP_X_TOKEN']) ? $_SERVER['HTTP_X_TOKEN'] : 'HSYumH8GyDXc90Bb1ZcBoVMBjatynktt');
$apiKey = !empty($data['apiKey']) ? $data['apiKey'] : (!empty($_SERVER['HTTP_APIKEY']) ? $_SERVER['HTTP_APIKEY'] : 'Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp');

// Cabeçalho de autorização
$authHeader = !empty($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : "Bearer {$token}";
if (strpos($authHeader, 'Bearer ') !== 0 && !empty($token)) {
    $authHeader = "Bearer {$token}";
}

// Montagem do payload a ser enviado à API Whaticket
$postData = json_encode([
    'number' => $cleanNumber,
    'body' => $body
]);

$headers = [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($postData),
    'Authorization: ' . $authHeader,
    'User-Agent: Atalaia-Production-Proxy/1.0'
];

if (!empty($apiKey)) {
    $headers[] = 'apikey: ' . $apiKey;
}

// 1. Tentar envio via cURL (mais rápido e com suporte a SNI e ignorar alertas SSL inválidos)
if (function_exists('curl_init')) {
    $ch = curl_init();
    
    // Normalização da URL para cURL (tenta com a porta informada e sem ela se falhar)
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 8);
    // Ignora certificados autoassinados ou alertas SNI transitórios
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response !== false && $httpCode >= 200 && $httpCode < 500) {
        http_response_code($httpCode);
        echo $response;
        exit;
    }

    // Se falhou com a URL original com :443, tenta sem :443
    if (strpos($targetUrl, ':443') !== false) {
        $cleanUrl = str_replace(':443', '', $targetUrl);
        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_URL, $cleanUrl);
        curl_setopt($ch2, CURLOPT_POST, true);
        curl_setopt($ch2, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch2, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch2, CURLOPT_CONNECTTIMEOUT, 8);
        curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch2, CURLOPT_SSL_VERIFYHOST, 0);

        $response2 = curl_exec($ch2);
        $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        curl_close($ch2);

        if ($response2 !== false && $httpCode2 >= 200 && $httpCode2 < 500) {
            http_response_code($httpCode2);
            echo $response2;
            exit;
        }
    }
}

// 2. Fallback via file_get_contents com stream_context
$opts = [
    'http' => [
        'method'  => 'POST',
        'header'  => implode("\r\n", $headers),
        'content' => $postData,
        'timeout' => 15,
        'ignore_errors' => true
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
];

$context = stream_context_create($opts);
$streamResult = @file_get_contents($targetUrl, false, $context);

if ($streamResult !== false) {
    http_response_code(200);
    echo $streamResult;
    exit;
}

// Se todas as tentativas falharam
http_response_code(502);
echo json_encode([
    'success' => false,
    'error' => 'Falha ao conectar com o servidor Whaticket: ' . ($curlError ?? 'Timeout ou erro de rede no servidor de hospedagem.')
]);
