<?php
/**
 * MeraSIF — Lead capture endpoint
 *
 * POST (JSON or form-encoded): name, phone, [email, city, investment, message,
 *   source, fund, score, corpus, horizon, calc] + honeypot field "website" (must be empty).
 *
 * On success: appends the lead to sif-leads.json (server-side, never lost) and
 * emails it to the desk. Returns {"ok":true}. The front-end then continues its
 * WhatsApp handoff — so a lead is captured even if the visitor never sends the
 * WhatsApp message.
 *
 * Owner access:  sif-lead.php?t=<token>&a=list   → recent leads (JSON)
 *                sif-lead.php?t=<token>&a=count  → total count
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.merasif.com');
header('Cache-Control: no-store');

$LEADS_FILE = __DIR__ . '/sif-leads.json';
$NOTIFY_TO  = 'wecare@trustner.in';
$TOKEN      = 'sif2026deploykey';

// ---------- owner views ----------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['t']) && hash_equals($TOKEN, (string)$_GET['t'])) {
        $all = json_decode(@file_get_contents($LEADS_FILE), true);
        if (!is_array($all)) $all = array();
        $a = $_GET['a'] ?? 'count';
        if ($a === 'list') {
            echo json_encode(array('count' => count($all), 'leads' => array_slice(array_reverse($all), 0, 100)), JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(array('count' => count($all)));
        }
        exit;
    }
    echo json_encode(array('ok' => true, 'service' => 'merasif-lead'));
    exit;
}

// ---------- capture ----------
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

// honeypot: bots fill every field; humans never see this one
if (!empty($data['website'])) { echo json_encode(array('ok' => true)); exit; }

$name  = trim(substr((string)($data['name']  ?? ''), 0, 120));
$phone = trim(substr((string)($data['phone'] ?? ''), 0, 24));
if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) < 8) {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'error' => 'name and a valid phone are required'));
    exit;
}

$lead = array(
    'ts'         => date('c'),
    'name'       => $name,
    'phone'      => $phone,
    'email'      => trim(substr((string)($data['email']      ?? ''), 0, 160)),
    'city'       => trim(substr((string)($data['city']       ?? ''), 0, 80)),
    'investment' => trim(substr((string)($data['investment'] ?? ''), 0, 80)),
    'message'    => trim(substr((string)($data['message']    ?? ''), 0, 1500)),
    'source'     => trim(substr((string)($data['source']     ?? ''), 0, 200)),
    'fund'       => trim(substr((string)($data['fund']       ?? ''), 0, 80)),
    'quiz'       => trim(substr((string)($data['quiz']       ?? ''), 0, 400)),
    'calc'       => trim(substr((string)($data['calc']       ?? ''), 0, 400)),
    'ip'         => substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45),
    'ua'         => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200),
);

// soft rate-limit: max 5 captures per IP per hour
$all = json_decode(@file_get_contents($LEADS_FILE), true);
if (!is_array($all)) $all = array();
$hourAgo = time() - 3600; $recent = 0;
foreach (array_slice($all, -50) as $l) {
    if (($l['ip'] ?? '') === $lead['ip'] && strtotime($l['ts'] ?? '') > $hourAgo) $recent++;
}
if ($recent >= 5) { echo json_encode(array('ok' => true)); exit; }

$all[] = $lead;
$fp = fopen($LEADS_FILE, 'c+');
if ($fp && flock($fp, LOCK_EX)) {
    ftruncate($fp, 0);
    fwrite($fp, json_encode($all, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    flock($fp, LOCK_UN); fclose($fp);
}

// notify the desk (best-effort; capture already persisted above)
$body = "New SIF lead via MeraSIF.com\n\n";
foreach (array('name','phone','email','city','investment','fund','message','quiz','calc','source','ts') as $k) {
    if ($lead[$k] !== '') $body .= str_pad(ucfirst($k), 12) . ": " . $lead[$k] . "\n";
}
$body .= "\n— Auto-captured by sif-lead.php (lead is also stored in sif-leads.json)";
@mail($NOTIFY_TO,
      'New SIF Lead: ' . $name . ($lead['investment'] ? ' · ' . $lead['investment'] : ''),
      $body,
      "From: leads@merasif.com\r\nReply-To: " . ($lead['email'] ?: $NOTIFY_TO) . "\r\n");

echo json_encode(array('ok' => true));
