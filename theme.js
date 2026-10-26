// ==========================================================================
// AuraGlass — Dynamic Backdrop, Color Extraction, Showcase & Control Center
// ==========================================================================

(function AuraGlassTheme() {
  if (!window.Spicetify || !Spicetify.Player || !document.body) {
    setTimeout(AuraGlassTheme, 250);
    return;
  }

  const STORAGE_KEY = "auraglass_settings_v3";

  const DEFAULT_SETTINGS = {
    colorMode: "dynamic", // "dynamic" | "AuraGlass" | "FrostCyan" | "RoseQuartz" | "EmeraldMist" | "custom"
    customColor: "#8B5CF6",
    fontFamily: "default", // "default" | "modern" | "editorial" | "mono"
    bgBlur: 56,
    bgBrightness: 38,
    panelOpacity: 60,
    borderAlpha: 10,
    liveBackground: true,
    glassHeaders: true,
    vinylMode: true,
    miniEq: true,
    spotlight: true,
    appleLyrics: true,
    floatingPlayer: true,
  };

  const COLOR_PRESETS = {
    AuraGlass: {
      button: "#8B5CF6",
      buttonActive: "#A78BFA",
      misc: "#38BDF8",
      rgbButton: "139, 92, 246",
      rgbButtonActive: "167, 139, 250",
      rgbMisc: "56, 189, 248",
    },
    FrostCyan: {
      button: "#06B6D4",
      buttonActive: "#22D3EE",
      misc: "#38BDF8",
      rgbButton: "6, 182, 212",
      rgbButtonActive: "34, 211, 238",
      rgbMisc: "56, 189, 248",
    },
    RoseQuartz: {
      button: "#EC4899",
      buttonActive: "#F472B6",
      misc: "#F43F5E",
      rgbButton: "236, 72, 153",
      rgbButtonActive: "244, 114, 182",
      rgbMisc: "244, 63, 94",
    },
    EmeraldMist: {
      button: "#10B981",
      buttonActive: "#34D399",
      misc: "#2DD4BF",
      rgbButton: "16, 185, 129",
      rgbButtonActive: "52, 211, 153",
      rgbMisc: "45, 212, 191",
    },
  };

  let settings = loadSettings();
  let lastExtractedColors = COLOR_PRESETS.AuraGlass;

  function loadSettings() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem("auraglass_settings_v2") ||
        localStorage.getItem("auraglass_settings_v1");
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  // ------------------------------------------------------------------------
  // 1. Dual-Layer Blurred Album Art Backdrop + Live Aurora Mesh
  // ------------------------------------------------------------------------
  let bgContainer = document.getElementById("auraglass-bg-container");
  if (!bgContainer) {
    bgContainer = document.createElement("div");
    bgContainer.id = "auraglass-bg-container";

    const layerA = document.createElement("div");
    layerA.className = "auraglass-bg-layer";
    layerA.id = "auraglass-bg-a";
    layerA.style.opacity = "1";

    const layerB = document.createElement("div");
    layerB.className = "auraglass-bg-layer";
    layerB.id = "auraglass-bg-b";
    layerB.style.opacity = "0";

    const aurora = document.createElement("div");
    aurora.id = "auraglass-bg-aurora";

    bgContainer.appendChild(layerA);
    bgContainer.appendChild(layerB);
    bgContainer.appendChild(aurora);
    document.body.prepend(bgContainer);
  } else if (!document.getElementById("auraglass-bg-aurora")) {
    const aurora = document.createElement("div");
    aurora.id = "auraglass-bg-aurora";
    bgContainer.appendChild(aurora);
  }

  let activeLayer = "a";
  let lastArtUrl = "";

  function normalizeSpotifyImageUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return "";
    if (rawUrl.startsWith("spotify:image:")) {
      return "https://i.scdn.co/image/" + rawUrl.replace("spotify:image:", "");
    }
    return rawUrl;
  }

  function getCurrentCoverUrl() {
    const data = Spicetify.Player.data;
    const item = data?.item || data?.track;
    const meta = item?.metadata;

    const raw =
      meta?.image_xlarge_url ||
      meta?.image_large_url ||
      meta?.image_url ||
      item?.images?.[0]?.url ||
      "";

    return normalizeSpotifyImageUrl(raw);
  }

  // ------------------------------------------------------------------------
  // 2. Dominant Color Extractor & Custom Hex Palette Generator
  // ------------------------------------------------------------------------
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function buildPaletteFromHex(hex) {
    const clean = (hex || "#8B5CF6").replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) || 139;
    const g = parseInt(clean.substring(2, 4), 16) || 92;
    const b = parseInt(clean.substring(4, 6), 16) || 246;
    const [h, s, l] = rgbToHsl(r, g, b);
    const mainRgb = [r, g, b];
    const activeRgb = hslToRgb(h, Math.min(100, s + 8), Math.min(82, l + 10));
    const miscRgb = hslToRgb((h + 36) % 360, Math.max(70, s), 62);
    return {
      button: rgbToHex(...mainRgb),
      buttonActive: rgbToHex(...activeRgb),
      misc: rgbToHex(...miscRgb),
      rgbButton: mainRgb.join(", "),
      rgbButtonActive: activeRgb.join(", "),
      rgbMisc: miscRgb.join(", "),
    };
  }

  function extractVibrantPaletteFromImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 36;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;

          const bins = Array.from({ length: 12 }, () => ({
            weight: 0,
            hSum: 0,
            sSum: 0,
          }));

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i],
              g = data[i + 1],
              b = data[i + 2];
            const [h, s, l] = rgbToHsl(r, g, b);
            if (s < 18 || l < 12 || l > 88) continue;
            const weight = (s / 100) * (1 - Math.abs(l - 50) / 50);
            const binIdx = Math.floor(h / 30) % 12;
            bins[binIdx].weight += weight;
            bins[binIdx].hSum += h * weight;
            bins[binIdx].sSum += s * weight;
          }

          let bestBin = bins[0];
          for (const bin of bins) {
            if (bin.weight > bestBin.weight) bestBin = bin;
          }

          if (bestBin.weight <= 0.1) {
            resolve(COLOR_PRESETS.AuraGlass);
            return;
          }

          const avgH = bestBin.hSum / bestBin.weight;
          const boostedS = Math.min(
            92,
            Math.max(72, bestBin.sSum / bestBin.weight + 15)
          );
          const mainRgb = hslToRgb(avgH, boostedS, 60);
          const activeRgb = hslToRgb(avgH, Math.min(96, boostedS + 6), 70);
          const miscRgb = hslToRgb((avgH + 38) % 360, boostedS, 62);

          resolve({
            button: rgbToHex(...mainRgb),
            buttonActive: rgbToHex(...activeRgb),
            misc: rgbToHex(...miscRgb),
            rgbButton: mainRgb.join(", "),
            rgbButtonActive: activeRgb.join(", "),
            rgbMisc: miscRgb.join(", "),
          });
        } catch (err) {
          resolve(COLOR_PRESETS.AuraGlass);
        }
      };
      img.onerror = () => resolve(COLOR_PRESETS.AuraGlass);
      img.src = url;
    });
  }

  function applyColorPalette(palette) {
    if (!palette) return;
    const root = document.documentElement;
    root.style.setProperty("--spice-button", palette.button);
    root.style.setProperty("--spice-button-active", palette.buttonActive);
    root.style.setProperty("--spice-tab-active", palette.button);
    root.style.setProperty("--spice-misc", palette.misc);
    root.style.setProperty("--spice-rgb-button", palette.rgbButton);
    root.style.setProperty("--spice-rgb-button-active", palette.rgbButtonActive);
    root.style.setProperty("--spice-rgb-misc", palette.rgbMisc);
  }

  function applyAllSettings() {
    const root = document.documentElement;
    root.style.setProperty("--auraglass-bg-blur", `${settings.bgBlur}px`);
    root.style.setProperty(
      "--auraglass-bg-brightness",
      (settings.bgBrightness / 100).toFixed(2)
    );
    root.style.setProperty(
      "--auraglass-panel-opacity",
      (settings.panelOpacity / 100).toFixed(2)
    );
    root.style.setProperty(
      "--auraglass-border-alpha",
      (settings.borderAlpha / 100).toFixed(2)
    );

    if (settings.fontFamily && settings.fontFamily !== "default") {
      document.body.setAttribute("data-auraglass-font", settings.fontFamily);
    } else {
      document.body.removeAttribute("data-auraglass-font");
    }

    document.body.classList.toggle(
      "auraglass-disable-live-bg",
      !settings.liveBackground
    );
    document.body.classList.toggle(
      "auraglass-disable-glass-headers",
      !settings.glassHeaders
    );
    document.body.classList.toggle(
      "auraglass-disable-vinyl",
      !settings.vinylMode
    );
    document.body.classList.toggle("auraglass-disable-eq", !settings.miniEq);
    document.body.classList.toggle(
      "auraglass-disable-spotlight",
      !settings.spotlight
    );
    document.body.classList.toggle(
      "auraglass-disable-apple-lyrics",
      !settings.appleLyrics
    );
    document.body.classList.toggle(
      "auraglass-disable-floating-player",
      !settings.floatingPlayer
    );
    document.body.classList.remove("auraglass-zen-mode");

    if (settings.colorMode === "dynamic") {
      applyColorPalette(lastExtractedColors);
    } else if (settings.colorMode === "custom") {
      applyColorPalette(buildPaletteFromHex(settings.customColor));
    } else if (COLOR_PRESETS[settings.colorMode]) {
      applyColorPalette(COLOR_PRESETS[settings.colorMode]);
    }
  }

  // ------------------------------------------------------------------------
  // 3. Mini 4-Bar Animated Equalizer & Fullscreen Showcase Sync
  // ------------------------------------------------------------------------
  function mountMiniEqualizer() {
    if (document.getElementById("auraglass-mini-eq")) return;
    const trackTitleEl =
      document.querySelector('[data-testid="context-item-info-title"]') ||
      document.querySelector(".main-trackInfo-name");
    if (!trackTitleEl) {
      setTimeout(mountMiniEqualizer, 800);
      return;
    }

    const eq = document.createElement("span");
    eq.id = "auraglass-mini-eq";
    eq.innerHTML = `
      <span class="auraglass-eq-bar"></span>
      <span class="auraglass-eq-bar"></span>
      <span class="auraglass-eq-bar"></span>
      <span class="auraglass-eq-bar"></span>
    `;
    trackTitleEl.prepend(eq);
  }

  function updateShowcaseMetadata() {
    const data = Spicetify.Player.data;
    const item = data?.item || data?.track;
    const meta = item?.metadata;
    const artUrl = getCurrentCoverUrl();

    const artEl = document.getElementById("ag-showcase-art");
    const titleEl = document.getElementById("ag-showcase-title");
    const artistEl = document.getElementById("ag-showcase-artist");
    const albumEl = document.getElementById("ag-showcase-album");
    const playBtnEl = document.getElementById("ag-showcase-play");

    if (artEl && artUrl) artEl.src = artUrl;
    if (titleEl)
      titleEl.textContent =
        meta?.title || item?.name || "Reproduciendo en Spotify";
    if (artistEl)
      artistEl.textContent =
        meta?.artist_name || item?.artists?.[0]?.name || "";
    if (albumEl)
      albumEl.textContent = meta?.album_title || item?.album?.name || "";
    if (playBtnEl) {
      playBtnEl.textContent = Spicetify.Player.isPlaying() ? "⏸" : "▶";
    }
  }

  function updatePlayState() {
    try {
      const playing = !!Spicetify.Player.isPlaying();
      document.body.classList.toggle("auraglass-is-playing", playing);
      mountMiniEqualizer();
      const playBtnEl = document.getElementById("ag-showcase-play");
      if (playBtnEl) playBtnEl.textContent = playing ? "⏸" : "▶";
    } catch (e) {}
  }

  async function updateBackdropAndColors() {
    updatePlayState();
    mountMiniEqualizer();
    updateShowcaseMetadata();

    const artUrl = getCurrentCoverUrl();
    if (!artUrl || artUrl === lastArtUrl) return;
    lastArtUrl = artUrl;

    document.documentElement.style.setProperty(
      "--auraglass-art-url",
      `url("${artUrl}")`
    );

    const layerA = document.getElementById("auraglass-bg-a");
    const layerB = document.getElementById("auraglass-bg-b");
    if (layerA && layerB) {
      if (activeLayer === "a") {
        layerB.style.backgroundImage = `url("${artUrl}")`;
        layerB.style.opacity = "1";
        layerA.style.opacity = "0";
        activeLayer = "b";
      } else {
        layerA.style.backgroundImage = `url("${artUrl}")`;
        layerA.style.opacity = "1";
        layerB.style.opacity = "0";
        activeLayer = "a";
      }
    }

    const palette = await extractVibrantPaletteFromImage(artUrl);
    lastExtractedColors = palette;
    if (settings.colorMode === "dynamic") {
      applyColorPalette(palette);
    }
  }

  // ------------------------------------------------------------------------
  // 4. Fullscreen Glass Showcase / Screensaver Mode + Live Progress & Lyrics
  // ------------------------------------------------------------------------
  function formatMs(ms) {
    if (!ms || isNaN(ms) || ms < 0) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function createShowcaseModal() {
    let existing = document.getElementById("auraglass-showcase-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "auraglass-showcase-overlay";
    overlay.innerHTML = `
      <div class="ag-showcase-top">
        <div class="ag-showcase-clock-wrap">
          <div id="ag-showcase-time">00:00</div>
          <div id="ag-showcase-date"></div>
        </div>
        <button id="ag-showcase-close" title="Salir de Showcase (Esc o Alt+S)">✕ Salir de Showcase</button>
      </div>

      <div class="ag-showcase-center">
        <div class="ag-showcase-art-wrap">
          <img id="ag-showcase-art" src="" alt="Cover Art">
        </div>
        <div class="ag-showcase-meta">
          <div class="ag-showcase-badge">✨ AuraGlass Showcase</div>
          <div id="ag-showcase-title">Spotify</div>
          <div id="ag-showcase-artist"></div>
          <div id="ag-showcase-album"></div>
          <div id="ag-showcase-lyric"></div>
          <div class="ag-showcase-progress-wrap">
            <span class="ag-showcase-time-lbl" id="ag-showcase-cur">0:00</span>
            <div id="ag-showcase-bar-track" title="Haz clic para avanzar o retroceder">
              <div id="ag-showcase-bar-fill"></div>
            </div>
            <span class="ag-showcase-time-lbl" id="ag-showcase-dur">0:00</span>
          </div>
          <div class="ag-showcase-controls">
            <button class="ag-showcase-btn" id="ag-showcase-prev" title="Anterior">⏮</button>
            <button class="ag-showcase-btn primary" id="ag-showcase-play" title="Reproducir / Pausar">▶</button>
            <button class="ag-showcase-btn" id="ag-showcase-next" title="Siguiente">⏭</button>
          </div>
        </div>
      </div>

      <div class="ag-showcase-bottom">
        Pulsa <b>Esc</b> o <b>Alt + S</b> en cualquier momento para volver
      </div>
    `;

    document.body.appendChild(overlay);

    function updateClock() {
      const now = new Date();
      const timeEl = document.getElementById("ag-showcase-time");
      const dateEl = document.getElementById("ag-showcase-date");
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }
    }

    function updateShowcaseProgressAndLyric() {
      if (!overlay.classList.contains("auraglass-showcase-open")) return;
      try {
        const cur = Spicetify.Player.getProgress?.() || 0;
        const dur = Spicetify.Player.getDuration?.() || 1;
        const pct = Math.max(0, Math.min(100, (cur / dur) * 100));
        const curEl = document.getElementById("ag-showcase-cur");
        const durEl = document.getElementById("ag-showcase-dur");
        const fillEl = document.getElementById("ag-showcase-bar-fill");
        const lyricEl = document.getElementById("ag-showcase-lyric");

        if (curEl) curEl.textContent = formatMs(cur);
        if (durEl) durEl.textContent = formatMs(dur);
        if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;

        if (lyricEl) {
          const activeLine =
            document.querySelector(".J4_kkGYm5hjbZlztykxr.SOT5gG00YqnGQ4uR7PwQ") ||
            document.querySelector(".lyrics-lyricsContent-active");
          const txt = activeLine?.textContent?.trim() || "";
          if (lyricEl.textContent !== txt) {
            lyricEl.textContent = txt ? `♪ ${txt}` : "";
          }
        }
      } catch (e) {}
    }

    updateClock();
    setInterval(updateClock, 10000);
    setInterval(updateShowcaseProgressAndLyric, 450);

    document
      .getElementById("ag-showcase-bar-track")
      .addEventListener("click", (e) => {
        const track = e.currentTarget;
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width)
        );
        const dur = Spicetify.Player.getDuration?.() || 0;
        if (dur > 0 && Spicetify.Player.seek) {
          Spicetify.Player.seek(Math.floor(dur * ratio));
          setTimeout(updateShowcaseProgressAndLyric, 80);
        }
      });

    document
      .getElementById("ag-showcase-close")
      .addEventListener("click", () => {
        overlay.classList.remove("auraglass-showcase-open");
      });

    document
      .getElementById("ag-showcase-prev")
      .addEventListener("click", () => Spicetify.Player.back());
    document
      .getElementById("ag-showcase-play")
      .addEventListener("click", () => {
        Spicetify.Player.togglePlay();
        setTimeout(updatePlayState, 120);
      });
    document
      .getElementById("ag-showcase-next")
      .addEventListener("click", () => Spicetify.Player.next());
  }

  function toggleShowcase() {
    const overlay = document.getElementById("auraglass-showcase-overlay");
    if (!overlay) return;
    updateShowcaseMetadata();
    overlay.classList.toggle("auraglass-showcase-open");
  }

  // ------------------------------------------------------------------------
  // 5. VisionOS Interactive Card Spotlight Listener
  // ------------------------------------------------------------------------
  document.addEventListener(
    "mousemove",
    (e) => {
      if (!settings.spotlight) return;
      const card = e.target.closest(
        '.main-card-card, div[data-encore-id="card"], .ofahUhwV8VMlglXFA3hw, .gQZ7_Fo8dI0_kP1_UK4V'
      );
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--ag-card-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--ag-card-y", `${e.clientY - rect.top}px`);
    },
    { passive: true }
  );

  // ------------------------------------------------------------------------
  // 6. AuraGlass Live Control Center (Topbar Buttons & Floating Panel)
  // ------------------------------------------------------------------------
  function createControlCenter() {
    let existing = document.getElementById("auraglass-panel-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "auraglass-panel-overlay";
    overlay.innerHTML = `
      <div id="auraglass-panel">
        <div class="auraglass-panel-header">
          <div class="auraglass-panel-title">
            <span>✨ AuraGlass Studio</span>
          </div>
          <button class="auraglass-panel-close" id="auraglass-close-btn" title="Cerrar">✕</button>
        </div>

        <div class="auraglass-section-label">Modo de Color</div>
        <div class="auraglass-presets">
          <button class="auraglass-preset-btn full-width" data-mode="dynamic">
            <span class="auraglass-custom-color-wrap">
              <span class="auraglass-dot" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4, #EC4899);"></span>
              <span>Dinámico (Según Carátula Actual)</span>
            </span>
          </button>
          <button class="auraglass-preset-btn" data-mode="AuraGlass">
            <span class="auraglass-dot" style="background: #8B5CF6;"></span>
            <span>AuraGlass</span>
          </button>
          <button class="auraglass-preset-btn" data-mode="FrostCyan">
            <span class="auraglass-dot" style="background: #06B6D4;"></span>
            <span>FrostCyan</span>
          </button>
          <button class="auraglass-preset-btn" data-mode="RoseQuartz">
            <span class="auraglass-dot" style="background: #EC4899;"></span>
            <span>RoseQuartz</span>
          </button>
          <button class="auraglass-preset-btn" data-mode="EmeraldMist">
            <span class="auraglass-dot" style="background: #10B981;"></span>
            <span>EmeraldMist</span>
          </button>
          <button class="auraglass-preset-btn full-width" data-mode="custom" id="ag-custom-preset-btn">
            <span class="auraglass-custom-color-wrap">
              <span class="auraglass-dot" id="ag-custom-dot" style="background: ${settings.customColor};"></span>
              <span>Color Personalizado en Vivo</span>
            </span>
            <input type="color" id="ag-custom-color-input" value="${settings.customColor}" title="Elige cualquier color">
          </button>
        </div>

        <div class="auraglass-section-label">Tipografía del Tema</div>
        <select class="auraglass-select" id="ag-select-font">
          <option value="default">Spotify Mix (Original)</option>
          <option value="modern">Modern Sans (Segoe UI Variable / Inter)</option>
          <option value="editorial">Editorial Serif (Elegante)</option>
          <option value="mono">Cyber Monospace (Código / Tech)</option>
        </select>

        <div class="auraglass-section-label">Ajustes de Cristal en Vivo</div>

        <div class="auraglass-control-row">
          <div class="auraglass-control-top">
            <span>Desenfoque de Fondo (Blur)</span>
            <span id="ag-val-blur">${settings.bgBlur}px</span>
          </div>
          <input type="range" class="auraglass-slider" id="ag-slider-blur" min="15" max="100" value="${settings.bgBlur}">
        </div>

        <div class="auraglass-control-row">
          <div class="auraglass-control-top">
            <span>Brillo de la Carátula de Fondo</span>
            <span id="ag-val-bright">${settings.bgBrightness}%</span>
          </div>
          <input type="range" class="auraglass-slider" id="ag-slider-bright" min="15" max="75" value="${settings.bgBrightness}">
        </div>

        <div class="auraglass-control-row">
          <div class="auraglass-control-top">
            <span>Opacidad de Paneles de Cristal</span>
            <span id="ag-val-opacity">${settings.panelOpacity}%</span>
          </div>
          <input type="range" class="auraglass-slider" id="ag-slider-opacity" min="20" max="92" value="${settings.panelOpacity}">
        </div>

        <div class="auraglass-control-row">
          <div class="auraglass-control-top">
            <span>Intensidad de Bordes de Cristal</span>
            <span id="ag-val-border">${settings.borderAlpha}%</span>
          </div>
          <input type="range" class="auraglass-slider" id="ag-slider-border" min="0" max="35" value="${settings.borderAlpha}">
        </div>

        <div class="auraglass-section-label">Efectos Especiales</div>

        <div class="auraglass-toggle-row">
          <span>🌊 Fondo Vivo en Movimiento (Apple Music)</span>
          <input type="checkbox" id="ag-toggle-live-bg" ${settings.liveBackground ? "checked" : ""}>
        </div>

        <div class="auraglass-toggle-row">
          <span>🪟 Cabeceras 100% Cristal (Playlists/Álbumes)</span>
          <input type="checkbox" id="ag-toggle-headers" ${settings.glassHeaders ? "checked" : ""}>
        </div>

        <div class="auraglass-toggle-row">
          <span>💿 Disco de Vinilo Giratorio al Reproducir</span>
          <input type="checkbox" id="ag-toggle-vinyl" ${settings.vinylMode ? "checked" : ""}>
        </div>

        <div class="auraglass-toggle-row">
          <span>📊 Mini Ecualizador Animado en Canción</span>
          <input type="checkbox" id="ag-toggle-eq" ${settings.miniEq ? "checked" : ""}>
        </div>

        <div class="auraglass-toggle-row">
          <span>✨ Reflejo Spotlight VisionOS al pasar ratón</span>
          <input type="checkbox" id="ag-toggle-spotlight" ${settings.spotlight ? "checked" : ""}>
        </div>

        <div class="auraglass-toggle-row">
          <span>🎤 Letras estilo Apple Music (Blur & Glow)</span>
          <input type="checkbox" id="ag-toggle-lyrics" ${settings.appleLyrics ? "checked" : ""}>
        </div>

        <div class="auraglass-toggle-row">
          <span>💊 Reproductor Flotante tipo Cápsula</span>
          <input type="checkbox" id="ag-toggle-player" ${settings.floatingPlayer ? "checked" : ""}>
        </div>

        <div class="auraglass-section-label" style="display:flex;justify-content:space-between;align-items:center;">
          <span>🌙 Temporizador de Sueño</span>
          <span id="ag-sleep-status"></span>
        </div>
        <select class="auraglass-select" id="ag-select-sleep">
          <option value="0">Desactivado</option>
          <option value="15">Apagar en 15 minutos</option>
          <option value="30">Apagar en 30 minutos</option>
          <option value="45">Apagar en 45 minutos</option>
          <option value="60">Apagar en 60 minutos</option>
        </select>

        <div class="auraglass-action-grid">
          <button class="auraglass-action-btn" id="ag-btn-export" title="Copia tu configuración actual al portapapeles">📋 Copiar mi Tema</button>
          <button class="auraglass-action-btn" id="ag-btn-import" title="Pega una configuración guardada">📥 Importar Tema</button>
        </div>

        <button class="auraglass-reset-btn" id="auraglass-reset-btn">Restablecer valores por defecto</button>
      </div>
    `;

    document.body.appendChild(overlay);

    function syncPanelUI() {
      overlay.querySelectorAll(".auraglass-preset-btn").forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.getAttribute("data-mode") === settings.colorMode
        );
      });
      document.getElementById("ag-custom-color-input").value =
        settings.customColor;
      document.getElementById("ag-custom-dot").style.background =
        settings.customColor;
      document.getElementById("ag-select-font").value =
        settings.fontFamily || "default";
      document.getElementById("ag-slider-blur").value = settings.bgBlur;
      document.getElementById("ag-val-blur").textContent = `${settings.bgBlur}px`;
      document.getElementById("ag-slider-bright").value = settings.bgBrightness;
      document.getElementById(
        "ag-val-bright"
      ).textContent = `${settings.bgBrightness}%`;
      document.getElementById("ag-slider-opacity").value =
        settings.panelOpacity;
      document.getElementById(
        "ag-val-opacity"
      ).textContent = `${settings.panelOpacity}%`;
      document.getElementById("ag-slider-border").value = settings.borderAlpha;
      document.getElementById(
        "ag-val-border"
      ).textContent = `${settings.borderAlpha}%`;
      document.getElementById("ag-toggle-live-bg").checked =
        settings.liveBackground;
      document.getElementById("ag-toggle-headers").checked =
        settings.glassHeaders;
      document.getElementById("ag-toggle-vinyl").checked = settings.vinylMode;
      document.getElementById("ag-toggle-eq").checked = settings.miniEq;
      document.getElementById("ag-toggle-spotlight").checked =
        settings.spotlight;
      document.getElementById("ag-toggle-lyrics").checked =
        settings.appleLyrics;
      document.getElementById("ag-toggle-player").checked =
        settings.floatingPlayer;
    }

    window.__auraglassSyncUI = syncPanelUI;
    syncPanelUI();

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("auraglass-open");
    });

    document
      .getElementById("auraglass-close-btn")
      .addEventListener("click", () => {
        overlay.classList.remove("auraglass-open");
      });

    overlay.querySelectorAll(".auraglass-preset-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (e.target.id === "ag-custom-color-input") return;
        settings.colorMode = btn.getAttribute("data-mode");
        saveSettings();
        applyAllSettings();
        syncPanelUI();
      });
    });

    document
      .getElementById("ag-custom-color-input")
      .addEventListener("input", (e) => {
        settings.customColor = e.target.value;
        settings.colorMode = "custom";
        saveSettings();
        applyAllSettings();
        syncPanelUI();
      });

    document
      .getElementById("ag-select-font")
      .addEventListener("change", (e) => {
        settings.fontFamily = e.target.value;
        saveSettings();
        applyAllSettings();
      });

    document.getElementById("ag-slider-blur").addEventListener("input", (e) => {
      settings.bgBlur = Number(e.target.value);
      document.getElementById("ag-val-blur").textContent = `${settings.bgBlur}px`;
      saveSettings();
      applyAllSettings();
    });

    document
      .getElementById("ag-slider-bright")
      .addEventListener("input", (e) => {
        settings.bgBrightness = Number(e.target.value);
        document.getElementById(
          "ag-val-bright"
        ).textContent = `${settings.bgBrightness}%`;
        saveSettings();
        applyAllSettings();
      });

    document
      .getElementById("ag-slider-opacity")
      .addEventListener("input", (e) => {
        settings.panelOpacity = Number(e.target.value);
        document.getElementById(
          "ag-val-opacity"
        ).textContent = `${settings.panelOpacity}%`;
        saveSettings();
        applyAllSettings();
      });

    document
      .getElementById("ag-slider-border")
      .addEventListener("input", (e) => {
        settings.borderAlpha = Number(e.target.value);
        document.getElementById(
          "ag-val-border"
        ).textContent = `${settings.borderAlpha}%`;
        saveSettings();
        applyAllSettings();
      });

    document
      .getElementById("ag-toggle-live-bg")
      .addEventListener("change", (e) => {
        settings.liveBackground = e.target.checked;
        saveSettings();
        applyAllSettings();
      });

    document
      .getElementById("ag-toggle-headers")
      .addEventListener("change", (e) => {
        settings.glassHeaders = e.target.checked;
        saveSettings();
        applyAllSettings();
      });

    document
      .getElementById("ag-toggle-vinyl")
      .addEventListener("change", (e) => {
        settings.vinylMode = e.target.checked;
        saveSettings();
        applyAllSettings();
      });

    document.getElementById("ag-toggle-eq").addEventListener("change", (e) => {
      settings.miniEq = e.target.checked;
      saveSettings();
      applyAllSettings();
    });

    document
      .getElementById("ag-toggle-spotlight")
      .addEventListener("change", (e) => {
        settings.spotlight = e.target.checked;
        saveSettings();
        applyAllSettings();
      });

    document
      .getElementById("ag-toggle-lyrics")
      .addEventListener("change", (e) => {
        settings.appleLyrics = e.target.checked;
        saveSettings();
        applyAllSettings();
      });

    document
      .getElementById("ag-toggle-player")
      .addEventListener("change", (e) => {
        settings.floatingPlayer = e.target.checked;
        saveSettings();
        applyAllSettings();
      });

    // Sleep Timer Logic
    let sleepDeadline = 0;
    let sleepInterval = null;
    document
      .getElementById("ag-select-sleep")
      .addEventListener("change", (e) => {
        const mins = Number(e.target.value);
        const statusEl = document.getElementById("ag-sleep-status");
        if (sleepInterval) clearInterval(sleepInterval);
        if (!mins) {
          sleepDeadline = 0;
          if (statusEl) statusEl.textContent = "";
          return;
        }
        sleepDeadline = Date.now() + mins * 60 * 1000;
        const tick = () => {
          const rem = sleepDeadline - Date.now();
          if (rem <= 0) {
            clearInterval(sleepInterval);
            sleepDeadline = 0;
            if (statusEl) statusEl.textContent = "Pausado 🌙";
            document.getElementById("ag-select-sleep").value = "0";
            try {
              Spicetify.Player.pause();
            } catch (err) {}
            return;
          }
          if (statusEl) statusEl.textContent = `⏳ ${formatMs(rem)}`;
        };
        tick();
        sleepInterval = setInterval(tick, 1000);
      });

    // Export / Import Theme Settings
    document.getElementById("ag-btn-export").addEventListener("click", (e) => {
      const btn = e.currentTarget;
      const json = JSON.stringify(settings);
      navigator.clipboard?.writeText(json);
      Spicetify.showNotification?.("✨ Configuración de AuraGlass copiada al portapapeles");
      btn.textContent = "✅ ¡Copiado!";
      setTimeout(() => (btn.textContent = "📋 Copiar mi Tema"), 1800);
    });

    document.getElementById("ag-btn-import").addEventListener("click", () => {
      const raw = window.prompt(
        "Pega aquí el código JSON de configuración de AuraGlass:"
      );
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        settings = { ...DEFAULT_SETTINGS, ...parsed };
        saveSettings();
        applyAllSettings();
        syncPanelUI();
        Spicetify.showNotification?.("✨ Tema AuraGlass importado con éxito");
      } catch (err) {
        Spicetify.showNotification?.("⚠️ Código de tema no válido", true);
      }
    });

    document
      .getElementById("auraglass-reset-btn")
      .addEventListener("click", () => {
        settings = { ...DEFAULT_SETTINGS };
        saveSettings();
        applyAllSettings();
        syncPanelUI();
      });
  }

  function mountTopbarButtons() {
    const oldZenBtn = document.getElementById("auraglass-zen-btn");
    if (oldZenBtn) oldZenBtn.remove();

    const userWidget = document.querySelector(
      'button[data-testid="user-widget-link"]'
    );
    const globalNav =
      userWidget?.parentElement || document.querySelector(".Root__globalNav");
    if (!globalNav) {
      setTimeout(mountTopbarButtons, 600);
      return;
    }

    if (!document.getElementById("auraglass-showcase-btn")) {
      const showBtn = document.createElement("button");
      showBtn.id = "auraglass-showcase-btn";
      showBtn.title = "Modo Salvapantallas / Showcase (Alt + S)";
      showBtn.innerHTML = `<span>🎬 Showcase</span>`;
      showBtn.addEventListener("click", toggleShowcase);
      if (userWidget && userWidget.parentElement) {
        userWidget.parentElement.insertBefore(showBtn, userWidget);
      } else {
        globalNav.appendChild(showBtn);
      }
    }

    if (!document.getElementById("auraglass-topbar-btn")) {
      const btn = document.createElement("button");
      btn.id = "auraglass-topbar-btn";
      btn.title = "Personalizar tema AuraGlass";
      btn.innerHTML = `
        <svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 0 1 5 5c0 1.65-1.35 3-3 3h-.6c-.35 0-.65.28-.65.63 0 .17.07.33.18.45.28.3.47.7.47 1.15 0 .97-.78 1.77-1.75 1.77A6.98 6.98 0 0 1 1 8c0-3.86 3.14-7 7-7zM5.5 6a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm3-1.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm3 2a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z"/></svg>
        <span>AuraGlass</span>
      `;

      btn.addEventListener("click", () => {
        const overlay = document.getElementById("auraglass-panel-overlay");
        if (overlay) overlay.classList.toggle("auraglass-open");
      });

      if (userWidget && userWidget.parentElement) {
        userWidget.parentElement.insertBefore(btn, userWidget);
      } else {
        globalNav.appendChild(btn);
      }
    }
  }

  // Keyboard shortcuts: Alt + S (Showcase), Esc (close Showcase)
  window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      toggleShowcase();
    } else if (e.key === "Escape") {
      const showcase = document.getElementById("auraglass-showcase-overlay");
      if (showcase) showcase.classList.remove("auraglass-showcase-open");
    }
  });

  // Initialize everything
  createShowcaseModal();
  createControlCenter();
  mountTopbarButtons();
  mountMiniEqualizer();
  applyAllSettings();
  updateBackdropAndColors();

  Spicetify.Player.addEventListener("songchange", updateBackdropAndColors);
  Spicetify.Player.addEventListener("onplaypause", updatePlayState);

  setTimeout(updateBackdropAndColors, 1200);
  setTimeout(mountTopbarButtons, 1500);
})();
