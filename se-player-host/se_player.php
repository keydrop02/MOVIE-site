<?php
////////////////////// SUPEREMBED PLAYER SCRIPT //////////////////////////////////////////
// Self-hosted copy (SuperEmbed "advanced way").
//
// SETUP:
//  1. Upload THIS FILE ONLY to any PHP host (PHP 7+, curl enabled is strongly
//     recommended, otherwise allow_url_fopen must be on).
//  2. Point movies-site at it:
//       NEXT_PUBLIC_SUPEREMBED_PLAYER_BASE=https://YOUR-HOST/se_player.php
//  3. Sanity-check right after upload:
//       https://YOUR-HOST/se_player.php?video_id=522931&tmdb=1
//     Expected: HTTP 302 redirect to https://streamingnow.mov/?play=...
//
// PLAYER SETTINGS ////////////////////////////////////////////////////////////

// do not change anything outside this section

// player font - paste font name from Google fonts, replace spaces with +
$player_font = "Inter";

// player colors - paste color code in HEX format without # eg. 123456
$player_bg_color = "020b07"; // background color
$player_font_color = "f5f5f5"; // font color
$player_primary_color = "9fd95b"; // primary color for loader and buttons
$player_secondary_color = "b6e57a"; // secondary color for hovers and elements

// player loader - you can choose a loading animation from 1 to 10
$player_loader = 1;

// preferred server - you can choose server that will be on top of the list and open after
// clicking play button, works only for quality >= 720p
// options are: vidlox = 7, fembed = 11, mixdrop = 12, upstream = 17, videobin = 18,
// doodstream = 21, streamtape = 25, streamsb = 26, voe = 29, ninjastream = 33
$preferred_server = 0; // paste only server number, leave 0 for no preference

// here you can choose source list style
// 1 = button with server count and full page overlay with server list
// 2 = button with icon and dropdown with server list
$player_sources_toggle_type = 2;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

if (isset($_GET['video_id'])) {
  $video_id = $_GET['video_id'];
  $is_tmdb = isset($_GET['tmdb']) ? $_GET['tmdb'] : 0;
  $season = isset($_GET['season']) ? $_GET['season'] : (isset($_GET['s']) ? $_GET['s'] : 0);
  $episode = isset($_GET['episode']) ? $_GET['episode'] : (isset($_GET['e']) ? $_GET['e'] : 0);

  if (!empty(trim($video_id))) {
    $request_url = "https://getsuperembed.link/?video_id=$video_id&tmdb=$is_tmdb&season=$season&episode=$episode"
      . "&player_font=$player_font&player_bg_color=$player_bg_color&player_font_color=$player_font_color"
      . "&player_primary_color=$player_primary_color&player_secondary_color=$player_secondary_color"
      . "&player_loader=$player_loader&preferred_server=$preferred_server"
      . "&player_sources_toggle_type=$player_sources_toggle_type";

    $player_url = "";
    if (function_exists('curl_version')) {
      $curl = curl_init();
      curl_setopt($curl, CURLOPT_URL, $request_url);
      curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
      curl_setopt($curl, CURLOPT_TIMEOUT, 7);
      curl_setopt($curl, CURLOPT_HEADER, false);
      // Real-browser user agent; prevents Cloudflare from refusing the request.
      curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
      curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
      $player_url = curl_exec($curl);
      $curl_error = curl_error($curl);
      curl_close($curl);
    } else {
      $player_url = @file_get_contents($request_url);
      $curl_error = $player_url === false ? "file_get_contents failed (enable allow_url_fopen or curl)" : "";
    }

    if (!empty($player_url)) {
      if (strpos($player_url, "https://") !== false) {
        header("Location: $player_url");
      } else {
        echo "<span style='color:red'>$player_url</span>";
      }
    } else {
      echo $curl_error !== "" ? "Request failed: $curl_error" : "Request server didn't respond";
    }
  } else {
    echo "Missing video_id";
  }
} else {
  echo "Missing video_id";
}

?>