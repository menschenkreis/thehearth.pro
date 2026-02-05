<?php
/**
 * The Hearth - Contact Form Handler
 *
 * Configure your email settings below, then upload to your server.
 */

// ============================================
// CONFIGURATION - Edit these values
// ============================================

$config = [
    // Where to send contact form submissions
    'to_email' => 'join@thehearth.pro',

    // From address (should be on your domain for best deliverability)
    'from_email' => 'noreply@thehearth.pro',

    // Email subject prefix
    'subject_prefix' => '[The Hearth]',
];

// ============================================
// Don't edit below unless you know what you're doing
// ============================================

header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get form data
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name, email, and message are required']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

// Sanitize inputs
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// Build email subject
$emailSubject = $config['subject_prefix'] . ' ';
$emailSubject .= !empty($subject) ? $subject : 'New Contact Form Submission';

// Build email body
$emailBody = "New contact form submission from The Hearth website:\n\n";
$emailBody .= "Name: {$name}\n";
$emailBody .= "Email: {$email}\n";
if (!empty($subject)) {
    $emailBody .= "Subject: {$subject}\n";
}
$emailBody .= "\nMessage:\n{$message}\n";
$emailBody .= "\n---\n";
$emailBody .= "Sent from: " . ($_SERVER['HTTP_REFERER'] ?? 'Unknown') . "\n";
$emailBody .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";
$emailBody .= "Time: " . date('Y-m-d H:i:s') . "\n";

// Email headers
$headers = [
    'From' => $config['from_email'],
    'Reply-To' => $email,
    'X-Mailer' => 'PHP/' . phpversion(),
    'Content-Type' => 'text/plain; charset=UTF-8',
];

// Convert headers array to string
$headerString = '';
foreach ($headers as $key => $value) {
    $headerString .= "{$key}: {$value}\r\n";
}

// Send email
$sent = mail($config['to_email'], $emailSubject, $emailBody, $headerString);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Message sent successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send message. Please try again later.']);
}
