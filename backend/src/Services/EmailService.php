<?php
namespace App\Services;

use App\Core\Database;
use App\Core\Env;
use PDO;

class EmailService {
    /**
     * Send transactional email using the configured driver
     */
    public static function send(string $toEmail, string $toName, string $subject, string $htmlBody, string $templateName = 'general', array $payload = []): bool {
        $driver = strtolower(Env::get('MAIL_DRIVER', 'log'));
        $fromAddress = Env::get('MAIL_FROM_ADDRESS', 'notifications@eduqueue.srcb.edu.ph');
        $fromName = Env::get('MAIL_FROM_NAME', 'SRCB Student Services');
        $apiKey = Env::get('MAIL_API_KEY', '');

        $status = 'sent';
        $errorMessage = null;
        $externalId = null;

        try {
            switch ($driver) {
                case 'resend':
                    $result = self::sendViaResend($apiKey, $fromAddress, $fromName, $toEmail, $subject, $htmlBody);
                    $externalId = $result['id'] ?? null;
                    break;

                case 'brevo':
                    $result = self::sendViaBrevo($apiKey, $fromAddress, $fromName, $toEmail, $toName, $subject, $htmlBody);
                    $externalId = $result['messageId'] ?? null;
                    break;

                case 'sendgrid':
                    $result = self::sendViaSendgrid($apiKey, $fromAddress, $fromName, $toEmail, $toName, $subject, $htmlBody);
                    $externalId = $result['id'] ?? null;
                    break;

                case 'smtp':
                    self::sendViaSmtp($fromAddress, $fromName, $toEmail, $toName, $subject, $htmlBody);
                    break;

                case 'log':
                default:
                    // Simulated transactional dispatch for development/testing
                    $logDir = dirname(__DIR__, 2) . '/storage/logs';
                    if (!is_dir($logDir)) {
                        @mkdir($logDir, 0777, true);
                    }
                    $logEntry = "[" . date('Y-m-d H:i:s') . "] TO: {$toEmail} ({$toName}) | SUBJECT: {$subject} | TEMPLATE: {$templateName}\nBODY:\n{$htmlBody}\n" . str_repeat('-', 80) . "\n";
                    @file_put_contents($logDir . '/mail.log', $logEntry, FILE_APPEND);
                    $externalId = 'log_' . uniqid();
                    break;
            }
        } catch (\Throwable $e) {
            $status = 'failed';
            $errorMessage = $e->getMessage();
            error_log("Email sending error to {$toEmail}: " . $e->getMessage());
        }

        // Always log to email_logs table for audit & traceability
        self::logEmail($toEmail, $toName, $subject, $templateName, $payload, $status, $errorMessage, $externalId);

        return $status === 'sent';
    }

    /**
     * Resend API Integration (https://resend.com/docs/api-reference/emails/send-email)
     */
    private static function sendViaResend(string $apiKey, string $from, string $fromName, string $to, string $subject, string $html): array {
        if (empty($apiKey)) {
            throw new \Exception("Resend API key is missing in environment (MAIL_API_KEY).");
        }

        $url = 'https://api.resend.com/emails';
        $data = [
            'from'    => "{$fromName} <{$from}>",
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html
        ];

        return self::executeCurlPost($url, $data, [
            "Authorization: Bearer {$apiKey}",
            "Content-Type: application/json"
        ]);
    }

    /**
     * Brevo API Integration (https://developers.brevo.com/reference/sendtransacemail)
     */
    private static function sendViaBrevo(string $apiKey, string $from, string $fromName, string $to, string $toName, string $subject, string $html): array {
        if (empty($apiKey)) {
            throw new \Exception("Brevo API key is missing in environment (MAIL_API_KEY).");
        }

        $url = 'https://api.brevo.com/v3/smtp/email';
        $data = [
            'sender'      => ['name' => $fromName, 'email' => $from],
            'to'          => [['email' => $to, 'name' => $toName]],
            'subject'     => $subject,
            'htmlContent' => $html
        ];

        return self::executeCurlPost($url, $data, [
            "api-key: {$apiKey}",
            "Content-Type: application/json"
        ]);
    }

    /**
     * SendGrid API Integration (https://docs.sendgrid.com/api-reference/mail-send/mail-send)
     */
    private static function sendViaSendgrid(string $apiKey, string $from, string $fromName, string $to, string $toName, string $subject, string $html): array {
        if (empty($apiKey)) {
            throw new \Exception("SendGrid API key is missing in environment (MAIL_API_KEY).");
        }

        $url = 'https://api.sendgrid.com/v3/mail/send';
        $data = [
            'personalizations' => [[
                'to' => [['email' => $to, 'name' => $toName]]
            ]],
            'from'    => ['email' => $from, 'name' => $fromName],
            'subject' => $subject,
            'content' => [['type' => 'text/html', 'value' => $html]]
        ];

        return self::executeCurlPost($url, $data, [
            "Authorization: Bearer {$apiKey}",
            "Content-Type: application/json"
        ]);
    }

    /**
     * Fallback standard SMTP / PHP mail()
     */
    private static function sendViaSmtp(string $from, string $fromName, string $to, string $toName, string $subject, string $html): void {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            "From: {$fromName} <{$from}>",
            "Reply-To: {$from}",
            'X-Mailer: PHP/' . phpversion()
        ];
        
        $sent = @mail($to, $subject, $html, implode("\r\n", $headers));
        if (!$sent) {
            throw new \Exception("PHP mail() delivery failed.");
        }
    }

    private static function executeCurlPost(string $url, array $data, array $headers): array {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local dev flexibility

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception("CURL HTTP error: {$error}");
        }

        if ($httpCode >= 400) {
            throw new \Exception("External Email API error (HTTP {$httpCode}): " . $response);
        }

        return json_decode($response, true) ?? ['status' => 'ok'];
    }

    private static function logEmail(string $toEmail, string $toName, string $subject, string $template, array $payload, string $status, ?string $errorMessage, ?string $externalId): void {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                INSERT INTO email_logs (recipient_email, recipient_name, subject, template, payload_json, status, error_message, external_message_id, created_at)
                VALUES (:to_email, :to_name, :subject, :template, :payload_json, :status, :error_msg, :ext_id, NOW())
            ");
            $stmt->execute([
                'to_email'     => $toEmail,
                'to_name'      => $toName,
                'subject'      => $subject,
                'template'     => $template,
                'payload_json' => !empty($payload) ? json_encode($payload, JSON_UNESCAPED_UNICODE) : null,
                'status'       => $status,
                'error_msg'    => $errorMessage,
                'ext_id'       => $externalId
            ]);
        } catch (\Exception $e) {
            error_log("Failed to insert email log: " . $e->getMessage());
        }
    }

    // -------------------------------------------------------------
    // TEMPLATE GENERATORS
    // -------------------------------------------------------------

    public static function templateWrapper(string $title, string $content): string {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{$title}</title>
    <style>
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: #1e3a8a; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0; font-size: 13px; color: #93c5fd; }
        .content { padding: 28px 24px; line-height: 1.6; font-size: 15px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
        .badge-approved { background: #dcfce7; color: #166534; }
        .badge-rejected { background: #fee2e2; color: #991b1b; }
        .badge-rescheduled { background: #fef3c7; color: #92400e; }
        .details-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 18px 0; border-radius: 4px; }
        .details-row { margin-bottom: 8px; font-size: 14px; }
        .details-row:last-child { margin-bottom: 0; }
        .details-label { font-weight: 600; color: #64748b; display: inline-block; width: 130px; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SRCB Student Services</h1>
            <p>St. Rita's College of Balingasag</p>
        </div>
        <div class="content">
            {$content}
        </div>
        <div class="footer">
            <p>&copy; 2026 St. Rita's College of Balingasag - Student Service Portal. This is an automated email; please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    public static function sendAppointmentApproved(array $appointment, array $student, array $service): bool {
        $dateFormatted = date('F d, Y', strtotime($appointment['appointment_date']));
        $timeFormatted = date('h:i A', strtotime($appointment['start_time'])) . ' - ' . date('h:i A', strtotime($appointment['end_time']));
        $location = htmlspecialchars($service['location_or_counter'] ?? 'Designated Office Window');
        $requirements = htmlspecialchars($service['requirements'] ?? 'Valid Student ID');
        $fullName = trim($student['first_name'] . (!empty($student['middle_name']) ? ' ' . $student['middle_name'] : '') . ' ' . $student['last_name']);

        $body = <<<HTML
        <h2>Hello {$student['first_name']},</h2>
        <p>Great news! Your student service appointment has been <span class="badge badge-approved">Approved</span>.</p>
        
        <div class="details-box">
            <div class="details-row"><span class="details-label">Appointment Code:</span> <strong>{$appointment['appointment_code']}</strong></div>
            <div class="details-row"><span class="details-label">Service:</span> {$service['name']}</div>
            <div class="details-row"><span class="details-label">Date:</span> {$dateFormatted}</div>
            <div class="details-row"><span class="details-label">Time Window:</span> {$timeFormatted}</div>
            <div class="details-row"><span class="details-label">Location / Counter:</span> {$location}</div>
        </div>

        <p><strong>Required Documents to Bring:</strong><br>{$requirements}</p>
        <p style="color: #64748b; font-size: 13px;">Please arrive 5–10 minutes before your scheduled time slot. Present your appointment code or student ID at the counter.</p>
HTML;

        $html = self::templateWrapper("Appointment Approved - {$appointment['appointment_code']}", $body);
        return self::send($student['email'], $fullName, "Appointment Confirmed: {$service['name']} ({$appointment['appointment_code']})", $html, 'appointment_approved', $appointment);
    }

    public static function sendAppointmentRejected(array $appointment, array $student, array $service, string $reason): bool {
        $dateFormatted = date('F d, Y', strtotime($appointment['appointment_date']));
        $reasonHtml = htmlspecialchars($reason);
        $fullName = trim($student['first_name'] . (!empty($student['middle_name']) ? ' ' . $student['middle_name'] : '') . ' ' . $student['last_name']);

        $body = <<<HTML
        <h2>Hello {$student['first_name']},</h2>
        <p>We regret to inform you that your appointment request for <strong>{$service['name']}</strong> on {$dateFormatted} has been <span class="badge badge-rejected">Declined</span>.</p>
        
        <div class="details-box" style="border-left-color: #ef4444;">
            <div class="details-row"><span class="details-label">Appointment Code:</span> <strong>{$appointment['appointment_code']}</strong></div>
            <div class="details-row"><span class="details-label">Service:</span> {$service['name']}</div>
            <div class="details-row"><span class="details-label">Reason for Decline:</span> <span style="color: #b91c1c;">{$reasonHtml}</span></div>
        </div>

        <p>You may log in to the Student Portal to review instructions and schedule a new appointment if needed.</p>
HTML;

        $html = self::templateWrapper("Appointment Update - {$appointment['appointment_code']}", $body);
        return self::send($student['email'], $fullName, "Update Regarding Your Appointment: {$appointment['appointment_code']}", $html, 'appointment_rejected', $appointment);
    }

    public static function sendAppointmentRescheduled(array $appointment, array $student, array $service, string $notes): bool {
        $dateFormatted = date('F d, Y', strtotime($appointment['appointment_date']));
        $timeFormatted = date('h:i A', strtotime($appointment['start_time'])) . ' - ' . date('h:i A', strtotime($appointment['end_time']));
        $notesHtml = htmlspecialchars($notes);
        $fullName = trim($student['first_name'] . (!empty($student['middle_name']) ? ' ' . $student['middle_name'] : '') . ' ' . $student['last_name']);

        $body = <<<HTML
        <h2>Hello {$student['first_name']},</h2>
        <p>Your appointment for <strong>{$service['name']}</strong> has been <span class="badge badge-rescheduled">Rescheduled</span> by the office administration.</p>
        
        <div class="details-box" style="border-left-color: #f59e0b;">
            <div class="details-row"><span class="details-label">Appointment Code:</span> <strong>{$appointment['appointment_code']}</strong></div>
            <div class="details-row"><span class="details-label">Service:</span> {$service['name']}</div>
            <div class="details-row"><span class="details-label">New Date:</span> <strong>{$dateFormatted}</strong></div>
            <div class="details-row"><span class="details-label">New Time Slot:</span> <strong>{$timeFormatted}</strong></div>
            <div class="details-row"><span class="details-label">Location:</span> {$service['location_or_counter']}</div>
            <div class="details-row"><span class="details-label">Admin Notes:</span> {$notesHtml}</div>
        </div>

        <p>If you cannot make this new schedule, please log into your student account to request a cancellation or different slot.</p>
HTML;

        $html = self::templateWrapper("Appointment Rescheduled - {$appointment['appointment_code']}", $body);
        return self::send($student['email'], $fullName, "Rescheduled: {$service['name']} ({$appointment['appointment_code']})", $html, 'appointment_rescheduled', $appointment);
    }
}
