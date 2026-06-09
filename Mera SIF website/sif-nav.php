<?php
/**
 * MeraSIF — SIF data engine  (Regular-Growth plan, real data only)
 *
 *  Default      → JSON summary of all funds.
 *  ?fund=<id>   → that fund's record (plus official NAV history if a live feed is wired).
 *
 * NON-NEGOTIABLE: this engine NEVER emits indicative / fabricated numbers.
 *   • m1, m3, aum, risk, ter  → REAL, from Value Research (Regular plan), passed through verbatim.
 *   • nav, si, d1, d5, history → ONLY populated when a fund has an official 'schemeCode'
 *     and the feed returns real data. Otherwise they are null and the UI shows "—".
 *
 * Returns are absolute point-to-point (SEBI norm for <1yr funds).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=3600');

$DIR        = __DIR__;
$DATA_FILE  = $DIR . '/sif-nav-data.json';
$CACHE_FILE = $DIR . '/sif-nav-cache.json';
$CACHE_TTL  = 12 * 3600;

$wantFund = isset($_GET['fund']) ? preg_replace('/[^a-z0-9-]/', '', $_GET['fund']) : null;

if (!$wantFund && !isset($_GET['force']) && file_exists($CACHE_FILE) && (time() - filemtime($CACHE_FILE)) < $CACHE_TTL) {
    echo file_get_contents($CACHE_FILE);
    exit;
}

$seed = json_decode(@file_get_contents($DATA_FILE), true);
if (!$seed || empty($seed['funds'])) { echo json_encode(array('error' => 'no-data', 'funds' => array())); exit; }
$funds = $seed['funds'];
$ASOF  = isset($seed['asOf']) ? $seed['asOf'] : date('Y-m-d');

function ms_get($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'MeraSIF-NAVBot/1.0 (+https://www.merasif.com)',
        ));
        $r = curl_exec($ch); curl_close($ch); return $r ? $r : false;
    }
    return @file_get_contents($url);
}
function pct($now, $past) { return (!$past || $past == 0) ? null : round(($now / $past - 1) * 100, 2); }

function nav_on_or_before($series, $target_ts) {
    $pick = null;
    foreach ($series as $p) { if (strtotime($p['d']) <= $target_ts) $pick = $p; else break; }
    return $pick;
}

function build($id, $f) {
    $g = function($k) use ($f) { return array_key_exists($k, $f) ? $f[$k] : null; };
    $rec = array(
        'name'  => $g('name'), 'amc' => $g('amc'), 'cat' => $g('cat'),
        'm1'    => $g('m1'),  'm3' => $g('m3'),        // REAL (Value Research)
        'aum'   => $g('aum'), 'risk' => $g('risk'), 'ter' => $g('ter'),
        'incept'=> $g('incept'),
        'nav'   => null, 'si' => null, 'd1' => null, 'd5' => null,
        'source'=> 'disclosed', 'retsrc' => ($g('m1') !== null || $g('m3') !== null) ? 'vr' : 'none',
        'history' => array(),
    );

    // Official feed path — only here do nav / si / daily returns become real.
    if (!empty($f['schemeCode'])) {
        $raw = ms_get('https://api.mfapi.in/mf/' . rawurlencode($f['schemeCode']));
        $j = $raw ? json_decode($raw, true) : null;
        if ($j && !empty($j['data'])) {
            $series = array();
            foreach (array_reverse($j['data']) as $pt) {
                $d = DateTime::createFromFormat('d-m-Y', $pt['date']);
                if ($d) $series[] = array('d' => $d->format('Y-m-d'), 'nav' => floatval($pt['nav']));
            }
            if ($series) {
                $last = end($series); $ts = strtotime($last['d']);
                $rec['nav'] = $last['nav'];
                $rec['si']  = pct($last['nav'], 10);
                $p1 = nav_on_or_before($series, $ts - 1 * 86400);  $rec['d1'] = $p1 ? pct($last['nav'], $p1['nav']) : null;
                $p5 = nav_on_or_before($series, $ts - 7 * 86400);  $rec['d5'] = $p5 ? pct($last['nav'], $p5['nav']) : null;
                $pm1 = nav_on_or_before($series, $ts - 30 * 86400); if ($pm1) $rec['m1'] = pct($last['nav'], $pm1['nav']);
                $pm3 = nav_on_or_before($series, $ts - 90 * 86400); if ($pm3) $rec['m3'] = pct($last['nav'], $pm3['nav']);
                $rec['source'] = 'live'; $rec['retsrc'] = 'live';
                $rec['history'] = $series;
            }
        }
    }
    return $rec;
}

if ($wantFund) {
    if (empty($funds[$wantFund])) { echo json_encode(array('error' => 'unknown-fund')); exit; }
    $rec = build($wantFund, $funds[$wantFund]);
    $rec['id'] = $wantFund; $rec['asOf'] = $ASOF;
    echo json_encode($rec, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$out_funds = array();
foreach ($funds as $id => $f) {
    if ($id === '_comment') continue;
    $rec = build($id, $f);
    unset($rec['history']);
    $out_funds[$id] = $rec;
}
$out = json_encode(array(
    'asOf' => $ASOF, 'updated' => date('c'), 'source' => isset($seed['source']) ? $seed['source'] : null,
    'count' => count($out_funds), 'funds' => $out_funds,
), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
@file_put_contents($CACHE_FILE, $out);
echo $out;
