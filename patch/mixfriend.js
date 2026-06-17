// MixFriend.js — place in same folder as MixFriend.amxd
// Inlets:  0 = all messages
// Outlets: 0 = JSON result string
//          1 = status string
//          2 = command list for Max routing (loadfile, done, etc.)

inlets  = 1;
outlets = 3;

var MAX_TRACKS      = 10;
var AMP_INTERVAL_MS = 30;   // matches snapshot~ interval in patch
var PITCH_INTERVAL_MS = 100;

var CACHE_PATH  = "";
var cache       = {};
var trackList   = [];
var currentIdx  = -1;

// Per-track analysis state
var ampHistory  = [];   // raw peakamp~ envelope, one value per AMP_INTERVAL_MS frame
var pitchBucket = {};   // {pitchClass: count}

// ── Pitch / Key ──────────────────────────────────────────────────────────────

var NOTE_NAMES    = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var MAJOR_PROFILE = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
var MINOR_PROFILE = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];

function hzToPitchClass(hz) {
    if (hz <= 0) return -1;
    var midi = 69 + 12 * (Math.log(hz / 440) / Math.log(2));
    return ((Math.round(midi) % 12) + 12) % 12;
}

function rotate(arr, n) { return arr.slice(n).concat(arr.slice(0, n)); }

function pearson(a, b) {
    var ma = 0, mb = 0, n = a.length;
    for (var i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    var num = 0, da = 0, db = 0;
    for (var i = 0; i < n; i++) {
        num += (a[i]-ma)*(b[i]-mb);
        da  += (a[i]-ma)*(a[i]-ma);
        db  += (b[i]-mb)*(b[i]-mb);
    }
    return (da && db) ? num / Math.sqrt(da*db) : 0;
}

function detectKey() {
    var chroma = [0,0,0,0,0,0,0,0,0,0,0,0];
    var total  = 0;
    for (var pc in pitchBucket) {
        chroma[parseInt(pc)] += pitchBucket[pc];
        total += pitchBucket[pc];
    }
    if (total < 5) return "Unknown";
    for (var i = 0; i < 12; i++) chroma[i] /= total;

    var best = -Infinity, bestKey = "C", bestMode = "major";
    for (var root = 0; root < 12; root++) {
        var maj = pearson(chroma, rotate(MAJOR_PROFILE, root));
        var min = pearson(chroma, rotate(MINOR_PROFILE, root));
        if (maj > best) { best = maj; bestKey = NOTE_NAMES[root]; bestMode = "major"; }
        if (min > best) { best = min; bestKey = NOTE_NAMES[root]; bestMode = "minor"; }
    }
    return bestKey + " " + bestMode;
}

// ── BPM (autocorrelation) ───────────────────────────────────────────────────
// Builds a half-wave-rectified "onset strength" envelope (frame-to-frame
// amplitude increase) from the raw peakamp~ history, then autocorrelates it
// across lags corresponding to 60-200 BPM. The lag with the strongest
// self-similarity is the dominant beat period. This is far more robust than
// threshold-based onset picking, especially on quieter/syncopated material.

function onsetStrengthEnvelope() {
    var env = [];
    for (var i = 1; i < ampHistory.length; i++) {
        var d = ampHistory[i] - ampHistory[i-1];
        env.push(d > 0 ? d : 0);
    }
    return env;
}

function detectBPM() {
    var env = onsetStrengthEnvelope();
    var frameRate = 1000 / AMP_INTERVAL_MS;
    var minLag = Math.round(frameRate * 60 / 200); // fastest tempo, shortest period
    var maxLag = Math.round(frameRate * 60 / 60);  // slowest tempo, longest period
    if (env.length < maxLag * 2) return 0;

    var bestLag = 0, bestScore = 0;
    for (var lag = minLag; lag <= maxLag; lag++) {
        var sum = 0;
        for (var i = 0; i + lag < env.length; i++) {
            sum += env[i] * env[i + lag];
        }
        if (sum > bestScore) { bestScore = sum; bestLag = lag; }
    }
    if (bestLag === 0) return 0;
    return Math.round((60 * frameRate / bestLag) * 10) / 10;
}

// ── Cue points ───────────────────────────────────────────────────────────────
// Peaks in the onset-strength envelope mark transient hits; gaps > 1.5s
// between peaks mark structural boundaries.

function detectCuePoints() {
    var env = onsetStrengthEnvelope();
    if (env.length < 8) return [];

    var avg = 0;
    for (var i = 0; i < env.length; i++) avg += env[i];
    avg /= env.length;
    var threshold = avg * 2.5;

    var onsetMs = [];
    for (var i = 1; i < env.length - 1; i++) {
        if (env[i] > threshold && env[i] >= env[i-1] && env[i] >= env[i+1]) {
            onsetMs.push(i * AMP_INTERVAL_MS);
        }
    }

    var cues = [];
    for (var i = 1; i < onsetMs.length; i++) {
        if (onsetMs[i] - onsetMs[i-1] > 1500) {
            cues.push(Math.round(onsetMs[i-1] / 100) * 100);
        }
    }
    return cues.slice(0, 8);
}

// ── Amplitude sampling ───────────────────────────────────────────────────────
// Called every AMP_INTERVAL_MS ms from the bpm-analysis subpatch (peakamp~).

function amp(val) {
    ampHistory.push(val);
}

// ── Pitch message ─────────────────────────────────────────────────────────────

function pitch(hz) {
    var pc = hzToPitchClass(parseFloat(hz));
    if (pc >= 0) pitchBucket[pc] = (pitchBucket[pc] || 0) + 1;
}

// ── Cache ────────────────────────────────────────────────────────────────────

function loadCache() {
    if (!CACHE_PATH) return;
    try {
        var f = new File(CACHE_PATH, "read", "TEXT");
        if (f.isopen) {
            var txt = f.readstring(2000000);
            f.close();
            cache = JSON.parse(txt);
            outlet(1, "cache loaded — " + Object.keys(cache).length + " tracks");
        }
    } catch(e) { cache = {}; }
}

function saveCache() {
    if (!CACHE_PATH) return;
    try {
        var f = new File(CACHE_PATH, "write", "TEXT");
        f.writestring(JSON.stringify(cache, null, 2));
        f.close();
    } catch(e) { outlet(1, "cache save failed: " + e.message); }
}

// ── Track sequencing ──────────────────────────────────────────────────────────

function resetAnalysis() {
    ampHistory  = [];
    pitchBucket = {};
}

function nexttrack() {
    currentIdx++;
    if (currentIdx >= trackList.length) {
        outlet(1, "all tracks done");
        outlet(2, "done");
        return;
    }
    var t = trackList[currentIdx];
    if (cache[t.filepath]) {
        var cd = cache[t.filepath];
        outlet(1, "cached: " + t.title + " | " + cd.bpm + " BPM | " + cd.key);
        outlet(0, JSON.stringify(cd));
        outlet(2, "cached", cd.bpm, cd.key);
        nexttrack();
    } else {
        resetAnalysis();
        outlet(1, "analyzing [" + (currentIdx+1) + "/" + trackList.length + "]: " + t.title);
        outlet(2, "loadfile", t.filepath);
    }
}

// ── Public messages ───────────────────────────────────────────────────────────

function cachepath(p) {
    CACHE_PATH = p.toString();
    loadCache();
}

function addfile() {
    var fp = arrayfromargs(arguments).join(" ");
    if (trackList.length >= MAX_TRACKS) return;
    var parts = fp.replace(/\\/g, "/").split("/");
    var title = parts[parts.length-1].replace(/\.[^.]+$/, "");
    trackList.push({ filepath: fp, title: title });
    outlet(1, "queued [" + trackList.length + "/" + MAX_TRACKS + "]: " + title);
}

// ── Directory scanning ────────────────────────────────────────────────────────
// "scandir <path>" — enumerate audio files in a folder and queue them directly,
// replacing the old folder/select/counter/gate object chain in the patch.

var AUDIO_EXT = /\.(wav|aif|aiff|mp3|m4a|flac)$/i;

function joinPath(dir, name) {
    var d = dir.toString().replace(/\\/g, "/");
    if (d.charAt(d.length - 1) !== "/") d += "/";
    return d + name;
}

function scandir() {
    var dirPath = arrayfromargs(arguments).join(" ");
    var queued = 0;
    var folder;
    try {
        folder = new Folder(dirPath);
    } catch (e) {
        outlet(1, "scandir failed: " + e.message);
        return;
    }
    folder.reset();
    while (!folder.end && trackList.length < MAX_TRACKS) {
        var fname = folder.filename;
        if (AUDIO_EXT.test(fname)) {
            var full = joinPath(dirPath, fname);
            var title = fname.replace(/\.[^.]+$/, "");
            trackList.push({ filepath: full, title: title });
            queued++;
        }
        folder.next();
    }
    folder.close();
    outlet(1, "scanned folder — queued " + queued + " file(s) [" + trackList.length + "/" + MAX_TRACKS + "]");
}

function start() {
    if (!trackList.length) { outlet(1, "no files queued"); return; }
    currentIdx = -1;
    nexttrack();
}

function finalize() {
    var t = trackList[currentIdx];
    if (!t) return;
    var bpm  = detectBPM();
    var key  = detectKey();
    var cues = detectCuePoints();
    var result = {
        filepath:   t.filepath,
        title:      t.title,
        bpm:        bpm,
        key:        key,
        cue_points: cues,
        analyzed:   new Date().toISOString()
    };
    cache[t.filepath] = result;
    saveCache();
    outlet(0, JSON.stringify(result));
    outlet(1, "done: " + t.title + " | " + bpm + " BPM | " + key + " | " + cues.length + " cues");
    outlet(2, "result", bpm, key);
    nexttrack();
}

function clearall() {
    cache = {}; trackList = []; currentIdx = -1;
    saveCache();
    outlet(1, "cleared");
}

function anything() {
    var sel = messagename;
    var args = arrayfromargs(arguments);
    if      (sel === "cachepath") cachepath(args[0]);
    else if (sel === "addfile")   addfile.apply(this, args);
    else if (sel === "scandir")   scandir.apply(this, args);
    else if (sel === "start")     start();
    else if (sel === "amp")       amp(args[0]);
    else if (sel === "pitch")     pitch(args[0]);
    else if (sel === "finalize")  finalize();
    else if (sel === "clear")     clearall();
    else outlet(1, "unknown: " + sel);
}
