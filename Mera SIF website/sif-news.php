<?php
/**
 * MeraSIF — SIF News Aggregator
 * Fetches Google News RSS for Specialized Investment Fund coverage,
 * dedupes, sorts newest-first, caches to JSON, self-refreshes every 6h.
 * No API key required. Gracefully serves stale cache on fetch failure.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=1800');

$CACHE = __DIR__ . '/sif-news-cache.json';
$TTL   = 6 * 3600; // 6 hours

// Serve fresh cache if still valid
if (file_exists($CACHE) && (time() - filemtime($CACHE)) < $TTL) {
    echo file_get_contents($CACHE);
    exit;
}

// Search feeds (India edition). Quoted phrase + context terms keep it on-topic.
$feeds = array(
    'https://news.google.com/rss/search?q=%22specialized+investment+fund%22+SEBI&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=SIF+%22long-short%22+mutual+fund+India&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=%22specialized+investment+fund%22+NFO&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=%22specialised+investment+fund%22+India&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=SIF+fund+SEBI+AMC+launch&hl=en-IN&gl=IN&ceid=IN:en',
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
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; MeraSIF-NewsBot/1.0; +https://www.merasif.com)',
        ));
        $data = curl_exec($ch);
        curl_close($ch);
        return $data ? $data : false;
    }
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create(array('http' => array('timeout' => 8, 'user_agent' => 'MeraSIF-NewsBot/1.0')));
        return @file_get_contents($url, false, $ctx);
    }
    return false;
}

// Topic guard — keep only items that look SIF-relevant
function ms_relevant($title) {
    $t = strtolower($title);
    if (strpos($t, 'specialized investment fund') !== false) return true;
    if (strpos($t, 'specialised investment fund') !== false) return true;
    $hasSif = (strpos($t, ' sif') !== false || strpos($t, 'sif ') === 0 || strpos($t, '(sif') !== false || strpos($t, 'sif:') !== false);
    if ($hasSif && (strpos($t, 'fund') !== false || strpos($t, 'sebi') !== false || strpos($t, 'long-short') !== false || strpos($t, 'long short') !== false || strpos($t, 'nfo') !== false || strpos($t, 'mutual') !== false || strpos($t, 'invest') !== false)) return true;
    return false;
}

$items = array();
$seen  = array();

foreach ($feeds as $url) {
    $xml = ms_fetch($url);
    if (!$xml) continue;
    $rss = @simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    if (!$rss || !isset($rss->channel->item)) continue;

    foreach ($rss->channel->item as $it) {
        $title  = trim((string)$it->title);
        $link   = trim((string)$it->link);
        $pub    = trim((string)$it->pubDate);
        $source = isset($it->source) ? trim((string)$it->source) : '';

        // Google titles arrive as "Headline - Source Name"
        if (!$source && strpos($title, ' - ') !== false) {
            $parts  = explode(' - ', $title);
            $source = trim(array_pop($parts));
            $title  = trim(implode(' - ', $parts));
        }

        if (!$title || !ms_relevant($title)) continue;

        $key = strtolower(preg_replace('/[^a-z0-9]/i', '', substr($title, 0, 60)));
        if (isset($seen[$key])) continue;
        $seen[$key] = true;

        $ts = $pub ? strtotime($pub) : 0;
        $items[] = array(
            'title'  => $title,
            'link'   => $link,
            'source' => $source,
            'date'   => $ts ? date('c', $ts) : '',
            'ts'     => $ts,
        );
    }
}

// Newest first
usort($items, function ($a, $b) { return $b['ts'] - $a['ts']; });
$items = array_slice($items, 0, 12);

// Strip internal sort key
foreach ($items as &$x) { unset($x['ts']); }
unset($x);

$out = json_encode(array(
    'updated' => date('c'),
    'count'   => count($items),
    'items'   => $items,
), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

if (count($items) > 0) {
    @file_put_contents($CACHE, $out);
    echo $out;
} elseif (file_exists($CACHE)) {
    // Fetch failed but we have an old cache — serve it
    echo file_get_contents($CACHE);
} else {
    echo $out; // empty; frontend falls back to evergreen cards
}
