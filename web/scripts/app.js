    const STORAGE_KEY = "survivor-simulator-web-v1";
    const DEFAULT_CAST = `Kitty Powers|1|4|3|5|2
Serena Williams|1|3|5|3|4
Dee|1|5|4|4|3
Q|1|4|4|2|3
TJ Klune|1|5|2|4|2
Spongebob|1|2|2|5|2
Peeta|1|3|3|5|3
Wendy Williams|2|4|3|4|2
Pinkie Pie|2|2|3|5|3
Holly|2|3|2|4|2
Lizzie|2|4|3|3|2
Forest|2|3|4|3|4
Balloony|2|2|2|4|2
Tom Holland|2|4|4|4|4`;

    const DEFAULT_SETTINGS = {
      castText: DEFAULT_CAST,
      seed: "starter-season",
      startingTribeMode: "manual",
      startingTribes: 2,
      startingTribeLabels: [],
      startingTribeColors: [],
      finalistsCount: 2,
      jurySize: 7,
      twistEvents: [
        { type: "swap", remaining: 12, tribes: 3 },
        { type: "merge", remaining: 9 }
      ],
      advantagesEnabled: true,
      seedStartingTribeIdols: true,
      seedMergeIdol: true,
      auctionEnabled: false,
      advantageSeeds: []
    };

    const ADVANTAGE_TYPES = [
      { value: "idol", label: "Hidden Immunity Idol" },
      { value: "super_idol", label: "Super Idol" },
      { value: "double_idol", label: "Double Idol" },
      { value: "legacy_adv", label: "Legacy Advantage" },
      { value: "coin_50_50", label: "50/50 Coin" },
      { value: "idol_nullifier", label: "Idol Nullifier" },
      { value: "vote_steal", label: "Vote Steal" },
      { value: "vote_block", label: "Vote Block" },
      { value: "knowledge_is_power", label: "Knowledge Is Power" },
      { value: "extra_vote", label: "Extra Vote" },
      { value: "safety_without_power", label: "Safety Without Power" },
      { value: "fake_idol_kit", label: "Fake Idol Kit" }
    ];

    const ADVANTAGE_LOCATIONS = [
      { value: "random", label: "Random" },
      { value: "camp", label: "Camp" },
      { value: "tribe_beach", label: "Tribe beach" },
      { value: "merge_camp", label: "Merge camp" },
      { value: "exile", label: "Exile" },
      { value: "journey", label: "Journey" },
      { value: "auction", label: "Auction" },
      { value: "reward", label: "Reward" },
      { value: "challenge", label: "Challenge" },
      { value: "sit_out_bench", label: "Sit-out bench" }
    ];

    const LEGACY_TRIBE_COLOR_NAMES = [
      "Indigo",
      "Maroon",
      "Brown",
      "Teal",
      "Gold",
      "Cyan",
      "Coral",
      "Navy",
      "Lime",
      "Silver"
    ];
    const DISTINCT_TRIBE_COLORS = [
      "#2563eb", // blue
      "#dc2626", // red
      "#16a34a", // green
      "#f59e0b", // amber
      "#7c3aed", // violet
      "#0891b2", // cyan
      "#db2777", // magenta
      "#65a30d", // lime
      "#ea580c", // orange
      "#0f766e", // teal
      "#4f46e5", // indigo
      "#9333ea", // purple
      "#64748b", // slate
      "#be123c", // rose
      "#0d9488", // bright teal
      "#ca8a04"  // gold
    ];
    let activeTribeColorMap = new Map();

    const PREMERGE_REWARDS = ["Food", "Supplies", "Fishing Gear", "Comfort"];
    const MERGE_REWARDS = ["Spa", "Food", "Camp Feast", "Letters From Home"];
    const EVENT_DSL_LIBRARY = Array.isArray(window.SURVIVOR_EVENT_DSL_LIBRARY)
      ? window.SURVIVOR_EVENT_DSL_LIBRARY
      : [];
    const CONFESSIONAL_LIBRARY = window.SURVIVOR_CONFESSIONAL_LIBRARY || {};
    const ALLIANCE_NAME_PREFIXES = [
      "Sunset",
      "Shelter",
      "Torch",
      "Tide",
      "Jungle",
      "Palm",
      "Smoke",
      "Reef",
      "Coconut",
      "Bamboo",
      "Flint",
      "Ember",
      "Wave",
      "Canopy",
      "Storm"
    ];
    const ALLIANCE_NAME_SUFFIXES = [
      "Alliance",
      "Bloc",
      "Collective",
      "Crew",
      "Pact",
      "Majority",
      "Syndicate",
      "Circle",
      "Unit",
      "Connection",
      "Coalition",
      "Numbers"
    ];

    const castEditorBody = document.getElementById("castEditorBody");
    const tribeBuilderHint = document.getElementById("tribeBuilderHint");
    const tribeNamesContainer = document.getElementById("tribeNamesContainer");
    const tribeBoard = document.getElementById("tribeBoard");
    const addPlayerButton = document.getElementById("addPlayerButton");
    const loadTestingCastButton = document.getElementById("loadTestingCastButton");
    const seedInput = document.getElementById("seedInput");
    const startingTribeModeInput = document.getElementById("startingTribeModeInput");
    const startingTribesInput = document.getElementById("startingTribesInput");
    const finalistsInput = document.getElementById("finalistsInput");
    const juryInput = document.getElementById("juryInput");
    const addTwistButton = document.getElementById("addTwistButton");
    const twistEventsBody = document.getElementById("twistEventsBody");
    const advantagesEnabledInput = document.getElementById("advantagesEnabledInput");
    const advantageControls = document.getElementById("advantageControls");
    const seedStartingTribeIdolsInput = document.getElementById("seedStartingTribeIdolsInput");
    const seedMergeIdolInput = document.getElementById("seedMergeIdolInput");
    const auctionEnabledInput = document.getElementById("auctionEnabledInput");
    const advantageSearchInput = document.getElementById("advantageSearchInput");
    const advantageTypeInput = document.getElementById("advantageTypeInput");
    const addAdvantageButton = document.getElementById("addAdvantageButton");
    const advantageSeedsBody = document.getElementById("advantageSeedsBody");
    const runButton = document.getElementById("runButton");
    const resetButton = document.getElementById("resetButton");
    const copyButton = document.getElementById("copyButton");
    const downloadButton = document.getElementById("downloadButton");
    const tabButtons = Array.from(document.querySelectorAll(".tab-button[data-tab-target]"));
    const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
    const resultsTabButton = document.getElementById("resultsTabButton");

    const winnerValue = document.getElementById("winnerValue");
    const winnerMeta = document.getElementById("winnerMeta");
    const winnerPhotoWrap = document.getElementById("winnerPhotoWrap");
    const winnerPhoto = document.getElementById("winnerPhoto");
    const finalistsValue = document.getElementById("finalistsValue");
    const voteValue = document.getElementById("voteValue");
    const shapeValue = document.getElementById("shapeValue");
    const shapeMeta = document.getElementById("shapeMeta");
    const episodeValue = document.getElementById("episodeValue");
    const episodeMeta = document.getElementById("episodeMeta");
    const placementsBody = document.getElementById("placementsBody");
    const votingHistoryBody = document.getElementById("votingHistoryBody");
    const juryVoteBody = document.getElementById("juryVoteBody");
    const allianceSummary = document.getElementById("allianceSummary");
    const allianceHistoryList = document.getElementById("allianceHistoryList");
    const socialGraphWrap = document.getElementById("socialGraphWrap");
    const seasonLog = document.getElementById("seasonLog");
    const runMeta = document.getElementById("runMeta");
    const logMeta = document.getElementById("logMeta");
    const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/";

    let latestLogText = "";
    let castEditorRows = [];
    let twistEventRows = [];
    let advantageSeedRows = [];
    let startingTribeNameRows = [];
    let startingTribeColorRows = [];
    let draggingTribeIndex = null;
    let hasSimulatedSeason = false;
    let pyodideRuntimePromise = null;
    let pythonEngineReady = false;

    function updateResultsTabAvailability() {
      if (!resultsTabButton) {
        return;
      }
      resultsTabButton.disabled = !hasSimulatedSeason;
      resultsTabButton.setAttribute("aria-disabled", hasSimulatedSeason ? "false" : "true");
      if (!hasSimulatedSeason) {
        resultsTabButton.tabIndex = -1;
      }
    }

    function setActiveTab(panelId) {
      if (panelId === "resultsPanel" && !hasSimulatedSeason) {
        panelId = "setupPanel";
      }

      tabButtons.forEach((button) => {
        const isActive = button.dataset.tabTarget === panelId;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
        button.tabIndex = isActive ? 0 : -1;
      });

      tabPanels.forEach((panel) => {
        panel.hidden = panel.id !== panelId;
      });
    }

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) {
          return;
        }
        setActiveTab(button.dataset.tabTarget);
      });
    });

    function hashSeed(seedText) {
      const text = String(seedText || "").trim() || String(Date.now());
      let h = 1779033703 ^ text.length;
      for (let i = 0; i < text.length; i += 1) {
        h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
      }
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^ (h >>> 16)) >>> 0;
    }

    class RNG {
      constructor(seedText) {
        this.seedText = String(seedText || "").trim() || "auto";
        this.state = hashSeed(seedText);
        if (this.state === 0) {
          this.state = 0x6d2b79f5;
        }
      }

      float() {
        this.state += 0x6d2b79f5;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      }

      int(min, max) {
        return Math.floor(this.float() * (max - min + 1)) + min;
      }

      choice(items) {
        if (!items.length) {
          return null;
        }
        return items[this.int(0, items.length - 1)];
      }

      shuffle(items) {
        const arr = items.slice();
        for (let i = arr.length - 1; i > 0; i -= 1) {
          const j = this.int(0, i);
          const tmp = arr[i];
          arr[i] = arr[j];
          arr[j] = tmp;
        }
        return arr;
      }
    }

    const TRIBE_NAME_CONSONANTS = Array.from("bcdfghjklmnpqrstvwxyz");
    const TRIBE_NAME_VOWELS = Array.from("aeiou");
    const TRIBE_SYLLABLE_PATTERNS = ["cv", "vc", "cvc", "vcv"];

    function randomTribeSyllable(rng) {
      const pattern = rng.choice(TRIBE_SYLLABLE_PATTERNS) || "cv";
      let syllable = "";
      for (const marker of pattern) {
        syllable += marker === "c"
          ? (rng.choice(TRIBE_NAME_CONSONANTS) || "t")
          : (rng.choice(TRIBE_NAME_VOWELS) || "a");
      }
      return syllable;
    }

    function randomTribeWord(rng) {
      const roll = rng.float();
      const syllableCount = roll < 0.52 ? 2 : roll < 0.92 ? 3 : 4;
      let word = "";
      for (let index = 0; index < syllableCount; index += 1) {
        word += randomTribeSyllable(rng);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    function randomTribeName(rng, usedNames) {
      const used = usedNames || new Set();
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const wordCount = rng.float() < 0.80 ? 1 : 2;
        const parts = [];
        for (let index = 0; index < wordCount; index += 1) {
          parts.push(randomTribeWord(rng));
        }
        const name = parts.join(" ");
        const key = name.toLowerCase();
        if (!used.has(key)) {
          used.add(key);
          return name;
        }
      }
      let fallbackIndex = used.size + 1;
      while (used.has(("Tavu" + fallbackIndex).toLowerCase())) {
        fallbackIndex += 1;
      }
      const fallback = "Tavu" + fallbackIndex;
      used.add(fallback.toLowerCase());
      return fallback;
    }

    function seededTribeNameRng(context) {
      return new RNG((seedInput ? seedInput.value : "") + ":" + context + ":" + Date.now() + ":" + Math.random());
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function slugify(text, index) {
      const slug = String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      return slug || "player_" + index;
    }

    function asInt(value) {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }

    function asArray(value) {
      if (Array.isArray(value)) {
        return value;
      }
      if (value && typeof value === "object") {
        return Object.values(value);
      }
      return [];
    }

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function distinctTribeColor(index, total) {
      if (index < DISTINCT_TRIBE_COLORS.length) {
        return DISTINCT_TRIBE_COLORS[index];
      }
      const hue = Math.round((index * 137.508) % 360);
      const lightness = total > 12 && index % 2 ? 38 : 48;
      return "hsl(" + hue + " 68% " + lightness + "%)";
    }

    function buildTribeColorMap(labels) {
      const uniqueLabels = [];
      const seen = new Set();
      (labels || []).forEach((label) => {
        const clean = String(label || "").trim();
        const key = clean.toLowerCase();
        if (!clean || seen.has(key)) {
          return;
        }
        seen.add(key);
        uniqueLabels.push(clean);
      });
      return new Map(uniqueLabels.map((label, index) => [
        label,
        distinctTribeColor(index, uniqueLabels.length)
      ]));
    }

    function setActiveTribeColors(labels, overrides) {
      activeTribeColorMap = buildTribeColorMap(labels);
      Object.entries(overrides || {}).forEach(([label, color]) => {
        const cleanLabel = String(label || "").trim();
        const cleanColor = normalizeHexColor(color);
        if (cleanLabel && cleanColor) {
          activeTribeColorMap.set(cleanLabel, cleanColor);
        }
      });
    }

    function tribeColor(label) {
      const clean = String(label || "").trim();
      if (clean && activeTribeColorMap.has(clean)) {
        return activeTribeColorMap.get(clean);
      }

      const named = {
        Indigo: "#5f4b8b",
        Maroon: "#7a2f3b",
        Brown: "#8a6642",
        Teal: "#2c7a7b",
        Gold: "#c9a227",
        Cyan: "#278ea5",
        Coral: "#d97b66",
        Navy: "#314a68",
        Lime: "#8aa63a",
        Silver: "#99a0a8",
        Merged: "#8a6642"
      };

      if (named[clean]) {
        return named[clean];
      }

      const key = clean || "Tribe";
      let hash = 0;
      for (let index = 0; index < key.length; index += 1) {
        hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0;
      }
      const hue = Math.abs(hash) % 360;
      return "hsl(" + hue + " 45% 72%)";
    }

    function textColorForBackground(color) {
      if (!color) {
        return "#1d221f";
      }

      if (color.startsWith("hsl")) {
        const match = color.match(/hsl\(\s*\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+(\d+(?:\.\d+)?)%/i);
        const lightness = match ? Number.parseFloat(match[1]) : 72;
        return lightness < 56 ? "#fff8ec" : "#1d221f";
      }

      const hex = color.replace("#", "");
      if (hex.length !== 6) {
        return "#1d221f";
      }

      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
      return luminance < 150 ? "#fff8ec" : "#1d221f";
    }

    function normalizeHexColor(value) {
      const raw = String(value || "").trim();
      if (!raw) {
        return "";
      }
      const prefixed = raw.startsWith("#") ? raw : "#" + raw;
      return /^#[0-9a-fA-F]{6}$/.test(prefixed) ? prefixed.toLowerCase() : "";
    }

    function tribeStyle(label) {
      const background = tribeColor(label);
      const color = textColorForBackground(background);
      return ' style="background-color: ' + escapeHtml(background) + "; color: " + escapeHtml(color) + ';"';
    }

    function customTribeColorMap(labels, colors) {
      const map = new Map();
      const cleanColors = cloneTribeColors(colors || []);
      cloneTribeLabels(labels || []).forEach((label, index) => {
        const color = cleanColors[index] || "";
        if (label && color) {
          map.set(label, color);
        }
      });
      return map;
    }

    function phaseName(phase) {
      if (phase === "merged") {
        return "Merged Tribes";
      }
      if (phase === "demerged") {
        return "Demerged Tribes";
      }
      if (phase === "swapped") {
        return "Swapped Tribes";
      }
      return "Original Tribes";
    }

    function normalizeEditorStat(value) {
      return clamp(asInt(value) || 3, 1, 5);
    }

    function maxTribesForPlayers(playerCount) {
      return Math.max(1, Math.floor(Math.max(0, playerCount) / 3));
    }

    function enforceStartingTribeLimit(commitValue) {
      const namedCount = castEditorRows.filter((row) => row.name.trim().length).length;
      const manualSetup = startingTribeModeInput.value !== "random";
      const maxTribes = manualSetup
        ? Math.max(1, namedCount || DISTINCT_TRIBE_COLORS.length)
        : Math.max(1, maxTribesForPlayers(namedCount || 0));
      startingTribesInput.max = String(maxTribes);
      const rawValue = String(startingTribesInput.value || "").trim();
      const parsedValue = asInt(rawValue);
      const current = parsedValue == null ? (DEFAULT_SETTINGS.startingTribes || 2) : parsedValue;
      const next = clamp(current, 1, maxTribes);
      if (commitValue !== false) {
        startingTribesInput.value = String(next);
      }
      return next;
    }

    function defaultEditorTribe() {
      const tribeCount = enforceStartingTribeLimit(false);
      const namedRows = castEditorRows.filter((row) => row.name.trim().length);
      return String((namedRows.length % tribeCount) + 1);
    }

    function createEditorRow(data) {
      return {
        name: String(data && data.name ? data.name : ""),
        photo: String(data && data.photo ? data.photo : ""),
        tribe: String(data && data.tribe != null ? data.tribe : ""),
        strategy: normalizeEditorStat(data && data.strategy),
        threat: normalizeEditorStat(data && data.threat),
        social: normalizeEditorStat(data && data.social),
        challenge: normalizeEditorStat(data && data.challenge)
      };
    }

    function parseEditorCast(castText, existingRows) {
      const priorRows = existingRows || [];
      return String(castText || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line, index) => {
          const parts = line.split("|").map((part) => part.trim());
          return createEditorRow({
            name: parts[0] || "",
            photo: priorRows[index] && priorRows[index].photo ? priorRows[index].photo : "",
            tribe: parts[1] || "",
            strategy: parts[2],
            threat: parts[3],
            social: parts[4],
            challenge: parts[5]
          });
        });
    }

    function serializeEditorCast(rows) {
      return rows
        .filter((row) => row.name.trim().length)
        .map((row) => [
          row.name.trim(),
          row.tribe.trim(),
          row.strategy,
          row.threat,
          row.social,
          row.challenge
        ].join("|"))
        .join("\n");
    }

    function buildStatOptions(selected) {
      let html = "";
      for (let value = 1; value <= 5; value += 1) {
        html += '<option value="' + value + '"' + (value === selected ? " selected" : "") + ">" + value + "</option>";
      }
      return html;
    }

    function normalizeManualTribeAssignments() {
      const tribeCount = enforceStartingTribeLimit(false);
      for (const row of castEditorRows) {
        if (!row.name.trim().length) {
          continue;
        }
        const tribeNumber = asInt(row.tribe);
        if (tribeNumber == null || tribeNumber < 1 || tribeNumber > tribeCount) {
          row.tribe = defaultEditorTribe();
        } else {
          row.tribe = String(tribeNumber);
        }
      }
    }

    function normalizeStartingTribeNameRows() {
      const tribeCount = Math.max(1, asInt(startingTribesInput.value) || DEFAULT_SETTINGS.startingTribes || 2);
      while (startingTribeNameRows.length < tribeCount) {
        startingTribeNameRows.push("");
      }
      while (startingTribeColorRows.length < tribeCount) {
        startingTribeColorRows.push("");
      }
      if (startingTribeNameRows.length > tribeCount) {
        startingTribeNameRows = startingTribeNameRows.slice(0, tribeCount);
      }
      if (startingTribeColorRows.length > tribeCount) {
        startingTribeColorRows = startingTribeColorRows.slice(0, tribeCount);
      }
    }

    function renderTribeNameControls() {
      if (!tribeNamesContainer) {
        return;
      }
      normalizeStartingTribeNameRows();
      const tribeCount = Math.max(1, asInt(startingTribesInput.value) || DEFAULT_SETTINGS.startingTribes || 2);
      let html = "";
      for (let index = 0; index < tribeCount; index += 1) {
        const pickerColor = normalizeHexColor(startingTribeColorRows[index]) || distinctTribeColor(index, tribeCount);
        html += '<div class="field tribe-name-field"><label>Tribe ' + (index + 1) + ' name</label><div class="tribe-name-control"><input data-tribe-name-index="' + index + '" type="text" placeholder="Auto-generate if blank" value="' + escapeHtml(startingTribeNameRows[index] || "") + '"><button class="secondary compact-button" data-action="randomize-starting-tribe-name" data-tribe-name-index="' + index + '" type="button">Randomize</button></div>'
          + '<label class="tribe-color-label">Color</label><div class="tribe-color-control"><input data-tribe-color-picker-index="' + index + '" type="color" value="' + escapeHtml(pickerColor) + '"><input data-tribe-color-hex-index="' + index + '" type="text" inputmode="text" placeholder="Auto color" value="' + escapeHtml(startingTribeColorRows[index] || "") + '"></div></div>';
      }
      tribeNamesContainer.innerHTML = html;
    }

    function cloneTribeLabels(labels) {
      return (labels || []).map((label) => String(label || "").trim());
    }

    function cloneTribeColors(colors) {
      return (colors || []).map((color) => normalizeHexColor(color));
    }

    function twistTribeLabelsFor(event) {
      if (!event || (event.type !== "swap" && event.type !== "demerge")) {
        return [];
      }
      const count = Math.max(2, asInt(event.tribes) || 2);
      const labels = cloneTribeLabels(event.tribeLabels);
      while (labels.length < count) {
        labels.push("");
      }
      return labels.slice(0, count);
    }

    function createTwistEvent(data) {
      const type = (data && data.type) || "merge";
      let remaining = Math.max(2, asInt(data && data.remaining) || 9);
      let tribes = Math.max(2, asInt(data && data.tribes) || 2);
      if (type === "swap" || type === "demerge") {
        remaining = Math.max(6, remaining);
        tribes = clamp(tribes, 2, Math.max(2, maxTribesForPlayers(remaining)));
      }
      return {
        type,
        remaining,
        tribes,
        tribeLabels: (type === "swap" || type === "demerge") ? twistTribeLabelsFor({ type, tribes, tribeLabels: data && data.tribeLabels }) : [],
        immunity: data && data.immunity === false ? false : true
      };
    }

    function cloneTwistEvents(events) {
      return (events || []).map((event) => createTwistEvent(event));
    }

    function createAdvantageSeed(data) {
      const typeValues = new Set(ADVANTAGE_TYPES.map((item) => item.value));
      const locationValues = new Set(ADVANTAGE_LOCATIONS.map((item) => item.value));
      const timing = data && data.timing && typeof data.timing === "object" ? data.timing : {};
      const timingKind = String(timing.kind || data?.timingKind || "pre_merge");
      const validTimingKinds = ["starting_tribe", "pre_merge", "swap", "merge", "auction", "final_remaining"];
      const normalizedKind = validTimingKinds.includes(timingKind) ? timingKind : "pre_merge";
      const remaining = Math.max(2, asInt(timing.remainingPlayers ?? data?.remainingPlayers) || 6);
      return {
        advantageType: typeValues.has(data?.advantageType) ? data.advantageType : ADVANTAGE_TYPES[0].value,
        timing: {
          kind: normalizedKind,
          remainingPlayers: normalizedKind === "final_remaining" ? remaining : null
        },
        location: locationValues.has(data?.location) ? data.location : "random",
        enabled: data && data.enabled === false ? false : true
      };
    }

    function cloneAdvantageSeeds(seeds) {
      return (seeds || []).map((seed) => createAdvantageSeed(seed));
    }

    function hasTwistType(type) {
      return twistEventRows.some((event) => event.type === type);
    }

    function hasAuctionEnabled() {
      return Boolean(auctionEnabledInput && auctionEnabledInput.checked);
    }

    function availableAdvantageTimings() {
      const timings = [
        { value: "starting_tribe", label: "Starting tribes" },
        { value: "pre_merge", label: "Pre-merge" },
        { value: "merge", label: "Merge" },
        { value: "final_remaining", label: "Players remaining" }
      ];
      if (hasTwistType("swap")) {
        timings.splice(2, 0, { value: "swap", label: "Swap" });
      }
      if (hasAuctionEnabled()) {
        timings.splice(timings.length - 1, 0, { value: "auction", label: "Auction" });
      }
      return timings;
    }

    function normalizeAdvantageSeedRows() {
      const timingValues = new Set(availableAdvantageTimings().map((item) => item.value));
      advantageSeedRows = cloneAdvantageSeeds(advantageSeedRows).map((seed) => {
        if (!timingValues.has(seed.timing.kind)) {
          seed.timing.kind = seed.timing.kind === "auction" ? "pre_merge" : "merge";
          seed.timing.remainingPlayers = null;
        }
        if (!hasAuctionEnabled() && seed.location === "auction") {
          seed.location = "random";
        }
        return seed;
      });
    }

    function advantageLabel(value) {
      const found = ADVANTAGE_TYPES.find((item) => item.value === value);
      return found ? found.label : value;
    }

    function renderAdvantageTypeOptions() {
      const search = String(advantageSearchInput ? advantageSearchInput.value : "").trim().toLowerCase();
      const matches = ADVANTAGE_TYPES.filter((item) => !search || item.label.toLowerCase().includes(search) || item.value.includes(search));
      const options = (matches.length ? matches : ADVANTAGE_TYPES).map((item) => (
        '<option value="' + escapeHtml(item.value) + '">' + escapeHtml(item.label) + "</option>"
      ));
      advantageTypeInput.innerHTML = options.join("");
    }

    function renderAdvantageSeeds() {
      if (!advantageSeedsBody || !advantageControls || !advantagesEnabledInput) {
        return;
      }
      const enabled = advantagesEnabledInput.checked;
      advantageControls.hidden = !enabled;
      if (!enabled) {
        return;
      }

      normalizeAdvantageSeedRows();
      const timingOptions = availableAdvantageTimings();
      const locationOptions = ADVANTAGE_LOCATIONS.filter((item) => hasAuctionEnabled() || item.value !== "auction");

      if (!advantageSeedRows.length) {
        advantageSeedsBody.innerHTML = '<p class="twist-note">No user-seeded advantages yet.</p>';
        return;
      }

      advantageSeedsBody.innerHTML = advantageSeedRows.map((seed, index) => {
        const timingSelect = timingOptions.map((item) => (
          '<option value="' + escapeHtml(item.value) + '"' + (seed.timing.kind === item.value ? " selected" : "") + ">" + escapeHtml(item.label) + "</option>"
        )).join("");
        const locationSelect = locationOptions.map((item) => (
          '<option value="' + escapeHtml(item.value) + '"' + (seed.location === item.value ? " selected" : "") + ">" + escapeHtml(item.label) + "</option>"
        )).join("");
        const finalInput = seed.timing.kind === "final_remaining"
          ? '<div class="field"><label>Players left</label><input data-advantage-index="' + index + '" data-advantage-field="remainingPlayers" type="number" min="2" step="1" value="' + escapeHtml(seed.timing.remainingPlayers || 6) + '"></div>'
          : "";
        return '<div class="twist-row' + (seed.enabled ? "" : " advantage-row-disabled") + '">'
          + '<div class="twist-row-head"><div class="twist-row-title">' + escapeHtml(advantageLabel(seed.advantageType)) + '</div><button class="row-remove" data-action="remove-advantage" data-advantage-index="' + index + '" type="button">Remove</button></div>'
          + '<div class="twist-grid">'
          + '<label class="check-row"><input data-advantage-index="' + index + '" data-advantage-field="enabled" type="checkbox"' + (seed.enabled ? " checked" : "") + '><span>Enabled</span></label>'
          + '<div class="field"><label>Timing</label><select data-advantage-index="' + index + '" data-advantage-field="timingKind">' + timingSelect + "</select></div>"
          + finalInput
          + '<div class="field"><label>Location</label><select data-advantage-index="' + index + '" data-advantage-field="location">' + locationSelect + "</select></div>"
          + "</div>"
          + '<p class="twist-note">Copy ' + (index + 1) + ' will be hidden when that timing is reached.</p>'
          + "</div>";
      }).join("");
    }

    function defaultTwistEventsFromSettings(settings) {
      if (settings && Array.isArray(settings.twistEvents) && settings.twistEvents.length) {
        return cloneTwistEvents(settings.twistEvents);
      }
      const events = [];
      if (settings && asInt(settings.swapAt) > 0) {
        events.push(createTwistEvent({
          type: "swap",
          remaining: settings.swapAt,
          tribes: settings.swapTribes
        }));
      }
      if (settings && asInt(settings.mergeAt) > 0) {
        events.push(createTwistEvent({
          type: "merge",
          remaining: settings.mergeAt
        }));
      }
      return events.length ? events : cloneTwistEvents(DEFAULT_SETTINGS.twistEvents);
    }

    function twistExileInfo(event) {
      const tribes = Math.max(1, asInt(event.tribes) || 1);
      const remaining = Math.max(0, asInt(event.remaining) || 0);
      const tribeSize = Math.floor(remaining / tribes);
      const exileCount = remaining % tribes;
      return {
        tribes,
        remaining,
        tribeSize,
        exileCount
      };
    }

    function hasEarlierMergeTwist(rows, targetIndex) {
      const target = rows[targetIndex];
      if (!target || target.type !== "demerge") {
        return true;
      }
      return rows.some((event, index) => (
        index !== targetIndex
        && event.type === "merge"
        && asInt(event.remaining) > asInt(target.remaining)
      ));
    }

    function renderTwistEvents() {
      if (!twistEventRows.length) {
        twistEventsBody.innerHTML = '<p class="twist-note">No twists scheduled yet. Add a merge, swap, or demerge event.</p>';
        renderAdvantageSeeds();
        return;
      }

      twistEventsBody.innerHTML = twistEventRows.map((event, index) => {
        const exile = twistExileInfo(event);
        let note = "";
      if (event.type === "merge") {
        note = "At " + event.remaining + " players, everyone merges, there is individual immunity, and all players attend tribal together.";
      } else if (event.type === "swap") {
        note = "At " + event.remaining + " players, this makes " + exile.tribes + " tribe" + (exile.tribes === 1 ? "" : "s") + " of " + exile.tribeSize + (exile.exileCount ? " with " + exile.exileCount + " sent to exile island." : " with no one sent to exile island.") + " No tribe can have fewer than 3 contestants.";
      } else {
        const warning = hasEarlierMergeTwist(twistEventRows, index)
          ? ""
          : ' <span class="twist-warning">Add an earlier merge event first.</span>';
        note = "At " + event.remaining + " players, this splits the merged tribe into " + exile.tribes + " tribe" + (exile.tribes === 1 ? "" : "s") + " of " + exile.tribeSize + (exile.exileCount ? " with " + exile.exileCount + " sent to exile island." : " with no one sent to exile island.") + " No tribe can have fewer than 3 contestants. One contestant from each demerge tribe wins individual immunity, every demerge tribe attends its own Tribal Council, and everyone remerges the next episode." + warning;
      }
        const tribeLabelFields = (event.type === "swap" || event.type === "demerge")
          ? '<div class="twist-tribe-names">' + twistTribeLabelsFor(event).map((label, tribeIndex) => (
            '<div class="field tribe-name-field"><label>Tribe ' + (tribeIndex + 1) + ' name</label><div class="tribe-name-control"><input data-twist-index="' + index + '" data-twist-label-index="' + tribeIndex + '" data-twist-field="tribeLabel" type="text" placeholder="Reuse or randomize" value="' + escapeHtml(label) + '"><button class="secondary compact-button" data-action="randomize-twist-tribe-name" data-twist-index="' + index + '" data-twist-label-index="' + tribeIndex + '" type="button">Randomize</button></div></div>'
          )).join("") + "</div>"
          : "";

        return '<div class="twist-row">'
          + '<div class="twist-row-head"><div class="twist-row-title">Twist ' + (index + 1) + '</div><button class="row-remove" data-action="remove-twist" data-twist-index="' + index + '" type="button">Remove</button></div>'
          + '<div class="twist-grid">'
          + '<div class="field"><label>Twist type</label><select data-twist-index="' + index + '" data-twist-field="type"><option value="merge"' + (event.type === "merge" ? " selected" : "") + '>Merge</option><option value="swap"' + (event.type === "swap" ? " selected" : "") + '>Swap</option><option value="demerge"' + (event.type === "demerge" ? " selected" : "") + '>Demerge</option></select></div>'
          + '<div class="field"><label>At players remaining</label><input data-twist-index="' + index + '" data-twist-field="remaining" type="number" min="2" step="1" value="' + escapeHtml(event.remaining) + '"></div>'
          + ((event.type === "swap" || event.type === "demerge")
            ? '<div class="field"><label>' + (event.type === "swap" ? "Swap into tribes" : "Demerge into tribes") + '</label><input data-twist-index="' + index + '" data-twist-field="tribes" type="number" min="2" step="1" value="' + escapeHtml(event.tribes) + '"></div>'
            : "")
          + "</div>"
          + tribeLabelFields
          + '<p class="twist-note">' + note + "</p>"
          + "</div>";
      }).join("");
      renderAdvantageSeeds();
    }

    function renderCastEditor() {
      if (!castEditorRows.length) {
        castEditorRows = [createEditorRow({ tribe: defaultEditorTribe() })];
      }

      let html = "";
      for (let index = 0; index < castEditorRows.length; index += 1) {
        const row = castEditorRows[index];
        const previewHtml = row.photo
          ? '<img class="photo-preview" alt="Player photo preview" src="' + escapeHtml(row.photo) + '">'
          : '<span class="photo-placeholder">Photo</span>';
        html += "<tr>"
          + '<td><input class="player-name-input" data-index="' + index + '" data-field="name" type="text" placeholder="Player name" value="' + escapeHtml(row.name) + '"></td>'
          + '<td class="photo-cell"><div class="photo-uploader">' + previewHtml
          + '<input class="photo-input" data-index="' + index + '" data-field="photo" type="file" accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.avif,.bmp,.svg">'
          + '<button class="photo-clear" data-action="clear-photo" data-index="' + index + '" type="button">Clear</button></div></td>'
          + '<td><select class="stat-select" data-index="' + index + '" data-field="strategy">' + buildStatOptions(row.strategy) + "</select></td>"
          + '<td><select class="stat-select" data-index="' + index + '" data-field="threat">' + buildStatOptions(row.threat) + "</select></td>"
          + '<td><select class="stat-select" data-index="' + index + '" data-field="social">' + buildStatOptions(row.social) + "</select></td>"
          + '<td><select class="stat-select" data-index="' + index + '" data-field="challenge">' + buildStatOptions(row.challenge) + "</select></td>"
          + '<td class="cast-row-actions"><button class="row-remove" data-action="remove-player" data-index="' + index + '" type="button">Remove</button></td>'
          + "</tr>";
      }
      castEditorBody.innerHTML = html;
    }

    function renderTribeBuilder() {
      const manualTribes = startingTribeModeInput.value !== "random";
      renderTribeNameControls();
      const namedRows = castEditorRows
        .map((row, index) => ({ row, index }))
        .filter((entry) => entry.row.name.trim().length);

      if (!manualTribes) {
        tribeBuilderHint.textContent = "Switch the starting tribe setup back to manual if you want to choose who starts on each tribe.";
        tribeBoard.innerHTML = '<div class="tribe-board-empty">Random starting tribes are on, so the drag-and-drop tribe board is hidden.</div>';
        return;
      }

      if (!namedRows.length) {
        tribeBuilderHint.textContent = "Once players have names, you can assign them to starting tribes here.";
        tribeBoard.innerHTML = '<div class="tribe-board-empty">Add players in the cast builder first.</div>';
        return;
      }

      const tribeCount = Math.max(1, asInt(startingTribesInput.value) || DEFAULT_SETTINGS.startingTribes || 2);
      normalizeManualTribeAssignments();
      normalizeStartingTribeNameRows();
      syncTextareaFromEditor();
      tribeBuilderHint.textContent = "Drag contestant cards into the tribe boxes to set up the starting tribes.";

      const cardsByTribe = new Map();
      for (let tribe = 1; tribe <= tribeCount; tribe += 1) {
        cardsByTribe.set(String(tribe), []);
      }

      namedRows.forEach(({ row, index }) => {
        const key = String(asInt(row.tribe) || 1);
        const photoHtml = row.photo
          ? '<img class="tribe-card-photo" alt="' + escapeHtml(row.name) + ' portrait" src="' + escapeHtml(row.photo) + '">'
          : '<span class="tribe-card-fallback">Photo</span>';
        cardsByTribe.get(key).push(
          '<div class="tribe-card" draggable="true" data-drag-index="' + index + '">'
            + photoHtml
            + '<div class="tribe-card-name">' + escapeHtml(row.name) + "</div>"
          + "</div>"
        );
      });

      let boardHtml = "";
      for (let tribe = 1; tribe <= tribeCount; tribe += 1) {
        const customLabel = startingTribeNameRows[tribe - 1] || "";
        const label = customLabel || "Auto tribe " + tribe;
        const color = normalizeHexColor(startingTribeColorRows[tribe - 1]) || distinctTribeColor(tribe - 1, tribeCount);
        const cards = cardsByTribe.get(String(tribe)) || [];
        boardHtml += '<section class="tribe-zone" data-drop-tribe="' + tribe + '" style="border-color:' + escapeHtml(color) + ';">'
          + '<div class="tribe-zone-head"><span data-tribe-zone-label-index="' + (tribe - 1) + '">' + escapeHtml(label) + '</span><span class="tribe-zone-count">' + cards.length + " player" + (cards.length === 1 ? "" : "s") + "</span></div>"
          + '<div class="tribe-zone-cards">' + (cards.join("") || '<div class="tribe-board-empty">Drop contestants here</div>') + "</div>"
          + "</section>";
      }
      tribeBoard.innerHTML = boardHtml;
    }

    function syncTextareaFromEditor() {
      return serializeEditorCast(castEditorRows);
    }

    function syncEditorFromTextarea(castText) {
      const rows = parseEditorCast(castText, castEditorRows);
      castEditorRows = rows.length ? rows : [createEditorRow({ tribe: defaultEditorTribe() })];
      renderCastEditor();
      renderTribeBuilder();
    }

    function cloneCastRows(rows) {
      return (rows || []).map((row) => createEditorRow(row));
    }

    function loadImageElement(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The selected image format could not be read by this browser."));
        image.src = src;
      });
    }

    function fileToDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("The selected file could not be loaded."));
        reader.readAsDataURL(file);
      });
    }

    async function convertImageFileToPng(file) {
      const sourceUrl = await fileToDataUrl(file);
      const image = await loadImageElement(sourceUrl);
      const maxSize = 160;
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image conversion is not available in this browser.");
      }
      context.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL("image/png");
    }

    function updateEditorRow(target) {
      if (!target || !target.dataset) {
        return;
      }

      const index = asInt(target.dataset.index);
      const field = target.dataset.field;
      if (index == null || !field || !castEditorRows[index]) {
        return;
      }

      if (field === "photo") {
        return;
      }

      if (field === "name" || field === "tribe") {
        castEditorRows[index][field] = target.value;
      } else {
        castEditorRows[index][field] = normalizeEditorStat(target.value);
      }
      syncTextareaFromEditor();
      renderTribeBuilder();
    }

    function setDefaults(settings) {
      seedInput.value = settings.seed;
      startingTribeModeInput.value = settings.startingTribeMode || DEFAULT_SETTINGS.startingTribeMode;
      startingTribesInput.value = settings.startingTribes;
      finalistsInput.value = String(settings.finalistsCount);
      juryInput.value = settings.jurySize;
      advantagesEnabledInput.checked = settings.advantagesEnabled !== false;
      seedStartingTribeIdolsInput.checked = settings.seedStartingTribeIdols !== false;
      seedMergeIdolInput.checked = settings.seedMergeIdol !== false;
      auctionEnabledInput.checked = Boolean(settings.auctionEnabled);
      advantageSeedRows = cloneAdvantageSeeds(settings.advantageSeeds || []);
      startingTribeNameRows = cloneTribeLabels(settings.startingTribeLabels || []);
      startingTribeColorRows = cloneTribeColors(settings.startingTribeColors || []);
      normalizeStartingTribeNameRows();
      renderTribeNameControls();
      renderAdvantageTypeOptions();
      twistEventRows = defaultTwistEventsFromSettings(settings);
      renderTwistEvents();
      renderAdvantageSeeds();
      if (settings.castRows && settings.castRows.length) {
        castEditorRows = cloneCastRows(settings.castRows);
        renderCastEditor();
        renderTribeBuilder();
        syncTextareaFromEditor();
      } else {
        syncEditorFromTextarea(settings.castText);
      }
    }

    function getSettings() {
      const castText = syncTextareaFromEditor();
      return {
        castText,
        castRows: cloneCastRows(castEditorRows),
        seed: seedInput.value.trim(),
        startingTribeMode: startingTribeModeInput.value === "random" ? "random" : "manual",
        startingTribes: Math.max(1, asInt(startingTribesInput.value) || 2),
        startingTribeLabels: cloneTribeLabels(startingTribeNameRows),
        startingTribeColors: cloneTribeColors(startingTribeColorRows),
        finalistsCount: clamp(asInt(finalistsInput.value) || 2, 2, 3),
        jurySize: Math.max(0, asInt(juryInput.value) || 0),
        twistEvents: cloneTwistEvents(twistEventRows),
        advantagesEnabled: advantagesEnabledInput.checked,
        seedStartingTribeIdols: seedStartingTribeIdolsInput.checked,
        seedMergeIdol: seedMergeIdolInput.checked,
        auctionEnabled: auctionEnabledInput.checked,
        advantageSeeds: cloneAdvantageSeeds(advantageSeedRows)
      };
    }

    function saveSettings(settings) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    function loadSettings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return DEFAULT_SETTINGS;
        }
        const stored = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...stored };
      } catch (error) {
        return DEFAULT_SETTINGS;
      }
    }

    function ensureExternalScript(src) {
      return new Promise((resolve, reject) => {
        const existing = Array.from(document.scripts).find((script) => script.src === src);
        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Could not load " + src)), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.addEventListener("load", () => {
          script.dataset.loaded = "true";
          resolve();
        }, { once: true });
        script.addEventListener("error", () => reject(new Error("Could not load " + src)), { once: true });
        document.head.appendChild(script);
      });
    }

    function buildPythonSimulationPayload(settings) {
      const rows = (settings.castRows || [])
        .map((row, index) => ({
          id: slugify(row.name, index),
          name: String(row.name || "").trim(),
          photo: String(row.photo || ""),
          tribe: String(row.tribe || "").trim(),
          strategy: normalizeEditorStat(row.strategy),
          threat: normalizeEditorStat(row.threat),
          social: normalizeEditorStat(row.social),
          challenge: normalizeEditorStat(row.challenge)
        }))
        .filter((row) => row.name.length);

      return {
        seed: settings.seed || null,
        startingTribeMode: settings.startingTribeMode,
        startingTribes: settings.startingTribes,
        startingTribeLabels: cloneTribeLabels(settings.startingTribeLabels || []),
        startingTribeColors: cloneTribeColors(settings.startingTribeColors || []),
        finalistsCount: settings.finalistsCount,
        jurySize: settings.jurySize,
        advantagesEnabled: settings.advantagesEnabled !== false,
        seedStartingTribeIdols: settings.seedStartingTribeIdols !== false,
        seedMergeIdol: settings.seedMergeIdol !== false,
        auctionEnabled: Boolean(settings.auctionEnabled),
        advantageSeeds: cloneAdvantageSeeds(settings.advantageSeeds || []),
        twistEvents: cloneTwistEvents(settings.twistEvents || []),
        cast: rows
      };
    }

    const PYTHON_WEB_RUNNER_CODE = String.raw`
import json
import re
from collections import Counter, defaultdict

from SurvivorSimulator import AdvantageSeed, AdvantageTiming, SurvivorSimulator, GameConfig, SeasonPlan, Player


def _slugify(text, index):
    slug = re.sub(r"[^a-z0-9]+", "_", str(text or "").lower()).strip("_")
    return slug or f"player_{index}"


class CaptureLogger:
    def __init__(self):
        self.lines = []
        self.logfile = None
        self.level = 1
        self.enabled = True

    def log(self, msg, level=1):
        self.lines.append("" if msg is None else str(msg))

    def debug(self, msg):
        self.log(msg, 0)

    def info(self, msg):
        self.log(msg, 1)

    def warn(self, msg):
        self.log(msg, 2)

    def error(self, msg):
        self.log(msg, 3)


class WebVoteRecorder:
    def __init__(self, sim):
        self.sim = sim
        self.records = []
        sim.events.on("tribal_start", self._on_tribal_start)
        sim.events.on("vote_cast", self._on_vote_cast)
        sim.events.on("eliminated", self._on_eliminated)

    def _phase(self):
        if getattr(self.sim, "merged", False):
            return "merged"
        if getattr(self.sim, "swap_counter", 0):
            return "swapped"
        return "original"

    def _tribe_label_for_pool(self, pool):
        labels = []
        for player in pool or []:
            label = getattr(player, "tribe_label", None) or ""
            if label and label not in labels:
                labels.append(label)
        if len(labels) == 1:
            return labels[0]
        return ", ".join(labels)

    def _find_record(self, round_number):
        if not self.records:
            return None
        if round_number is None:
            return self.records[-1]
        for record in reversed(self.records):
            if record.get("round") == round_number:
                return record
        return self.records[-1]

    def _on_tribal_start(self, round=None, pool=None, **kwargs):
        pool = list(pool or [])
        self.records.append({
            "eventId": f"tribal-{len(self.records) + 1}",
            "round": int(round or len(self.records) + 1),
            "episode": int(getattr(self.sim, "episode_number", round or len(self.records) + 1)),
            "phase": self._phase(),
            "tribeLabel": self._tribe_label_for_pool(pool),
            "pool": [player.name for player in pool],
            "ballots": [],
            "_poolObjects": pool[:],
            "eliminated": "",
            "votesLabel": ""
        })

    def _on_vote_cast(self, voter=None, target=None, round=None, **kwargs):
        record = self._find_record(round)
        if record is None or voter is None or target is None:
            return
        record["ballots"].append({
            "voterId": getattr(voter, "player_id", voter.name),
            "voterName": voter.name,
            "targetId": getattr(target, "player_id", target.name),
            "targetName": target.name,
            "_voter": voter,
            "_target": target
        })

    def _on_eliminated(self, round=None, player=None, final_tally=None, original_vote_targets=None, nullified_targets=None, **kwargs):
        record = self._find_record(round)
        if record is None:
            return
        record["eliminated"] = player.name if player is not None else ""
        nullified_names = {target.name for target in (nullified_targets or []) if target is not None}
        counts = []
        if final_tally:
            counts.extend(sorted((int(count) for count in final_tally.values()), reverse=True))
        else:
            tally = Counter(ballot["targetName"] for ballot in record["ballots"] if ballot.get("targetName") not in nullified_names)
            counts.extend(sorted(tally.values(), reverse=True))
        original_counts = original_vote_targets or Counter()
        for target in nullified_targets or []:
            try:
                if int(original_counts.get(target, 0)) > 0:
                    counts.append(0)
            except Exception:
                continue
        if counts and not any(int(count) > 0 for count in counts):
            counts = [0]
        record["votesLabel"] = "-".join(str(count) for count in counts) if counts else ""
        finalized = []
        for ballot in record["ballots"]:
            reason = _explain_vote(self.sim, record, ballot, player)
            finalized.append({
                "voterId": ballot["voterId"],
                "voterName": ballot["voterName"],
                "targetId": ballot["targetId"],
                "targetName": ballot["targetName"],
                "nullified": ballot["targetName"] in nullified_names,
                "reason": reason
            })
        record["ballots"] = finalized


def _rel(a, b):
    if a is None or b is None:
        return 0
    return int(a.relationships.get(b, 0))


def _perceived_threat(voter, target):
    if voter is None or target is None:
        return 0.0
    return float(voter.threat_perceptions.get(target, float(getattr(target, "threat_level", 0) or 0)))


def _allies_for(sim, voter, pool):
    out = []
    for other in pool:
        if other is voter:
            continue
        rel_score = _rel(voter, other)
        interest = 0.0
        try:
            interest = float(sim._interest_edge_weight(voter, other, pool))
        except Exception:
            interest = 0.0
        if rel_score >= max(4, getattr(sim.config, "alliance_min_edge", 4)) or interest >= getattr(sim.config, "alliance_edge_threshold", 0.45):
            out.append((other, rel_score, interest))
    out.sort(key=lambda item: (item[1], item[2], item[0].name), reverse=True)
    return out


def _jury_pressure(sim, target):
    try:
        jurors = sim._compute_jury_from_boot_log()
    except Exception:
        jurors = []
    if not jurors or target is None:
        return 0.0
    scores = [_rel(juror, target) for juror in jurors]
    return float(sum(scores) / max(1, len(scores)))


def _reason_tag(label, text, weight):
    return {
        "label": label,
        "text": text,
        "weight": float(weight),
    }


def _relationship_threat_label(voter, target):
    rel = _rel(voter, target)
    perceived = _perceived_threat(voter, target)
    self_threat = float(getattr(voter, "threat_level", 0) or 0)
    if rel >= 3:
        band = "friend"
    elif rel <= -2:
        band = "enemy"
    else:
        band = "neutral"
    if perceived >= self_threat + 1.25:
        threat = "higher"
    elif perceived <= self_threat - 1.25:
        threat = "lower"
    else:
        threat = "same"
    if band == "friend" and threat == "higher":
        return "Shield"
    if band == "enemy" and threat == "lower":
        return "Safe Vote"
    if band == "friend" and threat == "lower":
        return "Goat"
    if band == "enemy" and threat == "higher":
        return "Target"
    if band == "friend":
        return "Ally"
    if band == "enemy":
        return "Rival"
    if threat == "higher":
        return "Wild Card"
    if threat == "lower":
        return "Easy Vote"
    return "Swing Vote"


def _vote_action_for_label(label):
    return {
        "Shield": "Blindside",
        "Ally": "Betrayal",
        "Goat": "Clearing the Field",
        "Target": "Direct Shot",
        "Rival": "Removing Competition",
        "Safe Vote": "Playing it Safe",
        "Wild Card": "Removing Chaos",
        "Swing Vote": "Seizing Control",
        "Easy Vote": "Avoiding Blood",
    }.get(label, "Vote Read")


def _explain_vote(sim, record, ballot, eliminated):
    pool = list(record.get("_poolObjects") or [])
    voter = ballot.get("_voter")
    target = ballot.get("_target")
    if voter is None or target is None:
        return {
            "summary": "No detailed read available for this vote.",
            "tags": [],
            "details": []
        }

    tally = Counter(item["targetName"] for item in record.get("ballots", []))
    target_count = tally.get(target.name, 0)
    max_count = max(tally.values()) if tally else 0
    scores = {}
    eligibles = [candidate for candidate in pool if candidate is not voter and not getattr(candidate, "immune", False)]
    for candidate in eligibles:
        try:
            scores[candidate] = float(sim._score_target_for_voter(voter, candidate))
        except Exception:
            scores[candidate] = float(_rel(voter, candidate) * -1.0) + _perceived_threat(voter, candidate)
    ranked = sorted(scores.items(), key=lambda item: item[1])
    rank_lookup = {candidate: index + 1 for index, (candidate, _) in enumerate(ranked)}
    allies = _allies_for(sim, voter, pool)
    ally_vote_names = []
    for ally, _, _ in allies[:4]:
        for other_ballot in record.get("ballots", []):
            if other_ballot.get("voterName") == ally.name:
                ally_vote_names.append(other_ballot.get("targetName"))
                break
    ally_vote_tally = Counter(name for name in ally_vote_names if name)
    reasons = []

    voter_rel_to_target = _rel(voter, target)
    target_rel_to_voter = _rel(target, voter)
    threat = getattr(target, "threat_level", 0) or 0
    social = getattr(target, "social_skill", 0) or 0
    challenge = getattr(target, "challenge_ability", 0) or 0
    strategy = getattr(target, "strategy_level", 0) or 0
    jury_pressure = _jury_pressure(sim, target)
    has_advantage = any(int(count) > 0 for adv, count in getattr(target, "inventory", {}).items() if adv not in ("vote_blocked", "extra_ballots"))
    relationship_label = _relationship_threat_label(voter, target)
    relationship_action = _vote_action_for_label(relationship_label)

    return {
        "summary": relationship_action,
        "tags": [relationship_label, relationship_action],
        "details": [
            f"{voter.name} sees {target.name} as a {relationship_label}. Voting for a {relationship_label} is {relationship_action.lower()}."
        ]
    }

    if target_count == max_count and target.name == getattr(eliminated, "name", None):
        reasons.append(_reason_tag(
            "Majority",
            f"{voter.name} was on the pile that actually sent {target.name} out.",
            4.4
        ))

    if target_count < max_count and max_count >= 3:
        majority_target = next((name for name, count in tally.items() if count == max_count), "")
        if ally_vote_tally.get(majority_target, 0) >= 2:
            reasons.append(_reason_tag(
                "Split Vote",
                f"This reads like part of a split-plan: {voter.name} helps cover the secondary pile on {target.name} while allies keep the main votes on {majority_target}.",
                4.2
            ))
        elif getattr(voter, "strategy_level", 0) >= 4 and target_count <= 2:
            reasons.append(_reason_tag(
                "Minority Cover",
                f"{voter.name} keeps their hands off the main target and leaves themselves a cleaner story if the vote gets messy.",
                3.8
            ))

    if ally_vote_tally.get(target.name, 0) >= 2:
        allies_on_target = [name for name, count in ally_vote_tally.items() if name == target.name]
        reasons.append(_reason_tag(
            "Alliance",
            f"{voter.name} is moving with close numbers here instead of free-styling the vote alone.",
            4.1
        ))

    if voter_rel_to_target <= -6 or target_rel_to_voter <= -6:
        reasons.append(_reason_tag(
            "Personal",
            f"The relationship is bad enough that this vote is also personal, not just strategic.",
            4.0 + (abs(min(voter_rel_to_target, target_rel_to_voter)) / 20.0)
        ))
    elif voter_rel_to_target <= -3:
        reasons.append(_reason_tag(
            "Social Friction",
            f"{voter.name} already feels rough enough about {target.name} that voting them out is easy to justify socially.",
            3.3
        ))

    if not getattr(sim, "merged", False) and challenge >= 4:
        reasons.append(_reason_tag(
            "Challenge Threat",
            f"{target.name} looks dangerous in challenges, so {voter.name} is willing to cut them before the merge or the next immunity run.",
            3.9 + (challenge / 10.0)
        ))

    if getattr(sim, "merged", False) and jury_pressure >= 2.5:
        reasons.append(_reason_tag(
            "Jury Threat",
            f"{target.name} is starting to look expensive at the end, and {voter.name} does not want that résumé getting any stronger.",
            4.0 + (jury_pressure / 10.0)
        ))

    if strategy >= 4 and rank_lookup.get(target, 99) <= 2:
        reasons.append(_reason_tag(
            "Strategic Control",
            f"{voter.name} sees too much influence running through {target.name}, so this vote is about cutting off a real decision-maker.",
            3.7 + (strategy / 10.0)
        ))

    if social >= 4 and rank_lookup.get(target, 99) <= 2:
        reasons.append(_reason_tag(
            "Social Threat",
            f"{target.name} feels too easy for people to live with, and that makes them harder to beat later.",
            3.5 + (social / 10.0)
        ))

    if threat >= 5 or _perceived_threat(voter, target) >= 5:
        reasons.append(_reason_tag(
            "Threat",
            f"{voter.name} sees {target.name} as broadly dangerous, even if the exact reason is different for everyone else.",
            3.5 + (max(threat, _perceived_threat(voter, target)) / 12.0)
        ))

    if has_advantage:
        reasons.append(_reason_tag(
            "Advantage Pressure",
            f"{target.name} looks like somebody who could blow up a clean plan with an idol or another advantage, so this vote helps pressure that slot.",
            3.8
        ))

    if rank_lookup.get(target, 99) == 1 and not reasons:
        reasons.append(_reason_tag(
            "Best Target",
            f"By {voter.name}'s own read of the board, {target.name} was simply the best available target tonight.",
            3.2
        ))

    if target_count == 1 and getattr(voter, "strategy_level", 0) >= 4 and max_count >= 3:
        reasons.append(_reason_tag(
            "Operation Italy Energy",
            f"This looks like a deliberate side-vote: {voter.name} keeps one foot off the obvious pile so they can protect relationships and still stay in the numbers game.",
            3.9
        ))

    reasons.sort(key=lambda item: item["weight"], reverse=True)
    top_reasons = reasons[:3]
    summary = top_reasons[0]["label"] if top_reasons else "Vote Read"
    return {
        "summary": summary,
        "tags": [item["label"] for item in top_reasons],
        "details": [item["text"] for item in top_reasons]
    }


def _event_appearance_counts(log_lines, photo_lookup):
    counts = Counter()
    ordered_names = sorted(photo_lookup.keys(), key=len, reverse=True)
    for line in log_lines:
      for name in ordered_names:
        if name and name in line:
          counts[name] += 1
    return counts


def _build_social_graph_edges(sim):
    everyone = sim.players + sim.eliminated_players
    edges = []
    for index, a in enumerate(everyone):
        for b in everyone[index + 1:]:
            rel_a = a.relationships.get(b, 0)
            rel_b = b.relationships.get(a, 0)
            edges.append({
                "fromId": getattr(a, "player_id", a.name),
                "toId": getattr(b, "player_id", b.name),
                "score": (rel_a + rel_b) / 2.0
            })
    return edges


def _build_social_graph_groups(sim, placements_by_id, photo_lookup):
    groups = defaultdict(list)
    for player in sim.players:
        label = getattr(player, "tribe_label", None) or "Unplaced"
        groups[label].append(player)

    result = []
    for label in sorted(groups.keys()):
        members = list(groups[label])
        members.sort(key=lambda p: (placements_by_id.get(getattr(p, "player_id", p.name), 9999), p.name))
        member_rows = []
        for player in members:
            player_id = getattr(player, "player_id", player.name)
            member_rows.append({
                "id": player_id,
                "name": player.name,
                "photo": photo_lookup.get(player.name, ""),
                "rank": placements_by_id.get(player_id)
            })
        edges = []
        for index, a in enumerate(members):
            for b in members[index + 1:]:
                rel_a = a.relationships.get(b, 0)
                rel_b = b.relationships.get(a, 0)
                score = (rel_a + rel_b) / 2.0
                edges.append({
                    "fromId": getattr(a, "player_id", a.name),
                    "toId": getattr(b, "player_id", b.name),
                    "score": score
                })
        result.append({
            "tribeLabel": label,
            "members": member_rows,
            "edges": edges
        })
    return result


def _build_alliance_recap(log_lines, photo_lookup):
    history = []
    active = {}
    current_episode = 1
    current_title = ""

    for raw_line in log_lines:
        line = (raw_line or "").strip()
        if not line:
            continue
        episode_match = re.match(r"Episode (\d+)", line)
        if episode_match:
            current_episode = int(episode_match.group(1))
            continue
        snapshot_match = re.match(r"Alliance Snapshot [^A-Za-z0-9]* (.+)$", line)
        if snapshot_match:
            current_title = snapshot_match.group(1).strip()
            continue
        bullet_line = line.lstrip("•").strip()
        if bullet_line.startswith("("):
            continue
        member_match = re.match(r"\[(.+?)\]", bullet_line)
        if member_match:
            members = [name.strip() for name in member_match.group(1).split(",") if name.strip()]
            entry_text = "Snapshot: " + ", ".join(members)
            history.append({
                "episode": current_episode,
                "tribeLabel": current_title,
                "text": entry_text,
                "type": "snapshot",
                "memberIds": members
            })
            active[current_title + "::" + ", ".join(members)] = {
                "name": current_title or "Alliance Snapshot",
                "tribeLabel": current_title,
                "members": members
            }

    active_rows = []
    for key in sorted(active.keys()):
        entry = active[key]
        active_rows.append({
            "name": entry["name"],
            "tribeLabel": entry["tribeLabel"],
            "members": [
                {
                    "id": member,
                    "name": member,
                    "photo": photo_lookup.get(member, "")
                }
                for member in entry["members"]
            ]
        })

    return {
        "active": active_rows,
        "history": history
    }


def _parse_finalists_from_log(log_lines):
    for line in log_lines:
        clean = (line or "").strip()
        match = re.match(r"Final Tribal (.+)$", clean)
        if match:
            return [name.strip() for name in match.group(1).split(" v ") if name.strip()]
    return []


def _parse_winner_and_vote(log_lines):
    winner = ""
    final_vote = ""
    for line in reversed(log_lines):
        clean = (line or "").strip()
        match = re.match(r"The Sole Survivor is (.+?) (\([^)]+\))$", clean)
        if match:
            winner = match.group(1).strip()
            final_vote = match.group(2).strip()
            break
    return winner, final_vote


def _build_jury_vote(sim, log_lines, finalists):
    jury = list(getattr(sim, "jury", []) or [])
    finalist_lookup = {player.name: getattr(player, "player_id", player.name) for player in sim.players}
    jury_lookup = {player.name: getattr(player, "player_id", player.name) for player in jury}
    jurors_by_name = {player.name: player for player in jury}
    finalists_by_name = {player.name: player for player in sim.players}
    capture = False
    votes = []
    for line in log_lines:
        clean = (line or "").strip()
        if clean.startswith("Final Tribal "):
            capture = True
            continue
        if capture and clean.startswith("The Sole Survivor is "):
            break
        if not capture or "->" not in clean:
            continue
        left, right = [part.strip() for part in clean.split("->", 1)]
        is_finalist_tie_breaker = False
        finalist_decider_match = re.match(r"(.+?)\s+\(finalist\)\s+casts deciding vote$", left)
        if finalist_decider_match:
            left = finalist_decider_match.group(1).strip()
            is_finalist_tie_breaker = True
        if "casts the deciding finalist vote" in left:
            left = left.replace("casts the deciding finalist vote", "").strip()
            is_finalist_tie_breaker = True
        left_lookup = jury_lookup if left in jury_lookup else finalist_lookup
        if left in left_lookup and right in finalist_lookup:
            juror = jurors_by_name.get(left) or finalists_by_name.get(left)
            finalist = finalists_by_name.get(right)
            votes.append({
                "jurorId": left_lookup[left],
                "jurorName": left,
                "finalistId": finalist_lookup[right],
                "finalistName": right,
                "isFinalistTieBreaker": is_finalist_tie_breaker,
                "reason": _explain_jury_vote(juror, finalist, list(sim.players)) if juror is not None and finalist is not None else None,
            })
    return {
        "jurors": [{"id": jury_lookup[player.name], "name": player.name} for player in jury],
        "finalists": [{"id": finalist_lookup.get(name, name), "name": name} for name in finalists],
        "votes": votes
    }


def _explain_jury_vote(juror, choice, finalists):
    alternatives = [player for player in finalists if player is not choice]
    reasons = []

    def add(label, text, weight):
        reasons.append({"label": label, "text": text, "weight": float(weight)})

    rel = int(juror.relationships.get(choice, 0))
    best_alt_rel = max([int(juror.relationships.get(player, 0)) for player in alternatives] or [-99])
    choice_threat = float(getattr(choice, "threat_level", 0) or 0)
    alt_threat = max([float(getattr(player, "threat_level", 0) or 0) for player in alternatives] or [0.0])
    choice_strategy = int(getattr(choice, "strategy_level", 0) or 0)
    alt_strategy = max([int(getattr(player, "strategy_level", 0) or 0) for player in alternatives] or [0])
    choice_social = int(getattr(choice, "social_skill", 0) or 0)
    alt_social = max([int(getattr(player, "social_skill", 0) or 0) for player in alternatives] or [0])

    if rel >= best_alt_rel + 2 or rel >= 5:
        add("Relationship", f"{juror.name} feels most personally respected by {choice.name}, and that matters when the vote is for a winner.", 4.3)
    if choice_threat >= 4 or choice_threat > alt_threat:
        add("Winning Case", f"{choice.name} has the clearest overall case to own the season in front of the jury.", 4.15)
    if choice_strategy >= 4 or choice_strategy > alt_strategy:
        add("Strategic Game", f"{juror.name} rewards {choice.name} for shaping votes instead of just surviving them.", 4.05)
    if choice_social >= 4 or choice_social > alt_social:
        add("Social Game", f"{choice.name} built enough social capital that this vote feels earned, not accidental.", 3.95)
    if int(getattr(choice, "challenge_ability", 0) or 0) >= 4:
        add("Challenge Respect", f"{juror.name} respects how visible {choice.name} was in challenges when the game got thin.", 3.55)
    if not reasons:
        add("Final Tribal Case", f"{juror.name} thinks {choice.name} gave the most complete answer for why their game should win.", 3.2)

    reasons.sort(key=lambda item: item["weight"], reverse=True)
    top = reasons[:3]
    return {
        "summary": top[0]["label"],
        "tags": [item["label"] for item in top],
        "details": [item["text"] for item in top],
    }


def _twist_summaries(log_lines):
    swaps = []
    merges = []
    for line in log_lines:
        clean = (line or "").strip()
        swap_match = re.match(r"(SWAP|DEMERGE) at (\d+) players remaining - forming (\d+) tribe", clean)
        if swap_match:
            kind = "Swap" if swap_match.group(1) == "SWAP" else "Demerge"
            swaps.append(f"{kind} at {swap_match.group(2)} into {swap_match.group(3)} tribes")
            continue
        merge_match = re.match(r"MERGE at (\d+) players remaining", clean)
        if merge_match:
            merges.append(f"Merge at {merge_match.group(1)} players")
    return ". ".join(swaps) if swaps else "No swap or demerge events triggered.", ". ".join(merges) if merges else "No merge event triggered."


def run_web_simulation(payload_json):
    payload = json.loads(payload_json)
    cast_rows = [row for row in payload.get("cast", []) if str(row.get("name", "")).strip()]
    if not cast_rows:
        raise ValueError("Add at least one player to the cast.")

    logger = CaptureLogger()
    photo_lookup = {row["name"]: row.get("photo", "") for row in cast_rows}
    players = []
    for index, row in enumerate(cast_rows):
        player = Player(
            name=row["name"],
            player_id=row.get("id") or _slugify(row["name"], index),
            strategy_level=int(row.get("strategy", 3)),
            threat_level=int(row.get("threat", 3)),
            social_skill=int(row.get("social", 3)),
            challenge_ability=int(row.get("challenge", 3)),
        )
        players.append(player)

    starting_tribes = None
    requested_tribe_count = max(1, int(payload.get("startingTribes") or 1))
    raw_starting_labels = payload.get("startingTribeLabels") or []
    raw_starting_colors = payload.get("startingTribeColors") or []
    starting_tribe_labels = [
        str(raw_starting_labels[i]).strip() if i < len(raw_starting_labels) else ""
        for i in range(requested_tribe_count)
    ] if raw_starting_labels else None
    starting_tribe_colors = [
        str(raw_starting_colors[i]).strip() if i < len(raw_starting_colors) else ""
        for i in range(requested_tribe_count)
    ]
    if payload.get("startingTribeMode") != "random":
        tribe_count = requested_tribe_count
        grouped = []
        grouped_map = defaultdict(list)
        for row in cast_rows:
            tribe_token = row.get("tribe") or "1"
            try:
                tribe_index = max(1, int(tribe_token))
            except Exception:
                tribe_index = 1
            grouped_map[tribe_index].append(row.get("id") or row["name"])
        for tribe_index in range(1, tribe_count + 1):
            grouped.append(grouped_map.get(tribe_index, []))
        starting_tribes = grouped

    swap_plan = []
    swap_tribe_labels_by_remaining = {}
    enable_demerge = False
    demerge_at_remaining = None
    twists = payload.get("twistEvents") or []
    for event in sorted(twists, key=lambda item: (-int(item.get("remaining", 0)), str(item.get("type", "")))):
        event_type = str(event.get("type", "")).strip()
        remaining = int(event.get("remaining", 0) or 0)
        tribes = max(1, int(event.get("tribes", 2) or 2))
        if event_type == "swap":
            swap_plan.append((remaining, tribes))
            raw_labels = event.get("tribeLabels") or []
            labels = [str(raw_labels[i]).strip() if i < len(raw_labels) else "" for i in range(tribes)]
            if any(labels):
                swap_tribe_labels_by_remaining[remaining] = labels
        elif event_type == "merge":
            swap_plan.append((remaining, 1))
        elif event_type == "demerge" and demerge_at_remaining is None:
            enable_demerge = True
            demerge_at_remaining = remaining
            raw_labels = event.get("tribeLabels") or []
            labels = [str(raw_labels[i]).strip() if i < len(raw_labels) else "" for i in range(tribes)]
            if any(labels):
                swap_tribe_labels_by_remaining[remaining] = labels

    advantage_seeds = []
    if payload.get("advantagesEnabled", True):
        for raw_seed in payload.get("advantageSeeds") or []:
            if raw_seed.get("enabled", True) is False:
                continue
            raw_timing = raw_seed.get("timing") or {}
            timing_kind = str(raw_timing.get("kind") or "pre_merge")
            remaining_players = raw_timing.get("remainingPlayers")
            try:
                timing = AdvantageTiming(
                    kind=timing_kind,
                    remaining_players=int(remaining_players) if timing_kind == "final_remaining" else None,
                )
                advantage_seeds.append(AdvantageSeed(
                    advantage_type=str(raw_seed.get("advantageType") or "idol"),
                    timing=timing,
                    location=str(raw_seed.get("location") or "random"),
                    source="user",
                ))
            except Exception:
                continue

    plan = SeasonPlan(
        starting_tribes=starting_tribes,
        starting_tribe_labels=starting_tribe_labels,
        finalists_count=int(payload.get("finalistsCount") or 2),
        jury_size=int(payload.get("jurySize") or 0),
        swap_plan=swap_plan if swap_plan else None,
        swap_tribe_labels_by_remaining=swap_tribe_labels_by_remaining,
        enable_demerge=enable_demerge,
        demerge_at_remaining=demerge_at_remaining,
        advantages_enabled=bool(payload.get("advantagesEnabled", True)),
        seed_starting_tribe_idols=bool(payload.get("seedStartingTribeIdols", True)),
        seed_merge_idol=bool(payload.get("seedMergeIdol", True)),
        advantage_seeds=advantage_seeds,
    )

    cfg = GameConfig(
        seed=payload.get("seed") or None,
        logfile=None,
        log_level=1,
        prediction_enabled=False,
        use_social_memory=False,
        save_social_memory_at_end=False,
        enable_visual_graphs=False,
        ascii_alliance_graph=False,
        ensure_traversable_graph=False,
        advantages_enabled=bool(payload.get("advantagesEnabled", True)),
        seed_starting_tribe_idols=bool(payload.get("seedStartingTribeIdols", True)),
        seed_merge_idol=bool(payload.get("seedMergeIdol", True)),
        advantage_seeds=advantage_seeds,
    )

    sim = SurvivorSimulator(players, config=cfg, logger=logger, season_plan=plan)
    vote_recorder = WebVoteRecorder(sim)
    original_tribes = {}
    initial_tribe_names = []
    original_split_into_tribes = sim.split_into_tribes

    def wrapped_split_into_tribes(num_tribes, labels=None):
        nonlocal initial_tribe_names
        result = original_split_into_tribes(num_tribes, labels=labels)
        if not original_tribes:
            initial_tribe_names = list(getattr(sim, "tribe_names", []) or [])
            for tribe_label, tribe in zip(sim.tribe_names, sim.tribes):
                for player in tribe:
                    original_tribes[getattr(player, "player_id", player.name)] = tribe_label
        return result

    sim.split_into_tribes = wrapped_split_into_tribes
    sim._pause_for_next_episode = lambda *args, **kwargs: None
    sim.run_game(num_tribes=max(1, int(payload.get("startingTribes") or 2)))

    log_lines = logger.lines[:]
    winner_name, final_vote = _parse_winner_and_vote(log_lines)
    finalists = _parse_finalists_from_log(log_lines) or [player.name for player in sim.players]
    if not winner_name and getattr(sim, "_actual_winner_id", None):
        for player in (sim.players + sim.eliminated_players):
            if getattr(player, "player_id", None) == getattr(sim, "_actual_winner_id", None):
                winner_name = player.name
                break
    event_counts = _event_appearance_counts(log_lines, photo_lookup)
    sim._finalize_actual_placements()

    everyone = sim.players + sim.eliminated_players
    stats_by_id = dict(sim.player_season_stats)
    placement_rows = []
    placements_by_id = {}
    for player in everyone:
        player_id = getattr(player, "player_id", player.name)
        stats = stats_by_id.get(player_id, {})
        placement = int(stats.get("actual_placement") or len(everyone))
        placements_by_id[player_id] = placement
        placement_rows.append({
            "rank": placement,
            "id": player_id,
            "name": player.name,
            "photo": photo_lookup.get(player.name, ""),
            "tribe": original_tribes.get(player_id, ""),
            "strategy": int(getattr(player, "strategy_level", 3) or 3),
            "threat": int(getattr(player, "threat_level", 3) or 3),
            "social": int(getattr(player, "social_skill", 3) or 3),
            "challenge": int(getattr(player, "challenge_ability", 3) or 3),
            "eventAppearances": int(event_counts.get(player.name, 0)),
            "juryVotes": 0
        })
    placement_rows.sort(key=lambda row: (row["rank"], row["name"]))

    jury_vote = _build_jury_vote(sim, log_lines, finalists)
    jury_vote_counts = Counter(vote["finalistId"] for vote in jury_vote["votes"])
    for row in placement_rows:
        row["juryVotes"] = int(jury_vote_counts.get(row["id"], 0))
    if not final_vote and jury_vote_counts:
        final_vote = "(" + "-".join(str(count) for count in sorted(jury_vote_counts.values(), reverse=True)) + ")"

    swap_summary, merge_summary = _twist_summaries(log_lines)
    alliance_recap = _build_alliance_recap(log_lines, photo_lookup)
    vote_history = []
    for record in vote_recorder.records:
        vote_history.append({
            "eventId": record.get("eventId", ""),
            "round": record.get("round"),
            "episode": record.get("episode"),
            "phase": record.get("phase", ""),
            "tribeLabel": record.get("tribeLabel", ""),
            "pool": list(record.get("pool", [])),
            "ballots": list(record.get("ballots", [])),
            "eliminated": record.get("eliminated", ""),
            "votesLabel": record.get("votesLabel", "")
        })

    result = {
        "seed": str(payload.get("seed") or "auto"),
        "winner": winner_name,
        "winnerPhoto": photo_lookup.get(winner_name, ""),
        "finalists": finalists,
        "finalVote": final_vote,
        "placements": placement_rows,
        "castOrder": [{"id": row.get("id") or _slugify(row["name"], index), "name": row["name"]} for index, row in enumerate(cast_rows)],
        "voteHistory": vote_history,
        "juryVote": jury_vote,
        "logText": "\\n".join(log_lines),
        "seasonShape": f"{len(cast_rows)} players | {len(twists)} twist event(s) | final {int(payload.get('finalistsCount') or 2)}",
        "allianceRecap": alliance_recap,
        "socialGraphEdges": _build_social_graph_edges(sim),
        "socialGraphGroups": _build_social_graph_groups(sim, placements_by_id, photo_lookup),
        "mergeColor": getattr(sim, "merge_color", None) or "Merged",
        "tribeColors": {
            label: starting_tribe_colors[index]
            for index, label in enumerate(initial_tribe_names)
            if index < len(starting_tribe_colors) and starting_tribe_colors[index]
        },
        "juryCount": len(jury_vote["jurors"]),
        "bootCount": len(getattr(sim, "boot_log", [])),
        "episodes": int(getattr(sim, "episode_number", 0) or 0),
        "playerCount": len(cast_rows),
        "swapSummary": swap_summary,
        "mergeSummary": merge_summary,
        "engine": "python"
    }
    return json.dumps(result)
`;

    function writePythonSources(pyodide) {
      const bundle = window.SURVIVOR_PYTHON_SOURCES || {};
      if (!Object.keys(bundle).length) {
        throw new Error("Python source bundle is missing.");
      }
      const fs = pyodide.FS;
      const mkdirp = (dirPath) => {
        const parts = dirPath.split("/").filter(Boolean);
        let current = "";
        parts.forEach((part) => {
          current += "/" + part;
          try {
            fs.mkdir(current);
          } catch (error) {
            if (!/File exists/i.test(String(error && error.message ? error.message : error))) {
              throw error;
            }
          }
        });
      };

      mkdirp("/app");
      Object.keys(bundle).forEach((relativePath) => {
        const targetPath = "/app/" + relativePath.replace(/\\/g, "/");
        const segments = targetPath.split("/");
        segments.pop();
        mkdirp(segments.join("/"));
        fs.writeFile(targetPath, bundle[relativePath], { encoding: "utf8" });
      });
    }

    async function ensurePythonEngine() {
      if (pyodideRuntimePromise) {
        return pyodideRuntimePromise;
      }
      pyodideRuntimePromise = (async () => {
        if (typeof window.loadPyodide !== "function") {
          await ensureExternalScript(PYODIDE_INDEX_URL + "pyodide.js");
        }
        const pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
        if (!pythonEngineReady) {
          writePythonSources(pyodide);
          pyodide.runPython("import sys\nif '/app' not in sys.path:\n    sys.path.insert(0, '/app')");
          await pyodide.runPythonAsync(PYTHON_WEB_RUNNER_CODE);
          pythonEngineReady = true;
        }
        return pyodide;
      })().catch((error) => {
        pyodideRuntimePromise = null;
        throw error;
      });
      return pyodideRuntimePromise;
    }

    async function simulateSeasonViaPython(settings) {
      const pyodide = await ensurePythonEngine();
      const payload = buildPythonSimulationPayload(settings);
      pyodide.globals.set("web_payload_json", JSON.stringify(payload));
      try {
        const resultJson = await pyodide.runPythonAsync("run_web_simulation(web_payload_json)");
        return JSON.parse(resultJson);
      } finally {
        pyodide.globals.delete("web_payload_json");
      }
    }

    function normalizeTwistTimeline(events) {
      return cloneTwistEvents(events)
        .map((event, index) => ({
          ...event,
          remaining: Math.max(2, asInt(event.remaining) || 2),
          tribes: Math.max(2, asInt(event.tribes) || 2),
          order: index
        }))
        .sort((a, b) => b.remaining - a.remaining || a.order - b.order);
    }

    function validateTwistTimeline(events) {
      let mergeSeen = false;
      for (const event of events) {
        if (event.type === "merge") {
          mergeSeen = true;
          continue;
        }
        if (event.type === "demerge" && !mergeSeen) {
          throw new Error("Every demerge twist needs an earlier merge twist with more players remaining.");
        }
      }
    }

    function exileInfoForPlayers(playerCount, teams) {
      const tribeCount = Math.max(2, teams);
      return {
        tribes: tribeCount,
        tribeSize: Math.floor(playerCount / tribeCount),
        exileCount: playerCount % tribeCount
      };
    }

    function parseCast(castText, rng, castRows, startingTribeMode) {
      const photoRows = castRows || [];
      const manualTribes = startingTribeMode !== "random";
      const lines = String(castText || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (!lines.length) {
        throw new Error("Add at least one player to the cast.");
      }

      return lines.map((line, index) => {
        let parts = line.split("|").map((part) => part.trim());
        if (parts.length === 1 && line.includes(",")) {
          parts = line.split(",").map((part) => part.trim());
        }

        const name = parts[0];
        if (!name) {
          throw new Error("Every cast line needs a player name.");
        }

        const tribeToken = manualTribes && parts[1] ? parts[1] : null;
        const strategy = asInt(parts[2]);
        const threat = asInt(parts[3]);
        const social = asInt(parts[4]);
        const challenge = asInt(parts[5]);

        return {
          id: slugify(name, index),
          name,
          photo: photoRows[index] && photoRows[index].photo ? photoRows[index].photo : "",
          tribeToken,
          strategy: strategy == null ? rng.int(1, 5) : clamp(strategy, 1, 5),
          threat: threat == null ? rng.int(1, 5) : clamp(threat, 1, 5),
          social: social == null ? rng.int(1, 5) : clamp(social, 1, 5),
          challenge: challenge == null ? rng.int(1, 5) : clamp(challenge, 1, 5)
        };
      });
    }

    function buildPlayers(entries) {
      return entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        photo: entry.photo || "",
        tribeToken: entry.tribeToken,
        originalTribeLabel: "",
        currentTribeLabel: "",
        strategy: entry.strategy,
        threat: entry.threat,
        social: entry.social,
        challenge: entry.challenge,
        immune: false,
        satOutLast: false,
        relationships: {},
        threatPerceptions: {},
        juryVotes: 0,
        inventory: {
          idol: 0
        },
        idolsFound: 0,
        idolsPlayed: 0,
        advantagesFound: 0,
        storyAdvantages: [],
        activeAdvantages: [],
        eventAppearances: 0
      }));
    }

    function initializeSocialState(players, rng) {
      for (const observer of players) {
        for (const target of players) {
          if (observer.id === target.id) {
            continue;
          }
          observer.relationships[target.id] = rng.int(-2, 3);
          observer.threatPerceptions[target.id] = target.threat;
        }
      }
    }

    function orderedKeys(keys) {
      const numericKeys = keys.every((key) => /^-?\d+$/.test(String(key)));
      if (numericKeys) {
        return keys.slice().sort((a, b) => Number(a) - Number(b));
      }
      return keys.slice();
    }

    function groupStartingTribes(state, settings) {
      const explicit = state.players.filter((player) => player.tribeToken != null && player.tribeToken !== "");
      const usedLabels = [];
      const tribes = [];
      const tribeNames = [];

      if (explicit.length) {
        const grouped = new Map();
        for (const player of explicit) {
          const key = String(player.tribeToken);
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key).push(player);
        }

        const keys = orderedKeys(Array.from(grouped.keys()));
        const labelsAreText = keys.some((key) => !/^-?\d+$/.test(key));

        keys.forEach((key, index) => {
          const requestedLabels = cloneTribeLabels(settings.startingTribeLabels || []);
          const label = requestedLabels[index] || (labelsAreText ? key : randomTribeName(state.rng, new Set(usedLabels.map((name) => name.toLowerCase()))));
          tribeNames.push(label);
          tribes.push(grouped.get(key));
          usedLabels.push(label);
        });

        const unassigned = state.players.filter((player) => player.tribeToken == null || player.tribeToken === "");
        let cursor = 0;
        while (unassigned.length) {
          tribes[cursor % tribes.length].push(unassigned.shift());
          cursor += 1;
        }
      } else {
        const numTribes = clamp(settings.startingTribes, 1, Math.max(1, Math.floor(state.players.length / 2)));
        const shuffled = state.rng.shuffle(state.players);
        const requestedLabels = cloneTribeLabels(settings.startingTribeLabels || []);
        for (let i = 0; i < numTribes; i += 1) {
          tribes.push([]);
          tribeNames.push(requestedLabels[i] || randomTribeName(state.rng, new Set(usedLabels.map((name) => name.toLowerCase()))));
          usedLabels.push(tribeNames[i]);
        }
        shuffled.forEach((player, index) => {
          tribes[index % numTribes].push(player);
        });
      }

      state.tribes = tribes;
      state.tribeNames = tribeNames;
      state.initialTribeNames = tribeNames.slice();
      state.startingTribeColors = cloneTribeColors(settings.startingTribeColors || []);
      state.mergeColor = randomTribeName(state.rng, new Set(usedLabels.map((name) => String(name || "").toLowerCase())));
      state.phaseKey = "original";
      if (state.eventDsl) {
        state.eventDsl.tribeFlags = new Map(
          tribeNames.map((label) => [label, { advantageAvailable: true }])
        );
      }

      for (let index = 0; index < state.tribes.length; index += 1) {
        const label = state.tribeNames[index];
        for (const player of state.tribes[index]) {
          player.originalTribeLabel = label;
          player.currentTribeLabel = label;
        }
      }
    }

    function logLines(state, ...lines) {
      lines.forEach((line) => state.log.push(line));
    }

    function recordEventAppearances(players) {
      const seen = new Set();
      (players || []).filter(Boolean).forEach((player) => {
        if (!player || !player.id || seen.has(player.id)) {
          return;
        }
        seen.add(player.id);
        player.eventAppearances = (player.eventAppearances || 0) + 1;
      });
    }

    function logEpisodeBeat(state, line, players) {
      logLines(state, line);
      recordEventAppearances(players);
      return true;
    }

    function logTribes(state) {
      for (let index = 0; index < state.tribes.length; index += 1) {
        logLines(state, "", state.tribeNames[index]);
        state.tribes[index].forEach((player) => logLines(state, player.name));
      }
    }

    function phaseProgress(state, settings) {
      const start = state.startingPlayerCount;
      const end = settings.finalistsCount;
      const now = state.players.length;
      const denom = Math.max(1, start - end);
      return clamp((start - now) / denom, 0, 1);
    }

    function threatMultiplier(state, settings) {
      const base = 5;
      const t = phaseProgress(state, settings);
      const curve = (Math.pow(base, t) - 1) / (base - 1);
      return 2 * curve;
    }

    function currentJurorCount(state, settings) {
      return Math.max(0, (settings.finalistsCount + settings.jurySize) - state.players.length);
    }

    function getCurrentJurors(state, settings) {
      const count = currentJurorCount(state, settings);
      return count ? state.bootLog.slice(-count) : [];
    }

    function estimateJuryThreatScore(state, settings, candidate) {
      const jurors = getCurrentJurors(state, settings);
      if (!jurors.length || !candidate) {
        return 0;
      }

      const total = jurors.reduce((sum, juror) => {
        const rel = juror.relationships[candidate.id] ?? 0;
        const relationshipScore = Math.max(0, rel + 2);
        const threatScore = candidate.threat * 0.45;
        const socialScore = candidate.social * 0.3;
        return sum + relationshipScore + threatScore + socialScore;
      }, 0);

      return total / jurors.length;
    }

    function averageRelationshipToward(state, target, pool) {
      const others = (pool || []).filter((player) => player.id !== target.id);
      if (!others.length) {
        return 0;
      }
      const total = others.reduce((sum, player) => sum + (player.relationships[target.id] ?? 0), 0);
      return total / others.length;
    }

    function averagePairRelationship(a, b) {
      if (!a || !b || a.id === b.id) {
        return 0;
      }
      return ((a.relationships[b.id] ?? 0) + (b.relationships[a.id] ?? 0)) / 2;
    }

    function shortPlayerName(playerOrName) {
      const name = typeof playerOrName === "string"
        ? playerOrName
        : (playerOrName && playerOrName.name) || "";
      return String(name || "").trim().split(/\s+/)[0] || String(name || "");
    }

    function renderTokenTemplate(template, context) {
      return String(template || "").replace(/\{([^}]+)\}/g, (_, token) => {
        const value = context && Object.prototype.hasOwnProperty.call(context, token)
          ? context[token]
          : "";
        if (value && typeof value === "object" && value.name) {
          return value.name;
        }
        return value == null ? "" : String(value);
      });
    }

    function allCombinations(items, size, startIndex, prefix, output) {
      if (prefix.length === size) {
        output.push(prefix.slice());
        return;
      }
      for (let index = startIndex; index <= items.length - (size - prefix.length); index += 1) {
        prefix.push(items[index]);
        allCombinations(items, size, index + 1, prefix, output);
        prefix.pop();
      }
    }

    function averageGroupRelationship(group) {
      let pairCount = 0;
      let total = 0;
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          pairCount += 1;
          total += averagePairRelationship(group[i], group[j]);
        }
      }
      return pairCount ? total / pairCount : 0;
    }

    function minimumGroupRelationship(group) {
      let minimum = Number.POSITIVE_INFINITY;
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          minimum = Math.min(minimum, averagePairRelationship(group[i], group[j]));
        }
      }
      return Number.isFinite(minimum) ? minimum : 0;
    }

    function allianceTrackerState(state) {
      if (!state.allianceTracker) {
        state.allianceTracker = {
          nextId: 1,
          active: [],
          history: [],
          usedNames: new Set()
        };
      }
      return state.allianceTracker;
    }

    function storyTrackerState(state) {
      if (!state.storyTracker) {
        state.storyTracker = {
          usedConfessionalTemplates: new Set(),
          usedConfessionalLines: new Set(),
          confessionalCountsByPlayer: new Map()
        };
      }
      return state.storyTracker;
    }

    function makeAllianceName(state) {
      const tracker = allianceTrackerState(state);
      const name = "Alliance " + tracker.nextId;
      tracker.usedNames.add(name);
      return name;
    }

    function getActiveAlliancesForTribe(state, tribeLabel) {
      return allianceTrackerState(state).active.filter((alliance) => alliance.active !== false && alliance.tribeLabel === tribeLabel);
    }

    function getAllianceMembers(state, alliance) {
      if (!alliance || !Array.isArray(alliance.memberIds)) {
        return [];
      }
      return alliance.memberIds
        .map((memberId) => state.allPlayers.find((player) => player.id === memberId) || state.players.find((player) => player.id === memberId))
        .filter(Boolean);
    }

    function findAllianceForPlayer(state, player, tribeLabel) {
      if (!player) {
        return null;
      }
      const label = tribeLabel || player.currentTribeLabel;
      return getActiveAlliancesForTribe(state, label)
        .slice()
        .sort((a, b) => b.memberIds.length - a.memberIds.length || a.name.localeCompare(b.name))
        .find((alliance) => alliance.memberIds.includes(player.id)) || null;
    }

    function sharedAllianceBetween(state, a, b) {
      if (!a || !b) {
        return null;
      }
      const label = a.currentTribeLabel || b.currentTribeLabel;
      return getActiveAlliancesForTribe(state, label)
        .find((alliance) => alliance.memberIds.includes(a.id) && alliance.memberIds.includes(b.id)) || null;
    }

    function strongestVisiblePair(pool, excludedIds) {
      const blocked = new Set(excludedIds || []);
      let best = null;
      for (let i = 0; i < pool.length; i += 1) {
        if (blocked.has(pool[i].id)) {
          continue;
        }
        for (let j = i + 1; j < pool.length; j += 1) {
          if (blocked.has(pool[j].id)) {
            continue;
          }
          const score = averagePairRelationship(pool[i], pool[j]);
          if (score < 4) {
            continue;
          }
          if (!best || score > best.score) {
            best = {
              players: [pool[i], pool[j]],
              score
            };
          }
        }
      }
      return best;
    }

    function detectAlliancesForTribe(tribePlayers) {
      if (!tribePlayers || tribePlayers.length < 2) {
        return [];
      }

      const candidates = [];
      const maxSize = Math.min(5, tribePlayers.length);
      for (let size = maxSize; size >= 2; size -= 1) {
        const combos = [];
        allCombinations(tribePlayers, size, 0, [], combos);
        combos.forEach((group) => {
          const average = averageGroupRelationship(group);
          const minimum = minimumGroupRelationship(group);
          const threshold = size === 2
            ? { average: 4.2, minimum: 3.2 }
            : size === 3
              ? { average: 3.2, minimum: 2.1 }
              : size === 4
                ? { average: 2.7, minimum: 1.6 }
                : { average: 2.35, minimum: 1.2 };
          if (average < threshold.average || minimum < threshold.minimum) {
            return;
          }
          const strategyAverage = group.reduce((sum, player) => sum + player.strategy, 0) / group.length;
          const socialAverage = group.reduce((sum, player) => sum + player.social, 0) / group.length;
          candidates.push({
            members: group.slice().sort((a, b) => a.name.localeCompare(b.name)),
            average,
            minimum,
            score: (average * 1.6) + (minimum * 0.7) + (strategyAverage * 0.18) + (socialAverage * 0.12)
          });
        });
      }

      candidates.sort((a, b) => {
        if (b.members.length !== a.members.length) {
          return b.members.length - a.members.length;
        }
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.members.map((player) => player.name).join(", ").localeCompare(b.members.map((player) => player.name).join(", "));
      });

      const usedIds = new Set();
      const picked = [];
      candidates.forEach((candidate) => {
        if (candidate.members.some((player) => usedIds.has(player.id))) {
          return;
        }
        picked.push(candidate);
        candidate.members.forEach((player) => usedIds.add(player.id));
      });
      return picked;
    }

    function allianceOverlapScore(oldAlliance, memberIds) {
      const oldSet = new Set(oldAlliance.memberIds || []);
      const newSet = new Set(memberIds || []);
      let intersection = 0;
      newSet.forEach((memberId) => {
        if (oldSet.has(memberId)) {
          intersection += 1;
        }
      });
      const union = new Set([].concat(Array.from(oldSet), Array.from(newSet)));
      return union.size ? intersection / union.size : 0;
    }

    function logAllianceHistoryEvent(state, tribeLabel, text, members, type) {
      const tracker = allianceTrackerState(state);
      tracker.history.push({
        episode: state.episodeNumber,
        tribeLabel,
        text,
        type: type || "note",
        memberIds: (members || []).map((member) => member.id)
      });
      logEpisodeBeat(state, text, members);
    }

    function syncTribeAlliances(state, tribePlayers, tribeLabel, options) {
      const settings = options || {};
      const tracker = allianceTrackerState(state);
      const candidates = detectAlliancesForTribe(tribePlayers);
      const existing = getActiveAlliancesForTribe(state, tribeLabel);
      const matchedIds = new Set();
      const nextActive = [];
      let didAnnounceHeader = false;
      let hadMeaningfulChange = false;

      const ensureHeader = () => {
        if (!settings.log || didAnnounceHeader || !candidates.length) {
          return;
        }
        didAnnounceHeader = true;
        logEpisodeBeat(state, "Alliance Snapshot - " + tribeLabel, tribePlayers);
      };

      candidates.forEach((candidate) => {
        const memberIds = candidate.members.map((member) => member.id).sort();
        const match = existing
          .filter((alliance) => !matchedIds.has(alliance.id))
          .map((alliance) => ({
            alliance,
            overlap: allianceOverlapScore(alliance, memberIds)
          }))
          .sort((a, b) => b.overlap - a.overlap || b.alliance.memberIds.length - a.alliance.memberIds.length)[0];

        if (match && match.overlap >= 0.5) {
          const alliance = match.alliance;
          matchedIds.add(alliance.id);
          const oldKey = alliance.memberIds.slice().sort().join("|");
          const newKey = memberIds.join("|");
          alliance.memberIds = memberIds;
          alliance.active = true;
          alliance.lastEpisode = state.episodeNumber;
          nextActive.push(alliance);
          if (settings.log && oldKey !== newKey) {
            hadMeaningfulChange = true;
            ensureHeader();
            logAllianceHistoryEvent(
              state,
              tribeLabel,
              alliance.name + " shifts into " + candidate.members.map((member) => member.name).join(", ") + ".",
              candidate.members,
              "shift"
            );
          }
          return;
        }

        const alliance = {
          id: "alliance-" + tracker.nextId,
          name: makeAllianceName(state),
          tribeLabel,
          memberIds,
          formedEpisode: state.episodeNumber,
          lastEpisode: state.episodeNumber,
          active: true
        };
        tracker.nextId += 1;
        nextActive.push(alliance);
        if (settings.log) {
          hadMeaningfulChange = true;
          ensureHeader();
          logAllianceHistoryEvent(
            state,
            tribeLabel,
            alliance.name + " forms between " + candidate.members.map((member) => member.name).join(", ") + ".",
            candidate.members,
            "formation"
          );
          maybeLogConfessional(state, {
            category: "alliance_formed",
            speakerPool: candidate.members,
            tribeLabel,
            players: candidate.members,
            context: {
              alliance: alliance.name,
              members: candidate.members.map((member) => shortPlayerName(member)).join(", ")
            },
            chance: 1
          });
        }
      });

      existing.forEach((alliance) => {
        if (matchedIds.has(alliance.id)) {
          return;
        }
        alliance.active = false;
        if (settings.log && alliance.memberIds.length >= 2) {
          hadMeaningfulChange = true;
          ensureHeader();
          logAllianceHistoryEvent(
            state,
            tribeLabel,
            alliance.name + " looks like it has cracked apart.",
            getAllianceMembers(state, alliance),
            "fracture"
          );
        }
      });

      tracker.active = tracker.active
        .filter((alliance) => alliance.tribeLabel !== tribeLabel || nextActive.some((entry) => entry.id === alliance.id))
        .concat(nextActive.filter((alliance) => !tracker.active.some((entry) => entry.id === alliance.id)));

      if (settings.log && candidates.length && (hadMeaningfulChange || state.rng.float() < 0.35)) {
        const summaries = nextActive
          .slice()
          .sort((a, b) => b.memberIds.length - a.memberIds.length || a.name.localeCompare(b.name))
          .slice(0, 2);
        summaries.forEach((alliance) => {
          ensureHeader();
          const members = getAllianceMembers(state, alliance);
          logEpisodeBeat(
            state,
            alliance.name + " currently includes " + members.map((member) => member.name).join(", ") + ".",
            members
          );
        });
      }
    }

    function pruneAllianceStateForPlayer(state, player) {
      const tracker = allianceTrackerState(state);
      tracker.active = tracker.active.reduce((list, alliance) => {
        if (!alliance.memberIds.includes(player.id)) {
          list.push(alliance);
          return list;
        }
        alliance.memberIds = alliance.memberIds.filter((memberId) => memberId !== player.id);
        if (alliance.memberIds.length >= 2) {
          list.push(alliance);
        } else {
          alliance.active = false;
        }
        return list;
      }, []);
    }

    function resetActiveAlliances(state) {
      const tracker = allianceTrackerState(state);
      tracker.active.forEach((alliance) => {
        alliance.active = false;
      });
      tracker.active = [];
    }

    function allianceTargetPressure(state, voter, target, pool) {
      if (!voter || !target) {
        return 0;
      }
      const tribeLabel = voter.currentTribeLabel || target.currentTribeLabel;
      const sharedAlliance = sharedAllianceBetween(state, voter, target);
      let modifier = 0;
      if (sharedAlliance) {
        modifier += 4 + (sharedAlliance.memberIds.length * 0.35);
      }

      const targetAlliance = findAllianceForPlayer(state, target, tribeLabel);
      if (targetAlliance && !sharedAlliance) {
        const activeMembers = targetAlliance.memberIds.filter((memberId) => memberId !== target.id && pool.some((player) => player.id === memberId));
        modifier -= activeMembers.length * 0.9;
      }

      const visiblePair = strongestVisiblePair(pool, new Set([voter.id]));
      if (visiblePair && visiblePair.players.some((player) => player.id === target.id) && !sharedAlliance) {
        modifier -= 0.75;
      }

      return modifier;
    }

    function simpleTargetInterest(observer, candidate) {
      if (!observer || !candidate || observer.id === candidate.id) {
        return Number.NEGATIVE_INFINITY;
      }
      const rel = observer.relationships[candidate.id] ?? 0;
      const perceivedThreat = observer.threatPerceptions[candidate.id] ?? candidate.threat;
      return perceivedThreat * Math.max(0.4, observer.strategy / 3) - rel;
    }

    function topSimpleTarget(observer, pool, excludedIds) {
      const blocked = excludedIds || new Set();
      return (pool || [])
        .filter((candidate) => candidate && candidate.id !== observer.id && !candidate.immune && !blocked.has(candidate.id))
        .slice()
        .sort((a, b) => simpleTargetInterest(observer, b) - simpleTargetInterest(observer, a) || a.name.localeCompare(b.name))[0] || null;
    }

    function shieldValueForVoter(state, settings, voter, target, pool) {
      if (!voter || !target || target.threat <= voter.threat) {
        return 0;
      }
      const progress = phaseProgress(state, settings);
      if (progress >= 0.78) {
        return 0;
      }

      const targetRelToVoter = target.relationships[voter.id] ?? 0;
      const targetPerceivedVoterThreat = target.threatPerceptions[voter.id] ?? voter.threat;
      const notComingForVoter = targetRelToVoter >= 0 || targetPerceivedVoterThreat <= Math.max(3, voter.threat);
      if (!notComingForVoter) {
        return 0;
      }

      const blocked = new Set([voter.id, target.id]);
      const voterNextTarget = topSimpleTarget(voter, pool, blocked);
      const targetNextTarget = topSimpleTarget(target, pool, blocked);
      const similarTargets = voterNextTarget && targetNextTarget && voterNextTarget.id === targetNextTarget.id;
      const sharedAlliance = sharedAllianceBetween(state, voter, target);
      const biggerThreatGap = Math.max(0, target.threat - voter.threat);
      const relationshipComfort = clamp((voter.relationships[target.id] ?? 0) / 4, -1, 1.5);
      const timingValue = 1 - progress;
      const strategicAwareness = voter.strategy / 5;
      const base = biggerThreatGap * 0.55 * timingValue * strategicAwareness;
      const alignmentBonus = similarTargets ? 1.1 : 0;
      const allianceBonus = sharedAlliance ? 0.85 : 0;
      const comfortBonus = Math.max(0, relationshipComfort) * 0.45;
      return Math.max(0, base + alignmentBonus + allianceBonus + comfortBonus);
    }

    function perceivedThreatRank(observer, other) {
      return observer && other ? (observer.threatPerceptions[other.id] ?? other.threat ?? 0) : 0;
    }

    function relationshipBand(rel, context) {
      if (context && context.friendCutoff != null && context.enemyCutoff != null) {
        if (rel >= context.friendCutoff) {
          return "friend";
        }
        if (rel <= context.enemyCutoff) {
          return "enemy";
        }
        return "neutral";
      }
      if (rel >= 5) {
        return "friend";
      }
      if (rel <= -4) {
        return "enemy";
      }
      return "neutral";
    }

    function threatComparison(observer, other) {
      const otherThreat = perceivedThreatRank(observer, other);
      const selfThreat = observer ? (observer.threat ?? 0) : 0;
      if (otherThreat >= selfThreat + 1.25) {
        return "higher";
      }
      if (otherThreat <= selfThreat - 1.25) {
        return "lower";
      }
      return "same";
    }

    function relationshipThreatLabel(observer, other, relOverride, threatComparisonOverride, context) {
      const rel = relOverride == null ? (observer.relationships[other.id] ?? 0) : relOverride;
      const band = relationshipBand(rel, context);
      const threat = threatComparisonOverride || threatComparison(observer, other);
      if (band === "friend" && threat === "higher") return "Shield";
      if (band === "enemy" && threat === "lower") return "Safe Vote";
      if (band === "friend" && threat === "lower") return "Goat";
      if (band === "enemy" && threat === "higher") return "Target";
      if (band === "friend") return "Ally";
      if (band === "enemy") return "Rival";
      if (threat === "higher") return "Wild Card";
      if (threat === "lower") return "Easy Vote";
      return "Swing Vote";
    }

    function voteActionForRelationshipLabel(label) {
      return {
        Shield: "Blindside",
        Ally: "Betrayal",
        Goat: "Clearing the Field",
        Target: "Direct Shot",
        Rival: "Removing Competition",
        "Safe Vote": "Playing it Safe",
        "Wild Card": "Removing Chaos",
        "Swing Vote": "Seizing Control",
        "Easy Vote": "Avoiding Blood"
      }[label] || "Vote Read";
    }

    function pickConfessionalSpeaker(state, preferredPool, fallbackPool) {
      const source = (preferredPool && preferredPool.length ? preferredPool : fallbackPool || [])
        .filter(Boolean);
      if (!source.length) {
        return null;
      }
      const tracker = storyTrackerState(state);
      return weightedChoice(state.rng, source, (player) => {
        const confessionalCount = tracker.confessionalCountsByPlayer.get(player.id) || 0;
        return Math.max(1, player.strategy + player.social) / (1 + (confessionalCount * 0.7));
      });
    }

    function maybeLogConfessional(state, options) {
      return false;
      /* Confessionals are currently disabled in favor of cleaner strategic episode text. */
      const settings = options || {};
      const chance = settings.chance == null ? 0.4 : settings.chance;
      if (chance <= 0 || state.rng.float() > chance) {
        return false;
      }
      const categoryTemplates = (CONFESSIONAL_LIBRARY[settings.category] || [])
        .filter((template, index, list) => list.indexOf(template) === index);
      const genericTemplates = (CONFESSIONAL_LIBRARY.generic || [])
        .filter((template, index, list) => list.indexOf(template) === index)
        .filter((template) => !categoryTemplates.includes(template));
      const templates = categoryTemplates.concat(genericTemplates);
      if (!templates.length) {
        return false;
      }
      const speaker = settings.speaker || pickConfessionalSpeaker(state, settings.speakerPool, settings.players);
      if (!speaker) {
        return false;
      }
      const context = {
        speaker,
        tribe: settings.tribeLabel || speaker.currentTribeLabel || "",
        alliance: settings.alliance || "",
        members: settings.members || "",
        target: settings.target || "",
        ally: settings.ally || "",
        reward: settings.reward || "",
        jurors: settings.jurors || "",
        ...settings.context
      };
      const tracker = storyTrackerState(state);
      const buildCandidates = (sourceTemplates) => sourceTemplates.map((template) => ({
        template,
        line: speaker.name + " confessional: " + renderTokenTemplate(template, context)
      }));
      const categoryCandidates = buildCandidates(categoryTemplates);
      const genericCandidates = buildCandidates(genericTemplates);
      const candidates = categoryCandidates.concat(genericCandidates);
      const freshCandidates = candidates.filter((candidate) => (
        !tracker.usedConfessionalTemplates.has(candidate.template)
        && !tracker.usedConfessionalLines.has(candidate.line)
      ));
      const freshLineCandidates = candidates.filter((candidate) => !tracker.usedConfessionalLines.has(candidate.line));
      const freshTemplateCandidates = candidates.filter((candidate) => !tracker.usedConfessionalTemplates.has(candidate.template));
      const categoryFreshCandidates = categoryCandidates.filter((candidate) => (
        !tracker.usedConfessionalTemplates.has(candidate.template)
        && !tracker.usedConfessionalLines.has(candidate.line)
      ));
      const categoryFreshLineCandidates = categoryCandidates.filter((candidate) => !tracker.usedConfessionalLines.has(candidate.line));
      const categoryFreshTemplateCandidates = categoryCandidates.filter((candidate) => !tracker.usedConfessionalTemplates.has(candidate.template));
      const choicePool = categoryFreshCandidates.length
        ? categoryFreshCandidates
        : categoryFreshLineCandidates.length
          ? categoryFreshLineCandidates
          : categoryFreshTemplateCandidates.length
            ? categoryFreshTemplateCandidates
            : freshCandidates.length
              ? freshCandidates
              : freshLineCandidates.length
                ? freshLineCandidates
                : freshTemplateCandidates.length
                  ? freshTemplateCandidates
                  : candidates;
      const selected = state.rng.choice(choicePool);
      const line = selected.line;
      tracker.usedConfessionalTemplates.add(selected.template);
      tracker.usedConfessionalLines.add(line);
      tracker.confessionalCountsByPlayer.set(speaker.id, (tracker.confessionalCountsByPlayer.get(speaker.id) || 0) + 1);
      const involvedPlayers = [speaker].concat(settings.players || []).filter(Boolean);
      logEpisodeBeat(state, line, involvedPlayers);
      return true;
    }

    function scoreTarget(state, settings, voter, target) {
      const relationshipWeight = (100 - (voter.strategy - 1) * 20) / 100;
      const rawThreatWeight = ((voter.strategy - 1) * 20) / 100;
      const perceivedThreat = voter.threatPerceptions[target.id] ?? target.threat;
      const phaseThreat = threatMultiplier(state, settings);
      const phasePreempt = phaseThreat > 0 ? Math.sqrt(phaseThreat) : 0;
      const relScore = voter.relationships[target.id] ?? 0;
      const baseScore = (relScore * relationshipWeight) - (perceivedThreat * rawThreatWeight * phaseThreat);

      const otherRelWeight = (100 - (target.strategy - 1) * 20) / 100;
      const otherThreatWeight = ((target.strategy - 1) * 20) / 100;
      const otherBase = ((target.relationships[voter.id] ?? 0) * otherRelWeight)
        - ((target.threatPerceptions[voter.id] ?? voter.threat) * otherThreatWeight * phaseThreat);

      const dangerFromOther = Math.max(0, -otherBase);
      const hostility = Math.max(0, -(target.relationships[voter.id] ?? 0));
      const stratScaled = Math.pow(voter.strategy / 5, 1.25);
      const preemptWeight = stratScaled * phasePreempt * 0.9;
      const preempt = dangerFromOther * (1 + 0.15 * hostility) * phasePreempt;
      const targetShield = getPlayerTargetShield(target);
      const juryThreat = estimateJuryThreatScore(state, settings, target);
      const juryPressure = currentJurorCount(state, settings)
        ? (0.15 + (0.35 * (currentJurorCount(state, settings) / Math.max(1, settings.jurySize))))
        : 0;
      const alliancePressure = allianceTargetPressure(state, voter, target, (voter.currentTribeLabel || target.currentTribeLabel)
        ? state.players.filter((player) => player.currentTribeLabel === (voter.currentTribeLabel || target.currentTribeLabel))
        : state.players.slice());
      const localPool = (voter.currentTribeLabel || target.currentTribeLabel)
        ? state.players.filter((player) => player.currentTribeLabel === (voter.currentTribeLabel || target.currentTribeLabel))
        : state.players.slice();
      const shieldValue = shieldValueForVoter(state, settings, voter, target, localPool);
      return baseScore - (preemptWeight * preempt) + targetShield - (juryThreat * juryPressure) + alliancePressure + shieldValue;
    }

    function chooseNominees(state, settings, pool) {
      const eligible = pool.filter((player) => !player.immune);
      const unshieldedEligible = eligible.filter((player) => !hasPlayerNomineeShield(player));
      const nomineePool = unshieldedEligible.length >= 2 ? unshieldedEligible : eligible;
      if (nomineePool.length <= 2) {
        return nomineePool.slice();
      }

      const advantagePressureCount = nomineePool.filter((player) => playerHasPlayableAdvantage(player)).length;
      const largeTribe = pool.length >= 9;
      const messyEnoughForThird = (
        largeTribe
        && (state.merged || currentJurorCount(state, settings) > 0 || advantagePressureCount > 0)
        && state.rng.float() < (advantagePressureCount > 0 ? 0.24 : 0.12)
      );
      const desired = Math.min(messyEnoughForThird ? 3 : 2, nomineePool.length);
      const majorityNeeded = Math.floor(pool.length / 2) + 1;
      const maxGroupSize = Math.min(pool.length - 1, majorityNeeded + 2);
      const plans = [];
      let checked = 0;
      const maxChecks = 700;

      function visitCombinations(items, size, start, combo, visitor) {
        if (combo.length === size) {
          visitor(combo.slice());
          return;
        }
        for (let index = start; index < items.length; index += 1) {
          combo.push(items[index]);
          visitCombinations(items, size, index + 1, combo, visitor);
          combo.pop();
          if (checked > maxChecks) {
            return;
          }
        }
      }

      for (let size = majorityNeeded; size <= maxGroupSize && checked <= maxChecks; size += 1) {
        visitCombinations(pool, size, 0, [], (group) => {
          checked += 1;
          const groupIds = new Set(group.map((player) => player.id));
          const outsiders = nomineePool.filter((target) => !groupIds.has(target.id));
          if (!outsiders.length) {
            return;
          }
          let bestTarget = null;
          let bestScore = Number.POSITIVE_INFINITY;
          outsiders.forEach((target) => {
            const score = group.reduce((sum, voter) => sum + scoreTarget(state, settings, voter, target), 0) / group.length;
            if (score < bestScore) {
              bestScore = score;
              bestTarget = target;
            }
          });
          if (!bestTarget) {
            return;
          }
          let cohesion = 0;
          let pairs = 0;
          for (let i = 0; i < group.length; i += 1) {
            for (let j = i + 1; j < group.length; j += 1) {
              cohesion += (((group[i].relationships[group[j].id] ?? 0) + (group[j].relationships[group[i].id] ?? 0)) / 2) / 12;
              pairs += 1;
            }
          }
          cohesion = pairs ? cohesion / pairs : 0;
          plans.push({
            target: bestTarget,
            score: bestScore - (0.35 * cohesion),
            cohesion
          });
        });
      }

      plans.sort((a, b) => a.score - b.score || b.cohesion - a.cohesion || a.target.name.localeCompare(b.target.name));
      const nominees = [];
      plans.forEach((plan) => {
        if (!nominees.some((player) => player.id === plan.target.id)) {
          nominees.push(plan.target);
        }
      });

      if (nominees.length < 2) {
        nomineePool
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((candidate) => {
            if (!nominees.some((player) => player.id === candidate.id)) {
              nominees.push(candidate);
            }
          });
      }

      return nominees.slice(0, Math.max(2, desired));
    }

    function chooseTarget(state, settings, voter, eligibles) {
      if (!eligibles.length) {
        return null;
      }

      return eligibles
        .slice()
        .sort((a, b) => {
          const delta = scoreTarget(state, settings, voter, a) - scoreTarget(state, settings, voter, b);
          return delta === 0 ? a.name.localeCompare(b.name) : delta;
        })[0];
    }

    function consolidatePluralityVotes(state, settings, pool, nominees, votes) {
      const tally = new Map();
      for (const targetId of votes.values()) {
        tally.set(targetId, (tally.get(targetId) || 0) + 1);
      }
      const activeVoteCount = Array.from(tally.values()).reduce((sum, count) => sum + count, 0);
      const majorityNeeded = Math.floor(activeVoteCount / 2) + 1;
      if (activeVoteCount < 5 || !tally.size) {
        return votes;
      }

      const orderedTargets = Array.from(tally.entries())
        .map(([targetId, count]) => ({
          target: pool.find((player) => player.id === targetId) || null,
          count
        }))
        .filter((entry) => entry.target)
        .sort((a, b) => b.count - a.count || a.target.name.localeCompare(b.target.name));
      const leaderEntry = orderedTargets[0];
      const runnerUpCount = orderedTargets[1] ? orderedTargets[1].count : 0;
      if (!leaderEntry || leaderEntry.count >= majorityNeeded || leaderEntry.count <= runnerUpCount) {
        return votes;
      }

      const leader = leaderEntry.target;
      if (playerHasPlayableAdvantage(leader)) {
        return votes;
      }

      const adjusted = new Map(votes);
      const movableVoters = pool
        .filter((voter) => adjusted.get(voter.id) && adjusted.get(voter.id) !== leader.id)
        .sort((a, b) => (
          ((b.strategy || 1) + (b.social || 1)) - ((a.strategy || 1) + (a.social || 1))
          || ((b.relationships[leader.id] ?? 0) - (a.relationships[leader.id] ?? 0))
          || a.name.localeCompare(b.name)
        ));

      for (const voter of movableVoters) {
        if ((tally.get(leader.id) || 0) >= majorityNeeded) {
          break;
        }
        const currentTargetId = adjusted.get(voter.id);
        const currentTarget = pool.find((player) => player.id === currentTargetId);
        if (!currentTarget) {
          continue;
        }
        const eligibleTargets = nominees.filter((candidate) => candidate.id !== voter.id && !candidate.immune);
        const fallbackTargets = pool.filter((candidate) => candidate.id !== voter.id && !candidate.immune);
        const legalTargets = eligibleTargets.length ? eligibleTargets : fallbackTargets;
        if (!legalTargets.some((candidate) => candidate.id === leader.id)) {
          continue;
        }
        const leaderScore = scoreTarget(state, settings, voter, leader);
        const currentScore = scoreTarget(state, settings, voter, currentTarget);
        const canConsolidate = leaderScore <= currentScore + 1.25 || voter.strategy >= 4 || voter.social >= 4;
        if (canConsolidate && state.rng.float() < 0.82) {
          adjusted.set(voter.id, leader.id);
          tally.set(currentTarget.id, (tally.get(currentTarget.id) || 0) - 1);
          if ((tally.get(currentTarget.id) || 0) <= 0) {
            tally.delete(currentTarget.id);
          }
          tally.set(leader.id, (tally.get(leader.id) || 0) + 1);
          logLines(state, "Vote consolidation: " + voter.name + " shifts from " + currentTarget.name + " to " + leader.name + " to avoid an accidental plurality.");
        }
      }

      return adjusted;
    }

    function buildProjectedVotePlan(state, settings, pool) {
      const nominees = chooseNominees(state, settings, pool);
      let votes = new Map();
      const tally = new Map();

      for (const voter of pool) {
        const eligibleTargets = nominees.filter((candidate) => candidate.id !== voter.id && !candidate.immune);
        const fallbackTargets = pool.filter((candidate) => candidate.id !== voter.id && !candidate.immune);
        const target = chooseTarget(state, settings, voter, eligibleTargets.length ? eligibleTargets : fallbackTargets);
        if (!target) {
          continue;
        }
        votes.set(voter.id, target.id);
        tally.set(target.id, (tally.get(target.id) || 0) + 1);
      }

      const leaders = pool
        .filter((player) => tally.has(player.id))
        .slice()
        .sort((a, b) => (tally.get(b.id) || 0) - (tally.get(a.id) || 0) || a.name.localeCompare(b.name));

      return {
        nominees,
        votes,
        tally,
        leaders
      };
    }

    function pickConversationPair(state, pool, target, excludedIds) {
      const blocked = new Set(excludedIds || []);
      if (target) {
        blocked.add(target.id);
      }

      const speakers = pool
        .filter((player) => !blocked.has(player.id))
        .slice()
        .sort((a, b) => {
          const aScore = (a.strategy * 2) + a.social - (target ? (a.relationships[target.id] ?? 0) : 0);
          const bScore = (b.strategy * 2) + b.social - (target ? (b.relationships[target.id] ?? 0) : 0);
          if (aScore === bScore) {
            return a.name.localeCompare(b.name);
          }
          return bScore - aScore;
        });
      const speakerPool = speakers.slice(0, Math.min(3, speakers.length));
      const speaker = speakerPool.length ? state.rng.choice(speakerPool) : null;
      if (!speaker) {
        return null;
      }

      const listeners = pool
        .filter((player) => player.id !== speaker.id && !blocked.has(player.id))
        .slice()
        .sort((a, b) => {
          const aScore = (speaker.relationships[a.id] ?? 0) + a.social;
          const bScore = (speaker.relationships[b.id] ?? 0) + b.social;
          if (aScore === bScore) {
            return a.name.localeCompare(b.name);
          }
          return bScore - aScore;
        });
      const listenerPool = listeners.slice(0, Math.min(3, listeners.length));
      const listener = listenerPool.length ? state.rng.choice(listenerPool) : null;
      if (!listener) {
        return null;
      }

      return { speaker, listener };
    }

    function strongestCurrentJurorConnections(state, settings, target) {
      return getCurrentJurors(state, settings)
        .slice()
        .sort((a, b) => (b.relationships[target.id] ?? 0) - (a.relationships[target.id] ?? 0) || a.name.localeCompare(b.name))
        .slice(0, 2);
    }

    function identifyTargetReason(state, settings, pool, target) {
      const juryThreat = estimateJuryThreatScore(state, settings, target);
      const averageInbound = averageRelationshipToward(state, target, pool);
      const targetAlliance = findAllianceForPlayer(state, target, target.currentTribeLabel);
      if (currentJurorCount(state, settings) > 0 && juryThreat >= 4.5) {
        return "jury";
      }
      if (targetAlliance && targetAlliance.memberIds.length >= 3) {
        return "alliance";
      }
      if (!state.merged && target.challenge >= 4) {
        return "challenge";
      }
      if (hasPlayerNomineeShield(target) || playerHasPlayableAdvantage(target)) {
        return "advantage";
      }
      if (target.strategy >= 4) {
        return "strategy";
      }
      if (averageInbound >= 1.5 || target.social >= 4) {
        return "social";
      }
      if (target.threat >= 4) {
        return "threat";
      }
      return "consensus";
    }

    function runPreTribalStrategyBeats(state, settings, pool, tribeLabel) {
      if (!pool.length) {
        return;
      }

      logEpisodeBeat(state, "Pre-Tribal: " + tribeLabel, pool);

      const plan = buildProjectedVotePlan(state, settings, pool);
      const mainTarget = plan.leaders[0];
      if (!mainTarget) {
        return;
      }
      const jurors = getCurrentJurors(state, settings);
      const targetCount = state.rng.int(6, 10);
      const usedCounts = new Map();
      const visibleDuo = strongestVisiblePair(pool, new Set([mainTarget.id]));
      const contenderMap = new Map();
      plan.leaders.slice(0, 3).forEach((player) => {
        if (player) {
          contenderMap.set(player.id, player);
        }
      });
      plan.nominees.slice(0, 3).forEach((player) => {
        if (player) {
          contenderMap.set(player.id, player);
        }
      });
      const contenders = Array.from(contenderMap.values())
        .filter((player) => pool.some((entry) => entry.id === player.id))
        .slice(0, 3);
      const backupTarget = contenders.find((player) => player.id !== mainTarget.id) || null;

      const tallyFor = (target) => target ? (plan.tally.get(target.id) || 0) : 0;
      const strongestAllyFor = (target) => {
        if (!target) {
          return null;
        }
        return pool
          .filter((player) => player.id !== target.id)
          .slice()
          .sort((a, b) => (b.relationships[target.id] ?? 0) - (a.relationships[target.id] ?? 0) || a.name.localeCompare(b.name))[0] || null;
      };
      const reasonFor = (target) => identifyTargetReason(state, settings, pool, target);
      const allianceFor = (target) => findAllianceForPlayer(state, target, tribeLabel);
      const topJurorText = (target) => {
        const names = strongestCurrentJurorConnections(state, settings, target).map((player) => player.name);
        return names.length ? names.join(" and ") : "the jury";
      };
      const otherContenders = (target) => contenders.filter((player) => !target || player.id !== target.id);
      const pickAlternative = (target) => {
        const others = otherContenders(target);
        if (!others.length) {
          return null;
        }
        return weightedChoice(state.rng, others, (player) => Math.max(1, tallyFor(player) + (player.id === mainTarget.id ? 2 : 1)));
      };
      const applySuspicion = (pair, target, threatDelta) => {
        if (!pair) {
          return;
        }
        bumpRelationship(pair.speaker, pair.listener, 1);
        bumpRelationship(pair.listener, pair.speaker, 1);
        if (target) {
          bumpRelationship(pair.speaker, target, -1);
          bumpRelationship(pair.listener, target, -1);
          if (threatDelta) {
            target.threat = (target.threat ?? 0) + threatDelta;
          }
        }
      };
      const pickFocusedTarget = (stage) => {
        if (stage === "late" || contenders.length === 1) {
          return mainTarget;
        }
        if (stage === "early") {
          return weightedChoice(state.rng, contenders, (target) => {
            if (target.id === mainTarget.id) {
              return 1.4;
            }
            if (backupTarget && target.id === backupTarget.id) {
              return 2.3;
            }
            return 1.8;
          }) || mainTarget;
        }
        return weightedChoice(state.rng, contenders, (target) => {
          if (target.id === mainTarget.id) {
            return 2.6;
          }
          if (backupTarget && target.id === backupTarget.id) {
            return 1.9;
          }
          return 1.2;
        }) || mainTarget;
      };
      const renderBeatLine = (template, context, players, confessionalCategory, chance) => {
        const line = renderTokenTemplate(template, context);
        logEpisodeBeat(state, line, players);
        maybeLogConfessional(state, {
          category: confessionalCategory || "strategy",
          speakerPool: players,
          players,
          tribeLabel,
          context: {
            target: context.target || "",
            ally: context.alt || "",
            alliance: context.alliance || "",
            jurors: context.jurors || ""
          },
          chance: chance == null ? 0.24 : chance
        });
      };

      if (contenders.length > 1) {
        const openingNames = contenders.map((player) => player.name).join(", ");
        logEpisodeBeat(state, "Early whispers scatter between " + openingNames + ", and nobody seems completely sure which way the vote is going to break.", contenders);
      }

      const executeBeat = (type, target) => {
        const altTarget = pickAlternative(target);
        const pairTarget = type === "numbers_blurry" || type === "backup_float" || type === "backup_contingency"
          ? null
          : target;
        const pair = pickConversationPair(state, pool, pairTarget);
        const alliance = allianceFor(target);
        const strongestAlly = strongestAllyFor(target);
        const context = {
          speaker: pair ? pair.speaker.name : "",
          listener: pair ? pair.listener.name : "",
          target: target ? target.name : "",
          alt: altTarget ? altTarget.name : "",
          alliance: alliance ? alliance.name : "",
          jurors: target ? topJurorText(target) : ""
        };

        if (type !== "ally_pushback" && !pair) {
          return false;
        }

        if (type === "case_target" && target) {
          const reason = reasonFor(target);
          let template = "{speaker} tells {listener} that {target} is starting to feel like the cleanest vote tonight.";
          let category = "strategy";
          let threatDelta = 0;
          if (reason === "jury") {
            template = "{speaker} tells {listener} that {target} may already have {jurors} leaning their way, which is exactly why they cannot let them get any deeper.";
            category = "jury_threat";
            threatDelta = 1;
          } else if (reason === "alliance" && alliance) {
            template = "{speaker} tells {listener} that {target} looks too insulated inside {alliance}, and that leaving that structure intact is asking for trouble.";
            category = "alliance_target";
          } else if (reason === "challenge") {
            template = "{speaker} warns {listener} that {target} could dominate the next stretch of challenges, so this may be the last clean chance to take the shot.";
            category = "strategy";
            threatDelta = 1;
          } else if (reason === "advantage") {
            template = "{speaker} worries to {listener} that {target} may have some kind of protection, and says waiting any longer only makes that scarier.";
            category = "advantage_found";
          } else if (reason === "strategy") {
            template = "{speaker} tells {listener} that too many important conversations keep passing through {target}, and that is how somebody quietly takes control.";
            category = "strategy";
            threatDelta = 1;
          } else if (reason === "social") {
            template = "{speaker} tells {listener} that everyone feels a little too good about {target}, which is exactly what makes them dangerous.";
            category = "strategy";
          } else if (reason === "threat") {
            template = "{speaker} says to {listener} that {target} just feels too dangerous to leave around much longer.";
            category = "strategy";
            threatDelta = 1;
          }
          renderBeatLine(template, context, [pair.speaker, pair.listener, target], category, 0.18);
          applySuspicion(pair, target, threatDelta);
          return true;
        }

        if (type === "counter_target" && target && altTarget) {
          const templates = [
            "{speaker} tells {listener} that they still cannot let go of {target}'s name, even if more people seem to be circling {alt}.",
            "{speaker} pushes {target} to {listener} and says the tribe may be overthinking things by drifting toward {alt}.",
            "{speaker} reminds {listener} that {target} is still an option, and says the vote may be getting too cute if everyone keeps overcorrecting to {alt}."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target, altTarget], "strategy", 0.14);
          applySuspicion(pair, target, 0);
          return true;
        }

        if (type === "swing_vote_check" && target) {
          const templates = altTarget ? [
            "{speaker} quietly checks with {listener} because they are worried one nervous conversation could still swing the vote from {target} to {alt}.",
            "{speaker} tells {listener} that tonight still feels fragile, because it would not take much for the tribe to flip from {target} to {alt}.",
            "{speaker} checks in with {listener} and admits they do not trust how live both {target} and {alt} still feel."
          ] : [
            "{speaker} quietly checks with {listener} because they are worried the vote is still softer than it looks.",
            "{speaker} tells {listener} that even if {target} sounds like the name, they do not trust it yet.",
            "{speaker} compares notes with {listener} and says one weird conversation could still change tonight."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target].concat(altTarget ? [altTarget] : []), "strategy", 0.14);
          bumpRelationship(pair.speaker, pair.listener, 1);
          bumpRelationship(pair.listener, pair.speaker, 1);
          return true;
        }

        if (type === "numbers_blurry" && target && altTarget) {
          const openPair = pickConversationPair(state, pool, null);
          if (!openPair) {
            return false;
          }
          const openContext = {
            speaker: openPair.speaker.name,
            listener: openPair.listener.name,
            target: target.name,
            alt: altTarget.name
          };
          const templates = [
            "{speaker} compares notes with {listener} and realizes the tribe still sounds split between {target} and {alt}.",
            "By the time {speaker} catches {listener}, the names still bouncing around most are {target} and {alt}.",
            "{speaker} tells {listener} that every new conversation seems to land on either {target} or {alt}, and that is making the afternoon feel unstable."
          ];
          renderBeatLine(state.rng.choice(templates), openContext, [openPair.speaker, openPair.listener, target, altTarget], "strategy", 0.12);
          bumpRelationship(openPair.speaker, openPair.listener, 1);
          bumpRelationship(openPair.listener, openPair.speaker, 1);
          return true;
        }

        if (type === "numbers_shift" && target) {
          const templates = altTarget ? [
            "{speaker} comes back to {listener} and says it finally feels like the vote is leaning harder toward {target} than {alt}.",
            "After another round of whispers, {speaker} tells {listener} that {target} now seems to have more traction than {alt}.",
            "{speaker} tells {listener} that the energy has started drifting off {alt} and onto {target}."
          ] : [
            "{speaker} tells {listener} that {target}'s name is starting to come up with enough consistency that the vote is beginning to feel real.",
            "{speaker} senses to {listener} that the tribe is finally narrowing in on {target}.",
            "{speaker} says to {listener} that the chatter is no longer all over the place and now seems to keep returning to {target}."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target].concat(altTarget ? [altTarget] : []), "strategy", 0.12);
          applySuspicion(pair, target, 0);
          return true;
        }

        if (type === "ally_pushback" && target && strongestAlly && (strongestAlly.relationships[target.id] ?? 0) >= 2) {
          const allyPair = pickConversationPair(state, pool, target, new Set([strongestAlly.id]));
          if (!allyPair) {
            return false;
          }
          const allyContext = {
            speaker: allyPair.speaker.name,
            target: target.name,
            ally: strongestAlly.name
          };
          const templates = [
            "{ally} pushes back when {speaker} raises {target}'s name, making it obvious the vote is not settled.",
            "{ally} does not hide their discomfort when {speaker} tests {target}'s name, and suddenly the plan feels less clean.",
            "When {speaker} floats {target}, {ally} immediately throws cold water on it and reminds everyone that this vote is still live."
          ];
          renderBeatLine(state.rng.choice(templates), allyContext, [allyPair.speaker, strongestAlly, target], "alliance_defense", 0.32);
          bumpRelationship(strongestAlly, target, 1);
          bumpRelationship(target, strongestAlly, 1);
          bumpRelationship(strongestAlly, allyPair.speaker, -1);
          bumpRelationship(allyPair.speaker, strongestAlly, -1);
          return true;
        }

        if (type === "duo_warning" && visibleDuo) {
          const duoPair = pair || pickConversationPair(state, pool, null);
          if (!duoPair) {
            return false;
          }
          const duoNames = visibleDuo.players.map((player) => player.name);
          const duoContext = {
            speaker: duoPair.speaker.name,
            listener: duoPair.listener.name,
            target: duoNames[0],
            alt: duoNames[1]
          };
          const templates = [
            "{speaker} points out to {listener} that {target} and {alt} are always together, and says that kind of visible pair never stays harmless for long.",
            "{speaker} tells {listener} that {target} and {alt} feel too connected to ignore, even if neither is the obvious name yet.",
            "{speaker} says to {listener} that one reason tonight feels messy is because everybody can see how tight {target} and {alt} are."
          ];
          renderBeatLine(state.rng.choice(templates), duoContext, [duoPair.speaker, duoPair.listener].concat(visibleDuo.players), "duo_warning", 0.26);
          bumpRelationship(duoPair.speaker, duoPair.listener, 1);
          bumpRelationship(duoPair.listener, duoPair.speaker, 1);
          return true;
        }

        if (type === "split_vote_concern" && target && altTarget) {
          const templates = [
            "{speaker} worries to {listener} that too much bouncing between {target} and {alt} could leave the tribe with a split it did not mean to create.",
            "{speaker} tells {listener} that if people keep speaking about both {target} and {alt}, they could accidentally make the vote messy.",
            "{speaker} warns {listener} that all this back-and-forth between {target} and {alt} is how someone unexpected slips through."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target, altTarget], "vote_split", 0.28);
          bumpRelationship(pair.speaker, pair.listener, 1);
          bumpRelationship(pair.listener, pair.speaker, 1);
          return true;
        }

        if (type === "backup_float" && target && altTarget) {
          const openPair = pickConversationPair(state, pool, null, new Set([target.id, altTarget.id]));
          if (!openPair) {
            return false;
          }
          const openContext = {
            speaker: openPair.speaker.name,
            listener: openPair.listener.name,
            target: target.name,
            alt: altTarget.name
          };
          const templates = [
            "{speaker} floats {alt} to {listener} as another real option, and for a moment it feels like the vote could tip that way instead of {target}.",
            "{speaker} tells {listener} that if the tribe backs off {target}, they would rather land on {alt}.",
            "{speaker} quietly raises {alt} with {listener}, and the conversation makes it sound like the plan may not be as settled as people think."
          ];
          renderBeatLine(state.rng.choice(templates), openContext, [openPair.speaker, openPair.listener, target, altTarget], "vote_split", 0.2);
          bumpRelationship(openPair.speaker, openPair.listener, 1);
          bumpRelationship(openPair.listener, openPair.speaker, 1);
          bumpRelationship(openPair.speaker, altTarget, -1);
          return true;
        }

        if (type === "backup_contingency" && backupTarget) {
          const openPair = pickConversationPair(state, pool, null, new Set([mainTarget.id, backupTarget.id]));
          if (!openPair) {
            return false;
          }
          const openContext = {
            speaker: openPair.speaker.name,
            listener: openPair.listener.name,
            target: mainTarget.name,
            alt: backupTarget.name
          };
          const templates = [
            "{speaker} tells {listener} that if the vote gets shaky at the last second, {alt} is the backup name.",
            "{speaker} and {listener} quietly agree that if tonight gets strange, they can always fall back on {alt}.",
            "{speaker} makes sure {listener} is ready to pivot to {alt} if the tribe loses its nerve on {target}."
          ];
          renderBeatLine(state.rng.choice(templates), openContext, [openPair.speaker, openPair.listener, mainTarget, backupTarget], "vote_split", 0.18);
          bumpRelationship(openPair.speaker, openPair.listener, 1);
          bumpRelationship(openPair.listener, openPair.speaker, 1);
          return true;
        }

        if (type === "tribe_strength_pitch" && !state.merged && target) {
          renderBeatLine("{speaker} tells {listener} that keeping the tribe strong matters, but they still think {target} is the better vote tonight.", context, [pair.speaker, pair.listener, target], "strategy", 0.12);
          applySuspicion(pair, target, 0);
          return true;
        }

        if (type === "before_merge_pitch" && !state.merged && target) {
          const templates = [
            "{speaker} argues to {listener} that if they are ever going to take the shot at {target}, it has to happen before the merge changes everything.",
            "{speaker} tells {listener} that waiting until after the merge to deal with {target} could be a mistake they do not get to fix.",
            "{speaker} says to {listener} that the tribe needs to decide now whether {target} is someone they can really afford to leave in the game."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target], "strategy", 0.18);
          applySuspicion(pair, target, 0);
          return true;
        }

        if (type === "jury_math_chat" && jurors.length && target) {
          const templates = [
            "{speaker} counts votes out loud with {listener} and says {target} may already have {jurors} in their corner.",
            "{speaker} tells {listener} that the scary part about {target} is not tonight, it is that {jurors} may already respect them at the end.",
            "{speaker} and {listener} keep landing back on the idea that {target} might already have {jurors} leaning their way."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target], "jury_threat", 0.34);
          applySuspicion(pair, target, 1);
          return true;
        }

        if (type === "who_beats_who" && jurors.length && target) {
          const templates = [
            "{speaker} asks {listener} who actually beats whom at the end, and the answer keeps dragging them back toward {target}.",
            "{speaker} and {listener} talk endgame matchups and both come away more nervous about {target}.",
            "{speaker} tells {listener} that every final tribal thought experiment seems to make {target} look scarier."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target], "jury_threat", 0.3);
          applySuspicion(pair, target, 1);
          return true;
        }

        if (type === "numbers_settle" && target) {
          const settleContext = {
            speaker: pair.speaker.name,
            listener: pair.listener.name,
            target: target.name,
            alt: altTarget ? altTarget.name : ""
          };
          const templates = altTarget ? [
            "Late in the afternoon, {speaker} tells {listener} that the chaos finally seems to be settling on {target}, not {alt}.",
            "{speaker} comes back to {listener} with the feeling that the tribe has mostly stopped wandering and is now landing on {target}.",
            "By sunset, {speaker} and {listener} both get the sense that {target} has moved in front of {alt}."
          ] : [
            "Late in the afternoon, {speaker} realizes with {listener} that the vote has started settling on {target}.",
            "{speaker} tells {listener} that enough separate conversations now point toward {target} that the plan finally feels real.",
            "By the end of the scrambling, {speaker} and {listener} both feel the tribe narrowing toward {target}."
          ];
          renderBeatLine(state.rng.choice(templates), settleContext, [pair.speaker, pair.listener, target].concat(altTarget ? [altTarget] : []), "strategy", 0.12);
          applySuspicion(pair, target, 0);
          return true;
        }

        if (type === "vote_lock" && target) {
          const templates = [
            "{speaker} asks {listener} for a firm commitment on {target}, wanting to make sure the vote does not drift again.",
            "{speaker} checks one more time that {listener} is really good with {target}.",
            "{speaker} tells {listener} that if they want this plan to work, everybody needs to stay on {target}."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target], "strategy", 0.14);
          applySuspicion(pair, target, 0);
          return true;
        }

        if (type === "final_check" && target) {
          const templates = altTarget ? [
            "{speaker} and {listener} compare notes one last time and agree the safer path is still {target}, even though {alt} had real traction earlier.",
            "{speaker} tells {listener} that they have heard enough now to believe the vote should land on {target}, not {alt}.",
            "One last quiet check between {speaker} and {listener} leaves both believing the tribe is finally there on {target}."
          ] : [
            "{speaker} and {listener} compare notes one last time and decide the safest path is still {target}.",
            "{speaker} quietly confirms with {listener} that nothing seems to be moving off {target} anymore.",
            "{speaker} tells {listener} that unless somebody panics, the vote should stay on {target}."
          ];
          renderBeatLine(state.rng.choice(templates), context, [pair.speaker, pair.listener, target].concat(altTarget ? [altTarget] : []), "strategy", 0.1);
          bumpRelationship(pair.speaker, pair.listener, 1);
          bumpRelationship(pair.listener, pair.speaker, 1);
          return true;
        }

        return false;
      };

      const stagePools = {
        early: ["case_target", "counter_target", "numbers_blurry", "swing_vote_check"],
        middle: ["case_target", "counter_target", "numbers_shift", "split_vote_concern", "backup_float", "ally_pushback"],
        late: ["numbers_settle", "vote_lock", "final_check", "backup_contingency", "case_target"]
      };
      if (!state.merged) {
        stagePools.early.push("tribe_strength_pitch", "before_merge_pitch");
      }
      if (jurors.length) {
        stagePools.middle.push("jury_math_chat", "who_beats_who");
      }
      if (visibleDuo) {
        stagePools.early.push("duo_warning");
      }
      if (!backupTarget) {
        stagePools.middle = stagePools.middle.filter((type) => type !== "split_vote_concern" && type !== "backup_float");
        stagePools.late = stagePools.late.filter((type) => type !== "backup_contingency");
      }
      if (contenders.length < 2) {
        stagePools.early = stagePools.early.filter((type) => type !== "counter_target" && type !== "numbers_blurry");
        stagePools.middle = stagePools.middle.filter((type) => type !== "counter_target");
      }

      let guard = 0;
      let played = contenders.length > 1 ? 1 : 0;
      while (played < targetCount && guard < 80) {
        const progress = played / Math.max(1, targetCount - 1);
        const stage = progress < 0.34 ? "early" : (progress < 0.72 ? "middle" : "late");
        const availableTypes = stagePools[stage].filter((type) => (usedCounts.get(type) || 0) < (
          type === "case_target" || type === "counter_target" || type === "numbers_shift" ? 2 : 1
        ));
        if (!availableTypes.length) {
          break;
        }
        const type = state.rng.choice(availableTypes);
        const focusTarget = type === "backup_contingency"
          ? mainTarget
          : pickFocusedTarget(stage);
        if (executeBeat(type, focusTarget)) {
          usedCounts.set(type, (usedCounts.get(type) || 0) + 1);
          played += 1;
        } else {
          usedCounts.set(type, (usedCounts.get(type) || 0) + 1);
        }
        guard += 1;
      }
    }

    function bumpRelationship(a, b, delta) {
      if (!a || !b || a.id === b.id) {
        return;
      }
      a.relationships[b.id] = (a.relationships[b.id] ?? 0) + delta;
    }

    function relationshipDrift(state, players) {
      for (let i = 0; i < players.length; i += 1) {
        for (let j = i + 1; j < players.length; j += 1) {
          const a = players[i];
          const b = players[j];
          const avgSocial = (a.social + b.social) / 2;
          const pPositive = 0.27 + 0.16 * (avgSocial / 5);
          const pNegative = 0.13 - 0.06 * (avgSocial / 5);
          const roll = state.rng.float();
          let delta = 0;

          if (roll < pNegative) {
            delta = -1;
          } else if (roll > 1 - pPositive) {
            delta = state.rng.float() < (0.1 + 0.1 * (avgSocial / 5)) ? 2 : 1;
          }

          if (delta !== 0) {
            bumpRelationship(a, b, delta);
            bumpRelationship(b, a, delta);
          }
        }
      }
    }

    function bondingDrift(state, players, boost) {
      for (let i = 0; i < players.length; i += 1) {
        for (let j = i + 1; j < players.length; j += 1) {
          const a = players[i];
          const b = players[j];
          const avgSocial = (a.social + b.social) / 2;
          const pPositive = 0.35 + boost + 0.16 * (avgSocial / 5);
          const pNegative = Math.max(0.02, 0.1 - 0.05 * (avgSocial / 5));
          const roll = state.rng.float();
          let delta = 0;

          if (roll < pNegative) {
            delta = -1;
          } else if (roll > 1 - pPositive) {
            delta = state.rng.float() < 0.25 ? 2 : 1;
          }

          if (delta !== 0) {
            bumpRelationship(a, b, delta);
            bumpRelationship(b, a, delta);
          }
        }
      }
    }

    function getPlayerAdvantages(player) {
      if (!player.activeAdvantages) {
        player.activeAdvantages = [];
      }
      return player.activeAdvantages;
    }

    function getPlayerInventory(player) {
      if (!player.inventory) {
        player.inventory = { idol: 0 };
      }
      if (player.inventory.idol == null) {
        player.inventory.idol = 0;
      }
      return player.inventory;
    }

    function playerHasPlayableAdvantage(player) {
      return getPlayerAdvantages(player).length > 0 || getPlayerInventory(player).idol > 0;
    }

    function grantIdol(state, player, sourceLabel) {
      if (!player) {
        return false;
      }
      const inventory = getPlayerInventory(player);
      inventory.idol += 1;
      player.idolsFound = (player.idolsFound || 0) + 1;
      player.advantagesFound = (player.advantagesFound || 0) + 1;
      player.threat = (player.threat ?? 0) + 1;
      logEpisodeBeat(state, player.name + " finds a Hidden Immunity Idol" + (sourceLabel ? " " + sourceLabel : "") + ".", [player]);
      return true;
    }

    function seedStartingIdols(state) {
      state.tribes.forEach((tribe, index) => {
        if (!tribe.length || state.rng.float() >= 0.65) {
          return;
        }
        const seeker = weightedChoice(state.rng, tribe, (player) => Math.max(1, player.strategy + (player.social * 0.35)));
        grantIdol(state, seeker, "for " + (state.tribeNames[index] || "their tribe"));
      });
    }

    function maybeGrantRewardAdvantage(state, attendees, sourceLabel) {
      const candidates = (attendees || []).filter(Boolean);
      if (!candidates.length || state.rng.float() >= 0.22) {
        return;
      }
      const finder = weightedChoice(state.rng, candidates, (player) => Math.max(1, player.strategy + player.social * 0.25));
      grantIdol(state, finder, "during " + sourceLabel);
    }

    function expireStandardIdolsAfterFinalFive(state) {
      if (!state.merged || state.players.length !== 4) {
        return;
      }
      const expired = [];
      state.players.forEach((player) => {
        const inventory = getPlayerInventory(player);
        if (inventory.idol > 0) {
          inventory.idol = 0;
          expired.push(player.name);
        }
      });
      if (expired.length) {
        logEpisodeBeat(state, "Standard idols expire after the Final 5 Tribal Council: " + expired.join(", "), []);
      }
    }

    function pruneExpiredAdvantages(player) {
      player.activeAdvantages = getPlayerAdvantages(player).filter((advantage) => {
        const tracksChallenges = advantage.remainingChallenges != null;
        const tracksTribals = advantage.remainingTribals != null;
        if (!tracksChallenges && !tracksTribals) {
          return true;
        }
        if (tracksChallenges && advantage.remainingChallenges > 0) {
          return true;
        }
        if (tracksTribals && advantage.remainingTribals > 0) {
          return true;
        }
        return false;
      });
    }

    function getPlayerChallengeBonus(player) {
      return getPlayerAdvantages(player).reduce((sum, advantage) => {
        if ((advantage.remainingChallenges ?? 0) <= 0) {
          return sum;
        }
        return sum + Number(advantage.challengeBonus || 0);
      }, 0);
    }

    function getPlayerTargetShield(player) {
      return getPlayerAdvantages(player).reduce((sum, advantage) => {
        if ((advantage.remainingTribals ?? 0) <= 0) {
          return sum;
        }
        return sum + Number(advantage.targetShield || 0);
      }, 0);
    }

    function hasPlayerNomineeShield(player) {
      return getPlayerAdvantages(player).some((advantage) => advantage.nomineeShield && (advantage.remainingTribals ?? 0) > 0);
    }

    function consumeChallengeAdvantages(players) {
      players.forEach((player) => {
        getPlayerAdvantages(player).forEach((advantage) => {
          if ((advantage.remainingChallenges ?? 0) > 0) {
            advantage.remainingChallenges -= 1;
          }
        });
        pruneExpiredAdvantages(player);
      });
    }

    function consumeTribalAdvantages(players) {
      players.forEach((player) => {
        getPlayerAdvantages(player).forEach((advantage) => {
          if ((advantage.remainingTribals ?? 0) > 0) {
            advantage.remainingTribals -= 1;
          }
        });
        pruneExpiredAdvantages(player);
      });
    }

    function dslEventPhaseMatches(state, eventDef) {
      if (!eventDef || !eventDef.phase || eventDef.phase === "any") {
        return true;
      }
      if (eventDef.phase === "premerge") {
        return !state.merged;
      }
      if (eventDef.phase === "merged") {
        return state.merged;
      }
      return state.phaseKey === eventDef.phase;
    }

    function syncEventDslState(state) {
      if (!state.eventDsl) {
        state.eventDsl = {
          tribeFlags: new Map(),
          playerAdvantages: new Map()
        };
      }

      state.tribeNames.forEach((label) => {
        if (!state.eventDsl.tribeFlags.has(label)) {
          state.eventDsl.tribeFlags.set(label, {
            advantageAvailable: true
          });
        }
      });
    }

    function getEventDslTribeFlags(state, tribeLabel) {
      syncEventDslState(state);
      if (!state.eventDsl.tribeFlags.has(tribeLabel)) {
        state.eventDsl.tribeFlags.set(tribeLabel, {
          advantageAvailable: true
        });
      }
      return state.eventDsl.tribeFlags.get(tribeLabel);
    }

    function weightedChoice(rng, items, weightFn) {
      if (!items.length) {
        return null;
      }

      const total = items.reduce((sum, item) => sum + Math.max(0, weightFn(item)), 0);
      if (total <= 0) {
        return rng.choice(items);
      }

      let roll = rng.float() * total;
      for (const item of items) {
        roll -= Math.max(0, weightFn(item));
        if (roll <= 0) {
          return item;
        }
      }

      return items[items.length - 1];
    }

    function buildEventActorContexts(actorDefs, tribePlayers, rng) {
      const actorKeys = Object.keys(actorDefs || {});
      let contexts = [{}];

      for (const actorKey of actorKeys) {
        const actorDef = actorDefs[actorKey] || {};
        const sourcePlayers = actorDef.source === "tribe_member" ? tribePlayers : tribePlayers;
        const nextContexts = [];

        contexts.forEach((context) => {
          let candidates = sourcePlayers.slice();
          const distinctFrom = actorDef.distinctFrom || [];
          if (distinctFrom.length) {
            const blockedIds = new Set(
              distinctFrom
                .map((otherKey) => context[otherKey])
                .filter(Boolean)
                .map((player) => player.id)
            );
            candidates = candidates.filter((player) => !blockedIds.has(player.id));
          }

          rng.shuffle(candidates).forEach((candidate) => {
            nextContexts.push({
              ...context,
              [actorKey]: candidate
            });
          });
        });

        contexts = nextContexts;
        if (!contexts.length) {
          break;
        }
      }

      return contexts;
    }

    function buildDslExpressionScope(state, tribePlayers, tribeLabel, context) {
      const tribeFlags = getEventDslTribeFlags(state, tribeLabel);
      return {
        Math,
        ...context,
        tribe_label: tribeLabel,
        tribe_size: tribePlayers.length,
        tribe_advantage_available: Boolean(tribeFlags.advantageAvailable),
        relationship: (a, b) => {
          if (!a || !b || !a.relationships) {
            return 0;
          }
          return a.relationships[b.id] ?? 0;
        },
        advantage_count: (player) => getPlayerAdvantages(player).length + getPlayerInventory(player).idol,
        has_advantage: (player) => playerHasPlayableAdvantage(player)
      };
    }

    function evaluateDslExpression(expression, scope) {
      const names = Object.keys(scope);
      const values = Object.values(scope);
      return Function(...names, "return (" + expression + ");")(...values);
    }

    function dslConditionsPass(eventDef, state, tribePlayers, tribeLabel, context) {
      const scope = buildDslExpressionScope(state, tribePlayers, tribeLabel, context);
      return (eventDef.conditions || []).every((condition) => {
        try {
          return Boolean(evaluateDslExpression(condition, scope));
        } catch {
          return false;
        }
      });
    }

    function resolveDslDerivedContext(eventDef, state, context, outcomeKey) {
      const derivedDefs = eventDef && eventDef.derived && eventDef.derived[outcomeKey];
      if (!derivedDefs) {
        return context;
      }

      const derivedContext = { ...context };
      Object.entries(derivedDefs).forEach(([key, def]) => {
        if (!def) {
          return;
        }
        if (def.type === "random_actor") {
          const choices = (def.choices || []).map((choiceKey) => derivedContext[choiceKey]).filter(Boolean);
          if (choices.length) {
            derivedContext[key] = state.rng.choice(choices);
          }
        }
      });
      return derivedContext;
    }

    function renderDslTemplate(template, context, tribeLabel) {
      return String(template || "").replace(/\{([^}]+)\}/g, (_, token) => {
        const value = token === "tribe"
          ? tribeLabel
          : context[token];
        if (value && typeof value === "object" && value.name) {
          return value.name;
        }
        return value == null ? "" : String(value);
      });
    }

    function applyDslEffect(state, tribeLabel, context, effect) {
      if (!effect || !effect.type) {
        return;
      }

      if (effect.type === "adjust_relationship_pair") {
        const a = context[effect.a];
        const b = context[effect.b];
        if (a && b) {
          bumpRelationship(a, b, effect.delta || 0);
          bumpRelationship(b, a, effect.delta || 0);
        }
        return;
      }

      if (effect.type === "adjust_pairwise_relationships") {
        const players = (effect.players || [])
          .map((key) => context[key])
          .filter(Boolean);
        for (let index = 0; index < players.length; index += 1) {
          for (let otherIndex = index + 1; otherIndex < players.length; otherIndex += 1) {
            bumpRelationship(players[index], players[otherIndex], effect.delta || 0);
            bumpRelationship(players[otherIndex], players[index], effect.delta || 0);
          }
        }
        return;
      }

      if (effect.type === "adjust_relationship_with_tribe") {
        const player = context[effect.player];
        if (!player) {
          return;
        }
        const excludedIds = new Set(
          (effect.exclude || [])
            .map((key) => context[key])
            .filter(Boolean)
            .map((entry) => entry.id)
        );
        const tribePlayers = state.players.filter((entry) => entry.currentTribeLabel === tribeLabel && entry.id !== player.id && !excludedIds.has(entry.id));
        tribePlayers.forEach((other) => {
          bumpRelationship(player, other, effect.delta || 0);
          bumpRelationship(other, player, effect.delta || 0);
        });
        return;
      }

      if (effect.type === "adjust_threat") {
        const player = context[effect.player];
        if (player) {
          player.threat = (player.threat ?? 0) + (effect.delta || 0);
        }
        return;
      }

      if (effect.type === "set_tribe_flag") {
        const tribeFlags = getEventDslTribeFlags(state, tribeLabel);
        tribeFlags[effect.key] = effect.value;
        return;
      }

      if (effect.type === "grant_story_advantage" || effect.type === "grant_game_advantage") {
        const player = context[effect.player];
        if (!player) {
          return;
        }
        const label = effect.label || "Advantage";
        if (!state.eventDsl.playerAdvantages.has(player.id)) {
          state.eventDsl.playerAdvantages.set(player.id, []);
        }
        state.eventDsl.playerAdvantages.get(player.id).push(label);
        player.storyAdvantages = player.storyAdvantages || [];
        player.storyAdvantages.push(label);
        if (effect.type === "grant_game_advantage") {
          getPlayerAdvantages(player).push({
            label,
            targetShield: Number(effect.targetShield || 0),
            challengeBonus: Number(effect.challengeBonus || 0),
            nomineeShield: Boolean(effect.nomineeShield),
            remainingTribals: effect.remainingTribals == null ? null : Math.max(0, Number(effect.remainingTribals)),
            remainingChallenges: effect.remainingChallenges == null ? null : Math.max(0, Number(effect.remainingChallenges))
          });
        }
      }
    }

    function resolveDslEventForTribe(state, tribePlayers, tribeLabel, excludedEventIds) {
      const collectApplicableEvents = (respectExclusions) => {
        const applicableEvents = [];

        EVENT_DSL_LIBRARY.forEach((eventDef) => {
          if (!dslEventPhaseMatches(state, eventDef)) {
            return;
          }
          if (respectExclusions && excludedEventIds && excludedEventIds.has(eventDef.id)) {
            return;
          }

          const contexts = buildEventActorContexts(eventDef.actors, tribePlayers, state.rng)
            .filter((context) => dslConditionsPass(eventDef, state, tribePlayers, tribeLabel, context));

          if (!contexts.length) {
            return;
          }

          applicableEvents.push({
            eventDef,
            context: state.rng.choice(contexts)
          });
        });

        return applicableEvents;
      };

      let applicableEvents = collectApplicableEvents(true);
      if (!applicableEvents.length && excludedEventIds && excludedEventIds.size) {
        applicableEvents = collectApplicableEvents(false);
      }
      if (!applicableEvents.length) {
        return null;
      }

      return weightedChoice(state.rng, applicableEvents, (entry) => entry.eventDef.weight || 1);
    }

    function runDslCampEvents(state) {
      syncEventDslState(state);
      state.tribes.forEach((tribePlayers, index) => {
        if (!tribePlayers.length) {
          return;
        }
        const tribeLabel = state.tribeNames[index] || ("Tribe " + (index + 1));
        logEpisodeBeat(state, "Pre-Immunity: " + tribeLabel, tribePlayers);
        const beatTarget = state.rng.int(5, 8);
        const usedEventIds = new Set();

        for (let beatIndex = 0; beatIndex < beatTarget; beatIndex += 1) {
          const picked = resolveDslEventForTribe(state, tribePlayers.slice(), tribeLabel, usedEventIds);
          if (!picked) {
            break;
          }

          const eventDef = picked.eventDef;
          const chanceScope = buildDslExpressionScope(state, tribePlayers, tribeLabel, picked.context);
          let successChance = 0;
          try {
            successChance = Number(evaluateDslExpression(eventDef.chance || "0", chanceScope));
          } catch {
            successChance = 0;
          }
          successChance = clamp(successChance, 0, 0.95);
          const outcomeKey = state.rng.float() < successChance ? "success" : "fail";
          const resolvedContext = resolveDslDerivedContext(eventDef, state, picked.context, outcomeKey);
          const template = eventDef.text && eventDef.text[outcomeKey];
          const renderedText = template ? renderDslTemplate(template, resolvedContext, tribeLabel) : "";
          if (template) {
            const beatPlayers = Object.values(resolvedContext).filter((value) => value && typeof value === "object" && value.id);
            logEpisodeBeat(state, renderedText, beatPlayers);
            let confessionalCategory = "generic";
            if (/finds one|claiming it/.test(renderedText)) {
              confessionalCategory = "advantage_found";
            } else if (/closer|allies|tighter/.test(renderedText)) {
              confessionalCategory = "bonding";
            } else if (/argument|disagreement|frustrating|tense/.test(renderedText)) {
              confessionalCategory = "conflict";
            } else if (/shelter|firewood|fish|camp|rice|wood|work/.test(renderedText)) {
              confessionalCategory = "camp_life";
            } else if (/strategy|numbers|plan|vote|majority|control/.test(renderedText)) {
              confessionalCategory = "strategy";
            }
            maybeLogConfessional(state, {
              category: confessionalCategory,
              speakerPool: beatPlayers,
              players: beatPlayers,
              tribeLabel,
              context: {
                target: beatPlayers[1] ? beatPlayers[1].name : "",
                ally: beatPlayers[0] ? beatPlayers[0].name : ""
              },
              chance: outcomeKey === "success" ? 0.34 : 0.2
            });
          }
          (eventDef.effects && eventDef.effects[outcomeKey] ? eventDef.effects[outcomeKey] : []).forEach((effect) => {
            applyDslEffect(state, tribeLabel, resolvedContext, effect);
          });
          usedEventIds.add(eventDef.id);
        }
        syncTribeAlliances(state, tribePlayers.slice(), tribeLabel, { log: true });
      });
    }

    function updateThreatLevels(state) {
      for (const player of state.players) {
        const relationshipTotal = Object.values(player.relationships).reduce((sum, value) => sum + value, 0);
        if (relationshipTotal > 100 || relationshipTotal < -100) {
          player.threat = (player.threat ?? 0) + 1;
        }
      }

      for (const observer of state.players) {
        for (const target of state.players) {
          if (observer.id === target.id) {
            continue;
          }
          const current = observer.threatPerceptions[target.id] ?? target.threat;
          observer.threatPerceptions[target.id] = (0.85 * current) + (0.15 * target.threat);
        }
      }
    }

    function recordVoteEffects(state, pool, votes, eliminated) {
      const votersByTarget = new Map();

      for (const [voterId, targetId] of votes.entries()) {
        const voter = pool.find((player) => player.id === voterId);
        const target = pool.find((player) => player.id === targetId);
        if (!voter || !target) {
          continue;
        }

        if (!votersByTarget.has(targetId)) {
          votersByTarget.set(targetId, []);
        }
        votersByTarget.get(targetId).push(voter);

        bumpRelationship(voter, target, -1);
        if (targetId === eliminated.id) {
          voter.threat = (voter.threat ?? 0) + (voter.strategy >= 4 ? 0.5 : 1);
        } else {
          voter.threat = (voter.threat ?? 0) - 1;
        }
      }

      for (const group of votersByTarget.values()) {
        for (let i = 0; i < group.length; i += 1) {
          for (let j = i + 1; j < group.length; j += 1) {
            bumpRelationship(group[i], group[j], 1);
            bumpRelationship(group[j], group[i], 1);
          }
        }
      }
    }

    function removePlayer(state, player) {
      state.players = state.players.filter((entry) => entry.id !== player.id);
      state.tribes = state.tribes.map((tribe) => tribe.filter((entry) => entry.id !== player.id));
      pruneAllianceStateForPlayer(state, player);
      state.bootLog.push(player);
    }

    function fireMaking(state, tiedPlayers) {
      const contenders = tiedPlayers.slice(0, 2);
      logLines(state, "", "Fire-making: " + contenders.map((player) => player.name).join(" vs "));
      const scores = contenders.map((player) => ({
        player,
        score: player.strategy + player.social + state.rng.int(1, 6)
      }));
      scores.sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name));
      const loser = scores[scores.length - 1].player;
      logEpisodeBeat(state, scores[0].player.name + " wins fire-making.", [scores[0].player, loser]);
      return loser;
    }

    function resolveTie(state, settings, pool, tiedPlayers) {
      const tiedIds = new Set(tiedPlayers.map((player) => player.id));
      const revoters = pool.filter((player) => !tiedIds.has(player.id));

      logLines(state, "", "Revote " + tiedPlayers.map((player) => player.name).join(" v "));

      if (!revoters.length) {
        const randomLoser = state.rng.choice(tiedPlayers);
        logLines(state, "No revoters remain. Random elimination resolves the tie.");
        return {
          eliminated: randomLoser,
          note: "Rocks",
          revoteTally: null,
          revoteVotes: null,
          rocksBallots: null
        };
      }

      const revoteTally = new Map();
      const revoteVotes = new Map();

      for (const voter of revoters) {
        const eligibles = tiedPlayers.filter((player) => player.id !== voter.id && !player.immune);
        const target = chooseTarget(state, settings, voter, eligibles);
        if (!target) {
          continue;
        }
        revoteVotes.set(voter.id, target.id);
        revoteTally.set(target.id, (revoteTally.get(target.id) || 0) + 1);
      }

      logVotesInRevealOrder(state, revoteVotes, pool);

      const maxVotes = Math.max(...revoteTally.values());
      const leaders = tiedPlayers.filter((player) => (revoteTally.get(player.id) || 0) === maxVotes);

      if (leaders.length === 1) {
        return {
          eliminated: leaders[0],
          note: "Revote",
          revoteTally,
          revoteVotes,
          rocksBallots: null
        };
      }

      const immuneIds = new Set([
        ...tiedPlayers.map((player) => player.id),
        ...pool.filter((player) => player.immune).map((player) => player.id)
      ]);

      if (state.rng.float() < 0.72) {
        const consensusCandidates = leaders.concat(pool.filter((player) => !tiedIds.has(player.id) && !player.immune));
        const consensusTarget = consensusCandidates
          .filter((player, index, players) => players.findIndex((entry) => entry.id === player.id) === index)
          .sort((a, b) => {
            const aRel = pool.reduce((sum, player) => sum + (player.relationships[a.id] ?? 0), 0) / Math.max(1, pool.length);
            const bRel = pool.reduce((sum, player) => sum + (player.relationships[b.id] ?? 0), 0) / Math.max(1, pool.length);
            return aRel - bRel || b.threat - a.threat || a.name.localeCompare(b.name);
          })[0];
        logLines(state, "Revote stays tied, but the tribe reaches consensus on " + consensusTarget.name + " to avoid rocks.");
        return {
          eliminated: consensusTarget,
          note: "Consensus",
          revoteTally,
          revoteVotes,
          rocksBallots: null
        };
      }

      const rockEligible = pool.filter((player) => !immuneIds.has(player.id));
      const rocksBallots = {};

      if (!rockEligible.length) {
        const randomLoser = state.rng.choice(leaders);
        logLines(state, "Revote stays tied and no one is eligible to draw rocks.");
        return {
          eliminated: randomLoser,
          note: "Rocks",
          revoteTally,
          revoteVotes,
          rocksBallots: null
        };
      }

      const randomLoser = state.rng.choice(rockEligible);
      logLines(state, "Revote stays tied. The non-immune players draw rocks.");

      for (const player of pool) {
        if (immuneIds.has(player.id)) {
          rocksBallots[player.id] = {
            label: "Immune",
            tribeLabel: "",
            kind: "special"
          };
        } else if (player.id === randomLoser.id) {
          rocksBallots[player.id] = {
            label: "Black Rock",
            tribeLabel: "",
            kind: "special"
          };
        } else {
          rocksBallots[player.id] = {
            label: "White Rock",
            tribeLabel: "",
            kind: "special"
          };
        }
      }

      return {
        eliminated: randomLoser,
        note: "Rocks",
        revoteTally,
        revoteVotes,
        rocksBallots
      };
    }

    function summarizeVotes(tallyMap) {
      const counts = Array.from(tallyMap.values()).sort((a, b) => b - a);
      return counts.length ? "(" + counts.join("-") + ")" : "(none)";
    }

    function voteCountText(tallyMap) {
      const counts = Array.from(tallyMap.values()).sort((a, b) => b - a);
      return counts.length ? counts.join("-") : "";
    }

    function voteCountTextWithNullified(effectiveTallyMap, originalTallyMap, nullifiedTargetIds) {
      const counts = Array.from(effectiveTallyMap.values()).sort((a, b) => b - a);
      const nullifiedIds = nullifiedTargetIds || new Set();
      nullifiedIds.forEach((targetId) => {
        if ((originalTallyMap.get(targetId) || 0) > 0) {
          counts.push(0);
        }
      });
      if (!Array.from(effectiveTallyMap.values()).length && counts.length) {
        return "0";
      }
      return counts.length ? counts.join("-") : "";
    }

    function buildVoteRevealOrder(votes, people, rng) {
      const peopleById = new Map((people || []).map((person) => [person.id, person]));
      const ballotsByTarget = new Map();

      for (const [voterId, targetId] of votes.entries()) {
        if (!ballotsByTarget.has(targetId)) {
          ballotsByTarget.set(targetId, []);
        }
        ballotsByTarget.get(targetId).push({ voterId, targetId });
      }

      const targetOrder = Array.from(ballotsByTarget.keys()).sort((a, b) => {
        const countDifference = ballotsByTarget.get(a).length - ballotsByTarget.get(b).length;
        if (countDifference !== 0) {
          return countDifference;
        }

        const personA = peopleById.get(a);
        const personB = peopleById.get(b);
        return String(personA ? personA.name : a).localeCompare(String(personB ? personB.name : b));
      });

      const revealOrder = [];
      let ballotsRemain = true;

      while (ballotsRemain) {
        ballotsRemain = false;
        for (const targetId of targetOrder) {
          const ballots = ballotsByTarget.get(targetId);
          if (!ballots || !ballots.length) {
            continue;
          }
          revealOrder.push(ballots.shift());
          ballotsRemain = true;
        }
      }

      if (rng && revealOrder.length >= 5) {
        const middleStart = Math.max(1, Math.floor(revealOrder.length / 3));
        const middleEnd = Math.min(revealOrder.length - 3, Math.ceil((revealOrder.length * 2) / 3));
        const swapStarts = [];

        for (let index = middleStart; index <= middleEnd; index += 1) {
          if (revealOrder[index] && revealOrder[index + 1] && revealOrder[index].targetId !== revealOrder[index + 1].targetId) {
            swapStarts.push(index);
          }
        }

        let swapsRemaining = Math.min(2, swapStarts.length);
        if (swapsRemaining === 2 && rng.float() < 0.5) {
          swapsRemaining = 1;
        }

        while (swapsRemaining > 0 && swapStarts.length) {
          const pickIndex = rng.int(0, swapStarts.length - 1);
          const swapIndex = swapStarts.splice(pickIndex, 1)[0];
          const temp = revealOrder[swapIndex];
          revealOrder[swapIndex] = revealOrder[swapIndex + 1];
          revealOrder[swapIndex + 1] = temp;
          swapsRemaining -= 1;
        }
      }

      return revealOrder;
    }

    function logVotesInRevealOrder(state, votes, people, nullifiedTargetIds) {
      const peopleById = new Map((people || []).map((person) => [person.id, person]));
      const nullifiedIds = nullifiedTargetIds || new Set();
      const revealOrder = buildVoteRevealOrder(votes, people, state && state.rng);
      const nullifiedVotes = revealOrder.filter(({ targetId }) => nullifiedIds.has(targetId));
      const countingVotes = revealOrder.filter(({ targetId }) => !nullifiedIds.has(targetId));

      nullifiedVotes.concat(countingVotes).forEach(({ voterId, targetId }) => {
        const voter = peopleById.get(voterId);
        const target = peopleById.get(targetId);
        if (!voter || !target) {
          return;
        }
        const suffix = nullifiedIds.has(targetId) ? " (Does Not Count)" : "";
        logLines(state, voter.name + " -> " + target.name + suffix);
      });
    }

    function currentPhaseKey(state) {
      if (state.phaseKey) {
        return state.phaseKey;
      }
      if (state.merged) {
        return "merged";
      }
      if (state.swappedAt != null) {
        return "swapped";
      }
      return "original";
    }

    function recordVotingHistory(state, entry) {
      if (entry && !entry.immunityLabel) {
        entry.immunityLabel = String(state.currentImmunityLabel || "");
      }
      state.voteHistory.push(entry);
    }

    function buildBallotMap(pool, votes, tribeLabel, specialLabel, noVoteIds, voteReasons, nullifiedTargetIds) {
      const ballotMap = {};
      const noVoteSet = noVoteIds || new Set();
      const nullifiedIds = nullifiedTargetIds || new Set();

      for (const player of pool) {
        if (specialLabel) {
          ballotMap[player.id] = {
            label: specialLabel,
            tribeLabel: "",
            kind: "special"
          };
          continue;
        }

        if (noVoteSet.has(player.id)) {
          ballotMap[player.id] = {
            label: "None",
            tribeLabel: "",
            kind: "none"
          };
          continue;
        }

        const targetId = votes.get(player.id) || "";
        const target = pool.find((candidate) => candidate.id === targetId);
        ballotMap[player.id] = target
          ? {
              label: target.name,
              tribeLabel: target.currentTribeLabel || tribeLabel || "",
              kind: "vote",
              nullified: nullifiedIds.has(target.id),
              reason: voteReasons ? voteReasons.get(player.id) || null : null
            }
          : {
              label: "",
              tribeLabel: "",
              kind: "blank"
            };
      }

      return ballotMap;
    }

    function idolPlayThreshold(strategy) {
      if (strategy >= 4) {
        return 1;
      }
      if (strategy === 3) {
        return 2;
      }
      return 3;
    }

    function decideIdolPlays(state, pool, votes, tally) {
      const protectedIds = new Set();
      const notes = [];
      const topVotes = Math.max(...Array.from(tally.values()), 0);
      const holders = pool
        .filter((player) => getPlayerInventory(player).idol > 0 && !player.immune)
        .sort((a, b) => (tally.get(b.id) || 0) - (tally.get(a.id) || 0) || b.strategy - a.strategy);

      holders.forEach((holder) => {
        if (protectedIds.has(holder.id)) {
          return;
        }
        const votesOnHolder = tally.get(holder.id) || 0;
        const threshold = idolPlayThreshold(holder.strategy);
        const scaredRead = holder.strategy >= 4 && votesOnHolder > 0 && state.rng.float() < 0.22;
        if ((votesOnHolder >= threshold && votesOnHolder >= topVotes) || scaredRead) {
          getPlayerInventory(holder).idol -= 1;
          holder.idolsPlayed = (holder.idolsPlayed || 0) + 1;
          protectedIds.add(holder.id);
          notes.push(holder.name + " plays a Hidden Immunity Idol for self-protection.");
          return;
        }

        if (holder.strategy < 4 || state.players.length <= 4 || state.rng.float() >= 0.18) {
          return;
        }
        const alliesInDanger = pool
          .filter((candidate) => candidate.id !== holder.id && !candidate.immune && !protectedIds.has(candidate.id))
          .filter((candidate) => (holder.relationships[candidate.id] ?? 0) >= 3 && (tally.get(candidate.id) || 0) >= Math.max(1, topVotes - 1))
          .sort((a, b) => (tally.get(b.id) || 0) - (tally.get(a.id) || 0) || (holder.relationships[b.id] ?? 0) - (holder.relationships[a.id] ?? 0));
        const ally = alliesInDanger[0];
        if (ally) {
          getPlayerInventory(holder).idol -= 1;
          holder.idolsPlayed = (holder.idolsPlayed || 0) + 1;
          protectedIds.add(ally.id);
          notes.push(holder.name + " plays a Hidden Immunity Idol on " + ally.name + ".");
        }
      });

      if (notes.length) {
        notes.forEach((note) => logEpisodeBeat(state, note, pool.filter((player) => note.includes(player.name))));
      }
      return protectedIds;
    }

    function effectiveVotesAfterProtection(votes, protectedIds) {
      if (!protectedIds || !protectedIds.size) {
        return votes;
      }
      const effectiveVotes = new Map();
      for (const [voterId, targetId] of votes.entries()) {
        if (!protectedIds.has(targetId)) {
          effectiveVotes.set(voterId, targetId);
        }
      }
      return effectiveVotes;
    }

    function votePlanText(pool, votes) {
      return Array.from(votes.entries()).map(([voterId, targetId]) => {
        const voter = pool.find((player) => player.id === voterId);
        const target = pool.find((player) => player.id === targetId);
        return voter && target ? voter.name + " -> " + target.name : "";
      }).filter(Boolean).join("; ");
    }

    function logStrategicVoteReads(state, settings, pool, votes, tally) {
      if (!pool || !votes || !votes.size) {
        return;
      }
      const planText = votePlanText(pool, votes);
      const topCount = Math.max(...Array.from(tally.values()), 0);
      const topTargets = pool.filter((player) => (tally.get(player.id) || 0) === topCount && topCount > 0);
      const splitTargets = pool.filter((player) => (tally.get(player.id) || 0) > 0);
      const advantageTargets = topTargets.filter((player) => playerHasPlayableAdvantage(player) || pool.some((observer) => (observer.threatPerceptions[player.id] ?? player.threat) >= 4.5));
      if (splitTargets.length >= 2 && advantageTargets.length) {
        const reader = pool.slice().sort((a, b) => b.strategy - a.strategy || a.name.localeCompare(b.name))[0];
        logEpisodeBeat(
          state,
          reader.name + " thinks " + advantageTargets[0].name + " may have an idol, so they want coverage on the vote. The split would look like this: " + planText + ".",
          [reader].concat(splitTargets)
        );
        return;
      }
      const holder = pool.find((player) => getPlayerInventory(player).idol > 0 && (tally.get(player.id) || 0) >= Math.max(1, topCount - 1));
      if (holder) {
        logEpisodeBeat(
          state,
          holder.name + " has an idol and thinks the votes could be coming their way. If they play it correctly, the remaining votes look like this: " + planText + ".",
          [holder].concat(topTargets)
        );
        return;
      }
      const defender = pool
        .filter((player) => player.strategy >= 3)
        .map((player) => {
          const ally = topTargets
            .filter((target) => target.id !== player.id)
            .sort((a, b) => (player.relationships[b.id] ?? 0) - (player.relationships[a.id] ?? 0))[0];
          return ally ? { player, ally, rel: player.relationships[ally.id] ?? 0 } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.rel - a.rel)[0];
      if (defender && defender.rel >= 3) {
        const alternate = pool
          .filter((candidate) => !candidate.immune && candidate.id !== defender.player.id && candidate.id !== defender.ally.id)
          .sort((a, b) => scoreTarget(state, settings, defender.player, a) - scoreTarget(state, settings, defender.player, b))[0];
        if (alternate) {
          logEpisodeBeat(
            state,
            defender.player.name + " feels close to " + defender.ally.name + " and thinks " + defender.ally.name + " is getting targeted. " + defender.player.name + " is going to try to sway the vote to " + alternate.name + ".",
            [defender.player, defender.ally, alternate]
          );
        }
      }
    }

    function buildVoteReason(state, settings, pool, votes, tally, voter, target, eliminated) {
      const relationshipLabel = relationshipThreatLabel(voter, target);
      const relationshipAction = voteActionForRelationshipLabel(relationshipLabel);
      return {
        summary: relationshipAction,
        tags: [relationshipLabel, relationshipAction],
        details: [
          voter.name + " sees " + target.name + " as a " + relationshipLabel + ". Voting for a " + relationshipLabel + " is " + relationshipAction.toLowerCase() + "."
        ]
      };
    }

    function chooseFinalTwoBoot(state, settings, immunityWinner, options) {
      const candidates = options.slice();
      if (candidates.length <= 1) {
        return candidates[0] || null;
      }
      const scored = candidates.map((candidate) => {
        const label = relationshipThreatLabel(immunityWinner, candidate);
        const labelAdjustment = label === "Goat" || label === "Easy Vote" || label === "Safe Vote"
          ? -2.2
          : label === "Shield" || label === "Target" || label === "Wild Card"
            ? 1.6
            : label === "Ally"
              ? -0.8
              : 0;
        const projected = estimateJuryThreatScore(state, settings, candidate)
          + averageRelationshipToward(state, candidate, getCurrentJurors(state, settings)) * 0.18
          + labelAdjustment;
        return { candidate, projected, label };
      });
      scored.sort((a, b) => b.projected - a.projected || a.candidate.name.localeCompare(b.candidate.name));
      return scored[0].candidate;
    }

    function tribalCouncil(state, settings, pool, titleLabel, tribeLabel) {
      const eventId = "tribal-" + state.voteEventCounter;
      state.voteEventCounter += 1;

      if (!state.merged && pool.length === 2) {
        logLines(state, "", titleLabel);
        logLines(state, "Only two players are attending this Tribal. Fire-making will decide who goes home.");

        const eliminated = fireMaking(state, pool);

        recordVotingHistory(state, {
          eventId,
          episode: state.episodeNumber,
          phase: currentPhaseKey(state),
          tribeLabel: tribeLabel || "",
          eliminated: eliminated.name,
          votesLabel: "Fire",
          ballots: buildBallotMap(pool, new Map(), tribeLabel, "Fire")
        });

        removePlayer(state, eliminated);
        consumeTribalAdvantages(pool);
        relationshipDrift(state, state.players);
        logLines(state, "");
        logEpisodeBeat(state, eliminated.name + " has been eliminated (Fire)", [eliminated]);
        return eliminated;
      }

      const nominees = chooseNominees(state, settings, pool);
      let votes = new Map();

      logLines(state, "", titleLabel);

      for (const voter of pool) {
        const eligibleTargets = nominees.filter((candidate) => candidate.id !== voter.id && !candidate.immune);
        const fallbackTargets = pool.filter((candidate) => candidate.id !== voter.id && !candidate.immune);
        const target = chooseTarget(state, settings, voter, eligibleTargets.length ? eligibleTargets : fallbackTargets);
        if (!target) {
          continue;
        }
        votes.set(voter.id, target.id);
        target.votesReceived = (target.votesReceived || 0) + 1;
      }

      if (!votes.size) {
        throw new Error("No legal votes were cast at tribal council.");
      }
      votes = consolidatePluralityVotes(state, settings, pool, nominees, votes);

      let tally = new Map();
      for (const targetId of votes.values()) {
        tally.set(targetId, (tally.get(targetId) || 0) + 1);
      }
      logStrategicVoteReads(state, settings, pool, votes, tally);
      const originalTally = new Map(tally);

      const protectedIds = decideIdolPlays(state, pool, votes, tally);
      const initialVotes = new Map(votes);
      let effectiveVotes = effectiveVotesAfterProtection(votes, protectedIds);
      const initialEffectiveTally = new Map();
      for (const targetId of effectiveVotes.values()) {
        initialEffectiveTally.set(targetId, (initialEffectiveTally.get(targetId) || 0) + 1);
      }
      let officialNullifiedRevote = null;
      if (!effectiveVotes.size) {
        const revoteEligible = pool.filter((player) => !player.immune && !protectedIds.has(player.id));
        const revoteVotes = new Map();
        const revoteTally = new Map();
        logLines(state, "", "Official revote: every vote was nullified.");
        for (const voter of pool) {
          const eligibles = revoteEligible.filter((player) => player.id !== voter.id);
          const target = chooseTarget(state, settings, voter, eligibles);
          if (!target) {
            continue;
          }
          revoteVotes.set(voter.id, target.id);
          revoteTally.set(target.id, (revoteTally.get(target.id) || 0) + 1);
        }
        if (revoteVotes.size) {
          logVotesInRevealOrder(state, revoteVotes, pool);
          officialNullifiedRevote = {
            votes: revoteVotes,
            tally: revoteTally,
            eligibleIds: new Set(revoteEligible.map((player) => player.id))
          };
          effectiveVotes = revoteVotes;
        } else {
          effectiveVotes = votes;
        }
      }

      tally = new Map();
      for (const targetId of effectiveVotes.values()) {
        tally.set(targetId, (tally.get(targetId) || 0) + 1);
      }

      logVotesInRevealOrder(state, initialVotes, pool, protectedIds);

      const maxVotes = Math.max(...tally.values());
      const finalists = pool.filter((player) => (tally.get(player.id) || 0) === maxVotes);
      let eliminated;
      let finalVoteLabel = voteCountTextWithNullified(tally, originalTally, protectedIds);
      let initialVoteLabel = voteCountTextWithNullified(initialEffectiveTally, originalTally, protectedIds);
      let revoteEntry = null;
      let rocksEntry = null;

      if (state.merged && pool.length === 4 && finalists.length >= 2) {
        eliminated = fireMaking(state, finalists);
        finalVoteLabel = "Fire";
        initialVoteLabel = "Fire";
      } else if (finalists.length === 1) {
        eliminated = finalists[0];
      } else {
        const tieResult = resolveTie(state, settings, pool, finalists);
        const tiedIds = new Set(finalists.map((player) => player.id));
        eliminated = tieResult.eliminated;
        if (tieResult.revoteVotes && tieResult.revoteTally) {
          const revoteReasons = new Map();
          for (const [voterId, targetId] of tieResult.revoteVotes.entries()) {
            const voter = pool.find((player) => player.id === voterId);
            const target = pool.find((player) => player.id === targetId);
            if (voter && target) {
              revoteReasons.set(voterId, buildVoteReason(state, settings, pool, tieResult.revoteVotes, tieResult.revoteTally, voter, target, eliminated));
            }
          }
          revoteEntry = {
            eventId,
            episode: state.episodeNumber,
            phase: currentPhaseKey(state),
            tribeLabel: tribeLabel || (state.merged ? state.mergeColor : ""),
            eliminated: eliminated.name,
            votesLabel: voteCountText(tieResult.revoteTally) || tieResult.note || "Revote",
            ballots: buildBallotMap(pool, tieResult.revoteVotes, tribeLabel, null, tiedIds, revoteReasons),
            notes: tieResult.note === "Consensus"
              ? ["After the revote stayed tied, the tribe reached consensus on " + eliminated.name + " to avoid rocks."]
              : []
          };
          if (tieResult.note === "Rocks" && tieResult.rocksBallots) {
            rocksEntry = {
              eventId,
              episode: state.episodeNumber,
              phase: currentPhaseKey(state),
              tribeLabel: tribeLabel || (state.merged ? state.mergeColor : ""),
              eliminated: eliminated.name,
              votesLabel: "Rocks",
              ballots: tieResult.rocksBallots
            };
          }
        } else if (tieResult.note) {
          finalVoteLabel = tieResult.note;
        }
      }

      const voteReasons = new Map();
      for (const [voterId, targetId] of votes.entries()) {
        const voter = pool.find((player) => player.id === voterId);
        const target = pool.find((player) => player.id === targetId);
        if (voter && target) {
          voteReasons.set(voterId, buildVoteReason(state, settings, pool, votes, tally, voter, target, eliminated));
        }
      }

      recordVotingHistory(state, {
        eventId,
        episode: state.episodeNumber,
        phase: currentPhaseKey(state),
        tribeLabel: tribeLabel || (state.merged ? state.mergeColor : ""),
        eliminated: eliminated.name,
        votesLabel: initialVoteLabel,
        ballots: buildBallotMap(pool, initialVotes, tribeLabel, null, null, voteReasons, protectedIds)
      });

      if (officialNullifiedRevote) {
        recordVotingHistory(state, {
          eventId,
          episode: state.episodeNumber,
          phase: currentPhaseKey(state),
          tribeLabel: tribeLabel || (state.merged ? state.mergeColor : ""),
          eliminated: eliminated.name,
          votesLabel: voteCountText(officialNullifiedRevote.tally) || "Official Revote",
          ballots: buildBallotMap(pool, officialNullifiedRevote.votes, tribeLabel, null, null, new Map()),
          notes: ["Every original vote was nullified. This column is the official revote."]
        });
      }

      if (revoteEntry) {
        recordVotingHistory(state, revoteEntry);
      }

      if (rocksEntry) {
        recordVotingHistory(state, rocksEntry);
      }

      recordVoteEffects(state, pool, officialNullifiedRevote ? officialNullifiedRevote.votes : votes, eliminated);
      removePlayer(state, eliminated);
      expireStandardIdolsAfterFinalFive(state);
      consumeTribalAdvantages(pool);
      relationshipDrift(state, state.players);
      if (finalVoteLabel === "Fire") {
        logLines(state, "");
        logEpisodeBeat(state, eliminated.name + " has been eliminated (Fire)", [eliminated]);
      } else if (rocksEntry) {
        logLines(state, "");
        logEpisodeBeat(state, eliminated.name + " drew the bad rock and is eliminated", [eliminated]);
      } else {
        logLines(state, "");
        logEpisodeBeat(state, eliminated.name + " the tribe has spoken.", [eliminated]);
      }
      return eliminated;
    }

    function premergeReward(state) {
      const scores = state.tribes.map((tribe) => tribe.reduce((sum, player) => {
        const challengeScore = player.challenge + getPlayerChallengeBonus(player);
        return sum + (challengeScore * state.rng.int(1, 6));
      }, 0));
      state.tribes.forEach((tribe) => consumeChallengeAdvantages(tribe));
      const winIndex = scores.indexOf(Math.max(...scores));
      const reward = state.rng.choice(PREMERGE_REWARDS);
      logLines(state, "");
      logEpisodeBeat(state, "Reward Challenge: " + state.tribeNames[winIndex] + " win " + reward, state.tribes[winIndex]);
      maybeGrantRewardAdvantage(state, state.tribes[winIndex], "the reward");
      maybeLogConfessional(state, {
        category: "reward_win",
        speakerPool: state.tribes[winIndex],
        players: state.tribes[winIndex],
        tribeLabel: state.tribeNames[winIndex],
        reward,
        context: {
          reward
        },
        chance: 0.7
      });
      bondingDrift(state, state.tribes[winIndex], 0.2);
    }

    function mergeReward(state) {
      const performances = state.players.map((player) => ({
        player,
        score: (player.challenge + getPlayerChallengeBonus(player)) * state.rng.int(1, 6)
      }));
      consumeChallengeAdvantages(state.players);
      performances.sort((a, b) => b.score - a.score);
      const winner = performances[0].player;
      const reward = state.rng.choice(MERGE_REWARDS);
      const others = state.players
        .filter((player) => player.id !== winner.id)
        .slice()
        .sort((a, b) => (winner.relationships[b.id] ?? 0) - (winner.relationships[a.id] ?? 0));
      const guestCount = others.length ? state.rng.int(1, Math.min(3, others.length)) : 0;
      const attendees = [winner].concat(others.slice(0, guestCount));
      const brought = attendees.slice(1).map((player) => player.name).join(", ");
      const message = brought
        ? winner.name + " wins " + reward + " and brings " + brought
        : winner.name + " wins " + reward;
      logLines(state, "");
      logEpisodeBeat(state, "Reward Challenge: " + message, attendees);
      maybeGrantRewardAdvantage(state, attendees, "the reward");
      maybeLogConfessional(state, {
        category: "reward_win",
        speaker: winner,
        players: attendees,
        tribeLabel: winner.currentTribeLabel,
        reward,
        context: {
          reward,
          ally: brought
        },
        chance: 0.85
      });
      bondingDrift(state, attendees, 0.2);
    }

    function premergeChallenge(state) {
      const minSize = Math.min(...state.tribes.map((tribe) => tribe.length));
      const scores = [];

      for (const tribe of state.tribes) {
        const available = tribe.filter((player) => !player.satOutLast);
        const competitors = state.rng.shuffle(available.length ? available : tribe).slice(0, minSize);
        const compIds = new Set(competitors.map((player) => player.id));
        tribe.forEach((player) => {
          player.satOutLast = !compIds.has(player.id);
        });
        const score = competitors.reduce((sum, player) => {
          const challengeScore = player.challenge + getPlayerChallengeBonus(player);
          return sum + (challengeScore * state.rng.int(1, 6));
        }, 0);
        consumeChallengeAdvantages(competitors);
        scores.push(score);
      }

      const losingIndex = scores.indexOf(Math.min(...scores));
      const winningLabels = state.tribeNames.filter((_, index) => index !== losingIndex);
      const winningPlayers = state.tribes
        .filter((_, index) => index !== losingIndex)
        .flat();
      state.currentImmunityLabel = winningLabels.join(", ");
      logLines(state, "");
      logEpisodeBeat(state, winningLabels.join(", ") + " win immunity", winningPlayers);
      const losingTribe = state.tribes[losingIndex];
      maybeLogConfessional(state, {
        category: "immunity_win",
        speakerPool: winningPlayers,
        players: winningPlayers,
        tribeLabel: winningLabels[0] || "",
        chance: 0.55
      });
      maybeLogConfessional(state, {
        category: "heading_to_tribal",
        speakerPool: losingTribe,
        players: losingTribe,
        tribeLabel: state.tribeNames[losingIndex],
        chance: 0.65
      });
      return {
        losingTribe,
        losingLabel: state.tribeNames[losingIndex]
      };
    }

    function individualImmunity(state) {
      state.players.forEach((player) => {
        player.immune = false;
      });
      const performances = state.players.map((player) => ({
        player,
        score: (player.challenge + getPlayerChallengeBonus(player)) * state.rng.int(1, 6)
      }));
      consumeChallengeAdvantages(state.players);
      performances.sort((a, b) => b.score - a.score);
      const winner = performances[0].player;
      winner.immune = true;
      state.currentImmunityLabel = winner.name;
      winner.threat = (winner.threat ?? 0) + 2;
      winner.immunityWins = (winner.immunityWins || 0) + 1;
      return winner;
    }

    function demergeIndividualImmunity(state) {
      state.players.forEach((player) => {
        player.immune = false;
      });

      const results = [];
      state.tribes.forEach((tribe, index) => {
        const eligible = tribe.filter((player) => state.players.some((active) => active.id === player.id));
        if (!eligible.length) {
          return;
        }
        const performances = eligible.map((player) => ({
          player,
          score: (player.challenge + getPlayerChallengeBonus(player)) * state.rng.int(1, 6)
        }));
        consumeChallengeAdvantages(eligible);
        performances.sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name));
        const winner = performances[0].player;
        winner.immune = true;
        winner.threat = (winner.threat ?? 0) + 2;
        winner.immunityWins = (winner.immunityWins || 0) + 1;
        results.push({
          tribe,
          label: state.tribeNames[index],
          winner
        });
      });

      if (results.length) {
        logLines(state, "");
        state.currentImmunityLabel = results.map((result) => result.winner.name + " (" + result.label + ")").join(", ");
        results.forEach((result) => {
          logEpisodeBeat(state, result.winner.name + " wins individual immunity for " + result.label, [result.winner]);
          maybeLogConfessional(state, {
            category: "immunity_win",
            speaker: result.winner,
            players: [result.winner],
            tribeLabel: result.label,
            chance: 0.75
          });
        });
      }

      return results;
    }

    function currentRoundImmunityLabel(state, pool) {
      const label = String(state.currentImmunityLabel || "").trim();
      if (label) {
        return label;
      }
      return (pool || [])
        .filter((player) => player && player.immune)
        .map((player) => player.name)
        .join(", ");
    }

    function returnExilePlayers(state) {
      if (!state.exilePlayers.length || !state.tribes.length) {
        return;
      }

      const returning = state.rng.shuffle(state.exilePlayers.slice());
      logLines(state, "", "Exile Island return");
      returning.forEach((player, index) => {
        const sortedTribes = state.tribes
          .map((tribe, tribeIndex) => ({ tribe, tribeIndex }))
          .sort((a, b) => a.tribe.length - b.tribe.length || a.tribeIndex - b.tribeIndex);
        const target = sortedTribes[index % sortedTribes.length];
        target.tribe.push(player);
        player.currentTribeLabel = state.tribeNames[target.tribeIndex];
        logEpisodeBeat(state, player.name + " returns to " + player.currentTribeLabel, [player]);
      });
      state.exilePlayers = [];
    }

    function mergeNow(state, triggerRemaining, sourceType) {
      resetActiveAlliances(state);
      state.merged = true;
      state.mergedEver = true;
      state.phaseKey = "merged";
      state.demergeHasImmunity = false;
      state.mergedAt = triggerRemaining;
      state.tribes = [state.players.slice()];
      state.tribeNames = [state.mergeColor];
      state.exilePlayers = [];
      if (state.eventDsl) {
        state.eventDsl.tribeFlags = new Map([
          [state.mergeColor, { advantageAvailable: true }]
        ]);
      }
      state.players.forEach((player) => {
        player.currentTribeLabel = state.mergeColor;
        player.immune = false;
      });
      const mergeLabel = sourceType === "remerge" ? "REMERGE" : "MERGE";
      const summary = (sourceType === "remerge" ? "Remerge" : "Merge") + " at " + triggerRemaining + " players";
      state.twistHistory.push(summary);
      logLines(
        state,
        "",
        mergeLabel + " at " + triggerRemaining + " players remaining - forming 1 tribe.",
        "Merge color: " + state.mergeColor
      );
      if (sourceType !== "remerge" && state.players.length >= 7 && state.rng.float() < 0.75) {
        const finder = weightedChoice(state.rng, state.players, (player) => Math.max(1, player.strategy + player.social * 0.25));
        grantIdol(state, finder, "at the merge");
      }
      maybeLogConfessional(state, {
        category: "merge",
        speakerPool: state.players,
        players: state.players.slice(),
        tribeLabel: state.mergeColor,
        chance: 0.75
      });
    }

    function splitIntoTribes(state, requestedTeams, triggerRemaining, mode, tribeImmunity, requestedLabels) {
      resetActiveAlliances(state);
      const teams = Math.max(2, Math.min(requestedTeams, state.players.length));
      const shuffled = state.rng.shuffle(state.players);
      const exileInfo = exileInfoForPlayers(state.players.length, teams);
      const exilePlayers = shuffled.slice(0, exileInfo.exileCount);
      const assignedPlayers = shuffled.slice(exileInfo.exileCount);

      state.merged = false;
      state.phaseKey = mode === "demerge" ? "demerged" : "swapped";
      state.demergeHasImmunity = mode === "demerge" ? tribeImmunity !== false : true;
      state.remergeAfterDemerge = false;
      state.tribes = Array.from({ length: teams }, () => []);
      const priorLabels = state.tribeNames.slice();
      const usedLabels = new Set(priorLabels.map((label) => String(label || "").toLowerCase()));
      const labels = cloneTribeLabels(requestedLabels || []);
      state.tribeNames = Array.from({ length: teams }, (_, index) => {
        if (labels[index]) {
          usedLabels.add(labels[index].toLowerCase());
          return labels[index];
        }
        if (priorLabels[index]) {
          return priorLabels[index];
        }
        return randomTribeName(state.rng, usedLabels);
      });
      state.exilePlayers = exilePlayers.slice();
      if (state.eventDsl) {
        state.eventDsl.tribeFlags = new Map(
          state.tribeNames.map((label) => [label, { advantageAvailable: true }])
        );
      }

      assignedPlayers.forEach((player, index) => {
        const tribeIndex = index % teams;
        state.tribes[tribeIndex].push(player);
        player.currentTribeLabel = state.tribeNames[tribeIndex];
      });

      exilePlayers.forEach((player) => {
        player.currentTribeLabel = "Exile Island";
      });

      if (mode === "swap") {
        state.swappedAt = triggerRemaining;
        state.swappedTeams = teams;
        state.twistHistory.push("Swap at " + triggerRemaining + " into " + teams + " tribes");
        logLines(state, "", "SWAP at " + triggerRemaining + " players remaining - forming " + teams + " tribe(s).");
      } else {
        state.demergedAt = triggerRemaining;
        state.demergedTeams = teams;
        state.twistHistory.push("Demerge at " + triggerRemaining + " into " + teams + " tribes");
        logLines(state, "", "DEMERGE at " + triggerRemaining + " players remaining - forming " + teams + " tribe(s).");
        logLines(state, "Each demerged tribe will award individual immunity, then each tribe will attend its own Tribal Council.");
      }

      if (exilePlayers.length) {
        logLines(state, exilePlayers.length + " player(s) are sent to Exile Island: " + exilePlayers.map((player) => player.name).join(", "));
      }
      logTribes(state);
      maybeLogConfessional(state, {
        category: "swap",
        speakerPool: assignedPlayers,
        players: assignedPlayers.slice(),
        tribeLabel: state.tribeNames[0] || "",
        chance: 0.75
      });
    }

    function processScheduledTwists(state, settings, playerCount) {
      const pending = state.twistEvents.filter((event) => !state.triggeredTwistOrders.has(event.order) && event.remaining === playerCount);
      for (const event of pending) {
        state.triggeredTwistOrders.add(event.order);
        if (event.type === "merge") {
          mergeNow(state, playerCount, "scheduled");
        } else if (event.type === "swap") {
          splitIntoTribes(state, event.tribes, playerCount, "swap", true, event.tribeLabels);
        } else if (event.type === "demerge") {
          if (!state.mergedEver) {
            logLines(state, "", "Demerge scheduled at " + playerCount + " players was skipped because no merge had happened yet.");
            continue;
          }
          splitIntoTribes(state, event.tribes, playerCount, "demerge", event.immunity, event.tribeLabels);
        }
      }
    }

    function runRound(state, settings) {
      logLines(state, "", "Episode " + state.episodeNumber);
      returnExilePlayers(state);
      if (state.remergeAfterDemerge) {
        state.remergeAfterDemerge = false;
        mergeNow(state, state.players.length, "remerge");
      }
      const playerCount = state.players.length;
      processScheduledTwists(state, settings, playerCount);

      if (!state.merged && state.tribes.length < 2) {
        mergeNow(state, playerCount, "emergency");
      }

      if (!state.merged && state.tribes.some((tribe) => tribe.length <= 1)) {
        if (playerCount <= settings.finalistsCount + 7) {
          mergeNow(state, playerCount, "emergency");
        } else {
          logLines(state, "Emergency swap executed.");
          splitIntoTribes(state, 2, playerCount, "swap", true);
        }
      }

      runDslCampEvents(state);

      if (state.phaseKey === "demerged") {
        premergeReward(state);
        const immunityResults = demergeIndividualImmunity(state);
        for (const result of immunityResults) {
          const activeTribe = result.tribe.filter((player) => state.players.some((active) => active.id === player.id));
          if (activeTribe.length <= 1) {
            continue;
          }
          logEpisodeBeat(state, result.label + " is heading to tribal", activeTribe);
          updateThreatLevels(state);
          runPreTribalStrategyBeats(state, settings, activeTribe.slice(), result.label);
          syncTribeAlliances(state, activeTribe.slice(), result.label, { log: true });
          updateThreatLevels(state);
          tribalCouncil(
            state,
            settings,
            activeTribe.slice(),
            result.label + " Tribal",
            result.label
          );
        }
        state.remergeAfterDemerge = true;
      } else if (!state.merged) {
        premergeReward(state);
        const challengeResult = premergeChallenge(state);
        updateThreatLevels(state);
        runPreTribalStrategyBeats(
          state,
          settings,
          challengeResult.losingTribe.slice(),
          challengeResult.losingLabel
        );
        syncTribeAlliances(state, challengeResult.losingTribe.slice(), challengeResult.losingLabel, { log: true });
        updateThreatLevels(state);
        tribalCouncil(
          state,
          settings,
          challengeResult.losingTribe.slice(),
          challengeResult.losingLabel + " Tribal",
          challengeResult.losingLabel
        );
      } else {
        mergeReward(state);
        const immunityWinner = individualImmunity(state);
        logLines(state, "");
        logEpisodeBeat(state, immunityWinner.name + " wins immunity", [immunityWinner]);
        maybeLogConfessional(state, {
          category: "immunity_win",
          speaker: immunityWinner,
          players: [immunityWinner],
          tribeLabel: state.mergeColor,
          chance: 0.8
        });
        updateThreatLevels(state);
        runPreTribalStrategyBeats(state, settings, state.players.slice(), state.mergeColor);
        syncTribeAlliances(state, state.players.slice(), state.mergeColor, { log: true });
        updateThreatLevels(state);
        tribalCouncil(
          state,
          settings,
          state.players.slice(),
          "Merge Tribal (" + state.mergeColor + ")",
          state.mergeColor
        );
      }

      state.players.forEach((player) => {
        player.immune = false;
      });
      state.roundNumber += 1;
      state.episodeNumber += 1;
    }

    function juryVoteFor(juror, finalists) {
      const weightThreat = 0.11 + (0.075 * (juror.strategy - 1));
      const weightRelationship = 1 - weightThreat;
      const ranked = finalists
        .slice()
        .sort((a, b) => {
          const scoreA = (weightRelationship * (juror.relationships[a.id] ?? 0)) + (weightThreat * a.threat);
          const scoreB = (weightRelationship * (juror.relationships[b.id] ?? 0)) + (weightThreat * b.threat);
          if (scoreA === scoreB) {
            return a.name.localeCompare(b.name);
          }
          return scoreB - scoreA;
        });
      return ranked[0];
    }

    function buildJuryVoteReason(juror, choice, finalists) {
      const alternatives = finalists.filter((player) => player.id !== choice.id);
      const reasons = [];
      const addReason = (label, text, weight) => reasons.push({ label, text, weight });
      const rel = juror.relationships[choice.id] ?? 0;
      const bestAltRel = alternatives.reduce((best, finalist) => Math.max(best, juror.relationships[finalist.id] ?? 0), -99);
      const threatGap = choice.threat - Math.max(...alternatives.map((player) => player.threat), 0);
      const socialGap = choice.social - Math.max(...alternatives.map((player) => player.social), 0);
      const strategyGap = choice.strategy - Math.max(...alternatives.map((player) => player.strategy), 0);

      if (rel >= bestAltRel + 2 || rel >= 5) {
        addReason("Relationship", juror.name + " feels most personally respected by " + choice.name + ", and that matters when the vote is for a winner.", 4.3);
      }
      if (choice.threat >= 4 || threatGap >= 1) {
        addReason("Winning Case", choice.name + " has the clearest overall case to own the season in front of the jury.", 4.15);
      }
      if (choice.strategy >= 4 || strategyGap >= 1) {
        addReason("Strategic Game", juror.name + " rewards " + choice.name + " for shaping votes instead of just surviving them.", 4.05);
      }
      if (choice.social >= 4 || socialGap >= 1) {
        addReason("Social Game", choice.name + " built enough social capital that this vote feels earned, not accidental.", 3.95);
      }
      if (choice.challenge >= 4 && juror.challenge >= 3) {
        addReason("Challenge Respect", juror.name + " respects how visible " + choice.name + " was in challenges when the game got thin.", 3.55);
      }
      if (!reasons.length) {
        addReason("Final Tribal Case", juror.name + " thinks " + choice.name + " gave the most complete answer for why their game should win.", 3.2);
      }

      reasons.sort((a, b) => b.weight - a.weight);
      const top = reasons.slice(0, 3);
      return {
        summary: top[0].label,
        tags: top.map((item) => item.label),
        details: top.map((item) => item.text)
      };
    }

    function finalTribalCouncil(state, settings) {
      const jurors = state.bootLog.slice(-settings.jurySize);
      const finalists = state.players.slice();
      const voteCounts = new Map();
      const juryVotes = [];

      finalists.forEach((player) => {
        voteCounts.set(player.id, 0);
        player.juryVotes = 0;
      });

      logLines(state, "", "Jury size set to " + jurors.length + " (target " + settings.jurySize + ")");
      logLines(state, "", "Final Tribal " + finalists.map((player) => player.name).join(" v "));

      for (const juror of jurors) {
        const choice = juryVoteFor(juror, finalists);
        voteCounts.set(choice.id, (voteCounts.get(choice.id) || 0) + 1);
        choice.juryVotes += 1;
        juryVotes.push({
          jurorId: juror.id,
          jurorName: juror.name,
          finalistId: choice.id,
          finalistName: choice.name,
          reason: buildJuryVoteReason(juror, choice, finalists)
        });
      }

      logVotesInRevealOrder(
        state,
        new Map(juryVotes.map((vote) => [vote.jurorId, vote.finalistId])),
        jurors.concat(finalists)
      );

      let contenders = finalists.slice().sort((a, b) => (voteCounts.get(b.id) || 0) - (voteCounts.get(a.id) || 0));
      let topVotes = voteCounts.get(contenders[0].id) || 0;
      let leaders = contenders.filter((player) => (voteCounts.get(player.id) || 0) === topVotes);

      if (finalists.length === 3 && leaders.length === 2) {
        const decider = finalists.find((player) => !leaders.some((leader) => leader.id === player.id));
        if (decider) {
          const decidingVote = juryVoteFor(decider, leaders);
          voteCounts.set(decidingVote.id, (voteCounts.get(decidingVote.id) || 0) + 1);
          decidingVote.juryVotes += 1;
          juryVotes.push({
            jurorId: decider.id,
            jurorName: decider.name,
            finalistId: decidingVote.id,
            finalistName: decidingVote.name,
            isFinalistTieBreaker: true,
            reason: buildJuryVoteReason(decider, decidingVote, leaders)
          });
          logLines(state, "", decider.name + " casts the deciding finalist vote -> " + decidingVote.name);
          contenders = finalists.slice().sort((a, b) => (voteCounts.get(b.id) || 0) - (voteCounts.get(a.id) || 0));
          topVotes = voteCounts.get(contenders[0].id) || 0;
          leaders = contenders.filter((player) => (voteCounts.get(player.id) || 0) === topVotes);
        }
      }

      let winner = leaders[0];
      if (leaders.length > 1) {
        winner = leaders
          .slice()
          .sort((a, b) => {
            const scoreA = jurors.reduce((sum, juror) => sum + (juror.relationships[a.id] ?? 0), 0);
            const scoreB = jurors.reduce((sum, juror) => sum + (juror.relationships[b.id] ?? 0), 0);
            if (scoreA === scoreB) {
              return a.name.localeCompare(b.name);
            }
            return scoreB - scoreA;
          })[0];
      }

      const finalVote = summarizeVotes(voteCounts);
      logLines(state, "");
      logEpisodeBeat(state, "The Sole Survivor is " + winner.name + " " + finalVote, finalists.concat(jurors));
      return {
        winner,
        jurors,
        finalists,
        voteCounts,
        finalVote,
        juryVotes
      };
    }

    function runFinale(state, settings) {
      if (!state.merged) {
        mergeNow(state, state.players.length, "finale");
      }

      logLines(state, "", "Episode " + state.episodeNumber + ": Finale");

      if (settings.finalistsCount === 3) {
        while (state.players.length > 3) {
          const immunityWinner = individualImmunity(state);
          logLines(state, "");
          logEpisodeBeat(state, immunityWinner.name + " wins immunity", [immunityWinner]);
          maybeLogConfessional(state, {
            category: "immunity_win",
            speaker: immunityWinner,
            players: [immunityWinner],
            tribeLabel: state.mergeColor,
            chance: 0.8
          });
          updateThreatLevels(state);
          runPreTribalStrategyBeats(state, settings, state.players.slice(), state.mergeColor);
          syncTribeAlliances(state, state.players.slice(), state.mergeColor, { log: true });
          updateThreatLevels(state);
          tribalCouncil(state, settings, state.players.slice(), "Finale Tribal", state.mergeColor);
          state.players.forEach((player) => {
            player.immune = false;
          });
        }
        return finalTribalCouncil(state, settings);
      }

      if (state.players.length === 4) {
        const immunityWinner = individualImmunity(state);
        logLines(state, "");
        logEpisodeBeat(state, immunityWinner.name + " wins immunity", [immunityWinner]);
        maybeLogConfessional(state, {
          category: "immunity_win",
          speaker: immunityWinner,
          players: [immunityWinner],
          tribeLabel: state.mergeColor,
          chance: 0.8
        });
        updateThreatLevels(state);
        runPreTribalStrategyBeats(state, settings, state.players.slice(), state.mergeColor);
        syncTribeAlliances(state, state.players.slice(), state.mergeColor, { log: true });
        updateThreatLevels(state);
        tribalCouncil(state, settings, state.players.slice(), "Final 4 Tribal", state.mergeColor);
        state.players.forEach((player) => {
          player.immune = false;
        });
      }

      if (state.players.length === 3) {
        const eventId = "tribal-" + state.voteEventCounter;
        state.voteEventCounter += 1;
        const immunityWinner = individualImmunity(state);
        logLines(state, "");
        logEpisodeBeat(state, immunityWinner.name + " wins immunity", [immunityWinner]);
        maybeLogConfessional(state, {
          category: "immunity_win",
          speaker: immunityWinner,
          players: [immunityWinner],
          tribeLabel: state.mergeColor,
          chance: 0.8
        });
        const others = state.players.filter((player) => player.id !== immunityWinner.id);
        runPreTribalStrategyBeats(state, settings, state.players.slice(), state.mergeColor);
        syncTribeAlliances(state, state.players.slice(), state.mergeColor, { log: true });
        updateThreatLevels(state);
        const target = chooseFinalTwoBoot(state, settings, immunityWinner, others);
        const finalThreeVotes = new Map([[immunityWinner.id, target.id]]);
        const finalThreeTally = new Map([[target.id, 1]]);
        const finalThreeReasons = new Map([[
          immunityWinner.id,
          buildVoteReason(state, settings, state.players, finalThreeVotes, finalThreeTally, immunityWinner, target, target)
        ]]);
        const noVoteIds = new Set(state.players.filter((player) => player.id !== immunityWinner.id).map((player) => player.id));
        logLines(state, immunityWinner.name + " -> " + target.name);
        recordVotingHistory(state, {
          eventId,
          episode: state.episodeNumber,
          phase: "merged",
          tribeLabel: state.mergeColor,
          eliminated: target.name,
          votesLabel: "1",
          ballots: buildBallotMap(state.players, finalThreeVotes, state.mergeColor, null, noVoteIds, finalThreeReasons)
        });
        removePlayer(state, target);
        logLines(state, "");
        logEpisodeBeat(state, target.name + " the tribe has spoken.", [target]);
        state.players.forEach((player) => {
          player.immune = false;
        });
      }

      return finalTribalCouncil(state, settings);
    }

    function computePlacements(state, finaleResult) {
      const placements = {};
      const total = state.allPlayers.length;

      state.bootLog.forEach((player, index) => {
        placements[player.id] = total - index;
      });

      placements[finaleResult.winner.id] = 1;

      const losingFinalists = finaleResult.finalists
        .filter((player) => player.id !== finaleResult.winner.id)
        .slice()
        .sort((a, b) => {
          const voteA = finaleResult.voteCounts.get(a.id) || 0;
          const voteB = finaleResult.voteCounts.get(b.id) || 0;
          if (voteA === voteB) {
            return a.name.localeCompare(b.name);
          }
          return voteB - voteA;
        });

      losingFinalists.forEach((player, index) => {
        placements[player.id] = index + 2;
      });

      return state.allPlayers
        .slice()
        .sort((a, b) => placements[a.id] - placements[b.id] || a.name.localeCompare(b.name))
        .map((player) => ({
          rank: placements[player.id],
          name: player.name,
          id: player.id,
          photo: player.photo || "",
          tribe: player.originalTribeLabel,
          strategy: player.strategy,
          threat: player.threat,
          social: player.social,
          challenge: player.challenge,
          eventAppearances: player.eventAppearances || 0,
          idolsFound: player.idolsFound || 0,
          idolsPlayed: player.idolsPlayed || 0,
          advantagesFound: player.advantagesFound || 0,
          juryVotes: player.juryVotes || 0
        }));
    }

    function buildAllianceRecap(state) {
      const tracker = allianceTrackerState(state);
      return {
        active: tracker.active
          .filter((alliance) => alliance.active !== false && alliance.memberIds.length >= 2)
          .map((alliance) => ({
            name: alliance.name,
            tribeLabel: alliance.tribeLabel,
            members: getAllianceMembers(state, alliance).map((player) => ({
              id: player.id,
              name: player.name,
              photo: player.photo || ""
            }))
          })),
        history: tracker.history.map((entry) => ({
          episode: entry.episode,
          tribeLabel: entry.tribeLabel,
          text: entry.text,
          type: entry.type,
          memberIds: (entry.memberIds || []).slice()
        }))
      };
    }

    function buildSocialGraphGroups(state, placements) {
      const rankById = new Map(asArray(placements).map((row) => [row.id, row.rank]));
      const groups = new Map();
      state.players.forEach((player) => {
        const label = player.currentTribeLabel || "Unplaced";
        if (!groups.has(label)) {
          groups.set(label, []);
        }
        groups.get(label).push(player);
      });

      return Array.from(groups.entries())
        .map(([label, members]) => {
          const sortedMembers = members
            .slice()
            .sort((a, b) => (rankById.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rankById.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name));
          const edges = [];
          for (let i = 0; i < sortedMembers.length; i += 1) {
            for (let j = i + 1; j < sortedMembers.length; j += 1) {
              edges.push({
                fromId: sortedMembers[i].id,
                toId: sortedMembers[j].id,
                score: averagePairRelationship(sortedMembers[i], sortedMembers[j])
              });
            }
          }
          return {
            tribeLabel: label,
            members: sortedMembers.map((player) => ({
              id: player.id,
              name: player.name,
              photo: player.photo || "",
              rank: rankById.get(player.id) ?? null,
              threat: player.threat || 0
            })),
            edges
          };
        })
        .sort((a, b) => a.tribeLabel.localeCompare(b.tribeLabel));
    }

    function buildSocialGraphEdges(state) {
      const players = state.allPlayers || [];
      const edges = [];
      for (let i = 0; i < players.length; i += 1) {
        for (let j = i + 1; j < players.length; j += 1) {
          edges.push({
            fromId: players[i].id,
            toId: players[j].id,
            score: averagePairRelationship(players[i], players[j])
          });
        }
      }
      return edges;
    }

    function buildAdvantageStatus(state) {
      return state.players
        .map((player) => {
          const inventory = getPlayerInventory(player);
          const items = [];
          if ((inventory.idol || 0) > 0) {
            items.push("Hidden Immunity Idol x" + inventory.idol);
          }
          getPlayerAdvantages(player).forEach((advantage) => {
            const label = advantage.label || advantage.type || "Advantage";
            items.push(label);
          });
          return items.length ? { player: player.name, items } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.player.localeCompare(b.player));
    }

    function simulateSeason(settings) {
      const rng = new RNG(settings.seed);
      const entries = parseCast(settings.castText, rng, settings.castRows, settings.startingTribeMode);
      const twistTimeline = normalizeTwistTimeline(settings.twistEvents);
      validateTwistTimeline(twistTimeline);
      const players = buildPlayers(entries);
      initializeSocialState(players, rng);

      const state = {
        rng,
        players,
        allPlayers: players.slice(),
        tribes: [],
        tribeNames: [],
        initialTribeNames: [],
        startingTribeColors: [],
        mergeColor: "Merged",
        merged: false,
        swappedAt: null,
        swappedTeams: null,
        mergedAt: null,
        demergedAt: null,
        demergedTeams: null,
        remergeAfterDemerge: false,
        mergedEver: false,
        phaseKey: "original",
        demergeHasImmunity: true,
        exilePlayers: [],
        twistEvents: twistTimeline,
        triggeredTwistOrders: new Set(),
        twistHistory: [],
        roundNumber: 1,
        episodeNumber: 1,
        voteEventCounter: 1,
        startingPlayerCount: players.length,
        bootLog: [],
        voteHistory: [],
        log: [],
        allianceTracker: {
          nextId: 1,
          active: [],
          history: [],
          usedNames: new Set()
        },
        storyTracker: {
          usedConfessionalTemplates: new Set(),
          usedConfessionalLines: new Set(),
          confessionalCountsByPlayer: new Map()
        },
        eventDsl: {
          tribeFlags: new Map(),
          playerAdvantages: new Map()
        }
      };

      groupStartingTribes(state, settings);

      logLines(state, "Survivor Simulation Log", "==============================");
      logLines(state, "Seed: " + rng.seedText);
      logLines(state, "Finalists this season: Final " + settings.finalistsCount);
      logLines(state, "Starting Survivor Season...");
      logTribes(state);
      seedStartingIdols(state);

      const finaleGate = settings.finalistsCount === 3 ? 5 : 4;
      while (state.players.length > finaleGate) {
        runRound(state, settings);
      }

      const finaleResult = runFinale(state, settings);
      const placements = computePlacements(state, finaleResult);
      const allianceRecap = buildAllianceRecap(state);
      const socialGraphGroups = buildSocialGraphGroups(state, placements);
      const socialGraphEdges = buildSocialGraphEdges(state);
      const advantageStatus = buildAdvantageStatus(state);
      const seasonShape = [
        state.allPlayers.length + " players",
        state.twistEvents.length ? state.twistEvents.length + " twist event(s)" : "no twist events",
        "final " + settings.finalistsCount
      ].join(" | ");
      const swapSummaryText = state.twistHistory.filter((item) => /^Swap |^Demerge /.test(item)).join(". ");
      const mergeSummaryText = state.twistHistory.filter((item) => /^(?:Merge|Remerge) /.test(item)).join(". ");
      const tribeColorLabels = state.tribeNames
        .concat(state.mergeColor || "")
        .concat(placements.map((row) => row.tribe || ""))
        .concat(state.voteHistory.map((entry) => entry.tribeLabel || ""));
      const tribeColors = buildTribeColorMap(tribeColorLabels);
      customTribeColorMap(state.initialTribeNames, state.startingTribeColors)
        .forEach((color, label) => tribeColors.set(label, color));

      return {
        seed: rng.seedText,
        winner: finaleResult.winner.name,
        winnerPhoto: finaleResult.winner.photo || "",
        finalists: finaleResult.finalists.map((player) => player.name),
        finalVote: finaleResult.finalVote,
        placements,
        castOrder: state.allPlayers.map((player) => ({
          id: player.id,
          name: player.name
        })),
        voteHistory: state.voteHistory,
        juryVote: {
          jurors: finaleResult.jurors.map((player) => ({
            id: player.id,
            name: player.name
          })),
          finalists: finaleResult.finalists.map((player) => ({
            id: player.id,
            name: player.name
          })),
          votes: finaleResult.juryVotes
        },
        logText: state.log.join("\n"),
        seasonShape,
        allianceRecap,
        advantageStatus,
        socialGraphEdges,
        socialGraphGroups,
        mergeColor: state.mergeColor,
        tribeColors: Object.fromEntries(tribeColors),
        juryCount: finaleResult.jurors.length,
        bootCount: state.bootLog.length,
        episodes: state.episodeNumber,
        playerCount: state.allPlayers.length,
        swapSummary: swapSummaryText || "No swap or demerge events triggered.",
        mergeSummary: mergeSummaryText || "No merge event triggered."
      };
    }

    function renderPlacements(rows) {
      placementsBody.innerHTML = asArray(rows).map((row) => {
        const photoCell = row.photo
          ? '<img class="player-avatar" alt="' + escapeHtml(row.name) + ' portrait" src="' + escapeHtml(row.photo) + '">'
          : '<span class="player-avatar-fallback" aria-label="' + escapeHtml(row.name) + ' default portrait"></span>';
        return "<tr>"
          + "<td>" + escapeHtml(row.rank) + "</td>"
          + "<td>" + escapeHtml(row.name) + "</td>"
          + "<td>" + photoCell + "</td>"
          + "<td>" + escapeHtml(row.tribe || "-") + "</td>"
          + "<td>" + escapeHtml(row.strategy) + "</td>"
          + "<td>" + escapeHtml(row.threat) + "</td>"
          + "<td>" + escapeHtml(row.social) + "</td>"
          + "<td>" + escapeHtml(row.challenge) + "</td>"
          + "<td>" + escapeHtml(row.eventAppearances) + "</td>"
          + "<td>" + escapeHtml(row.juryVotes) + "</td>"
          + "</tr>";
      }).join("");
    }

    function normalizeVoteBallots(entry) {
      if (!entry || !entry.ballots) {
        return {};
      }
      if (!Array.isArray(entry.ballots)) {
        return entry.ballots;
      }
      const mapped = {};
      entry.ballots.forEach((ballot) => {
        if (!ballot || !ballot.voterId) {
          return;
        }
        mapped[ballot.voterId] = {
          kind: "vote",
          label: ballot.targetName || "",
          nullified: Boolean(ballot.nullified)
        };
      });
      return mapped;
    }

    function buildVotingHistoryRowsHtml(result) {
      const history = asArray(result.voteHistory);
      if (!history.length) {
        return '<tr><td class="label-cell">Status</td><td>No voting chart has been generated yet.</td></tr>';
      }
      const chartFootnotes = [];
      const chartFootnoteKeyToNumber = new Map();
      function addChartFootnote(text) {
        const clean = String(text || "")
          .replace(/\s+/g, " ")
          .replace(/—/g, "-")
          .replace(/â€”/g, "-")
          .trim();
        if (!clean) {
          return "";
        }
        if (!chartFootnoteKeyToNumber.has(clean)) {
          chartFootnotes.push(clean);
          chartFootnoteKeyToNumber.set(clean, chartFootnotes.length);
        }
        return chartFootnoteKeyToNumber.get(clean);
      }

      function renderFootnoteRefs(notes) {
        const numbers = [];
        asArray(notes).forEach((note) => {
          const number = addChartFootnote(note);
          if (number && !numbers.includes(number)) {
            numbers.push(number);
          }
        });
        return numbers.length
          ? '<sup class="chart-note-refs">' + numbers.map((number) => '<a href="#vote-note-' + number + '">' + number + "</a>").join(",") + "</sup>"
          : "";
      }

      function normalizedLogSpecialLine(line) {
        const clean = String(line || "").replace(/â€”/g, "-").trim();
        if (!clean) {
          return "";
        }
        const useful = (
          /\bplays\b.*\b(?:Idol|Vote Block|Vote Steal|Knowledge Is Power|Safety Without Power|Legacy Advantage|50\/50|Nullifier|Advantage)\b/i.test(clean)
          || /\bSuper Idol\b.*\b(?:saved|forces elimination|caused new tie)\b/i.test(clean)
          || /\bwills the Legacy Advantage\b/i.test(clean)
          || /\buses Extra Vote\b/i.test(clean)
          || /\bProtection on\b.*\bNULLIFIED\b/i.test(clean)
          || /\bOfficial revote\b/i.test(clean)
          || /\breaches consensus\b/i.test(clean)
          || /\bdraw rocks\b/i.test(clean)
          || /\bbad rock\b/i.test(clean)
          || /\bFire-making\b/i.test(clean)
        );
        return useful ? clean : "";
      }

      const immunityByEpisode = new Map();
      const specialNotesByEpisode = new Map();
      let currentLogEpisode = "";
      String(result.logText || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .forEach((line) => {
          const episodeMatch = line.match(/^Episode\s+(\d+)(?::\s*(.*))?$/);
          if (episodeMatch) {
            currentLogEpisode = episodeMatch[1];
            const inlineText = String(episodeMatch[2] || "").trim();
            if (/\bwin(?:s)? immunity\b/i.test(inlineText)) {
              const winnerText = inlineText.replace(/\s+win(?:s)? immunity\.?$/i, "").trim();
              if (winnerText) {
                if (!immunityByEpisode.has(currentLogEpisode)) {
                  immunityByEpisode.set(currentLogEpisode, new Set());
                }
                immunityByEpisode.get(currentLogEpisode).add(winnerText);
              }
            }
            return;
          }
          const specialLine = normalizedLogSpecialLine(line);
          if (currentLogEpisode && specialLine) {
            if (!specialNotesByEpisode.has(currentLogEpisode)) {
              specialNotesByEpisode.set(currentLogEpisode, []);
            }
            specialNotesByEpisode.get(currentLogEpisode).push(specialLine);
          }
          if (!currentLogEpisode || !/\bwin(?:s)? immunity\b/i.test(line)) {
            return;
          }
          const winnerText = line.replace(/\s+win(?:s)?(?: individual)? immunity(?: for .+)?\.?$/i, "").trim();
          if (!winnerText || /^No\b/i.test(winnerText)) {
            return;
          }
          if (!immunityByEpisode.has(currentLogEpisode)) {
            immunityByEpisode.set(currentLogEpisode, new Set());
          }
          immunityByEpisode.get(currentLogEpisode).add(winnerText);
        });

      function entryBallotList(entry) {
        if (!entry || !entry.ballots) {
          return [];
        }
        if (Array.isArray(entry.ballots)) {
          return entry.ballots;
        }
        return Object.entries(entry.ballots).map(([voterId, ballot]) => ({
          voterId,
          voterName: voterId,
          targetName: ballot && ballot.label ? ballot.label : "",
          kind: ballot && ballot.kind,
          nullified: Boolean(ballot && ballot.nullified)
        }));
      }

      function entryFootnotes(entry) {
        const notes = [];
        const episodeNotes = specialNotesByEpisode.get(String(entry && entry.episode != null ? entry.episode : "")) || [];
        notes.push(...episodeNotes);
        notes.push(...asArray(entry && entry.notes));
        const ballots = entryBallotList(entry);
        const nullifiedTargets = Array.from(new Set(
          ballots
            .filter((ballot) => ballot && ballot.nullified && ballot.targetName)
            .map((ballot) => ballot.targetName)
        ));
        nullifiedTargets.forEach((targetName) => {
          const voters = ballots
            .filter((ballot) => ballot && ballot.nullified && ballot.targetName === targetName)
            .map((ballot) => ballot.voterName || ballot.voterId || "")
            .filter(Boolean);
          const existingSpecificNote = episodeNotes.some((note) => note.includes(targetName) && /\bIdol\b|\bLegacy\b|\b50\/50\b|\bprotect/i.test(note));
          if (!existingSpecificNote) {
            notes.push("Votes against " + targetName + " did not count after protection was played" + (voters.length ? " (" + voters.join(", ") + ")" : "") + ".");
          }
        });
        ballots
          .filter((ballot) => ballot && ballot.kind === "none")
          .forEach((ballot) => {
            const voterName = ballot.voterName || ballot.voterId || "A player";
            const hasSpecificNoVoteNote = episodeNotes.some((note) => note.includes(voterName) && /\bVote Block\b|\bVote Steal\b|\bSafety Without Power\b|\bno vote\b/i.test(note));
            if (!hasSpecificNoVoteNote) {
              notes.push(voterName + " did not cast a vote this round.");
            }
          });
        if (String(entry && entry.votesLabel || "").toLowerCase().includes("fire")) {
          notes.push("This elimination was resolved by fire-making instead of a normal vote.");
        }
        if (String(entry && entry.votesLabel || "").toLowerCase().includes("rocks")) {
          notes.push("This deadlock was resolved by drawing rocks.");
        }
        return notes;
      }

      const placementByName = new Map(
        asArray(result.placements).map((row) => [row.name, row.rank])
      );
      const orderedPlayers = asArray(result.castOrder).slice().sort((a, b) => {
        const rankA = placementByName.get(a.name) ?? Number.MAX_SAFE_INTEGER;
        const rankB = placementByName.get(b.name) ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return a.name.localeCompare(b.name);
      });

      const phaseGroups = [];
      for (const entry of history) {
        const last = phaseGroups[phaseGroups.length - 1];
        if (last && last.phase === entry.phase) {
          last.count += 1;
        } else {
          phaseGroups.push({ phase: entry.phase, count: 1 });
        }
      }

      const eventGroups = [];
      for (const entry of history) {
        const last = eventGroups[eventGroups.length - 1];
        if (last && last.eventId === entry.eventId) {
          last.count += 1;
        } else {
          eventGroups.push({
            eventId: entry.eventId,
            count: 1,
            episode: entry.episode,
            tribeLabel: entry.tribeLabel,
            eliminated: entry.eliminated
          });
        }
      }

      const eventOrderById = new Map();
      const eliminatedAfterEvent = new Map();
      eventGroups.forEach((group, index) => {
        eventOrderById.set(group.eventId, index);
        eliminatedAfterEvent.set(group.eliminated, index);
      });

      let html = "";
      html += '<tr class="phase-header"><td class="label-cell"></td>';
      phaseGroups.forEach((group) => {
        html += '<td colspan="' + group.count + '">' + escapeHtml(phaseName(group.phase)) + "</td>";
      });
      html += "</tr>";

      const episodeGroups = [];
      for (const group of eventGroups) {
        const last = episodeGroups[episodeGroups.length - 1];
        if (last && last.episode === group.episode) {
          last.count += group.count;
        } else {
          episodeGroups.push({ episode: group.episode, count: group.count });
        }
      }

      html += '<tr><th class="label-cell">Episode</th>';
      episodeGroups.forEach((group) => {
        html += '<td colspan="' + group.count + '">' + escapeHtml(group.episode) + "</td>";
      });
      html += "</tr>";

      html += '<tr><th class="label-cell">Immunity</th>';
      eventGroups.forEach((group) => {
        const matchingEntry = history.find((entry) => entry.eventId === group.eventId);
        const immunityText = String(matchingEntry && matchingEntry.immunityLabel || "").trim()
          || Array.from(immunityByEpisode.get(String(group.episode || "")) || new Set()).join(", ")
          || "-";
        html += '<td colspan="' + group.count + '">' + escapeHtml(immunityText) + "</td>";
      });
      html += "</tr>";

      html += '<tr><th class="label-cell">Tribe</th>';
      eventGroups.forEach((group) => {
        html += '<td colspan="' + group.count + '"' + tribeStyle(group.tribeLabel) + ">" + escapeHtml(group.tribeLabel || "-") + "</td>";
      });
      html += "</tr>";

      html += '<tr><th class="label-cell">Eliminated</th>';
      eventGroups.forEach((group) => {
        html += '<td colspan="' + group.count + '">' + escapeHtml(group.eliminated) + "</td>";
      });
      html += "</tr>";

      html += '<tr><th class="label-cell">Votes</th>';
      history.forEach((entry) => {
        html += "<td>" + escapeHtml(entry.votesLabel || "") + renderFootnoteRefs(entryFootnotes(entry)) + "</td>";
      });
      html += "</tr>";

      html += '<tr class="vote-divider"><td colspan="' + (history.length + 1) + '"></td></tr>';
      html += '<tr class="vote-header"><th class="label-cell">Voter</th>';
      html += '<th colspan="' + history.length + '">Vote</th>';
      html += "</tr>";

      orderedPlayers.forEach((player) => {
        html += '<tr><th class="label-cell">' + escapeHtml(player.name) + "</th>";
        history.forEach((entry) => {
          const ballotMap = normalizeVoteBallots(entry);
          const ballot = ballotMap[player.id] || null;
          const eventOrder = eventOrderById.get(entry.eventId);
          const eliminatedAfter = eliminatedAfterEvent.get(player.name);
          if (!ballot || !ballot.label) {
            if (
              eventOrder != null &&
              eliminatedAfter != null &&
              eventOrder > eliminatedAfter
            ) {
              html += '<td class="vote-eliminated"></td>';
            } else {
              html += '<td class="vote-empty"></td>';
            }
            return;
          }

          if (ballot.kind === "special") {
            html += '<td class="vote-special">' + escapeHtml(ballot.label) + "</td>";
            return;
          }

          if (ballot.kind === "none") {
            html += '<td class="vote-none">' + escapeHtml(ballot.label) + renderFootnoteRefs(entryFootnotes(entry)) + "</td>";
            return;
          }

          html += '<td><span class="vote-chip' + (ballot.nullified ? " vote-nullified" : "") + '">' + escapeHtml(ballot.label) + "</span>" + (ballot.nullified ? renderFootnoteRefs(entryFootnotes(entry)) : "") + "</td>";
        });
        html += "</tr>";
      });

      if (chartFootnotes.length) {
        html += '<tr class="chart-footnotes-row"><th class="label-cell">Notes</th><td colspan="' + history.length + '"><ol class="chart-footnotes">';
        chartFootnotes.forEach((note, index) => {
          const number = index + 1;
          html += '<li id="vote-note-' + number + '"><span class="chart-footnote-number">' + number + ".</span> " + escapeHtml(note) + "</li>";
        });
        html += "</ol></td></tr>";
      }

      return html;
    }

    function renderVotingHistory(result) {
      votingHistoryBody.innerHTML = buildVotingHistoryRowsHtml(result);
    }

    function renderJuryVote(result) {
      const juryVote = result.juryVote;
      if (!juryVote || !juryVote.finalists || !juryVote.finalists.length) {
        juryVoteBody.innerHTML = '<tr><td class="label-cell">Status</td><td>No jury vote chart has been generated yet.</td></tr>';
        return;
      }
      const finalists = asArray(juryVote.finalists);
      const votes = asArray(juryVote.votes);
      const jurorRows = asArray(juryVote.jurors).map((juror) => ({
        id: juror.id,
        name: juror.name,
        isFinalistTieBreaker: Boolean(juror.isFinalistTieBreaker)
      }));
      const jurorIds = new Set(jurorRows.map((juror) => String(juror.id)));
      votes.forEach((vote) => {
        const jurorId = String(vote.jurorId || "");
        if (!jurorId || jurorIds.has(jurorId)) {
          return;
        }
        jurorIds.add(jurorId);
        jurorRows.push({
          id: vote.jurorId,
          name: vote.jurorName || "Finalist vote",
          isFinalistTieBreaker: true
        });
      });

      let html = '<tr><th class="label-cell">Juror</th>';
      finalists.forEach((finalist) => {
        html += "<th>" + escapeHtml(finalist.name) + "</th>";
      });
      html += "</tr>";

      jurorRows.forEach((juror) => {
        const label = juror.name + (juror.isFinalistTieBreaker ? " (finalist tie-breaker)" : "");
        html += '<tr><th class="label-cell">' + escapeHtml(label) + "</th>";
        finalists.forEach((finalist) => {
          const picked = votes.some((vote) => vote.jurorId === juror.id && vote.finalistId === finalist.id);
          html += "<td>" + (picked ? '<span class="jury-check">&check;</span>' : "") + "</td>";
        });
        html += "</tr>";
      });

      juryVoteBody.innerHTML = html;
    }

    function relationshipGraphColor(score) {
      const normalized = (Math.tanh(Number(score || 0) / 12) + 1) / 2;
      const hue = Math.round(normalized * 120);
      return "hsl(" + hue + " 78% 48%)";
    }

    function buildSocialGraphHtml(groups) {
      const safeGroups = asArray(groups);
      if (!safeGroups.length) {
        return '<p class="subtle">No relationship status data is available for this simulation.</p>';
      }

      const percentileValue = (sortedValues, value) => {
        if (!sortedValues.length) {
          return 0.5;
        }
        const below = sortedValues.filter((entry) => entry < value).length;
        const same = sortedValues.filter((entry) => entry === value).length;
        return (below + same / 2) / sortedValues.length;
      };
      const greenLabels = new Set(["Shield", "Ally", "Goat"]);
      const redLabels = new Set(["Target", "Rival", "Easy Vote", "Safe Vote"]);
      const labelToneClass = (label) => {
        if (label === "Shield") return "relationship-tone-shield";
        if (label === "Ally") return "relationship-tone-ally";
        if (label === "Goat") return "relationship-tone-goat";
        if (label === "Target") return "relationship-tone-target";
        if (label === "Rival") return "relationship-tone-rival";
        if (label === "Easy Vote" || label === "Safe Vote") return "relationship-tone-easy";
        if (label === "Wild Card") return "relationship-tone-wild";
        return "relationship-tone-swing";
      };
      const maximalGreenGroups = (members, greenAdjacency) => {
        const ids = members.map((member) => member.id);
        const maximal = [];
        const bronKerbosch = (r, p, x) => {
          if (!p.size && !x.size) {
            if (r.size >= 2) {
              maximal.push(Array.from(r));
            }
            return;
          }
          Array.from(p).forEach((id) => {
            const neighbors = greenAdjacency.get(id) || new Set();
            bronKerbosch(
              new Set(Array.from(r).concat(id)),
              new Set(Array.from(p).filter((entry) => neighbors.has(entry))),
              new Set(Array.from(x).filter((entry) => neighbors.has(entry)))
            );
            p.delete(id);
            x.add(id);
          });
        };
        bronKerbosch(new Set(), new Set(ids), new Set());
        return maximal
          .filter((group, index, allGroups) => !allGroups.some((other, otherIndex) => (
            otherIndex !== index
            && other.length > group.length
            && group.every((id) => other.includes(id))
          )))
          .sort((a, b) => b.length - a.length || a.join("|").localeCompare(b.join("|")));
      };

      return safeGroups.map((group) => {
        const members = asArray(group.members).filter(Boolean);
        const memberIds = new Set(members.map((member) => member.id));
        const rawEdges = asArray(group.edges).filter((edge) => memberIds.has(edge.fromId) && memberIds.has(edge.toId));
        const edgeMap = new Map(rawEdges.map((edge) => [[edge.fromId, edge.toId].sort().join("::"), Number(edge.score || 0)]));
        const threatValues = members.map((member) => Number(member.threat || 0) || (member.rank ? Math.max(1, members.length + 1 - Number(member.rank || 0)) : 0));
        const sortedThreatValues = threatValues.slice().sort((a, b) => a - b);
        const relationshipLookup = new Map();
        const rows = members.map((observer) => {
          const relValues = members
            .filter((other) => other.id !== observer.id)
            .map((other) => edgeMap.get([observer.id, other.id].sort().join("::")) || 0)
            .sort((a, b) => a - b);
          const relRange = relValues.length ? relValues[relValues.length - 1] - relValues[0] : 0;
          const friendCutoff = relRange >= 4 ? relValues[Math.max(0, Math.ceil(relValues.length * 0.68) - 1)] : 5;
          const enemyCutoff = relRange >= 4 ? relValues[Math.min(relValues.length - 1, Math.floor(relValues.length * 0.28))] : -4;
          const observerThreat = Number(observer.threat || 0) || (observer.rank ? Math.max(1, members.length + 1 - Number(observer.rank || 0)) : 0);
          const entries = members
            .filter((other) => other.id !== observer.id)
            .map((other) => {
              const rel = edgeMap.get([observer.id, other.id].sort().join("::")) || 0;
              const otherThreat = Number(other.threat || 0) || (other.rank ? Math.max(1, members.length + 1 - Number(other.rank || 0)) : 0);
              const threatPercentile = percentileValue(sortedThreatValues, otherThreat);
              let threat = "same";
              if (otherThreat >= observerThreat + 1 && threatPercentile >= 0.66) {
                threat = "higher";
              } else if (otherThreat <= observerThreat - 1 && threatPercentile <= 0.34) {
                threat = "lower";
              }
              return {
                other,
                rel,
                label: relationshipThreatLabel(observer, other, rel, threat, { friendCutoff, enemyCutoff })
              };
            })
            .sort((a, b) => b.rel - a.rel || a.label.localeCompare(b.label) || a.other.name.localeCompare(b.other.name));
          entries.forEach((entry) => {
            const key = observer.id + "::" + entry.other.id;
            relationshipLookup.set(key, entry.label);
          });
          return '<article class="relationship-card">'
            + '<h5>' + escapeHtml(observer.name) + "'s relationships</h5>"
            + '<ul class="relationship-label-list">'
            + entries.map((entry) => '<li class="' + labelToneClass(entry.label) + '"><span>' + escapeHtml(entry.other.name) + '</span><strong>' + escapeHtml(entry.label) + "</strong></li>").join("")
            + "</ul>"
            + "</article>";
        }).join("");
        const greenAdjacency = new Map(members.map((member) => [member.id, new Set()]));
        const greenEdges = [];
        const redEdges = [];
        for (let outer = 0; outer < members.length; outer += 1) {
          for (let inner = outer + 1; inner < members.length; inner += 1) {
            const a = members[outer];
            const b = members[inner];
            const aLabel = relationshipLookup.get(a.id + "::" + b.id);
            const bLabel = relationshipLookup.get(b.id + "::" + a.id);
            if (greenLabels.has(aLabel) && greenLabels.has(bLabel)) {
              greenAdjacency.get(a.id).add(b.id);
              greenAdjacency.get(b.id).add(a.id);
              greenEdges.push({ fromId: a.id, toId: b.id });
            } else if (redLabels.has(aLabel) && redLabels.has(bLabel)) {
              redEdges.push({ fromId: a.id, toId: b.id });
            }
          }
        }
        const allianceGroups = maximalGreenGroups(members, greenAdjacency);
        const allianceLookup = new Map(members.map((member) => [member.id, member.name]));
        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        const pairKey = (aId, bId) => [aId, bId].sort().join("::");
        const positions = members.map((member, index) => {
          const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / Math.max(1, members.length));
          const ring = 24 + ((index % 3) * 5);
          return {
            member,
            x: 50 + Math.cos(angle) * ring,
            y: 50 + Math.sin(angle) * ring * 0.74,
            vx: 0,
            vy: 0
          };
        });
        const nodeById = new Map(positions.map((entry) => [entry.member.id, entry]));
        const relationshipPairs = [];
        for (let outer = 0; outer < members.length; outer += 1) {
          for (let inner = outer + 1; inner < members.length; inner += 1) {
            const a = members[outer];
            const b = members[inner];
            const score = edgeMap.get(pairKey(a.id, b.id)) || 0;
            const clampedScore = clamp(score, -18, 18);
            const desired = clamp(42 - clampedScore * 1.25, 17, 64);
            relationshipPairs.push({ aId: a.id, bId: b.id, score, desired });
          }
        }
        for (let tick = 0; tick < 180; tick += 1) {
          relationshipPairs.forEach((pair) => {
            const a = nodeById.get(pair.aId);
            const b = nodeById.get(pair.bId);
            if (!a || !b) return;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
            dx /= dist;
            dy /= dist;
            const pull = (dist - pair.desired) * 0.008;
            a.vx += dx * pull;
            a.vy += dy * pull;
            b.vx -= dx * pull;
            b.vy -= dy * pull;
          });
          for (let outer = 0; outer < positions.length; outer += 1) {
            for (let inner = outer + 1; inner < positions.length; inner += 1) {
              const a = positions[outer];
              const b = positions[inner];
              let dx = b.x - a.x;
              let dy = b.y - a.y;
              let dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
              dx /= dist;
              dy /= dist;
              const minDistance = Math.max(10, Math.min(17, (String(a.member.name || "").length + String(b.member.name || "").length) * 0.46));
              if (dist < minDistance) {
                const push = (minDistance - dist) * 0.048;
                a.vx -= dx * push;
                a.vy -= dy * push;
                b.vx += dx * push;
                b.vy += dy * push;
              }
            }
          }
          positions.forEach((entry) => {
            entry.vx += (50 - entry.x) * 0.002;
            entry.vy += (50 - entry.y) * 0.002;
            entry.vx *= 0.78;
            entry.vy *= 0.78;
            entry.x = clamp(entry.x + entry.vx, 9, 91);
            entry.y = clamp(entry.y + entry.vy, 11, 89);
          });
        }
        const greenDegree = new Map(members.map((member) => [member.id, 0]));
        greenEdges.forEach((edge) => {
          greenDegree.set(edge.fromId, (greenDegree.get(edge.fromId) || 0) + 1);
          greenDegree.set(edge.toId, (greenDegree.get(edge.toId) || 0) + 1);
        });
        const coloredDegree = new Map(members.map((member) => [member.id, greenDegree.get(member.id) || 0]));
        redEdges.forEach((edge) => {
          coloredDegree.set(edge.fromId, (coloredDegree.get(edge.fromId) || 0) + 1);
          coloredDegree.set(edge.toId, (coloredDegree.get(edge.toId) || 0) + 1);
        });
        const brownEdges = [];
        const brownEdgeKeys = new Set();
        members.forEach((member) => {
          if ((coloredDegree.get(member.id) || 0) > 0) return;
          const strongest = members
            .filter((other) => other.id !== member.id)
            .map((other) => ({ other, score: edgeMap.get(pairKey(member.id, other.id)) || 0 }))
            .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name))[0];
          if (!strongest) return;
          const key = pairKey(member.id, strongest.other.id);
          if (brownEdgeKeys.has(key)) return;
          brownEdgeKeys.add(key);
          brownEdges.push({ fromId: member.id, toId: strongest.other.id });
        });
        const lineFor = (edge, className) => {
          const from = nodeById.get(edge.fromId);
          const to = nodeById.get(edge.toId);
          if (!from || !to) return "";
          return '<line class="' + className + '" x1="' + from.x.toFixed(2) + '" y1="' + from.y.toFixed(2) + '" x2="' + to.x.toFixed(2) + '" y2="' + to.y.toFixed(2) + '"></line>';
        };
        const mapLines = greenEdges.map((edge) => lineFor(edge, "alliance-map-line alliance-map-line-green")).join("")
          + redEdges.map((edge) => lineFor(edge, "alliance-map-line alliance-map-line-red")).join("")
          + brownEdges.map((edge) => lineFor(edge, "alliance-map-line alliance-map-line-brown")).join("");
        const playerDots = positions.map((entry) => {
          const member = entry.member;
          return '<div class="alliance-map-player" style="left:' + entry.x.toFixed(2) + "%;top:" + entry.y.toFixed(2) + '%;">'
            + '<strong>' + escapeHtml(member.name) + "</strong>"
            + "</div>";
        }).join("");
        const allianceList = allianceGroups.length
          ? allianceGroups.map((ids, index) => '<li><strong>Alliance ' + (index + 1) + '</strong><span>' + escapeHtml(ids.map((id) => allianceLookup.get(id)).filter(Boolean).join(", ")) + "</span></li>").join("")
          : '<li><strong>No alliances</strong><span>No fully mutual green group has formed.</span></li>';
        const allianceChart = '<div class="alliance-chart-block">'
          + '<div class="alliance-chart-head"><h5>Alliance Structure</h5><p>Names attract and repel by relationship strength.</p></div>'
          + '<div class="alliance-chart-stage alliance-map-stage">'
          + '<svg class="alliance-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + mapLines + "</svg>"
          + playerDots
          + "</div>"
          + '<ul class="alliance-chart-list">' + allianceList + "</ul>"
          + "</div>";
        return '<section class="social-graph-panel relationship-status-panel">'
          + '<div class="social-graph-head"><h4>' + escapeHtml(group.tribeLabel) + '</h4><p>' + escapeHtml(members.length) + ' player relationship labels</p></div>'
          + '<div class="relationship-status-grid">' + rows + "</div>"
          + allianceChart
          + "</section>";
      }).join("");
    }

    function buildSocialGraphEdgeLookup(groups) {
      const lookup = new Map();
      const addEdge = (edge) => {
          const fromId = String(edge.fromId || "").trim();
          const toId = String(edge.toId || "").trim();
          if (!fromId || !toId) {
            return;
          }
          const key = [fromId, toId].sort().join("::");
          lookup.set(key, {
            fromId,
            toId,
            score: Number(edge.score || 0)
          });
      };
      asArray(groups).forEach((group) => {
        asArray(group && group.edges).forEach(addEdge);
      });
      return lookup;
    }

    function buildSocialGraphGroupsForTribes(tribes, castByName, edgeLookup) {
      const tribeEntries = Array.from((tribes || new Map()).entries());
      return tribeEntries.map(([tribeLabel, memberNames]) => {
        const members = (memberNames || [])
          .map((name) => castByName.get(String(name || "").trim()))
          .filter(Boolean)
          .filter((member, index, allMembers) => allMembers.findIndex((entry) => entry.id === member.id) === index);
        const edges = [];

        for (let outer = 0; outer < members.length; outer += 1) {
          for (let inner = outer + 1; inner < members.length; inner += 1) {
            const key = [members[outer].id, members[inner].id].sort().join("::");
            const edge = edgeLookup.get(key);
            if (edge) {
              edges.push(edge);
            }
          }
        }

        return {
          tribeLabel,
          members,
          edges
        };
      }).filter((group) => group.members.length);
    }

    function renderAllianceRecap(result) {
      if (!allianceSummary || !allianceHistoryList) {
        return;
      }
      const recap = result.allianceRecap || { active: [], history: [] };
      const activeAlliances = asArray(recap.active);
      const allianceHistory = asArray(recap.history);
      if (!activeAlliances.length) {
        allianceSummary.innerHTML = '<p class="subtle">No lasting alliances were locked in during this simulation.</p>';
      } else {
        allianceSummary.innerHTML = '<div class="alliance-summary-group">'
          + '<p class="alliance-summary-title">Current Alliances And Blocs</p>'
          + '<div class="alliance-chip-row">'
          + activeAlliances.map((alliance) => {
            const members = asArray(alliance && alliance.members);
            const photos = members.slice(0, 3).map((member) => member.photo
              ? '<img class="alliance-mini-photo" alt="' + escapeHtml(member.name) + ' portrait" src="' + escapeHtml(member.photo) + '">'
              : '<span class="graph-node-fallback" aria-label="' + escapeHtml(member.name) + ' default portrait"></span>').join("");
            return '<div class="alliance-chip">'
              + photos
              + '<span><strong>' + escapeHtml(alliance.name) + '</strong> - ' + escapeHtml(members.map((member) => member.name).join(", ")) + "</span>"
              + "</div>";
          }).join("")
          + "</div>"
          + "</div>";
      }

      if (!allianceHistory.length) {
        allianceHistoryList.innerHTML = '<li class="subtle">No alliance changes were recorded this season.</li>';
        return;
      }

      allianceHistoryList.innerHTML = allianceHistory.map((entry) => '<li class="alliance-history-item">'
        + '<div class="alliance-history-meta">Episode ' + escapeHtml(entry.episode) + ' | ' + escapeHtml(entry.tribeLabel || "Unknown tribe") + "</div>"
        + '<div class="alliance-history-text">' + escapeHtml(entry.text) + "</div>"
        + "</li>").join("");
    }

    function renderSocialGraph(result) {
      if (!socialGraphWrap) {
        return;
      }
      socialGraphWrap.innerHTML = buildSocialGraphHtml(asArray(result && result.socialGraphGroups));
    }

    function collectResultTribeLabels(result) {
      const labels = [];
      const add = (value) => {
        const label = String(value || "").trim();
        if (label) {
          labels.push(label);
        }
      };

      if (result && result.tribeColors) {
        Object.keys(result.tribeColors).forEach(add);
      }
      asArray(result && result.placements).forEach((row) => add(row && row.tribe));
      asArray(result && result.voteHistory).forEach((entry) => {
        add(entry.tribeLabel);
        asArray(entry.ballots).forEach((ballot) => add(ballot && ballot.tribeLabel));
      });
      asArray(result && result.allianceRecap && result.allianceRecap.active).forEach((entry) => add(entry && entry.tribeLabel));
      asArray(result && result.allianceRecap && result.allianceRecap.history).forEach((entry) => add(entry && entry.tribeLabel));
      asArray(result && result.socialGraphGroups).forEach((group) => add((group && group.tribeLabel) || (group && group.label)));
      add(result.mergeColor);

      return labels;
    }

    function renderResult(result) {
      setActiveTribeColors(collectResultTribeLabels(result), result.tribeColors || {});
      winnerValue.textContent = result.winner;
      if (result.winnerPhoto) {
        winnerPhoto.src = result.winnerPhoto;
        winnerPhotoWrap.hidden = false;
      } else {
        winnerPhoto.removeAttribute("src");
        winnerPhotoWrap.hidden = true;
      }
      winnerMeta.textContent = "Seed: " + result.seed;
      finalistsValue.textContent = result.finalists.join(" vs ");
      voteValue.textContent = "Final vote " + result.finalVote;
      shapeValue.textContent = result.seasonShape;
      shapeMeta.textContent = result.swapSummary + " " + result.mergeSummary;
      episodeValue.textContent = String(result.episodes);
      episodeMeta.textContent = result.bootCount + " boots, jury of " + result.juryCount + ".";
      runMeta.textContent = "Latest run used seed " + result.seed;
      logMeta.textContent = result.playerCount + " players | " + result.finalVote + (result.engine ? " | " + result.engine + " engine" : "");
      renderPlacements(result.placements);
      renderVotingHistory(result);
      renderJuryVote(result);
      renderAllianceRecap(result);
      renderSocialGraph(result);
      seasonLog.textContent = result.logText;
      latestLogText = result.logText;
    }

    function classifyEpisodeLine(text) {
      if (/^Reward Challenge:/.test(text)) {
        return "reward";
      }
      if (/\bwin(?:s)? immunity\b/.test(text)) {
        return "immunity";
      }
      if (/^(MERGE\b|REMERGE\b|SWAP\b|DEMERGE\b|Emergency swap)/.test(text)) {
        return "twist";
      }
      if (/Tribal|^Revote /.test(text)) {
        return "tribal";
      }
      if (/Nominees:/.test(text)) {
        return "nominees";
      }
      if (/->/.test(text)) {
        return "vote";
      }
      if (/has been eliminated|the tribe has spoken|The Sole Survivor is|draw rocks|Fire-making/.test(text)) {
        return "outcome";
      }
      return "plain";
    }

    function escapeRegExp(text) {
      return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function findMentionedPlayers(text, players) {
      const sourceText = String(text || "");
      return players
        .map((player) => {
          const name = String(player.name || "").trim();
          if (!name) {
            return null;
          }

          const pattern = /^[A-Za-z0-9]+$/.test(name)
            ? new RegExp("\\b" + escapeRegExp(name) + "\\b", "i")
            : new RegExp(escapeRegExp(name), "i");
          const match = sourceText.match(pattern);
          if (!match) {
            return null;
          }

          return {
            name,
            photo: player.photo || "",
            index: match.index != null ? match.index : sourceText.toLowerCase().indexOf(name.toLowerCase())
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.index - b.index || b.name.length - a.name.length)
        .filter((player, index, all) => all.findIndex((entry) => entry.name === player.name) === index);
    }

    function findVotePlayers(text, castByName) {
      const match = String(text || "").match(/^(.+?)(?:\s+casts the deciding finalist vote)?\s*->\s*(.+)$/);
      if (!match) {
        return null;
      }

      const voter = castByName.get(match[1].trim());
      const targetName = match[2].replace(/\s*\(Does Not Count\)\s*$/i, "").trim();
      const target = castByName.get(targetName);
      if (!voter && !target) {
        return null;
      }

      return {
        voter: voter || null,
        target: target || null
      };
    }

    function buildEpisodeViewerData(result) {
      const cast = asArray(result.placements).map((row) => ({
        id: row.id || "",
        rank: row.rank,
        name: row.name,
        tribe: row.tribe || "-",
        photo: row.photo || "",
        strategy: row.strategy || 0,
        threat: row.threat || 0,
        social: row.social || 0,
        challenge: row.challenge || 0,
        eventAppearances: row.eventAppearances || 0
      }));
      const overviewPage = {
        kind: "overview",
        title: "Season Overview",
        subtitle: result.seasonShape,
        summary: [
          "Seed: " + result.seed,
          "Winner: " + result.winner,
          "Final vote: " + result.finalVote,
          result.swapSummary,
          result.mergeSummary,
          asArray(result.advantageStatus).length
            ? "Current advantages: " + asArray(result.advantageStatus).map((row) => row.player + " has " + asArray(row.items).join(", ")).join("; ")
            : "Current advantages: none held."
        ],
        cast,
        voteChartRowsHtml: buildVotingHistoryRowsHtml(result)
      };
      const castByName = new Map(cast.map((row) => [row.name, row]));
      const socialGraphEdgeLookup = buildSocialGraphEdgeLookup(
        [{ edges: asArray(result.socialGraphEdges) }].concat(asArray(result.socialGraphGroups))
      );
      const flattenedVoteReasons = asArray(result.voteHistory).flatMap((entry) => (
        Array.isArray(entry.ballots)
          ? entry.ballots.map((ballot) => ({
              episode: entry && entry.episode != null ? String(entry.episode) : "",
              voterName: ballot.voterName || "",
              targetName: ballot.targetName || "",
              reason: ballot.reason || null
            }))
          : Object.entries(entry.ballots || {}).map(([voterId, ballot]) => {
              const voter = cast.find((row) => row.name === voterId || row.id === voterId);
              return {
                episode: entry && entry.episode != null ? String(entry.episode) : "",
                voterName: voter ? voter.name : voterId,
                targetName: ballot && ballot.label ? ballot.label : "",
                reason: ballot && ballot.reason ? ballot.reason : null
              };
            }).filter((item) => item.targetName)
      ));
      asArray(result.juryVote && result.juryVote.votes).forEach((vote) => {
        flattenedVoteReasons.push({
          episode: "final",
          voterName: vote.jurorName || "",
          targetName: vote.finalistName || ((result.juryVote.finalists || []).find((finalist) => finalist.id === vote.finalistId) || {}).name || "",
          reason: vote.reason || null
        });
      });
      let flattenedVoteReasonIndex = 0;
      const tribalLabelsByEpisode = new Map();
      asArray(result.voteHistory).forEach((entry) => {
        const episodeKey = String(entry && entry.episode != null ? entry.episode : "");
        const tribeLabel = String(entry && entry.tribeLabel ? entry.tribeLabel : "").trim();
        if (!episodeKey || !tribeLabel) {
          return;
        }
        if (!tribalLabelsByEpisode.has(episodeKey)) {
          tribalLabelsByEpisode.set(episodeKey, []);
        }
        const labels = tribalLabelsByEpisode.get(episodeKey);
        if (!labels.includes(tribeLabel)) {
          labels.push(tribeLabel);
        }
      });
      const knownNames = new Set(cast.map((row) => row.name));
      const knownTribeLabels = new Set(
        LEGACY_TRIBE_COLOR_NAMES
          .concat(collectResultTribeLabels(result))
          .concat(result.mergeColor || "")
          .concat(cast.map((row) => row.tribe || ""))
          .concat(Array.from(tribalLabelsByEpisode.values()).flat())
          .filter(Boolean)
      );
      const rawLogLines = String(result.logText || "")
        .split(/\r?\n/)
        .map((line) => line.trim());
      let currentTribes = new Map();
      const aliveNames = new Set(cast.map((row) => row.name));

      function isNarrativeOrSystemLine(line) {
        return !line
          || knownNames.has(line)
          || /^=+$/.test(line)
          || /^(Episode \d+:|Reward Challenge:|MERGE\b|REMERGE\b|SWAP\b|DEMERGE\b|Emergency swap|Exile Island return|Advantage Watch:|Advantages\/Idols in play:|Alliance Snapshot|Traversability:|Monte Carlo Forecast|Started:|Seed:|Finalists this season:|Starting Survivor Season|Applied persistent|Planned swaps\/merges:|Total planned swaps\/merges:|Merge color:|Jury size set to |Final Tribal )/.test(line)
          || /^\+[-+]+\+$/.test(line)
          || /^\|/.test(line)
          || /^\(/.test(line)
          || /^Rank\s+Player/.test(line)
          || /->/.test(line)
          || /has been eliminated|the tribe has spoken|drew the bad rock and is eliminated|The Sole Survivor is|draw rocks|Fire-making/.test(line);
      }

      function isTribeLabelLine(line, nextLine) {
        if (!line || !knownNames.has(nextLine || "")) {
          return false;
        }
        if (/^Tribe \d+$/.test(line) || knownTribeLabels.has(line)) {
          return true;
        }
        return !isNarrativeOrSystemLine(line);
      }

      function removePlayerFromCurrentTribes(name) {
        if (!name) {
          return;
        }
        currentTribes.forEach((members, label) => {
          currentTribes.set(label, members.filter((member) => member !== name));
        });
      }

      function setCurrentTribesToMerge() {
        const mergeLabel = String(result.mergeColor || "Merged").trim() || "Merged";
        const mergedMembers = cast
          .map((row) => row.name)
          .filter((name) => aliveNames.has(name));
        currentTribes = new Map([[mergeLabel, mergedMembers]]);
      }

      function applyLineStateUpdates(text) {
        const eliminatedMatch = String(text || "").match(/^(.+?) has been eliminated\b|^(.+?) drew the bad rock and is eliminated\b|^(.+?) the tribe has spoken\.?$/);
        const eliminatedName = eliminatedMatch ? (eliminatedMatch[1] || eliminatedMatch[2] || eliminatedMatch[3] || "").trim() : "";
        if (!eliminatedName) {
          return;
        }
        aliveNames.delete(eliminatedName);
        removePlayerFromCurrentTribes(eliminatedName);
      }

      function parseTribeSnapshot(lines, startIndex) {
        const tribes = new Map();
        let index = startIndex;
        let consumedAny = false;

        while (index < lines.length) {
          while (index < lines.length && !String(lines[index] || "").trim().length) {
            index += 1;
          }

          if (
            index >= lines.length
            || !isTribeLabelLine(lines[index], lines[index + 1])
            || !knownNames.has(lines[index + 1] || "")
          ) {
            break;
          }

          const label = lines[index];
          index += 1;
          const members = [];
          while (index < lines.length && knownNames.has(lines[index])) {
            if (aliveNames.has(lines[index])) {
              members.push(lines[index]);
            }
            index += 1;
          }
          tribes.set(label, members);
          consumedAny = true;
        }

        return consumedAny && tribes.size ? { tribes, nextIndex: index } : null;
      }

      function resolvePlayersForTribeLabels(labels) {
        const requestedLabels = labels
          .map((label) => String(label || "").trim())
          .filter(Boolean);
        const availableLabels = Array.from(currentTribes.keys());
        const missingLabels = requestedLabels.filter((label) => !currentTribes.has(label));
        const players = !requestedLabels.length || missingLabels.length
          ? []
          : requestedLabels
          .flatMap((label) => currentTribes.get(label) || [])
          .map((name) => castByName.get(name))
          .filter(Boolean)
          .filter((player, index, players) => players.findIndex((entry) => entry.name === player.name) === index);
        return {
          requestedLabels,
          availableLabels,
          missingLabels,
          players
        };
      }

      function findPlayersForTribeLabels(labels) {
        return resolvePlayersForTribeLabels(labels).players;
      }

      function findWinningTribePlayers(text) {
        const teamMatch = String(text || "").match(/^(?:Episode \d+:\s*)?(.+?) win immunity\.?$/);
        if (!teamMatch) {
          return [];
        }

        const labels = teamMatch[1]
          .split(/\s*,\s*/)
          .map((label) => label.trim())
          .filter(Boolean);
        return findPlayersForTribeLabels(labels);
      }

      function findRewardTribePlayers(text) {
        const teamMatch = String(text || "").match(/^Reward Challenge:\s+(.+?) win\b/);
        if (!teamMatch) {
          return [];
        }

        const labels = teamMatch[1]
          .split(/\s*,\s*/)
          .map((label) => label.trim())
          .filter(Boolean);
        return findPlayersForTribeLabels(labels);
      }

      function findTribalHeadingPlayers(text) {
        const match = String(text || "").match(/^(.+?) is heading to tribal\.?$/);
        if (!match) {
          return [];
        }
        return findPlayersForTribeLabels([match[1].trim()]);
      }

      function findSnapshotPlayers(text) {
        const match = String(text || "").match(/^(?:Tribe \d+(?: \([^)]+\))?|Merged tribe):\s*(.+)$/);
        if (!match) {
          return [];
        }

        return match[1]
          .split(/\s*,\s*/)
          .map((name) => castByName.get(name.trim()))
          .filter(Boolean);
      }

      function buildPlayersFromNames(names) {
        return names
          .map((name) => castByName.get(String(name || "").trim()))
          .filter(Boolean)
          .filter((player, index, players) => players.findIndex((entry) => entry.name === player.name) === index);
      }

      function splitPlayerNames(text) {
        return String(text || "")
          .split(/\s*,\s*/)
          .map((name) => name.trim())
          .filter(Boolean);
      }

      function cloneVoteReason(reason) {
        if (!reason || typeof reason !== "object") {
          return null;
        }
        return {
          summary: reason.summary || "",
          tags: Array.isArray(reason.tags) ? reason.tags.slice() : [],
          details: Array.isArray(reason.details) ? reason.details.slice() : []
        };
      }

      function buildFallbackVoteReason(voterName, targetName) {
        const fallbackDetails = voterName && targetName
          ? [
              voterName + " used this vote on " + targetName + " to stay close to the numbers without overexposing their own game.",
              voterName + " landed on " + targetName + " because the board around them offered cleaner cover there than anywhere else.",
              voterName + " put " + targetName + "'s name down as the least costly move in a vote with limited room to maneuver.",
              voterName + " treated " + targetName + " as the vote that best protected their relationships for the next round."
            ]
          : [
              "This vote followed the cleanest available numbers from that player's point of view.",
              "This vote was about staying covered while the tribal lines settled.",
              "This vote kept that player from being isolated in the next round."
            ];
        const indexSeed = String((voterName || "") + "|" + (targetName || ""))
          .split("")
          .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        return {
          summary: "Vote Read",
          tags: ["Tribal Logic"],
          details: [fallbackDetails[indexSeed % fallbackDetails.length]]
        };
      }

      function consumeVoteReasonForLine(text) {
        const match = String(text || "").match(/^(.+?)(?:\s+casts the deciding finalist vote)?\s*->\s*(.+)$/);
        if (!match) {
          return null;
        }
        const voterName = match[1].trim();
        const targetName = match[2].replace(/\s*\(Does Not Count\)\s*$/i, "").trim();
        for (let index = flattenedVoteReasonIndex; index < flattenedVoteReasons.length; index += 1) {
          const candidate = flattenedVoteReasons[index];
          if (candidate.voterName === voterName && candidate.targetName === targetName) {
            flattenedVoteReasonIndex = index + 1;
            return cloneVoteReason(candidate.reason) || buildFallbackVoteReason(voterName, targetName);
          }
        }
        return buildFallbackVoteReason(voterName, targetName);
      }

      function resolveScenarioPhotoAttachment(text) {
        const sourceText = String(text || "").trim();

        const teamImmunityMatch = sourceText.match(/^(?:Episode \d+:\s*)?(.+?) win immunity\.?$/);
        if (teamImmunityMatch) {
          const resolution = resolvePlayersForTribeLabels(
            teamImmunityMatch[1]
              .split(/\s*,\s*/)
              .map((label) => label.trim())
              .filter(Boolean)
          );
          return {
            tribePlayers: resolution.players
          };
        }

        const individualImmunityMatch = sourceText.match(/^(?:Episode \d+:\s*)?(.+?) wins immunity\.?$/);
        if (individualImmunityMatch) {
          const resolvedPlayers = buildPlayersFromNames([individualImmunityMatch[1]]);
          return {
            players: resolvedPlayers
          };
        }

        const teamRewardMatch = sourceText.match(/^Reward Challenge:\s+(.+?) win\s+(.+)$/);
        if (teamRewardMatch) {
          const resolution = resolvePlayersForTribeLabels(
            teamRewardMatch[1]
              .split(/\s*,\s*/)
              .map((label) => label.trim())
              .filter(Boolean)
          );
          return {
            tribePlayers: resolution.players
          };
        }

        const individualRewardWithGuestsMatch = sourceText.match(/^Reward Challenge:\s+(.+?) wins\s+(.+?)\s+and brings\s+(.+)$/);
        if (individualRewardWithGuestsMatch) {
          const requestedNames = [individualRewardWithGuestsMatch[1]].concat(splitPlayerNames(individualRewardWithGuestsMatch[3]));
          const resolvedPlayers = buildPlayersFromNames(requestedNames);
          return {
            players: resolvedPlayers
          };
        }

        const individualRewardMatch = sourceText.match(/^Reward Challenge:\s+(.+?) wins\s+(.+)$/);
        if (individualRewardMatch) {
          const resolvedPlayers = buildPlayersFromNames([individualRewardMatch[1]]);
          return {
            players: resolvedPlayers
          };
        }

        if (/is heading to tribal\.?$/.test(sourceText)) {
          const requestedLabel = sourceText.replace(/\s+is heading to tribal\.?$/, "").trim();
          const resolution = resolvePlayersForTribeLabels([requestedLabel]);
          return {
            tribePlayers: resolution.players
          };
        }

        const allianceSnapshotMatch = sourceText.match(/^Alliance Snapshot.*?([A-Za-z0-9][A-Za-z0-9 ]+)$/);
        if (allianceSnapshotMatch) {
          const resolution = resolvePlayersForTribeLabels([allianceSnapshotMatch[1].trim()]);
          return {
            players: resolution.players
          };
        }

        return null;
      }

      function buildEntry(text, overrides) {
        const options = overrides || {};
        const kind = options.kind || classifyEpisodeLine(text);
        const scenarioAttachment = resolveScenarioPhotoAttachment(text) || {};
        const votePlayers = options.votePlayers !== undefined
          ? options.votePlayers
          : kind === "vote"
            ? findVotePlayers(text, castByName)
            : null;
        const voteReason = options.voteReason !== undefined
          ? options.voteReason
          : kind === "vote"
            ? consumeVoteReasonForLine(text)
            : null;
        const tribePlayers = options.tribePlayers !== undefined ? options.tribePlayers : (scenarioAttachment.tribePlayers || []);
        const snapshotPlayers = /^(?:Tribe \d+(?: \([^)]+\))?|Merged tribe):/.test(text) ? findSnapshotPlayers(text) : [];
        const players = options.players !== undefined
          ? options.players
          : tribePlayers.length
            ? tribePlayers
            : snapshotPlayers.length
              ? snapshotPlayers
              : scenarioAttachment.players && scenarioAttachment.players.length
                ? scenarioAttachment.players
              : findMentionedPlayers(text, cast);
        return {
          text,
          kind,
          votePlayers,
          voteReason,
          tribePlayers,
          players
        };
      }

      function buildTribeRevealEntries(tribes, revealType) {
        const tribeList = Array.from(tribes.entries());
        if (revealType === "merge" && tribeList.length === 1) {
          return [
            buildEntry(
              "Merged tribe: " + tribeList[0][1].join(", "),
              { kind: "twist", players: buildPlayersFromNames(tribeList[0][1]) }
            )
          ];
        }

        return tribeList.map(([label, members], index) => buildEntry(
          "Tribe " + (index + 1) + " (" + label + "): " + members.join(", "),
          { kind: "twist", players: buildPlayersFromNames(members) }
        ));
      }

      function buildEpisodeStartEntries(episodeNumber, summaryText) {
        const text = String(summaryText || "").trim();
        if (!text) {
          return [];
        }

        const immunityMatch = text.match(/^(.+?) win immunity\.?$/);
        if (!immunityMatch) {
          return [text];
        }

        const immunityEntries = immunityMatch[1]
          .split(/\s*,\s*/)
          .map((label) => label.trim())
          .filter(Boolean)
          .map((label) => label + " win immunity");
        const tribalEntries = (tribalLabelsByEpisode.get(String(episodeNumber)) || [])
          .map((label) => label + " is heading to tribal");
        return immunityEntries.concat(tribalEntries);
      }

      function buildCurrentEpisodeSocialGraphHtml() {
        const groups = buildSocialGraphGroupsForTribes(currentTribes, castByName, socialGraphEdgeLookup);
        return buildSocialGraphHtml(groups);
      }

      function finalizeEpisodePage(page) {
        if (!page || page.kind !== "episode") {
          return;
        }
        page.socialGraphHtml = buildCurrentEpisodeSocialGraphHtml();
      }

      function entryIncludesPlayer(entry, playerName) {
        if (!entry || !playerName) {
          return false;
        }
        const normalizedName = String(playerName || "").trim();
        const attachedPlayers = []
          .concat(entry.players || [])
          .concat(entry.tribePlayers || [])
          .concat(entry.votePlayers ? [entry.votePlayers.voter, entry.votePlayers.target] : [])
          .filter(Boolean);
        return attachedPlayers.some((player) => player && player.name === normalizedName)
          || String(entry.text || "").includes(normalizedName);
      }

      function buildStoryConfessionalEntry(player, text) {
        if (!player || !text) {
          return null;
        }
        return buildEntry(player.name + " confessional: " + text, {
          kind: "plain",
          players: [player]
        });
      }

      function findPreferredInsertPosition(page, playerName) {
        if (!page || !Array.isArray(page.entries) || !page.entries.length) {
          return 0;
        }
        const matchingIndex = page.entries.findIndex((entry) => entryIncludesPlayer(entry, playerName));
        if (matchingIndex >= 0) {
          return matchingIndex + 1;
        }
        const sectionIndex = page.entries.findIndex((entry) => entry.kind !== "section");
        return sectionIndex >= 0 ? sectionIndex : page.entries.length;
      }

      function buildSeasonStorySeeds() {
        const finalistsCount = Math.max(2, (result.finalists || []).length || 2);
        const byRank = new Map(cast.map((player) => [player.rank, player]));
        const selectedNames = new Set();
        const seeds = [];

        const addSeed = (player, role, preferredRatios, lineFactory) => {
          if (!player || selectedNames.has(player.name)) {
            return;
          }
          selectedNames.add(player.name);
          seeds.push({
            player,
            role,
            preferredRatios,
            lines: lineFactory(player).filter(Boolean)
          });
        };

        addSeed(byRank.get(1), "winner", [0.1, 0.48, 0.82], (player) => [
          "Nobody out here is treating me like the headline yet, and that is exactly why I keep finding room to work.",
          player.social >= 4
            ? "People keep talking to me like I am a comfort blanket instead of a threat. I am not correcting them."
            : "I do not need to run around announcing plans. I need to keep landing inside the right conversation before the door closes.",
          "At this point I can feel the runway in front of me. If I stay sharp and do not spook anyone, I can turn this whole season into my story."
        ]);

        addSeed(byRank.get(2), "runner_up", [0.2, 0.72], (player) => [
          player.challenge >= 4
            ? "I know exactly how people look at somebody who can win challenges, so I have to stay useful without turning into the obvious next hit."
            : "I can feel my position hardening, but that only matters if I keep people needing me for one more vote.",
          "This is the dangerous stretch where one shaky read wrecks a deep run. I am too close now to let the game get away from me."
        ]);

        if (finalistsCount === 3) {
          addSeed(byRank.get(3), "third_place_finalist", [0.32, 0.86], (player) => [
            "I do not need everybody to adore me. I need enough people to feel like keeping me is easier than cutting me.",
            "If I am sitting there at the end, I can explain myself. The hard part is surviving long enough to make them listen."
          ]);
        }

        addSeed(byRank.get(finalistsCount + 1), "fallen_angel", [0.56, 0.9], (player) => [
          player.threat >= 5
            ? "I can tell my name is starting to carry a little extra weight around camp. If they smell the endgame on me too early, that gets dangerous fast."
            : "I am close enough now that people are starting to picture what happens if I get to the end. That is flattering and terrible.",
          "If they give me one clean opening, I can make a real case from here. That is why I know they may not let me have one."
        ]);

        const breakout = cast
          .slice()
          .filter((player) => !selectedNames.has(player.name) && player.rank <= Math.min(cast.length, finalistsCount + 4))
          .sort((a, b) => (b.eventAppearances || 0) - (a.eventAppearances || 0) || a.rank - b.rank)[0];
        addSeed(breakout, "breakout", [0.26, 0.62], (player) => [
          player.social >= 4
            ? "People keep telling me more than they mean to, and I am starting to realize how much that can buy me."
            : player.strategy >= 4
              ? "More and more of the real talk is bending through me. That is useful tonight and dangerous if I get lazy."
              : "I can feel myself becoming part of the shape of this season. Now I need to make sure that shape still has room for me."
        ]);

        return seeds.filter((seed) => seed.lines.length);
      }

      function injectSeasonStoryEdits(targetPages) {
        const episodePageIndexes = targetPages
          .map((page, index) => ({ page, index }))
          .filter((entry) => entry.page.kind === "episode")
          .map((entry) => entry.index);
        if (!episodePageIndexes.length) {
          return;
        }

        const usedKeys = new Set();
        const storySeeds = buildSeasonStorySeeds();
        storySeeds.forEach((seed) => {
          const playerPageIndexes = episodePageIndexes.filter((pageIndex) => {
            const page = targetPages[pageIndex];
            return page.entries.some((entry) => entryIncludesPlayer(entry, seed.player.name));
          });
          const candidateIndexes = playerPageIndexes.length ? playerPageIndexes : episodePageIndexes.slice();
          seed.preferredRatios.forEach((ratio, lineIndex) => {
            const line = seed.lines[lineIndex];
            if (!line) {
              return;
            }
            const targetEpisodeIndex = Math.round((episodePageIndexes.length - 1) * ratio);
            const pageIndex = candidateIndexes
              .slice()
              .sort((a, b) => {
                const distanceA = Math.abs(episodePageIndexes.indexOf(a) - targetEpisodeIndex);
                const distanceB = Math.abs(episodePageIndexes.indexOf(b) - targetEpisodeIndex);
                if (distanceA === distanceB) {
                  return a - b;
                }
                return distanceA - distanceB;
              })
              .find((index) => !usedKeys.has(seed.player.name + "::" + index));
            if (pageIndex == null) {
              return;
            }
            const entry = buildStoryConfessionalEntry(seed.player, line);
            if (!entry) {
              return;
            }
            const insertAt = findPreferredInsertPosition(targetPages[pageIndex], seed.player.name);
            targetPages[pageIndex].entries.splice(insertAt, 0, entry);
            usedKeys.add(seed.player.name + "::" + pageIndex);
          });
        });
      }

      function isNextEpisodeLeadIn(text) {
        return false;
      }

      const createEpisodeEntries = (text) => {
        const sourceText = String(text || "").trim();
        if (!sourceText) {
          return [];
        }

        const preImmunitySectionMatch = sourceText.match(/^Pre-Immunity:\s+(.+)$/);
        if (preImmunitySectionMatch) {
          return [buildEntry(sourceText, {
            kind: "section",
            tribePlayers: findPlayersForTribeLabels([preImmunitySectionMatch[1].trim()])
          })];
        }

        const preTribalSectionMatch = sourceText.match(/^Pre-Tribal:\s+(.+)$/);
        if (preTribalSectionMatch) {
          return [buildEntry(sourceText, {
            kind: "section",
            tribePlayers: findPlayersForTribeLabels([preTribalSectionMatch[1].trim()])
          })];
        }

        const teamImmunityMatch = sourceText.match(/^(?:Episode \d+:\s*)?(.+?) win immunity\.?$/);
        if (teamImmunityMatch) {
          return teamImmunityMatch[1]
            .split(/\s*,\s*/)
            .map((label) => label.trim())
            .filter(Boolean)
            .map((label) => buildEntry(label + " win immunity", {
              kind: "immunity",
              tribePlayers: findPlayersForTribeLabels([label])
            }));
        }

        const individualImmunityMatch = sourceText.match(/^(?:Episode \d+:\s*)?(.+?) wins immunity\.?$/);
        if (individualImmunityMatch) {
          return [buildEntry(sourceText.replace(/^Episode \d+:\s*/, ""), {
            kind: "immunity",
            players: buildPlayersFromNames([individualImmunityMatch[1]])
          })];
        }

        const teamRewardMatch = sourceText.match(/^Reward Challenge:\s+(.+?) win\s+(.+)$/);
        if (teamRewardMatch) {
          const rewardLabels = teamRewardMatch[1]
            .split(/\s*,\s*/)
            .map((label) => label.trim())
            .filter(Boolean);
          return rewardLabels.map((label) => buildEntry("Reward Challenge: " + label + " win " + teamRewardMatch[2], {
            kind: "reward",
            tribePlayers: findPlayersForTribeLabels([label])
          }));
        }

        const individualRewardWithGuestsMatch = sourceText.match(/^Reward Challenge:\s+(.+?) wins\s+(.+?)\s+and brings\s+(.+)$/);
        if (individualRewardWithGuestsMatch) {
          const winnerName = individualRewardWithGuestsMatch[1].trim();
          const guestNames = splitPlayerNames(individualRewardWithGuestsMatch[3]);
          return [
            buildEntry("Reward Challenge: " + winnerName + " wins " + individualRewardWithGuestsMatch[2].trim(), {
              kind: "reward",
              players: buildPlayersFromNames([winnerName])
            }),
            buildEntry(winnerName + " brings " + guestNames.join(", "), {
              kind: "reward",
              players: buildPlayersFromNames([winnerName].concat(guestNames))
            })
          ];
        }

        const individualRewardMatch = sourceText.match(/^Reward Challenge:\s+(.+?) wins\s+(.+)$/);
        if (individualRewardMatch) {
          return [buildEntry(sourceText, {
            kind: "reward",
            players: buildPlayersFromNames([individualRewardMatch[1]])
          })];
        }

        if (/is heading to tribal\.?$/.test(sourceText)) {
          return [buildEntry(sourceText, {
            kind: "tribal",
            tribePlayers: findTribalHeadingPlayers(sourceText)
          })];
        }

        const allianceSnapshotMatch = sourceText.match(/^Alliance Snapshot.*?([A-Za-z0-9][A-Za-z0-9 ]+)$/);
        if (allianceSnapshotMatch) {
          return [buildEntry(sourceText, {
            kind: "plain",
            players: findPlayersForTribeLabels([allianceSnapshotMatch[1].trim()])
          })];
        }

        return [buildEntry(sourceText)];
      };
      const pages = [];

      let currentEpisode = null;
      let pendingLines = [];
      let pendingRevealType = "";
      let storyStarted = false;

      for (let lineIndex = 0; lineIndex < rawLogLines.length; lineIndex += 1) {
        const snapshot = parseTribeSnapshot(rawLogLines, lineIndex);
        if (snapshot) {
          currentTribes = snapshot.tribes;
          if (storyStarted && pendingRevealType) {
            const snapshotEntries = buildTribeRevealEntries(snapshot.tribes, pendingRevealType);
            if (currentEpisode) {
              currentEpisode.entries.push(...snapshotEntries);
            } else {
              pendingLines.push(...snapshotEntries.map((entry) => entry.text));
            }
            pendingRevealType = "";
          }
          lineIndex = snapshot.nextIndex - 1;
          continue;
        }

        const line = rawLogLines[lineIndex];
        if (!line.length) {
          continue;
        }
        if (
          line === "Survivor Simulation Log"
          || /^=+$/.test(line)
          || /^Seed: /.test(line)
          || /^Finalists this season: /.test(line)
          || line === "Starting Survivor Season..."
        ) {
          continue;
        }

        if (!storyStarted && /^(Reward Challenge:|Episode \d+(?::|$)|MERGE\b|REMERGE\b|SWAP\b|DEMERGE\b|Emergency swap)/.test(line)) {
          storyStarted = true;
        }
        if (!storyStarted) {
          continue;
        }

        const episodeMatch = line.match(/^Episode (\d+)(?::\s*(.*))?$/);
        if (episodeMatch) {
          if (currentEpisode) {
            finalizeEpisodePage(currentEpisode);
            pages.push(currentEpisode);
          }
          currentEpisode = {
            kind: "episode",
            title: "Episode " + episodeMatch[1],
            subtitle: episodeMatch[2] || "Camp life, challenge, and tribal",
            entries: pendingLines
              .concat(buildEpisodeStartEntries(episodeMatch[1], episodeMatch[2]))
              .flatMap(createEpisodeEntries)
          };
          pendingLines = [];
          continue;
        }

        if (currentEpisode) {
          if (isNextEpisodeLeadIn(line)) {
            pendingLines.push(line);
            pendingRevealType = /^(MERGE|REMERGE)\b/.test(line) ? "merge" : /^(SWAP\b|DEMERGE\b|Emergency swap)/.test(line) ? "swap" : "";
            continue;
          }
          currentEpisode.entries.push(...createEpisodeEntries(line));
          applyLineStateUpdates(line);
          if (/^(MERGE|REMERGE)\b/.test(line)) {
            setCurrentTribesToMerge();
          }
          pendingRevealType = /^(MERGE|REMERGE)\b/.test(line) ? "merge" : /^(SWAP\b|DEMERGE\b|Emergency swap)/.test(line) ? "swap" : "";
        } else {
          pendingLines.push(line);
          applyLineStateUpdates(line);
          if (/^(MERGE|REMERGE)\b/.test(line)) {
            setCurrentTribesToMerge();
          }
          pendingRevealType = /^(MERGE|REMERGE)\b/.test(line) ? "merge" : /^(SWAP\b|DEMERGE\b|Emergency swap)/.test(line) ? "swap" : "";
        }
      }

      if (currentEpisode) {
        finalizeEpisodePage(currentEpisode);
        pages.push(currentEpisode);
      }

      if (!pages.length) {
        pages.push({
          kind: "episode",
          title: "Season Recap",
          subtitle: "No episode pages were generated",
          entries: createEpisodeEntries("Run another simulation to generate episode-by-episode navigation.")
        });
      }

      injectSeasonStoryEdits(pages);
      pages.push(overviewPage);

      return {
        seasonTitle: "Survivor Simulator Recap",
        winner: result.winner,
        winnerPhoto: result.winnerPhoto || "",
        finalVote: result.finalVote,
        pages
      };
    }

    function buildEpisodeViewerHtml(viewerData) {
      const dataJson = JSON.stringify(viewerData).replace(/</g, "\\u003c");
      const stylesheetHref = new URL("styles/main.css", window.location.href).href;
      return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Survivor Episode Viewer</title>
  <link rel="stylesheet" href="${stylesheetHref}">
</head>
<body class="viewer-page">
  <div class="viewer-shell">
    <section class="hero">
      <div class="viewer-nav">
        <button id="prevPage" class="nav-button" type="button">Previous</button>
        <button id="revealEpisode" class="nav-button" type="button">Reveal Entire Episode</button>
        <div class="page-counter" id="pageCounter"></div>
      </div>
      <article class="page-card">
        <div class="page-head">
          <div class="page-pill" id="pageKind"></div>
          <h2 id="pageTitle"></h2>
          <p class="page-subtitle" id="pageSubtitle"></p>
        </div>
        <div class="page-body" id="pageBody"></div>
        <div class="page-footer">
          <div class="next-hint" id="nextHint"></div>
          <button id="nextPage" class="nav-button next-button is-step" type="button">Next</button>
        </div>
      </article>
    </section>
  </div>
  <script>
  (() => {
    const viewerData = ${dataJson};
    const pageCounter = document.getElementById("pageCounter");
    const pageKind = document.getElementById("pageKind");
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");
    const pageBody = document.getElementById("pageBody");
    const nextHint = document.getElementById("nextHint");
    const prevPage = document.getElementById("prevPage");
    const revealEpisode = document.getElementById("revealEpisode");
    const nextPage = document.getElementById("nextPage");
    let pageIndex = 0;
    let revealIndex = 0;

    function escapeHtmlLocal(text) {
      return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function renderEventPlayerChip(player) {
      const name = String(player && player.name ? player.name : "Player").trim() || "Player";
      if (player && player.photo) {
        return '<span class="event-player-chip"><img class="event-photo" data-photo-image="true" alt="' + escapeHtmlLocal(name) + ' portrait" src="' + escapeHtmlLocal(player.photo) + '"><span class="event-photo-name">' + escapeHtmlLocal(name) + '</span></span>';
      }
      return '<span class="event-player-chip"><span class="event-photo event-photo-fallback" aria-label="' + escapeHtmlLocal(name) + ' default portrait"></span><span class="event-photo-name">' + escapeHtmlLocal(name) + '</span></span>';
    }

    function applyPhotoFallbacks() {
      pageBody.querySelectorAll('img[data-photo-image="true"], img.graph-node-photo, img.cast-photo').forEach((img) => {
        img.onerror = () => {
          const fallback = document.createElement("span");
          fallback.className = img.classList.contains("graph-node-photo")
            ? "graph-node-fallback"
            : img.classList.contains("cast-photo")
              ? "cast-placeholder"
              : "event-photo event-photo-fallback event-photo-error";
          fallback.setAttribute("aria-label", "Render issue");
          fallback.textContent = img.classList.contains("graph-node-photo") || img.classList.contains("cast-photo") ? "Render issue" : "";
          img.replaceWith(fallback);
        };
      });
    }

    function renderVoteReason(reason) {
      if (!reason || (!reason.summary && !(reason.details && reason.details.length))) {
        return "";
      }
      let html = '<details class="vote-reason-details">';
      html += '<summary class="vote-reason-toggle">Why this vote?</summary>';
      html += '<div class="vote-reason-panel">';
      if (reason.summary) {
        html += '<div class="vote-reason-summary">' + escapeHtmlLocal(reason.summary) + '</div>';
      }
      if (reason.tags && reason.tags.length) {
        html += '<div class="vote-reason-tags">';
        reason.tags.forEach((tag) => {
          html += '<span class="vote-reason-tag">' + escapeHtmlLocal(tag) + '</span>';
        });
        html += '</div>';
      }
      if (reason.details && reason.details.length) {
        html += '<ul class="vote-reason-list">';
        reason.details.forEach((detail) => {
          html += '<li>' + escapeHtmlLocal(detail) + '</li>';
        });
        html += '</ul>';
      }
      html += '</div></details>';
      return html;
    }

    function renderPage() {
      const page = viewerData.pages[pageIndex];
      if (page.kind === "episode") {
        pageCounter.textContent = "Page " + (pageIndex + 1) + " of " + viewerData.pages.length + " | Event " + (revealIndex + 1) + " of " + page.entries.length;
      } else {
        pageCounter.textContent = "Page " + (pageIndex + 1) + " of " + viewerData.pages.length;
      }
      pageKind.textContent = page.kind === "overview" ? "Overview" : "Episode";
      pageTitle.textContent = page.title;
      pageSubtitle.textContent = page.subtitle || "";

      if (page.kind === "overview") {
        let html = '<ul class="summary-list">';
        for (const item of page.summary) {
          html += '<li class="summary-item">' + escapeHtmlLocal(item) + '</li>';
        }
        html += '</ul><div class="cast-grid">';
        for (const player of page.cast) {
          html += '<article class="cast-card">';
          html += '<div class="cast-rank">Rank ' + escapeHtmlLocal(player.rank) + '</div>';
          html += player.photo
            ? '<img class="cast-photo" alt="' + escapeHtmlLocal(player.name) + ' portrait" src="' + escapeHtmlLocal(player.photo) + '">'
            : '<div class="cast-placeholder" aria-label="' + escapeHtmlLocal(player.name) + ' default portrait"></div>';
          html += '<div class="cast-name">' + escapeHtmlLocal(player.name) + '</div>';
          html += '<div class="cast-tribe">' + escapeHtmlLocal(player.tribe) + '</div>';
          html += '</article>';
        }
        html += '</div>';
        html += '<section class="overview-history">';
        html += '<h3 class="overview-section-title">Season Voting Chart</h3>';
        html += '<div class="voting-history overview-voting-history"><table><tbody>';
        html += page.voteChartRowsHtml || '<tr><td class="label-cell">Status</td><td>No voting chart has been generated yet.</td></tr>';
        html += '</tbody></table></div>';
        html += '</section>';
        pageBody.innerHTML = html;
      } else {
        let html = '<ul class="event-list">';
        for (const entry of page.entries.slice(0, revealIndex + 1)) {
          html += '<li class="event-item ' + escapeHtmlLocal(entry.kind) + '">';
          if (entry.kind === "vote" && entry.votePlayers) {
            html += '<div class="event-line event-line-stacked vote-event-stack">';
            html += '<div class="event-line vote-event-line">';
            html += entry.votePlayers.voter
              ? renderEventPlayerChip(entry.votePlayers.voter)
              : renderEventPlayerChip({ name: "Unknown voter" });
            html += '<div class="event-text vote-inline-text">voted for</div>';
            html += entry.votePlayers.target
              ? renderEventPlayerChip(entry.votePlayers.target)
              : renderEventPlayerChip({ name: "Unknown target" });
            html += '</div>';
            html += renderVoteReason(entry.voteReason);
            html += '</div>';
            html += '</li>';
            continue;
          }

          if (entry.tribePlayers && entry.tribePlayers.length) {
            html += '<div class="event-line event-line-stacked">';
            html += '<div class="event-text">' + escapeHtmlLocal(entry.text) + '</div>';
            html += '<div class="event-photo-strip">';
            entry.tribePlayers.forEach((player) => {
              html += renderEventPlayerChip(player);
            });
            html += '</div>';
            html += '</div></li>';
            continue;
          }

          html += '<div class="event-line">';
          if (entry.players && entry.players.length) {
            html += '<div class="event-photo-strip">';
            entry.players.forEach((player) => {
              html += renderEventPlayerChip(player);
            });
            html += '</div>';
          }
          html += '<div class="event-text">' + escapeHtmlLocal(entry.text) + '</div>';
          html += '</div></li>';
        }
        html += '</ul>';
        if (page.socialGraphHtml && revealIndex >= page.entries.length - 1) {
          html += '<section class="episode-social-graph">';
          html += '<h3 class="overview-section-title">Relationships</h3>';
          html += page.socialGraphHtml;
          html += '</section>';
        }
        pageBody.innerHTML = html;
      }

      applyPhotoFallbacks();

      const onFirstStep = pageIndex === 0 && (page.kind !== "episode" || revealIndex === 0);
      const onLastStep = pageIndex === viewerData.pages.length - 1
        && (page.kind !== "episode" || revealIndex === page.entries.length - 1);
      const hasMoreInEpisode = page.kind === "episode" && revealIndex < page.entries.length - 1;
      const hasNextPage = pageIndex < viewerData.pages.length - 1;
      const nextPageData = hasNextPage ? viewerData.pages[pageIndex + 1] : null;

      prevPage.disabled = onFirstStep;
      revealEpisode.disabled = page.kind !== "episode" || revealIndex >= page.entries.length - 1;
      nextPage.disabled = onLastStep;
      nextPage.classList.toggle("is-step", hasMoreInEpisode);
      nextPage.classList.toggle("is-page", !hasMoreInEpisode);

      if (hasMoreInEpisode) {
        nextPage.textContent = "Reveal Next Event";
        nextHint.textContent = "";
      } else if (hasNextPage && nextPageData && nextPageData.kind === "overview") {
        nextPage.textContent = "View Season Overview";
        nextHint.textContent = "The finale is done. Finish with the full-season recap.";
      } else if (hasNextPage) {
        nextPage.textContent = "Go to Next Episode";
        nextHint.textContent = "Move on when you're ready for the next episode.";
      } else {
        nextPage.textContent = "End of Season";
        nextHint.textContent = "You have reached the final page of the recap.";
      }
    }

    function goToPreviousStep() {
      const page = viewerData.pages[pageIndex];
      if (page.kind === "episode" && revealIndex > 0) {
        revealIndex -= 1;
        renderPage();
        return;
      }

      if (pageIndex > 0) {
        pageIndex -= 1;
        const previousPage = viewerData.pages[pageIndex];
        revealIndex = previousPage.kind === "episode" ? previousPage.entries.length - 1 : 0;
        renderPage();
      }
    }

    function goToNextStep() {
      const page = viewerData.pages[pageIndex];
      if (page.kind === "episode" && revealIndex < page.entries.length - 1) {
        revealIndex += 1;
        renderPage();
        return;
      }

      if (pageIndex < viewerData.pages.length - 1) {
        pageIndex += 1;
        revealIndex = 0;
        renderPage();
      }
    }

    prevPage.addEventListener("click", goToPreviousStep);

    revealEpisode.addEventListener("click", () => {
      const page = viewerData.pages[pageIndex];
      if (page.kind === "episode") {
        revealIndex = Math.max(0, page.entries.length - 1);
        renderPage();
      }
    });

    nextPage.addEventListener("click", goToNextStep);

    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        goToPreviousStep();
      }
      if (event.key === "ArrowRight") {
        goToNextStep();
      }
    });

    renderPage();
  })();
  <\/script>
</body>
</html>`;
    }

    function openEpisodeViewer(result, targetWindow) {
      const viewerWindow = targetWindow || window.open("", "survivor-episode-viewer");
      if (!viewerWindow) {
        return false;
      }
      const viewerHtml = buildEpisodeViewerHtml(buildEpisodeViewerData(result));
      viewerWindow.document.open();
      viewerWindow.document.write(viewerHtml);
      viewerWindow.document.close();
      return true;
    }

    async function runSimulation(openViewer, switchToResults = true) {
      const shouldOpenViewer = openViewer !== false;
      const recapWindow = shouldOpenViewer ? window.open("", "survivor-episode-viewer") : null;
      if (recapWindow) {
        recapWindow.document.open();
        recapWindow.document.write("<!doctype html><title>Generating recap</title><body style='font-family:Aptos,Segoe UI,sans-serif;padding:24px;'>Generating season recap...</body>");
        recapWindow.document.close();
      }
      runButton.disabled = true;
      runMeta.textContent = "Running simulation...";
      try {
        const settings = getSettings();
        saveSettings(settings);
        let result;
        let engineNote = "";
        try {
          result = await simulateSeasonViaPython(settings);
        } catch (pythonError) {
          result = simulateSeason(settings);
          result.engine = "javascript";
          engineNote = "Python engine unavailable, fell back to the browser JS simulator.";
        }
        hasSimulatedSeason = true;
        updateResultsTabAvailability();
        renderResult(result);
        if (engineNote) {
          logMeta.textContent = engineNote;
        }
        if (switchToResults) {
          setActiveTab("resultsPanel");
        }
        if (shouldOpenViewer && !openEpisodeViewer(result, recapWindow)) {
          logMeta.textContent = "Simulation finished, but the recap page was blocked by the browser.";
        }
      } catch (error) {
        latestLogText = String(error && error.message ? error.message : error);
        votingHistoryBody.innerHTML = '<tr><td class="label-cell">Status</td><td>Voting chart unavailable because the simulation failed.</td></tr>';
        juryVoteBody.innerHTML = '<tr><td class="label-cell">Status</td><td>Jury vote unavailable because the simulation failed.</td></tr>';
        if (allianceSummary) {
          allianceSummary.innerHTML = '<p class="subtle">Alliance tracker unavailable because the simulation failed.</p>';
        }
        if (allianceHistoryList) {
          allianceHistoryList.innerHTML = '<li class="subtle">Alliance history unavailable because the simulation failed.</li>';
        }
        if (socialGraphWrap) {
          socialGraphWrap.innerHTML = '<p class="subtle">Social graph unavailable because the simulation failed.</p>';
        }
        seasonLog.textContent = "Simulation error:\n" + latestLogText;
        runMeta.textContent = "Simulation failed";
        if (switchToResults) {
          setActiveTab("resultsPanel");
        }
        if (recapWindow) {
          recapWindow.document.open();
          recapWindow.document.write("<!doctype html><title>Simulation failed</title><body style='font-family:Aptos,Segoe UI,sans-serif;padding:24px;'>Simulation error:<pre style='white-space:pre-wrap;'>" + escapeHtml(latestLogText) + "</pre></body>");
          recapWindow.document.close();
        }
      } finally {
        runButton.disabled = false;
      }
    }

    runButton.addEventListener("click", runSimulation);

    addPlayerButton.addEventListener("click", () => {
      castEditorRows.push(createEditorRow({ tribe: defaultEditorTribe() }));
      renderCastEditor();
      renderTribeBuilder();
      syncTextareaFromEditor();
    });

    addTwistButton.addEventListener("click", () => {
      twistEventRows.push(createTwistEvent({
        type: "merge",
        remaining: Math.max(2, castEditorRows.filter((row) => row.name.trim().length).length - 5)
      }));
      renderTwistEvents();
    });

    function handleTwistEditorChange(event) {
      const target = event.target;
      const index = asInt(target.dataset.twistIndex);
      const field = target.dataset.twistField;
      if (index == null || !field || !twistEventRows[index]) {
        return;
      }

      if (field === "type") {
        twistEventRows[index].type = target.value;
      } else if (field === "remaining" || field === "tribes") {
        twistEventRows[index][field] = Math.max(field === "remaining" ? 2 : 2, asInt(target.value) || twistEventRows[index][field]);
      } else if (field === "tribeLabel") {
        const labelIndex = asInt(target.dataset.twistLabelIndex);
        if (labelIndex != null) {
          const labels = twistTribeLabelsFor(twistEventRows[index]);
          labels[labelIndex] = String(target.value || "");
          twistEventRows[index].tribeLabels = labels;
        }
        if (event.type === "input") {
          return;
        }
      } else if (field === "immunity") {
        twistEventRows[index].immunity = target.value !== "false";
      }

      twistEventRows[index] = createTwistEvent(twistEventRows[index]);
      renderTwistEvents();
    }

    twistEventsBody.addEventListener("input", handleTwistEditorChange);
    twistEventsBody.addEventListener("change", handleTwistEditorChange);

    twistEventsBody.addEventListener("click", (event) => {
      const randomizeButton = event.target.closest("button[data-action='randomize-twist-tribe-name']");
      if (randomizeButton) {
        const index = asInt(randomizeButton.dataset.twistIndex);
        const labelIndex = asInt(randomizeButton.dataset.twistLabelIndex);
        if (index != null && labelIndex != null && twistEventRows[index]) {
          const labels = twistTribeLabelsFor(twistEventRows[index]);
          const used = new Set();
          startingTribeNameRows.forEach((name) => {
            if (String(name || "").trim()) {
              used.add(String(name).trim().toLowerCase());
            }
          });
          twistEventRows.forEach((eventRow, eventIndex) => {
            twistTribeLabelsFor(eventRow).forEach((name, nameIndex) => {
              if ((eventIndex !== index || nameIndex !== labelIndex) && String(name || "").trim()) {
                used.add(String(name).trim().toLowerCase());
              }
            });
          });
          labels[labelIndex] = randomTribeName(seededTribeNameRng("twist-" + index + "-" + labelIndex), used);
          twistEventRows[index].tribeLabels = labels;
          twistEventRows[index] = createTwistEvent(twistEventRows[index]);
          renderTwistEvents();
        }
        return;
      }

      const button = event.target.closest("button[data-action='remove-twist']");
      if (!button) {
        return;
      }

      const index = asInt(button.dataset.twistIndex);
      if (index == null || !twistEventRows[index]) {
        return;
      }

      twistEventRows.splice(index, 1);
      renderTwistEvents();
    });

    advantageSearchInput.addEventListener("input", renderAdvantageTypeOptions);

    advantagesEnabledInput.addEventListener("change", renderAdvantageSeeds);
    auctionEnabledInput.addEventListener("change", renderAdvantageSeeds);

    addAdvantageButton.addEventListener("click", () => {
      advantageSeedRows.push(createAdvantageSeed({
        advantageType: advantageTypeInput.value || ADVANTAGE_TYPES[0].value,
        timing: { kind: hasAuctionEnabled() ? "auction" : "pre_merge" },
        location: hasAuctionEnabled() ? "auction" : "random"
      }));
      renderAdvantageSeeds();
    });

    function handleAdvantageSeedChange(event) {
      const target = event.target;
      const index = asInt(target.dataset.advantageIndex);
      const field = target.dataset.advantageField;
      if (index == null || !field || !advantageSeedRows[index]) {
        return;
      }

      const seed = advantageSeedRows[index];
      if (field === "enabled") {
        seed.enabled = Boolean(target.checked);
      } else if (field === "timingKind") {
        seed.timing.kind = target.value;
        seed.timing.remainingPlayers = target.value === "final_remaining"
          ? Math.max(2, asInt(seed.timing.remainingPlayers) || 6)
          : null;
        if (target.value === "auction") {
          seed.location = "auction";
        }
      } else if (field === "remainingPlayers") {
        seed.timing.remainingPlayers = Math.max(2, asInt(target.value) || 6);
      } else if (field === "location") {
        seed.location = target.value;
      }

      advantageSeedRows[index] = createAdvantageSeed(seed);
      renderAdvantageSeeds();
    }

    advantageSeedsBody.addEventListener("input", handleAdvantageSeedChange);
    advantageSeedsBody.addEventListener("change", handleAdvantageSeedChange);

    advantageSeedsBody.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action='remove-advantage']");
      if (!button) {
        return;
      }

      const index = asInt(button.dataset.advantageIndex);
      if (index == null || !advantageSeedRows[index]) {
        return;
      }

      advantageSeedRows.splice(index, 1);
      renderAdvantageSeeds();
    });

    loadTestingCastButton.addEventListener("click", () => {
      castEditorRows = parseEditorCast(DEFAULT_CAST, []);
      renderCastEditor();
      renderTribeBuilder();
      syncTextareaFromEditor();
      runMeta.textContent = "Testing cast loaded";
      logMeta.textContent = "Testing cast loaded into the simulator";
    });

    startingTribeModeInput.addEventListener("change", () => {
      renderCastEditor();
      renderTribeBuilder();
      if (startingTribeModeInput.value === "random") {
        runMeta.textContent = "Starting tribes will be randomized";
      } else {
        runMeta.textContent = "Starting tribes will use the tribe builder";
      }
    });

    startingTribesInput.addEventListener("input", () => {
      normalizeStartingTribeNameRows();
      renderTribeNameControls();
      renderTribeBuilder();
    });

    startingTribesInput.addEventListener("change", () => {
      enforceStartingTribeLimit(true);
      normalizeStartingTribeNameRows();
      renderTribeNameControls();
      renderTribeBuilder();
    });

    castEditorBody.addEventListener("input", (event) => {
      updateEditorRow(event.target);
    });

    castEditorBody.addEventListener("change", (event) => {
      updateEditorRow(event.target);
    });

    castEditorBody.addEventListener("click", (event) => {
      const clearButton = event.target.closest("button[data-action='clear-photo']");
      if (clearButton) {
        const clearIndex = asInt(clearButton.dataset.index);
        if (clearIndex != null && castEditorRows[clearIndex]) {
          castEditorRows[clearIndex].photo = "";
          renderCastEditor();
          renderTribeBuilder();
          syncTextareaFromEditor();
        }
        return;
      }

      const button = event.target.closest("button[data-action='remove-player']");
      if (!button) {
        return;
      }

      const index = asInt(button.dataset.index);
      if (index == null || !castEditorRows[index]) {
        return;
      }

      castEditorRows.splice(index, 1);
      if (!castEditorRows.length) {
        castEditorRows.push(createEditorRow({ tribe: defaultEditorTribe() }));
      }
      renderCastEditor();
      renderTribeBuilder();
      syncTextareaFromEditor();
    });

    tribeNamesContainer.addEventListener("input", (event) => {
      const input = event.target.closest("input[data-tribe-name-index]");
      if (!input) {
        return;
      }
      const index = asInt(input.dataset.tribeNameIndex);
      if (index == null) {
        return;
      }
      normalizeStartingTribeNameRows();
      startingTribeNameRows[index] = String(input.value || "");
      const labelPreview = tribeBoard.querySelector('[data-tribe-zone-label-index="' + index + '"]');
      if (labelPreview) {
        labelPreview.textContent = startingTribeNameRows[index] || "Auto tribe " + (index + 1);
      }
    });

    tribeNamesContainer.addEventListener("input", (event) => {
      const picker = event.target.closest("input[data-tribe-color-picker-index]");
      const hexInput = event.target.closest("input[data-tribe-color-hex-index]");
      const input = picker || hexInput;
      if (!input) {
        return;
      }
      const index = asInt(input.dataset.tribeColorPickerIndex || input.dataset.tribeColorHexIndex);
      if (index == null) {
        return;
      }
      normalizeStartingTribeNameRows();
      const color = normalizeHexColor(input.value);
      if (hexInput && String(input.value || "").trim() && !color) {
        return;
      }
      startingTribeColorRows[index] = color;
      const peerSelector = picker
        ? 'input[data-tribe-color-hex-index="' + index + '"]'
        : 'input[data-tribe-color-picker-index="' + index + '"]';
      const peer = tribeNamesContainer.querySelector(peerSelector);
      if (peer && peer !== input && color) {
        peer.value = color;
      }
      const zone = tribeBoard.querySelector('[data-drop-tribe="' + (index + 1) + '"]');
      if (zone) {
        zone.style.borderColor = color || distinctTribeColor(index, Math.max(1, asInt(startingTribesInput.value) || 2));
      }
    });

    tribeNamesContainer.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-tribe-name-index]");
      if (!input) {
        return;
      }
      const index = asInt(input.dataset.tribeNameIndex);
      if (index == null) {
        return;
      }
      normalizeStartingTribeNameRows();
      startingTribeNameRows[index] = String(input.value || "").trim();
      renderTribeNameControls();
      renderTribeBuilder();
    });

    tribeNamesContainer.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action='randomize-starting-tribe-name']");
      if (!button) {
        return;
      }
      const index = asInt(button.dataset.tribeNameIndex);
      if (index == null) {
        return;
      }
      normalizeStartingTribeNameRows();
      const used = new Set();
      startingTribeNameRows.forEach((name, nameIndex) => {
        if (nameIndex !== index && String(name || "").trim()) {
          used.add(String(name).trim().toLowerCase());
        }
      });
      startingTribeNameRows[index] = randomTribeName(seededTribeNameRng("starting-" + index), used);
      renderTribeNameControls();
      renderTribeBuilder();
    });

    tribeBoard.addEventListener("dragstart", (event) => {
      const card = event.target.closest(".tribe-card[data-drag-index]");
      if (!card) {
        return;
      }

      draggingTribeIndex = asInt(card.dataset.dragIndex);
      card.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(draggingTribeIndex));
      }
    });

    tribeBoard.addEventListener("dragend", (event) => {
      const card = event.target.closest(".tribe-card");
      if (card) {
        card.classList.remove("dragging");
      }
      draggingTribeIndex = null;
      tribeBoard.querySelectorAll(".tribe-zone.drag-over").forEach((zone) => {
        zone.classList.remove("drag-over");
      });
    });

    tribeBoard.addEventListener("dragover", (event) => {
      const zone = event.target.closest(".tribe-zone[data-drop-tribe]");
      if (!zone || startingTribeModeInput.value === "random") {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      zone.classList.add("drag-over");
    });

    tribeBoard.addEventListener("dragleave", (event) => {
      const zone = event.target.closest(".tribe-zone[data-drop-tribe]");
      if (!zone) {
        return;
      }
      zone.classList.remove("drag-over");
    });

    tribeBoard.addEventListener("drop", (event) => {
      const zone = event.target.closest(".tribe-zone[data-drop-tribe]");
      if (!zone || startingTribeModeInput.value === "random") {
        return;
      }

      event.preventDefault();
      zone.classList.remove("drag-over");
      const index = draggingTribeIndex != null
        ? draggingTribeIndex
        : asInt(event.dataTransfer ? event.dataTransfer.getData("text/plain") : null);
      const tribe = zone.dataset.dropTribe;
      if (index == null || !castEditorRows[index] || !tribe) {
        return;
      }

      castEditorRows[index].tribe = tribe;
      syncTextareaFromEditor();
      renderTribeBuilder();
      runMeta.textContent = castEditorRows[index].name.trim() + " moved to Tribe " + tribe;
    });

    castEditorBody.addEventListener("change", async (event) => {
      const input = event.target;
      if (!input.matches("input[data-field='photo']")) {
        return;
      }

      const index = asInt(input.dataset.index);
      const file = input.files && input.files[0];
      if (index == null || !castEditorRows[index] || !file) {
        return;
      }

      try {
        logMeta.textContent = "Converting " + file.name + " to PNG preview...";
        castEditorRows[index].photo = await convertImageFileToPng(file);
        renderCastEditor();
        renderTribeBuilder();
        syncTextareaFromEditor();
        logMeta.textContent = "Photo saved for " + (castEditorRows[index].name.trim() || "player row " + (index + 1));
      } catch (error) {
        logMeta.textContent = String(error && error.message ? error.message : error);
      }
    });

    resetButton.addEventListener("click", () => {
      setDefaults(DEFAULT_SETTINGS);
      saveSettings(DEFAULT_SETTINGS);
      runSimulation();
    });

    copyButton.addEventListener("click", async () => {
      if (!latestLogText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(latestLogText);
        logMeta.textContent = "Season log copied to clipboard";
      } catch (error) {
        logMeta.textContent = "Clipboard copy was blocked by the browser";
      }
    });

    downloadButton.addEventListener("click", () => {
      if (!latestLogText) {
        return;
      }
      const blob = new Blob([latestLogText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "survivor_simulator_log.txt";
      anchor.click();
      URL.revokeObjectURL(url);
    });

    updateResultsTabAvailability();
    setActiveTab("setupPanel");
    setDefaults(loadSettings());
