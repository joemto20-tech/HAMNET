
/* NVMP v13.1 HAMNET AUDIO BROADCAST */
const HAMNET_AUDIO_API_BASE = "https://nvmp-live-pings.joemto20.workers.dev/";
let HAMNET_AUDIO_CACHE = [];
let HAMNET_AUDIO_LAST_ID = localStorage.getItem("hamnet_last_audio_id") || "";
let HAMNET_AUDIO_LAST_FETCH = 0;
const ROTJAWS_RADIO_TRACKS = [
  {
    id: "rotjaws-01",
    title: "Distordeon - NCR Holiday",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/01-radio-hamfolder-distordeon-ncr-holiday.mp3"
  },
  {
    id: "rotjaws-02",
    title: "Distordeon - Rusty Alluminati",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/02-radio-hamfolder-distordeon-rusty-alluminati.mp3"
  },
  {
    id: "rotjaws-03",
    title: "MTO - Bang Bang (Nukes to a Knife Fight)",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/03-radio-hamfolder-mto-bang-bang-nukes-to-a-knife-fight.mp3"
  },
  {
    id: "rotjaws-04",
    title: "MTO - Bleach The Dream (Atomic Wrangler sessions)",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/04-radio-hamfolder-mto-bleach-the-dream-atomic-wrangler-sessions.mp3"
  },
  {
    id: "rotjaws-05",
    title: "MTO - Bleach The Dream",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/05-radio-hamfolder-mto-bleach-the-dream.mp3"
  },
  {
    id: "rotjaws-07",
    title: "RJGranny",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/07-radio-hamfolder-rjgranny.mp3"
  },
  {
    id: "rotjaws-08",
    title: "RJV1",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/08-radio-hamfolder-rjv1.mp3"
  },
  {
    id: "rotjaws-09",
    title: "RJV2",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/09-radio-hamfolder-rjv2.mp3"
  },
  {
    id: "rotjaws-10",
    title: "Rotjaw - Thoughts on Taxes",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/10-radio-hamfolder-rotjaw-thoughts-on-taxes.mp3"
  },
  {
    id: "rotjaws-11",
    title: "Rotjaw and The Ferals - Talon Tanked Unity",
    audioDataUrl: "assets/radio/rotjaws-wasteland-broadcast/11-radio-hamfolder-rotjaw-and-the-ferals-talon-tanked-unity.mp3"
  }
];
const ROTJAWS_RADIO_TRACK = ROTJAWS_RADIO_TRACKS[0];

const HAMNET_RADIO = {
  enabled: false,
  started: false,
  player: null,
  currentId: localStorage.getItem("hamnet_radio_track_id") || ROTJAWS_RADIO_TRACK.id,
  error: false,
  queue: [],
  queueIndex: -1
};

function audioEscape(s) {
  return String(s || "").replace(/[&<>"']/g, function(c) {
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
  });
}

function getAudioOperatorInfo() {
  var active = (typeof getActiveFactionInfo === "function") ? getActiveFactionInfo() : {};
  var char = (typeof NVMP_CHARACTER !== "undefined" && NVMP_CHARACTER) ? NVMP_CHARACTER : null;
  return {
    operator: (active && active.operatorName) || (char && char.name) || "Unknown Operator",
    rank: (active && active.rank) || "Unlisted",
    faction: (active && active.factionName) || "No Active Faction",
    groupId: (active && active.groupId) || (char && char.primary_group_id) || "None"
  };
}

function audioIdentityVerified() {
  var id = (typeof getVerifiedReportIdentity === "function") ? getVerifiedReportIdentity() : null;
  if (id) return id.ok;
  var op = getAudioOperatorInfo();
  return !!op.operator && op.operator !== "Unknown Operator" && !!op.groupId && op.groupId !== "None" && op.faction !== "No Active Faction";
}

async function fileToBase64DataUrl(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(String(reader.result || "")); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function hamnetFetchAudio(path, options) {
  var res = await fetch(HAMNET_AUDIO_API_BASE + path.replace(/^\//, ""), options || { cache:"no-store" });
  var data = await res.json().catch(function(){ return { ok:false, error:"Bad HAMNET response" }; });
  if (!res.ok || data.ok === false) throw new Error(data.error || ("HAMNET returned " + res.status));
  return data;
}

async function fetchHamnetAudio(force) {
  var now = Date.now();
  if (!force && now - HAMNET_AUDIO_LAST_FETCH < 15000) return HAMNET_AUDIO_CACHE;
  HAMNET_AUDIO_LAST_FETCH = now;
  try {
    var data = await hamnetFetchAudio("audio?t=" + now);
    HAMNET_AUDIO_CACHE = Array.isArray(data.audio) ? data.audio : [];
    syncHamnetRadioAuto();
    var newest = HAMNET_AUDIO_CACHE[0];
    if (newest && newest.id && HAMNET_AUDIO_LAST_ID && newest.id !== HAMNET_AUDIO_LAST_ID) {
      showHamnetAudioAlert(newest);
    }
    if (newest && newest.id) {
      HAMNET_AUDIO_LAST_ID = newest.id;
      localStorage.setItem("hamnet_last_audio_id", newest.id);
    }
  } catch(e) {
    console.warn("HAMNET audio fetch failed", e);
  }
  return HAMNET_AUDIO_CACHE;
}

function showHamnetAudioAlert(item) {
  try {
    showTerminalNotification({
      type: "audio",
      headline: "NEW HAMNET AUDIO BROADCAST",
      title: item.title || item.location || "INCOMING TRANSMISSION",
      operator: item.operator || "Unknown",
      faction: item.faction || "—",
      sub: "TAP TO REVIEW IN HAMNET AUDIO",
      action: function() { if (typeof screen !== "undefined" && typeof render === "function") { screen = "hamnetAudio"; render(); } }
    });
  } catch(e) {}
}

function showStationGoLiveNotification(st) {
  try {
    showTerminalNotification({
      type: "station",
      headline: "📡 HAM BROADCASTING STATION — ON AIR",
      title: st.title || "HAM Broadcasting Station",
      operator: st.operator || "Unknown",
      faction: st.faction || "—",
      sub: "TAP TO TUNE IN",
      action: function() {
        if (typeof screen !== "undefined" && typeof render === "function") {
          screen = "hamStation"; render();
          if (typeof startListeningStation === "function") startListeningStation();
          render();
        }
      }
    });
  } catch(e) {}
}

function showTerminalNotification(opts) {
  var existing = document.querySelector(".terminal-notification");
  if (existing) existing.remove();

  var el = document.createElement("div");
  el.className = "terminal-notification terminal-notification-" + (opts.type || "info");
  el.setAttribute("tabindex", "0");
  if (opts.color) el.style.setProperty("--notification-color", opts.color);
  if (opts.glow) el.style.setProperty("--notification-glow", opts.glow);

  var details = "";
  if (opts.location || opts.priority) {
    details += '<div class="tn-row"><span class="tn-label">LOCATION</span><span class="tn-val">' + audioEscape(opts.location || "Unknown") + (opts.priority ? " // " + audioEscape(opts.priority) : "") + '</span></div>';
  }
  if (opts.message) {
    details += '<div class="tn-message">' + audioEscape(opts.message) + '</div>';
  }

  el.innerHTML =
    '<div class="tn-bar">' +
      '<span class="tn-headline">' + audioEscape(opts.headline || "HAMNET ALERT") + '</span>' +
      '<button class="tn-close" title="Dismiss">X</button>' +
    '</div>' +
    '<div class="tn-title">' + audioEscape(opts.title || "INCOMING FIELD REPORT") + '</div>' +
    '<div class="tn-row"><span class="tn-label">OPERATOR</span><span class="tn-val">' + audioEscape(opts.operator || "Unknown") + '</span></div>' +
    '<div class="tn-row"><span class="tn-label">FACTION</span><span class="tn-val">' + audioEscape(opts.faction || "Unknown") + '</span></div>' +
    details +
    (opts.sub ? '<div class="tn-sub">' + audioEscape(opts.sub) + '</div>' : '');

  var root = document.getElementById("terminal") || document.body;
  root.appendChild(el);

  try {
    if (opts.silent !== true) {
      if (typeof playSound === "function") playSound("alert", 0.95);
      if (typeof playSound !== "function" || typeof HAM_AUDIO === "undefined" || !HAM_AUDIO.enabled) {
        var a = new Audio("assets/sounds/alert.mp3");
        a.volume = 0.35;
        a.play().catch(function(){});
      }
    }
  } catch (e) {}

  var autoTimer = setTimeout(function() { if (el.parentNode) el.remove(); }, opts.timeout || 12000);

  el.querySelector(".tn-close").addEventListener("click", function() {
    clearTimeout(autoTimer);
    el.remove();
  });

  if (opts.action) {
    el.addEventListener("click", function(e) {
      if (e.target.classList.contains("tn-close")) return;
      clearTimeout(autoTimer);
      el.remove();
      opts.action();
    });

    el.addEventListener("keydown", function(e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      clearTimeout(autoTimer);
      el.remove();
      opts.action();
      e.preventDefault();
    });
  }
}

function hamnetAudioUploadUnlocked() {
  return (typeof HAM_UNLOCKED !== "undefined") && HAM_UNLOCKED;
}

function normalizeRotjawIdentity(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function isRotjawStationAdmin() {
  var ids = [];
  try {
    var verified = (typeof getVerifiedReportIdentity === "function") ? getVerifiedReportIdentity() : null;
    if (verified) { ids.push(verified.name, verified.operator, verified.characterName, verified.username, verified.id, verified.characterId); }
    var op = getAudioOperatorInfo();
    ids.push(op.operator, op.groupId);
    if (typeof NVMP_CHARACTER !== "undefined" && NVMP_CHARACTER) {
      ids.push(NVMP_CHARACTER.name, NVMP_CHARACTER.id, NVMP_CHARACTER.character_id, NVMP_CHARACTER.username);
    }
    if (typeof NVMP_OPERATOR !== "undefined" && NVMP_OPERATOR) {
      ids.push(NVMP_OPERATOR.display_name, NVMP_OPERATOR.username, NVMP_OPERATOR.global_name, NVMP_OPERATOR.id);
    }
  } catch(e) {}
  return ids.some(function(value) { return normalizeRotjawIdentity(value) === "rotjaw"; });
}

function canUploadHamnetAudio() {
  return audioIdentityVerified() && hamnetAudioUploadUnlocked() && isRotjawStationAdmin();
}

function getHamnetAudioUrl(item) {
  return item && (item.audioDataUrl || item.dataUrl || item.audioUrl || item.url || "");
}

function getHamnetRadioTrackId(item) {
  return String((item && (item.id || item.createdAt || item.filename || item.title)) || "");
}

function getHamnetRadioTracks() {
  return ROTJAWS_RADIO_TRACKS.slice();
}

function getHamnetRadioTrackById(id) {
  id = String(id || "");
  return getHamnetRadioTracks().find(function(track) { return track.id === id; }) || ROTJAWS_RADIO_TRACK;
}

function isRotjawsSongTrack(track) {
  return /^(mto|distordeon)\b/i.test(String((track && track.title) || ""));
}

function shuffleRotjawsTracks(rows) {
  var shuffled = (rows || []).slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

function buildRotjawsRadioQueue() {
  var songs = shuffleRotjawsTracks(getHamnetRadioTracks().filter(isRotjawsSongTrack));
  var voiceSource = getHamnetRadioTracks().filter(function(track) { return !isRotjawsSongTrack(track); });
  var voiceBag = shuffleRotjawsTracks(voiceSource);
  var queue = [];

  function nextVoiceBreak() {
    if (!voiceSource.length) return null;
    if (!voiceBag.length) voiceBag = shuffleRotjawsTracks(voiceSource);
    return voiceBag.shift();
  }

  if (!songs.length) return shuffleRotjawsTracks(voiceSource);

  songs.forEach(function(song) {
    queue.push(song);
    var voice = nextVoiceBreak();
    if (voice) queue.push(voice);
  });

  return queue;
}

function prepareRotjawsRadioQueue(track) {
  HAMNET_RADIO.queue = buildRotjawsRadioQueue();
  HAMNET_RADIO.queueIndex = 0;
  if (track && track.id) {
    var idx = HAMNET_RADIO.queue.findIndex(function(item) { return item.id === track.id; });
    if (idx >= 0) HAMNET_RADIO.queueIndex = idx;
  }
  return HAMNET_RADIO.queue[HAMNET_RADIO.queueIndex] || ROTJAWS_RADIO_TRACK;
}

function getHamnetRadioVolume() {
  if (typeof HAM_AUDIO !== "undefined" && HAM_AUDIO.volume) {
    return Math.max(0, Math.min(1, (HAM_AUDIO.volume.master || 0) * (HAM_AUDIO.volume.radio || 0)));
  }
  return 0.65;
}

function applyHamnetRadioAudioState() {
  if (!HAMNET_RADIO.player) return;
  var masterOff = (typeof HAM_AUDIO !== "undefined" && !HAM_AUDIO.enabled);
  HAMNET_RADIO.player.volume = getHamnetRadioVolume();
  HAMNET_RADIO.player.muted = masterOff || !HAMNET_RADIO.enabled;
}

function getHamnetRadioPlayer() {
  if (!HAMNET_RADIO.player) {
    HAMNET_RADIO.player = new Audio();
    HAMNET_RADIO.player.volume = getHamnetRadioVolume();
    HAMNET_RADIO.player.muted = true;
    HAMNET_RADIO.player.addEventListener("ended", function() {
      if (HAMNET_RADIO.started) playNextHamnetRadioTrack();
    });
    HAMNET_RADIO.player.addEventListener("playing", function() {
      HAMNET_RADIO.error = false;
    });
    HAMNET_RADIO.player.addEventListener("error", function() {
      HAMNET_RADIO.error = true;
      HAMNET_RADIO.enabled = false;
      localStorage.setItem("hamnet_radio_enabled", "0");
      if (typeof screen !== "undefined" && screen === "hamnetAudio" && typeof render === "function") render();
    });
  }
  return HAMNET_RADIO.player;
}

function playNextHamnetRadioTrack() {
  if (!HAMNET_RADIO.queue.length || HAMNET_RADIO.queueIndex >= HAMNET_RADIO.queue.length - 1) {
    var next = prepareRotjawsRadioQueue();
    return startHamnetRadio(next, true, true);
  }
  HAMNET_RADIO.queueIndex += 1;
  return startHamnetRadio(HAMNET_RADIO.queue[HAMNET_RADIO.queueIndex], true, true);
}

function startHamnetRadio(track, keepQueue, preserveAudibleState) {
  var masterOff = (typeof HAM_AUDIO !== "undefined" && !HAM_AUDIO.enabled);
  if (masterOff && !HAMNET_RADIO.started) {
    HAMNET_RADIO.error = true;
    return false;
  }

  var existingPlayer = HAMNET_RADIO.player;
  if (!track && !keepQueue && HAMNET_RADIO.started && existingPlayer && existingPlayer.src) {
    if (!preserveAudibleState) HAMNET_RADIO.enabled = true;
    HAMNET_RADIO.error = false;
    applyHamnetRadioAudioState();
    existingPlayer.play().catch(function() { HAMNET_RADIO.error = true; });
    return true;
  }

  track = keepQueue ? (track || ROTJAWS_RADIO_TRACK) : prepareRotjawsRadioQueue(track);
  var url = getHamnetAudioUrl(track);
  if (!url) return false;

  var player = getHamnetRadioPlayer();
  if (player.getAttribute && player.getAttribute("src") !== url) player.src = url;
  else if (player.src !== url && player.src.indexOf(url) === -1) player.src = url;
  player.loop = getHamnetRadioTracks().length <= 1;
  HAMNET_RADIO.started = true;
  if (!preserveAudibleState) HAMNET_RADIO.enabled = true;
  HAMNET_RADIO.error = false;
  HAMNET_RADIO.currentId = track.id || ROTJAWS_RADIO_TRACK.id;
  localStorage.setItem("hamnet_radio_enabled", "0");
  localStorage.setItem("hamnet_radio_track_id", HAMNET_RADIO.currentId);
  applyHamnetRadioAudioState();
  player.play().catch(function() {
    HAMNET_RADIO.error = true;
  });
  return true;
}

function stopHamnetRadio() {
  HAMNET_RADIO.enabled = false;
  localStorage.setItem("hamnet_radio_enabled", "0");
  applyHamnetRadioAudioState();
}

function syncHamnetRadioAuto() {
  if (!HAMNET_RADIO.started && !HAMNET_RADIO.enabled) return;
  try {
    applyHamnetRadioAudioState();
    var player = getHamnetRadioPlayer();
    if (HAMNET_RADIO.started && (player.paused || !player.src)) startHamnetRadio(null, false, true);
  } catch(e) {}
}

async function sendHamnetAudioBroadcast(payload) {
  if (!isRotjawStationAdmin()) throw new Error("Rotjaw NVMP identity is required to publish station audio.");
  if (!hamnetAudioUploadUnlocked()) throw new Error("HAM ACCESS is required to publish station audio. Unlock HAM Access first.");
  if (!audioIdentityVerified()) throw new Error("A verified NVMP login and active faction are required to publish station audio.");
  var op = getAudioOperatorInfo();
  return hamnetFetchAudio("audio", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(Object.assign({}, op, payload))
  });
}

function renderHamnetAudio() {
  var body = frame("ROTJAWS WASTELAND BROADCAST", "HAMNET RADIO", "CLICK STATION / SIGNAL TO TOGGLE - ESC BACK");
  var wrap = document.createElement("div");
  wrap.className = "audio-wrap pip-radio-wrap";

  var isOn = !!HAMNET_RADIO.enabled;
  var currentTrack = getHamnetRadioTrackById(HAMNET_RADIO.currentId);
  var terminalAudioOn = (typeof HAM_AUDIO === "undefined") || HAM_AUDIO.enabled;
  var tracks = getHamnetRadioTracks();
  var status = !terminalAudioOn
    ? "AUDIO OFF - CLICK TO POWER RADIO"
    : (HAMNET_RADIO.error ? "SIGNAL WAITING FOR AUDIO" : (isOn ? "ON AIR" : "MUTED"));
  var toggleLabel = !terminalAudioOn ? "TURN AUDIO + RADIO ON" : (isOn ? "MUTE RADIO" : "TURN RADIO ON");
  var togglePressed = terminalAudioOn && isOn ? "true" : "false";

  var waveHeights = [18, 42, 26, 72, 34, 92, 48, 64, 28, 82, 38, 58, 20, 74, 44, 96, 30, 68, 52, 88, 24, 60, 36, 78, 46, 54, 22, 84, 40, 70, 32, 90];
  var waveHtml = '<div class="rotjaws-scope radio-click-zone' + (isOn ? '' : ' off') + '"><div class="rotjaws-wave">' +
    waveHeights.map(function(height, idx) {
      return '<span style="--wave-height:' + height + ';--wave-delay:' + idx + '"></span>';
    }).join('') +
    '</div></div>';

  wrap.innerHTML =
    '<div class="audio-card rotjaws-radio-card pip-radio-page">' +
      '<div class="pip-radio-topline pip-radio-topline-clickable"><span>RADIO</span><button type="button" class="pip-radio-mini-action" data-radio-toggle aria-pressed="' + togglePressed + '">' + status + '</button><span>HAMNET SIGNAL</span></div>' +
      '<div class="pip-radio-layout">' +
        '<div class="pip-radio-stations" aria-label="Radio station list">' +
          '<div class="pip-radio-column-title">STATION</div>' +
          '<button class="pip-radio-station selected radio-click-zone" type="button" data-radio-toggle aria-pressed="' + togglePressed + '">' +
            '<span class="pip-radio-caret">&gt;</span><span>Rotjaws Wasteland Broadcast</span>' +
          '</button>' +
          '<button class="pip-radio-side-action" type="button" data-radio-toggle>' + toggleLabel + '</button>' +
          '<div class="pip-radio-muted-line">LOCAL HAMNET SIGNAL</div>' +
          '<div class="pip-radio-muted-line">ARCHIVE TRACKS // ' + tracks.length + '</div>' +
        '</div>' +
        '<div class="pip-radio-display radio-click-zone" role="button" tabindex="0" data-radio-toggle aria-label="Toggle radio display">' +
          '<div class="pip-radio-signal left"></div>' +
          '<div class="pip-radio-logo-frame" aria-hidden="true"><img class="pip-radio-logo" src="assets/radio/rotjaws-wasteland-broadcast-logo.png" alt=""></div>' +
          '<div class="pip-radio-signal right"></div>' +
          '<div class="pip-radio-trackline">' + audioEscape(currentTrack.title || 'Rotjaws Wasteland Broadcast') + '</div>' +
          '<div class="pip-radio-click-hint">CLICK DISPLAY TO ' + (isOn ? 'MUTE' : 'LISTEN') + '</div>' +
        '</div>' +
        '<div class="pip-radio-tuner">' +
          '<button class="pip-radio-meter-button" type="button" data-radio-toggle>' +
            '<span class="pip-radio-meter-label">SIGNAL</span>' +
            waveHtml +
            '<span class="pip-radio-click-hint">CLICK SIGNAL TO ' + (isOn ? 'MUTE' : 'LISTEN') + '</span>' +
          '</button>' +
          '<div class="pip-radio-scale"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
        '</div>' +
      '</div>' +
      '<div class="pip-radio-actions">' +
        '<div id="radioStatus" class="audio-status pip-radio-footer-status">' + (HAMNET_RADIO.error ? 'Waiting for station audio.' : 'Rotjaws station plays in the background when unmuted.') + '</div>' +
        '<button id="radioToggleBtn" class="job-location-btn pip-radio-toggle" data-radio-toggle aria-pressed="' + togglePressed + '">' + toggleLabel + '</button>' +
      '</div>' +
    '</div>';

  body.appendChild(wrap);

  function toggleRadioFromClick() {
    if (!terminalAudioOn && typeof audioInit === "function") audioInit();
    if (HAMNET_RADIO.enabled) stopHamnetRadio();
    else startHamnetRadio();
    render();
  }

  wrap.querySelectorAll("[data-radio-toggle]").forEach(function(control) {
    control.addEventListener("click", function(e) {
      e.preventDefault();
      toggleRadioFromClick();
    });
    control.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleRadioFromClick();
      }
    });
  });

  addBtn(HAMNET_RADIO.enabled ? "MUTE RADIO" : "TURN RADIO ON", function(){
    if (!terminalAudioOn && typeof audioInit === "function") audioInit();
    if (HAMNET_RADIO.enabled) stopHamnetRadio();
    else startHamnetRadio();
    render();
  }, true);
  addBtn("BACK", goBack);
}

function startHamnetAudioPolling() {
  if (window.__hamnetAudioPoller) return;
  window.__hamnetAudioPoller = setInterval(function() {
    fetchHamnetAudio(true).then(function() {
      if (typeof screen !== "undefined" && screen === "hamnetAudio") render();
    });
  }, 20000);
  fetchHamnetAudio(true);
}

/* ===================== HAM BROADCASTING STATION (live audio) ===================== */
/*
  Listeners poll the worker for a rolling buffer of short audio chunks (~8s each,
  recorded by whoever is "live") and play them back to back through one <audio>
  element, simulating a live radio feed. This keeps everything on the same
  free-tier Worker + KV relay used for HAMNET Audio, with no extra services.
*/
const STATION_CHUNK_MS = 5000; // record/upload interval
const STATION_MAX_BROADCAST_MS = 30000; // hard cap: broadcasts can run at most 30 seconds

const STATION = {
  state: { live: false },
  lastStateFetch: 0,
  statusPoller: null,

  // broadcaster side
  recorder: null,
  stream: null,
  broadcastToken: null,
  broadcasting: false,
  startedAt: null,
  autoStopTimer: null,

  // listener side
  listening: false,
  lastSeq: 0,
  chunkQueue: [],
  chunkPoller: null,
  player: null,
  playing: false
};

function getStationPlayer() {
  if (!STATION.player) {
    STATION.player = new Audio();
    STATION.player.addEventListener("ended", function() { STATION.playing = false; playNextStationChunk(); });
    STATION.player.addEventListener("error", function() { STATION.playing = false; playNextStationChunk(); });
  }
  return STATION.player;
}

async function stationFetch(path, options) {
  var res = await fetch(HAMNET_AUDIO_API_BASE + path.replace(/^\//, ""), options || { cache: "no-store" });
  var data = await res.json().catch(function() { return { ok: false, error: "Bad station response" }; });
  if (!res.ok || data.ok === false) throw new Error(data.error || ("Station relay returned " + res.status));
  return data;
}

async function fetchStationState(force) {
  var now = Date.now();
  if (!force && now - STATION.lastStateFetch < 4000) return STATION.state;
  STATION.lastStateFetch = now;
  try {
    var data = await stationFetch("station/state?t=" + now);
    var prevLive = STATION.state.live;
    STATION.state = data.state || { live: false };
    if (!prevLive && STATION.state.live && !STATION.broadcasting) {
      showStationGoLiveNotification(STATION.state);
    }
    if (prevLive && !STATION.state.live) stopListeningStation(true);
  } catch (e) {
    console.warn("Station state fetch failed", e);
  }
  return STATION.state;
}

function startHamStationStatusPolling() {
  if (STATION.statusPoller) return;
  STATION.statusPoller = setInterval(function() {
    fetchStationState(true).then(function() {
      if (typeof screen !== "undefined" && (screen === "hamStation" || screen === "menu")) render();
    });
  }, 6000);
  fetchStationState(true);
}

async function goLiveOnStation(title) {
  if (typeof HAM_UNLOCKED === "undefined" || !HAM_UNLOCKED) throw new Error("HAM ACCESS is required to broadcast. Unlock HAM Access first.");
  if (!audioIdentityVerified()) throw new Error("A verified NVMP login and active faction are required to broadcast.");
  if (STATION.state.live && !STATION.broadcasting) throw new Error((STATION.state.operator || "Another operator") + " is already broadcasting.");

  var op = getAudioOperatorInfo();
  var data = await stationFetch("station/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operator: op.operator, rank: op.rank, faction: op.faction, groupId: op.groupId,
      title: title || "HAM Broadcasting Station"
    })
  });

  STATION.state = data.state;
  STATION.broadcastToken = data.token;
  STATION.broadcasting = true;
  STATION.startedAt = Date.now();

  var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  STATION.stream = stream;

  var mimeType = (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
    ? "audio/webm;codecs=opus" : "audio/webm";
  var recorder = new MediaRecorder(stream, { mimeType: mimeType });
  STATION.recorder = recorder;

  recorder.addEventListener("dataavailable", function(e) {
    if (!e.data || !e.data.size || !STATION.broadcasting) return;
    fileToBase64DataUrl(e.data).then(function(dataUrl) {
      return stationFetch("station/chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: STATION.broadcastToken, mimeType: mimeType, audioDataUrl: dataUrl })
      });
    }).catch(function(err) { console.warn("Station chunk upload failed", err); });
  });

  recorder.start(STATION_CHUNK_MS);

  if (STATION.autoStopTimer) clearTimeout(STATION.autoStopTimer);
  STATION.autoStopTimer = setTimeout(function() {
    stopBroadcastingStation().then(function() {
      if (typeof screen !== "undefined" && screen === "hamStation") render();
    });
  }, STATION_MAX_BROADCAST_MS);

  return STATION.state;
}

async function stopBroadcastingStation() {
  STATION.broadcasting = false;
  if (STATION.autoStopTimer) { clearTimeout(STATION.autoStopTimer); STATION.autoStopTimer = null; }
  try { if (STATION.recorder && STATION.recorder.state !== "inactive") STATION.recorder.stop(); } catch (e) {}
  try { if (STATION.stream) STATION.stream.getTracks().forEach(function(t) { t.stop(); }); } catch (e) {}
  STATION.recorder = null;
  STATION.stream = null;

  if (STATION.broadcastToken) {
    try {
      await stationFetch("station/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: STATION.broadcastToken })
      });
    } catch (e) { console.warn("Station stop failed", e); }
  }
  STATION.broadcastToken = null;
  STATION.startedAt = null;
  await fetchStationState(true);
}

function playNextStationChunk() {
  if (STATION.playing || !STATION.listening || !STATION.chunkQueue.length) return;
  var next = STATION.chunkQueue.shift();
  var player = getStationPlayer();
  player.src = next.dataUrl;
  STATION.playing = true;
  player.play().catch(function() { STATION.playing = false; playNextStationChunk(); });
}

async function pollStationChunks() {
  if (!STATION.listening) return;
  try {
    var data = await stationFetch("station/chunks?since=" + STATION.lastSeq + "&t=" + Date.now());
    var chunks = data.chunks || [];
    chunks.forEach(function(c) {
      STATION.chunkQueue.push(c);
      STATION.lastSeq = Math.max(STATION.lastSeq, c.seq);
    });
    if (chunks.length) playNextStationChunk();
  } catch (e) {
    console.warn("Station chunk poll failed", e);
  }
}

function startListeningStation() {
  if (STATION.listening) return;
  STATION.listening = true;
  STATION.lastSeq = STATION.state.seq ? Math.max(0, STATION.state.seq - 2) : 0; // small catch-up window, not full history
  STATION.chunkQueue = [];
  pollStationChunks();
  STATION.chunkPoller = setInterval(pollStationChunks, STATION_CHUNK_MS / 2);
}

function stopListeningStation(silent) {
  STATION.listening = false;
  STATION.chunkQueue = [];
  if (STATION.chunkPoller) { clearInterval(STATION.chunkPoller); STATION.chunkPoller = null; }
  if (STATION.player) { try { STATION.player.pause(); } catch (e) {} }
  STATION.playing = false;
  if (!silent && typeof screen !== "undefined" && screen === "hamStation") render();
}

function renderHamStation() {
  var body = frame("HAM BROADCASTING STATION", "LIVE FIELD RADIO", "GO LIVE OR TUNE IN • ESC BACK");
  var wrap = document.createElement("div");
  wrap.className = "audio-wrap";

  var op = getAudioOperatorInfo();
  var verified = audioIdentityVerified();
  var hamAccess = (typeof HAM_UNLOCKED !== "undefined") && HAM_UNLOCKED;
  var canBroadcast = verified && hamAccess;
  var st = STATION.state || { live: false };
  var youAreLive = STATION.broadcasting;
  var remainingSec = youAreLive && STATION.startedAt
    ? Math.max(0, Math.ceil((STATION_MAX_BROADCAST_MS - (Date.now() - STATION.startedAt)) / 1000))
    : null;

  var statusHtml = '<div class="audio-card">' +
    '<div class="tp-title">STATION STATUS</div>' +
    (st.live
      ? '<div class="tp-sub">🔴 LIVE — ' + audioEscape(st.title || "HAM Broadcasting Station") + '</div>' +
        '<div class="hamnet-row"><div class="hamnet-label">OPERATOR</div><div class="hamnet-value">' + audioEscape(st.operator) + '</div></div>' +
        '<div class="hamnet-row"><div class="hamnet-label">FACTION</div><div class="hamnet-value">' + audioEscape(st.faction) + '</div></div>'
      : '<div class="tp-sub">⚪ OFFLINE — no active broadcast</div>') +
    '</div>';

  var listenHtml = '<div class="audio-card">' +
    '<div class="tp-title">RECEIVE</div>' +
    (st.live
      ? '<div class="tp-sub">' + (STATION.listening ? "🔊 Receiving signal..." : "Anyone can tune in to listen live.") + '</div>' +
        '<button id="stationListenBtn" class="job-location-btn">' + (STATION.listening ? "STOP LISTENING" : "📻 TUNE IN") + '</button>'
      : '<div class="tp-sub">Nothing to tune in to right now.</div>') +
    '</div>';

  var broadcastLockMsg = !hamAccess
    ? "LOCKED: HAM ACCESS required to broadcast."
    : (!verified ? "LOCKED: verify NVMP login and active faction to broadcast." : "HAM ACCESS verified. You can go live.");

  var broadcastHtml = '<div class="audio-card">' +
    '<div class="tp-title">BROADCAST</div>' +
    '<div class="tp-sub">' + broadcastLockMsg + '</div>' +
    (youAreLive
      ? '<div class="tp-sub">🔴 You are live as ' + audioEscape(op.operator) + (remainingSec !== null ? ' — ' + remainingSec + 's remaining' : '') + '.</div><button id="stationStopBtn" class="job-location-btn">■ STOP BROADCAST</button>'
      : ('<div class="tp-label">STATION TITLE</div><input id="stationTitle" class="audio-input" placeholder="Example: Black Mountain Relay" ' + (canBroadcast ? "" : "disabled") + '>' +
         '<button id="stationGoLiveBtn" class="job-location-btn"' + (canBroadcast && !(st.live) ? "" : " disabled") + '>' + (st.live ? "STATION IN USE" : "📡 GO LIVE (MAX 30s)") + '</button>')) +
    '<div id="stationStatus" class="audio-status">Broadcasts are limited to 30 seconds. Audio is relayed in short rolling segments through HAMNET, not true low-latency streaming — expect a few seconds of delay.</div>' +
    '</div>';

  wrap.innerHTML = statusHtml + listenHtml + broadcastHtml;
  body.appendChild(wrap);

  var listenBtn = wrap.querySelector("#stationListenBtn");
  if (listenBtn) {
    listenBtn.addEventListener("click", function() {
      if (STATION.listening) stopListeningStation();
      else startListeningStation();
      render();
    });
  }

  var goLiveBtn = wrap.querySelector("#stationGoLiveBtn");
  if (goLiveBtn) {
    goLiveBtn.addEventListener("click", async function() {
      var status = wrap.querySelector("#stationStatus");
      try {
        status.textContent = "Requesting microphone access...";
        var title = wrap.querySelector("#stationTitle").value;
        await goLiveOnStation(title);
        status.textContent = "ON AIR. Companions can now tune in.";
        render();
      } catch (err) {
        status.textContent = "GO LIVE FAILED: " + err.message;
      }
    });
  }

  var stopBtn = wrap.querySelector("#stationStopBtn");
  if (stopBtn) {
    stopBtn.addEventListener("click", async function() {
      var status = wrap.querySelector("#stationStatus");
      status.textContent = "Ending broadcast...";
      await stopBroadcastingStation();
      status.textContent = "Broadcast ended.";
      render();
    });
  }

  addBtn("REFRESH", function() { fetchStationState(true).then(render); }, true);
  addBtn("◄ BACK", goBack);
}

/* Persistent live-tune-in widget shown on the main menu, available to everyone (no HAM Access needed to listen). */
function renderStationTuneInBanner(parent) {
  var st = STATION.state || { live: false };
  var banner = document.createElement("div");
  banner.className = "station-banner" + (st.live ? " station-banner-live" : "");
  banner.innerHTML = st.live
    ? '<span class="station-banner-text">🔴 LIVE NOW — ' + audioEscape(st.title || "HAM Broadcasting Station") + ' // ' + audioEscape(st.operator || "Unknown") + '</span>' +
      '<button id="menuTuneInBtn" class="station-banner-btn">' + (STATION.listening ? "STOP LISTENING" : "📻 TUNE IN") + '</button>'
    : '<span class="station-banner-text">📻 HAM Broadcasting Station: offline</span>';
  parent.appendChild(banner);

  var btn = banner.querySelector("#menuTuneInBtn");
  if (btn) {
    btn.addEventListener("click", function() {
      if (STATION.listening) stopListeningStation();
      else startListeningStation();
      render();
    });
  }
}

