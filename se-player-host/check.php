<?php
// Connectivity/health check for the self-hosted SuperEmbed player.
// Open in a browser: https://YOUR-HOST/check.php
// It repeats the exact request se_player.php makes and reports what it got back.

header("Content-Type: text/plain; charset=utf-8");

echo "PHP " . PHP_VERSION . "\n";
echo "curl: " . (function_exists('curl_version') ? "yes" : "no") . "\n";
echo "allow_url_fopen: " . (ini_get('allow_url_fopen') ? "yes" : "no") . "\n\n";

$video_id = isset($_GET['video_id']) && !empty($_GET['video_id']) ? $_GET['video_id'] : "522931";
$request_url = "https://getsuperembed.link/?video_id=$video_id&tmdb=1&season=0&episode=0&player_font=Inter"
  . "&player_bg_color=020b07&player_font_color=f5f5f5&player_primary_color=9fd95b"
  . "&player_secondary_color=b6e57a&player_loader=1&preferred_server=0&player_sources_toggle_type=2";

echo "Request: $request_url\n\n";

if (function_exists('curl_version')) {
  $curl = curl_init();
  curl_setopt($curl, CURLOPT_URL, $request_url);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_FOLLOWLOCATION, false);
  curl_setopt($curl, CURLOPT_TIMEOUT, 10);
  curl_setopt($curl, CURLOPT_HEADER, false);
  curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
  curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
  $body = curl_exec($curl);
  $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
  $err = curl_error($curl);
  curl_close($curl);

  echo "HTTP $http_code" . ($err !== "" ? "  (curl error: $err)" : "") . "\n";
  echo "Body: " . (is_string($body) && $body !== "" ? substr($body, 0, 200) : "(empty)") . "\n";
  if (is_string($body) && strpos($body, "streamingnow.mov") !== false) {
    echo "\nOK: this host can reach getsuperembed.link and resolves the player.\n";
  } elseif (is_string($body) && strpos($body, "http") !== false) {
    echo "\nWARN: responded with a URL, but not streamingnow.mov — check the body above.\n";
  } else {
    echo "\nFAIL: no player URL returned. Likely Cloudflare blocked the request or the host cannot reach getsuperembed.link.\n";
  }
} else {
  echo "curl is not available, so connectivity cannot be tested from here.\n";
  echo "Enable the curl PHP extension, or set allow_url_fopen=On so se_player.php can fall back to file_get_contents.\n";
}

?>