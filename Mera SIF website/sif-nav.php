<?php
/**
 * MeraSIF — SIF NAV & Returns engine v3  (Regular-Growth plans only)
 *
 *  Default      → JSON summary of all funds.
 *  ?fund=<id>   → that fund's record + its accrued official NAV history (for charts).
 *
 * Data sources (all real, nothing indicative):
 *  • OFFICIAL NAV — AMFI's SIF NAV API (amfiindia.com/api/sif-latest-nav), matched per
 *    fund by its official scheme code ('sd', e.g. SIF-11, Regular-Growth row). Cached 4h.
 *    SI is exact: nav / face − 1 (face value per fund: ₹10, or ₹1000 for Diviniti/Sapphire).
 *  • The engine snapshots each official NAV once per trading day into sif-nav-history.json,
 *    so 1D / 5D (and eventually 1M/3M) compute from official data automatically.
 *  • 1M / 3M — computed from accrued official history once the window is covered;
 *    until then, the Value Research figures from sif-nav-data.json are shown (retsrc 'vr').
 *  • AUM / risk band / TER — Value Research (Regular plan).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=1800');

$DIR        = __DIR__;
$DATA_FILE  = $DIR . '/sif-nav-data.json';
$HIST_FILE  = $DIR . '/sif-nav-history.json';
$CACHE_FILE = $DIR . '/sif-nav-cache.json';
$AMFI_RAW   = $DIR . '/amfi-sif-raw.json';
$CACHE_TTL  = 4 * 3600;

$wantFund = isset($_GET['fund']) ? preg_replace('/[^a-z0-9-]/', '', $_GET['fund']) : null;

if (!$wantFund && !isset($_GET['force']) && file_exists($CACHE_FILE) && (time() - filemtime($CACHE_FILE)) < $CACHE_TTL) {
    echo file_get_contents($CACHE_FILE);
    exit;
}

$seed = json_decode(@file_get_contents($DATA_FILE), true);
if (!$seed || empty($seed['funds'])) { echo json_encode(array('error' => 'no-data', 'funds' => array())); exit; }
$funds = $seed['funds'];
$VRASOF = isset($seed['asOf']) ? $seed['asOf'] : null;

function ms_get($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 12, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; MeraSIF-NAVBot/2.0; +https://www.merasif.com)',
        ));
        $r = curl_exec($ch); curl_close($ch); return $r ? $r : false;
    }
    return @file_get_contents($url);
}
function pct($now, $past) { return (!$past || $past == 0) ? null : round(($now / $past - 1) * 100, 2); }

// ---- official AMFI snapshot (cached 4h; falls back to last good copy) ----
$amfi = null;
if (file_exists($AMFI_RAW) && (time() - filemtime($AMFI_RAW)) < $CACHE_TTL) {
    $amfi = json_decode(@file_get_contents($AMFI_RAW), true);
}
if (!$amfi) {
    $raw = ms_get('https://www.amfiindia.com/api/sif-latest-nav?type=');
    $j = $raw ? json_decode($raw, true) : null;
    if ($j && !empty($j['data'])) { $amfi = $j; @file_put_contents($AMFI_RAW, $raw); }
    elseif (file_exists($AMFI_RAW)) { $amfi = json_decode(@file_get_contents($AMFI_RAW), true); }
}

// flatten official rows by scheme code
$bySd = array();
if ($amfi && !empty($amfi['data'])) {
    foreach ($amfi['data'] as $t) foreach (($t['categories'] ?? array()) as $c)
        foreach (($c['groups'] ?? array()) as $g) foreach (($g['schemes'] ?? array()) as $s) {
            if (!empty($s['Sd_Id'])) $bySd[$s['Sd_Id']] = $s;
        }
}

$hist = json_decode(@file_get_contents($HIST_FILE), true);
if (!is_array($hist)) $hist = array();

function win_return($series, $latestNav, $latestTs, $daysBack, $tol) {
    $target = $latestTs - $daysBack * 86400;
    $latestD = date('Y-m-d', $latestTs);
    $best = null; $bestDiff = null;
    foreach ($series as $p) {
        if ($p['d'] === $latestD) continue;
        $diff = abs(strtotime($p['d']) - $target);
        if ($bestDiff === null || $diff < $bestDiff) { $bestDiff = $diff; $best = $p; }
    }
    if (!$best || $bestDiff > $tol * 86400) return null;
    return pct($latestNav, $best['nav']);
}

function build($id, $f, &$hist, $bySd) {
    $face = isset($f['face']) ? floatval($f['face']) : 10;
    $rec = array(
        'name' => $f['name'], 'amc' => $f['amc'], 'cat' => $f['cat'],
        'nav' => null, 'navDate' => null, 'd1' => null, 'd5' => null,
        'm1' => null, 'm3' => null, 'si' => null,
        'aum' => $f['aum'] ?? null, 'risk' => $f['risk'] ?? null, 'ter' => $f['ter'] ?? null,
        'face' => $face, 'sd' => $f['sd'] ?? null,
        'source' => 'none', 'retsrc' => 'vr',
    );

    $series = isset($hist[$id]) && is_array($hist[$id]) ? $hist[$id] : array();

    // official NAV
    if (!empty($f['sd']) && isset($bySd[$f['sd']])) {
        $row = $bySd[$f['sd']];
        $nav = floatval($row['NetAssetValue']);
        $dt  = DateTime::createFromFormat('d-M-Y', $row['Date']);
        $iso = $dt ? $dt->format('Y-m-d') : date('Y-m-d');
        if ($nav > 0) {
            $rec['nav'] = $nav;
            $rec['navDate'] = $iso;
            $rec['si'] = pct($nav, $face);
            $rec['source'] = 'amfi';
            // accrue today's official snapshot (one per NAV date)
            $found = false;
            foreach ($series as &$p) { if ($p['d'] === $iso) { $p['nav'] = $nav; $found = true; break; } }
            unset($p);
            if (!$found) $series[] = array('d' => $iso, 'nav' => $nav);
            usort($series, function ($a, $b) { return strcmp($a['d'], $b['d']); });
            $hist[$id] = $series;
        }
    }

    // returns from accrued official history
    if ($rec['nav'] !== null && count($series) >= 2) {
        $lastTs = strtotime($rec['navDate']);
        $rec['d1'] = win_return($series, $rec['nav'], $lastTs, 1, 3);
        $rec['d5'] = win_return($series, $rec['nav'], $lastTs, 7, 5);
        $om1 = win_return($series, $rec['nav'], $lastTs, 30, 10);
        $om3 = win_return($series, $rec['nav'], $lastTs, 90, 15);
        if ($om1 !== null) { $rec['m1'] = $om1; $rec['retsrc'] = 'amfi'; }
        if ($om3 !== null) { $rec['m3'] = $om3; }
    }

    // VR fallback for 1M/3M until official history spans the window
    if ($rec['m1'] === null && array_key_exists('m1', $f) && $f['m1'] !== null) $rec['m1'] = floatval($f['m1']);
    if ($rec['m3'] === null && array_key_exists('m3', $f) && $f['m3'] !== null) $rec['m3'] = floatval($f['m3']);

    $rec['points'] = count($series);
    $rec['_series'] = $series;
    return $rec;
}

// ---------- single fund (with history) ----------
if ($wantFund) {
    if (empty($funds[$wantFund])) { echo json_encode(array('error' => 'unknown-fund')); exit; }
    $rec = build($wantFund, $funds[$wantFund], $hist, $bySd);
    @file_put_contents($HIST_FILE, json_encode($hist, JSON_UNESCAPED_SLASHES));
    $rec['id'] = $wantFund;
    $rec['vrAsOf'] = $VRASOF;
    $rec['history'] = $rec['_series'];
    unset($rec['_series']);
    echo json_encode($rec, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------- all funds ----------
$out_funds = array(); $latest = null;
foreach ($funds as $id => $f) {
    if ($id === '_comment') continue;
    $rec = build($id, $f, $hist, $bySd);
    if ($rec['navDate'] && (!$latest || $rec['navDate'] > $latest)) $latest = $rec['navDate'];
    unset($rec['_series']);
    $out_funds[$id] = $rec;
}
@file_put_contents($HIST_FILE, json_encode($hist, JSON_UNESCAPED_SLASHES));

$out = json_encode(array(
    'navAsOf'  => $latest,
    'vrAsOf'   => $VRASOF,
    'updated'  => date('c'),
    'count'    => count($out_funds),
    'official' => $latest !== null,
    'funds'    => $out_funds,
), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

@file_put_contents($CACHE_FILE, $out);
echo $out;
