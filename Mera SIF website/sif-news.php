<?php
/**
 * MeraSIF — SIF News Aggregator v2 (rolling archive)
 * Fetches Google News RSS across several SIF query angles, applies a strict
 * SIF-only topic guard, tags each headline by category, and ACCUMULATES into a
 * rolling archive (sif-news-archive.json, deduped, newest-first, capped) so the
 * page becomes a real growing record of SIF coverage — not just the latest fetch.
 * Self-refreshes every 6h (web) and on every CLI/cron run or ?force.
 * All headlines are real, from public sources; nothing is fabricated.
 * Gracefully serves the last good cache on total fetch failure.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=1800');

$CACHE       = __DIR__ . '/sif-news-cache.json';
$ARCHIVE     = __DIR__ . '/sif-news-archive.json';
$TTL         = 6 * 3600;   // web cache window
$ARCHIVE_MAX = 150;        // rolling archive size (real headlines retained)
$OUT_MAX     = 60;         // headlines returned for display
$isCli       = (PHP_SAPI === 'cli'); // cron runs `php sif-news.php` — always re-fetch

// Serve fresh cache for web hits within TTL. CLI (cron) and ?force always re-fetch.
if (!$isCli && !isset($_GET['force']) && file_exists($CACHE) && (time() - filemtime($CACHE)) < $TTL) {
    echo file_get_contents($CACHE);
    exit;
}

// Search feeds (India edition). Quoted phrase + context terms keep it on-topic;
// the ms_relevant() guard below is the real filter.
$feeds = array(
    'https://news.google.com/rss/search?q=%22specialized+investment+fund%22+SEBI&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=SIF+%22long-short%22+mutual+fund+India&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=%22specialized+investment+fund%22+NFO&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=%22specialised+investment+fund%22+India&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=SIF+fund+SEBI+AMC+launch&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=%22specialized+investment+fund%22+AUM+OR+flows+OR+crore&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=SIF+%22hybrid+long-short%22+OR+%22equity+long-short%22+India&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=%22specialised+investment+fund%22+SEBI+circular+OR+regulation+OR+tax&hl=en-IN&gl=IN&ceid=IN:en',
);

function ms_fetch($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; MeraSIF-NewsBot/2.0; +https://www.merasif.com)',
        ));
        $data = curl_exec($ch);
        curl_close($ch);
        return $data ? $data : false;
    }
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create(array('http' => array('timeout' => 8, 'user_agent' => 'MeraSIF-NewsBot/2.0')));
        return @file_get_contents($url, false, $ctx);
    }
    return false;
}

// Topic guard — keep only items that are clearly about SIFs.
function ms_relevant($title) {
    $t = strtolower($title);
    if (strpos($t, 'specialized investment fund') !== false) return true;
    if (strpos($t, 'specialised investment fund') !== false) return true;
    $hasSif = (strpos($t, ' sif') !== false || strpos($t, 'sif ') === 0 || strpos($t, '(sif') !== false || strpos($t, 'sif:') !== false || strpos($t, 'sif,') !== false);
    if ($hasSif && (strpos($t, 'fund') !== false || strpos($t, 'sebi') !== false || strpos($t, 'long-short') !== false || strpos($t, 'long short') !== false || strpos($t, 'nfo') !== false || strpos($t, 'mutual') !== false || strpos($t, 'invest') !== false || strpos($t, 'amc') !== false)) return true;
    return false;
}

// Categorise a headline (organises the news hub like a newsroom).
function ms_cat($title) {
    $t = strtolower($title);
    if (strpos($t,'nfo')!==false || strpos($t,'launch')!==false || strpos($t,'unveil')!==false || strpos($t,'debut')!==false || strpos($t,'enters')!==false || strpos($t,'introduc')!==false || strpos($t,'files')!==false || strpos($t,'to offer')!==false) return 'launch';
    if (strpos($t,'sebi')!==false || strpos($t,'circular')!==false || strpos($t,'regulat')!==false || strpos($t,'norms')!==false || strpos($t,' rule')!==false || strpos($t,'framework')!==false || strpos($t,'certification')!==false || strpos($t,' tax')!==false || strpos($t,'guidelines')!==false) return 'regulatory';
    if (strpos($t,'aum')!==false || strpos($t,'flows')!==false || strpos($t,'inflow')!==false || strpos($t,'crore')!==false || strpos($t,' grow')!==false || strpos($t,'assets')!==false || strpos($t,'milestone')!==false || strpos($t,'record')!==false || strpos($t,'folio')!==false) return 'flows';
    if (strpos($t,' vs ')!==false || strpos($t,'review')!==false || strpos($t,'explain')!==false || strpos($t,'guide')!==false || strpos($t,'should ')!==false || strpos($t,'why ')!==false || strpos($t,'outlook')!==false || strpos($t,'what ')!==false || strpos($t,'how ')!==false || strpos($t,'best ')!==false || strpos($t,'top ')!==false || strpos($t,'inside')!==false) return 'analysis';
    return 'update';
}

function ms_key($title) { return strtolower(preg_replace('/[^a-z0-9]/i', '', substr($title, 0, 60))); }

// ---- fetch fresh items across all feeds ----
$fresh = array();
$feeds_ok = 0;
foreach ($feeds as $url) {
    $xml = ms_fetch($url);
    if (!$xml) continue;
    $rss = @simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    if (!$rss || !isset($rss->channel->item)) continue;
    $feeds_ok++;
    foreach ($rss->channel->item as $it) {
        $title  = trim((string)$it->title);
        $link   = trim((string)$it->link);
        $pub    = trim((string)$it->pubDate);
        $source = isset($it->source) ? trim((string)$it->source) : '';
        if (!$source && strpos($title, ' - ') !== false) {
            $parts  = explode(' - ', $title);
            $source = trim(array_pop($parts));
            $title  = trim(implode(' - ', $parts));
        }
        if (!$title || !ms_relevant($title)) continue;
        $ts = $pub ? strtotime($pub) : 0;
        $fresh[] = array(
            'key'    => ms_key($title),
            'title'  => $title,
            'link'   => $link,
            'source' => $source,
            'date'   => $ts ? date('c', $ts) : '',
            'ts'     => $ts,
            'cat'    => ms_cat($title),
        );
    }
}

// ---- merge into the rolling archive (dedupe by title key; keep earliest link/date) ----
$archive = json_decode(@file_get_contents($ARCHIVE), true);
if (!is_array($archive)) $archive = array();
$byKey = array();
foreach ($archive as $a) {
    if (empty($a['title'])) continue;
    $k = isset($a['key']) ? $a['key'] : ms_key($a['title']);
    $a['key'] = $k;
    if (empty($a['cat'])) $a['cat'] = ms_cat($a['title']);
    if (!isset($a['ts'])) $a['ts'] = !empty($a['date']) ? strtotime($a['date']) : 0;
    $byKey[$k] = $a;
}
foreach ($fresh as $x) {
    if (!isset($byKey[$x['key']])) {
        $byKey[$x['key']] = $x;                       // brand-new headline
    } else {
        if (empty($byKey[$x['key']]['source']) && !empty($x['source'])) $byKey[$x['key']]['source'] = $x['source'];
        if (empty($byKey[$x['key']]['link']) && !empty($x['link']))     $byKey[$x['key']]['link']   = $x['link'];
    }
}
$merged = array_values($byKey);
usort($merged, function ($a, $b) { return (int)(!empty($b['ts']) ? $b['ts'] : 0) - (int)(!empty($a['ts']) ? $a['ts'] : 0); });
$merged = array_slice($merged, 0, $ARCHIVE_MAX);

// Persist the archive (never wipe it on a total fetch failure).
if (count($merged) > 0) {
    @file_put_contents($ARCHIVE, json_encode($merged, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

// ---- build output (strip internal keys, cap for display) ----
$out_items = array();
$sources = array();
foreach (array_slice($merged, 0, $OUT_MAX) as $m) {
    if (!empty($m['source'])) $sources[$m['source']] = true;
    $out_items[] = array(
        'title'  => $m['title'],
        'link'   => $m['link'],
        'source' => $m['source'],
        'date'   => $m['date'],
        'cat'    => isset($m['cat']) ? $m['cat'] : 'update',
    );
}

$out = json_encode(array(
    'updated' => date('c'),
    'count'   => count($out_items),
    'total'   => count($merged),
    'sources' => count($sources),
    'items'   => $out_items,
), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

if (count($out_items) > 0) {
    @file_put_contents($CACHE, $out);
    echo $out;
} elseif (file_exists($CACHE)) {
    echo file_get_contents($CACHE); // fetch failed, no archive — serve last good cache
} else {
    echo $out;
}
