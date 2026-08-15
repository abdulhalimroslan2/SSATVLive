const fs = require('fs');
let mpd = fs.readFileSync('scratch/hbo.mpd', 'utf8');

const widevineUuid = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';
const clearKeyUuid = 'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';
let rewritten = mpd.replaceAll(widevineUuid, clearKeyUuid);
rewritten = rewritten.replaceAll('<BaseURL>http://', '<BaseURL>https://');

if (!rewritten.includes(clearKeyUuid) && rewritten.includes('mp4protection')) {
   rewritten = rewritten.replace(
     /(<ContentProtection schemeIdUri="urn:mpeg:dash:mp4protection:2011"[^>]*>)/g,
     `$1\n      <ContentProtection schemeIdUri="urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b"/>`
   );
}
fs.writeFileSync('scratch/hbo_rewritten.mpd', rewritten);
console.log('Done');
