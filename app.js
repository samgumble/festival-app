const STORAGE = {
  favorites: "bb26:favorites",
  plan: "bb26:plan",
  content: "bb26:content",
  settings: "bb26:settings"
};

const state = {
  content: null,
  favorites: new Set(JSON.parse(localStorage.getItem(STORAGE.favorites) || "[]")),
  plan: JSON.parse(localStorage.getItem(STORAGE.plan) || "null"),
  day: "All",
  query: "",
  moods: new Set(["favorites"]),
  pace: "full",
  installPrompt: null,
  shareFile: null,
  shareUrl: null,
  lastFavoriteId: null,
  bound: false,
  posterMotionReady: false
};

if (state.plan) {
  state.pace = state.plan.pace || "full";
  state.moods = new Set(state.plan.moods?.length ? state.plan.moods : ["favorites"]);
}

const days = ["Friday", "Saturday", "Sunday"];
const heartIcon = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/></svg>`;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}

function timeValue(time) {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}

function artistFor(id) { return state.content.artists.find(artist => artist.id === id); }
function eventsFor(id) { return state.content.events.filter(event => event.artistId === id); }
function firstEventFor(id) { return eventsFor(id).sort((a,b) => days.indexOf(a.day) - days.indexOf(b.day) || timeValue(a.start) - timeValue(b.start))[0]; }
function initials(name) { return name.replace(/^(The |[“”'’.])/, "").split(/\s+/).slice(0,2).map(word => word[0]).join(""); }

async function loadContent() {
  const cached = localStorage.getItem(STORAGE.content);
  if (cached) {
    try { state.content = JSON.parse(cached); } catch (_) { /* ignore invalid cache */ }
  }
  try {
    const response = await fetch("data/content.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Content fetch failed");
    state.content = await response.json();
    localStorage.setItem(STORAGE.content, JSON.stringify(state.content));
  } catch (error) {
    if (!state.content) throw error;
    showToast("Offline — showing your saved festival guide");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function navigate(route) {
  const next = document.querySelector(`[data-view="${route}"]`);
  if (!next) return;
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view === next));
  document.querySelectorAll(".app-nav [data-route]").forEach(button => {
    const active = button.dataset.route === route;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  history.replaceState(null, "", `#${route}`);
  window.scrollTo({ top: 0, behavior: "auto" });
  const heading = next.querySelector("h1");
  heading?.setAttribute("tabindex", "-1");
  heading?.focus({ preventScroll: true });
  if (route === "plan") syncPlanToInputs();
}

function favoriteButton(id, label) {
  const active = state.favorites.has(id);
  const recent = state.lastFavoriteId === id ? "favorite-pop" : "";
  return `<button class="favorite-button ${active ? "active" : ""} ${recent}" data-favorite="${escapeHTML(id)}" aria-label="${active ? "Remove" : "Add"} ${escapeHTML(label)} ${active ? "from" : "to"} favorites" aria-pressed="${active}">${heartIcon}</button>`;
}

function toggleFavorite(id) {
  const artist = artistFor(id);
  if (!artist) return;
  state.lastFavoriteId = id;
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast(`${artist.name} removed`);
  } else {
    state.favorites.add(id);
    showToast(`${artist.name} added to your weekend`);
  }
  localStorage.setItem(STORAGE.favorites, JSON.stringify([...state.favorites]));
  invalidateSharePreview();
  updateFavoriteUI();
  renderHome();
  renderLineup();
  syncPlanToInputs({ announce: true });
  window.setTimeout(() => {
    state.lastFavoriteId = null;
    document.querySelectorAll(".favorite-pop").forEach(button => button.classList.remove("favorite-pop"));
  }, 360);
}

function updateFavoriteUI() {
  const count = state.favorites.size;
  document.getElementById("favoriteCount").textContent = `${count} ${count === 1 ? "pick" : "picks"}`;
  document.querySelectorAll("[data-favorite-count]").forEach(badge => {
    badge.textContent = count;
    badge.hidden = count === 0;
    badge.classList.remove("count-pop");
    if (count) requestAnimationFrame(() => badge.classList.add("count-pop"));
  });
  const featureCount = document.getElementById("featureFavoriteCount");
  if (featureCount) featureCount.textContent = count ? `${count} artist${count === 1 ? "" : "s"} saved` : "Start your weekend";
}

function renderAnnouncement() {
  const item = state.content.announcement;
  document.getElementById("announcementHero").innerHTML = item?.active ? `
    <div class="announcement ${item.urgent ? "urgent" : ""}">
      <span class="pulse"></span>
      <div><strong>${escapeHTML(item.label)}</strong><span>${escapeHTML(item.message)}</span></div>
    </div>` : "";
}

function renderHome() {
  const fullLineup = state.content.artists;
  document.getElementById("homeArtists").innerHTML = fullLineup.map(artist => {
    const event = firstEventFor(artist.id);
    return `<article class="artist-card ${artist.color}">
      ${favoriteButton(artist.id, artist.name)}
      <span class="time-pill">${event ? `${escapeHTML(event.day.toUpperCase())} · ${escapeHTML(event.start)}` : "OFFICIAL 2026 LINEUP"}</span>
      <h3>${escapeHTML(artist.name)}</h3>
      <p>${event ? `${escapeHTML(event.stage)} · ${escapeHTML(event.date)}` : "Schedule not listed"}</p>
    </article>`;
  }).join("");
}

function renderFilters() {
  document.getElementById("dayFilters").innerHTML = ["All", ...days].map(day =>
    `<button class="chip ${state.day === day ? "selected" : ""}" data-day="${day}" aria-pressed="${state.day === day}">${day}</button>`
  ).join("");
}

function renderLineup() {
  if (!state.content) return;
  renderFilters();
  const query = state.query.trim().toLowerCase();
  const artists = state.content.artists.filter(artist => {
    const matchesQuery = !query || artist.name.toLowerCase().includes(query);
    const matchesDay = state.day === "All" || eventsFor(artist.id).some(event => event.day === state.day);
    return matchesQuery && matchesDay;
  });
  const groups = state.day === "All" ? ["Headliners", "Full 2026 lineup"] : [state.day];
  const seen = new Set();
  let html = "";
  groups.forEach(group => {
    let groupArtists;
    if (group === "Headliners") groupArtists = artists.filter(artist => artist.tier === "headliner");
    else if (group === "Full 2026 lineup") groupArtists = artists.filter(artist => artist.tier !== "headliner");
    else groupArtists = artists.sort((a,b) => timeValue(firstEventFor(a.id)?.start || "11:59 PM") - timeValue(firstEventFor(b.id)?.start || "11:59 PM"));
    groupArtists = groupArtists.filter(artist => !seen.has(artist.id) && seen.add(artist.id));
    if (!groupArtists.length) return;
    html += `<div class="day-divider">${escapeHTML(group.toUpperCase())}</div>`;
    html += groupArtists.map(artist => {
      const allEvents = eventsFor(artist.id);
      const relevant = allEvents.find(event => state.day === "All" || event.day === state.day) || allEvents[0];
      const detail = relevant ? `${relevant.day} · ${relevant.start} · ${relevant.stage}${allEvents.length > 1 ? ` · ${allEvents.length} sets` : ""}` : "Official lineup · schedule not listed";
      return `<article class="artist-row">
        <div class="artist-mark ${artist.color}" aria-hidden="true">${escapeHTML(initials(artist.name))}</div>
        <div class="artist-details"><h3>${escapeHTML(artist.name)}</h3><p>${escapeHTML(detail)}</p></div>
        ${favoriteButton(artist.id, artist.name)}
      </article>`;
    }).join("");
  });
  document.getElementById("artistList").innerHTML = html;
  document.getElementById("lineupEmpty").hidden = artists.length > 0;
  document.getElementById("lineupResultCount").textContent = `${artists.length} artist${artists.length === 1 ? "" : "s"}${state.day === "All" ? "" : ` · ${state.day}`}`;
  document.getElementById("clearFilters").hidden = !query && state.day === "All";
}

function renderInfo() {
  document.getElementById("infoCards").innerHTML = state.content.guide.map(item => `
    <article class="info-card"><span class="info-icon">${escapeHTML(item.icon)}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p></article>
  `).join("");
  const container = document.getElementById("infoCards");
  const survival = document.createElement("article");
  survival.className = "info-card survival-card";
  survival.innerHTML = `<span class="info-icon">☀</span><h3>Offline survival mode</h3><p>${state.content.survival.map(tip => `• ${escapeHTML(tip)}`).join("<br><br>")}</p>`;
  container.append(survival);
  document.getElementById("faqList").innerHTML = (state.content.faq || []).map((item, index) => `
    <details class="faq-item" ${index === 0 ? "open" : ""}><summary>${escapeHTML(item.question)}<span aria-hidden="true">+</span></summary><div><p>${escapeHTML(item.answer)}</p>${item.source ? `<a href="${escapeHTML(item.source)}" target="_blank" rel="noopener">Official details ↗</a>` : ""}</div></details>
  `).join("");
}

function getCandidateEvents() {
  const favoriteEvents = state.content.events.filter(event => state.favorites.has(event.artistId));
  let candidates = favoriteEvents;
  if (state.moods.has("headliners")) candidates = candidates.filter(event => artistFor(event.artistId)?.tier === "headliner" || event.stage === "Main Stage");
  if (state.moods.has("side-stages")) candidates = [...candidates].sort((a,b) => (a.stage === "Main Stage") - (b.stage === "Main Stage"));
  if (state.moods.has("stay-central")) candidates = candidates.filter(event => ["Main Stage", "Blues Stage"].includes(event.stage));
  return candidates;
}

function resolveConflicts(events) {
  const selected = [];
  const conflicts = [];
  const byDay = Object.groupBy ? Object.groupBy(events, event => event.day) : events.reduce((map,event) => ((map[event.day] ||= []).push(event), map), {});
  days.forEach(day => {
    let dayEvents = (byDay[day] || []).sort((a,b) => timeValue(a.start) - timeValue(b.start));
    if (state.pace === "easy") dayEvents = dayEvents.filter((event,index) => index % 2 === 0 || artistFor(event.artistId)?.tier === "headliner");
    dayEvents.forEach(event => {
      const overlap = selected.find(pick => pick.day === event.day && timeValue(event.start) < timeValue(pick.end) && timeValue(event.end) > timeValue(pick.start));
      if (!overlap) selected.push(event);
      else {
        const eventScore = (artistFor(event.artistId)?.tier === "headliner" ? 3 : 0) + (event.stage === "Main Stage" ? 2 : 0);
        const overlapScore = (artistFor(overlap.artistId)?.tier === "headliner" ? 3 : 0) + (overlap.stage === "Main Stage" ? 2 : 0);
        if (eventScore > overlapScore) {
          selected.splice(selected.indexOf(overlap), 1, event);
          conflicts.push({ kept: event, skipped: overlap });
        } else conflicts.push({ kept: overlap, skipped: event });
      }
    });
  });
  return { selected: selected.sort((a,b) => days.indexOf(a.day) - days.indexOf(b.day) || timeValue(a.start) - timeValue(b.start)), conflicts };
}

function syncPlanToInputs({ announce = false } = {}) {
  if (!state.content) return;
  const status = document.getElementById("planAutoStatus");
  if (!state.favorites.size) {
    state.plan = null;
    localStorage.removeItem(STORAGE.plan);
    renderPlan();
    if (status) status.textContent = "Your schedule will appear as soon as you save an artist.";
    return;
  }
  const result = resolveConflicts(getCandidateEvents());
  const eventIds = result.selected.map(event => event.id);
  const sourceSignature = JSON.stringify({
    favorites: [...state.favorites].sort(),
    moods: [...state.moods].sort(),
    pace: state.pace,
    eventIds
  });
  const changed = state.plan?.sourceSignature !== sourceSignature;
  state.plan = {
    eventIds,
    conflicts: result.conflicts.length,
    builtAt: changed ? new Date().toISOString() : state.plan.builtAt,
    pace: state.pace,
    moods: [...state.moods],
    sourceSignature
  };
  localStorage.setItem(STORAGE.plan, JSON.stringify(state.plan));
  renderPlan();
  if (status) {
    const sets = eventIds.length;
    status.textContent = `${announce && changed ? "Schedule updated" : "Schedule in sync"} automatically · ${sets} ${sets === 1 ? "set" : "sets"}`;
  }
}

function renderPlan() {
  if (!state.content) return;
  updateFavoriteUI();
  const result = document.getElementById("planResults");
  const selectedEvents = state.plan ? state.plan.eventIds.map(id => state.content.events.find(event => event.id === id)).filter(Boolean) : [];
  if (!selectedEvents.length) {
    const hasPublishedSets = state.content.events.some(event => state.favorites.has(event.artistId));
    result.innerHTML = !state.favorites.size
      ? `<div class="plan-empty"><div class="empty-art">♡ ✦ ♫</div><h3>Your weekend starts here</h3><p>Heart artists in the lineup and their conflict-aware schedule will appear here automatically, ready without cell service.</p><button class="text-button" data-route="lineup">Choose artists →</button></div>`
      : hasPublishedSets
        ? `<div class="plan-empty"><div class="empty-art">♡ ✦ ♫</div><h3>No sets fit these choices</h3><p>Your favorites are safe. Show all your picks to restore the full personalized schedule.</p><button class="text-button" id="showAllPicks">Show all my picks →</button></div>`
        : `<div class="plan-empty"><div class="empty-art">♡ ✦ ♫</div><h3>Set times coming soon</h3><p>Your favorites are saved. Their schedule will appear automatically when published times are available.</p><button class="text-button" data-route="lineup">Edit favorite artists →</button></div>`;
    return;
  }
  const now = new Date();
  const next = getNextEvent(selectedEvents, now);
  let html = `<div class="plan-summary"><span>✦</span><div><h3>${selectedEvents.length} ${selectedEvents.length === 1 ? "set" : "sets"}, zero double-bookings</h3><p>${state.plan.conflicts ? `${state.plan.conflicts} conflict${state.plan.conflicts === 1 ? "" : "s"} resolved around your priorities.` : "Your favorites fit together cleanly."}</p></div></div>`;
  if (next) html += `<div class="next-up-card"><p class="eyebrow ink">WHAT SHOULD I SEE NEXT?</p><h3>${escapeHTML(artistFor(next.artistId).name)}</h3><p>${escapeHTML(next.day)} at ${escapeHTML(next.start)} · ${escapeHTML(next.stage)}</p><small>${next.reason}</small></div>`;
  days.forEach(day => {
    const events = selectedEvents.filter(event => event.day === day);
    if (!events.length) return;
    html += `<div class="schedule-day"><h3>${day.toUpperCase()} · ${events[0].date}</h3>`;
    html += events.map(event => `<article class="schedule-item"><div class="schedule-time">${escapeHTML(event.start)}</div><div class="timeline"></div><div class="schedule-info"><h4>${escapeHTML(artistFor(event.artistId).name)}</h4><p>${escapeHTML(event.stage)} · until ${escapeHTML(event.end)}</p><div class="schedule-tools"><button data-remind="${event.id}">Remind me</button><button data-calendar="${event.id}">Add to calendar</button></div></div></article>`).join("");
    html += `</div>`;
  });
  html += `<div class="plan-actions"><button class="primary-button" id="shareLineup">Share my festival picks · ${state.favorites.size} <span>↗</span></button><button class="text-button" data-route="lineup">Edit favorite artists</button></div>`;
  result.innerHTML = html;
}

function getNextEvent(events, now) {
  const festivalStart = new Date("2026-09-18T00:00:00-06:00");
  if (now < festivalStart) {
    const event = events[0];
    return event ? {...event, reason: "First up in your saved festival flow."} : null;
  }
  const dates = {Friday:"2026-09-18", Saturday:"2026-09-19", Sunday:"2026-09-20"};
  return events.map(event => ({...event, when: new Date(`${dates[event.day]}T${to24Hour(event.start)}:00-06:00`)})).find(event => event.when > now) || null;
}

function to24Hour(time) {
  const minutes = timeValue(time);
  return `${String(Math.floor(minutes / 60)).padStart(2,"0")}:${String(minutes % 60).padStart(2,"0")}`;
}

function eventDate(event) {
  const dates = {Friday:"2026-09-18", Saturday:"2026-09-19", Sunday:"2026-09-20"};
  return new Date(`${dates[event.day]}T${to24Hour(event.start)}:00-06:00`);
}

async function setReminder(eventId) {
  const event = state.content.events.find(item => item.id === eventId);
  const artist = artistFor(event?.artistId);
  if (!event || !artist) return;
  const at = new Date(eventDate(event).getTime() - 15 * 60 * 1000);
  if (at <= new Date()) return showToast("This set has already started");
  const notifications = window.Capacitor?.Plugins?.LocalNotifications;
  if (!window.Capacitor?.isNativePlatform?.() || !notifications) {
    addToCalendar(eventId, "Add this set to your calendar for a reliable reminder.");
    return;
  }
  const permission = await notifications.requestPermissions();
  if (permission.display !== "granted") return showToast("Notifications are off — the app still works normally");
  const id = [...event.id].reduce((hash,char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
  await notifications.schedule({notifications:[{id,title:`${artist.name} in 15 minutes`,body:`Head to ${event.stage}.`,schedule:{at},extra:{eventId:event.id}}]});
  showToast("Set reminder saved on this device");
}

async function addToCalendar(eventId, fallbackMessage) {
  const event = state.content.events.find(item => item.id === eventId);
  const artist = artistFor(event?.artistId);
  if (!event || !artist) return;
  const start = eventDate(event);
  const end = new Date(start.getTime() + (timeValue(event.end) - timeValue(event.start)) * 60000);
  const format = date => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SBG Productions//Blues and Brews 2026//EN","BEGIN:VEVENT",`UID:${event.id}@tellurideblues.com`,`DTSTAMP:${format(new Date())}`,`DTSTART:${format(start)}`,`DTEND:${format(end)}`,`SUMMARY:${artist.name.replace(/,/g,"\\,")}`,`LOCATION:${event.stage.replace(/,/g,"\\,")}, Telluride Blues & Brews Festival`,"DESCRIPTION:Official 2026 schedule. Times are subject to change.","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const blob = new Blob([ics], {type:"text/calendar"});
  const file = new File([blob], `${event.id}.ics`, {type:"text/calendar"});
  if (navigator.canShare?.({files:[file]})) {
    try { await navigator.share({files:[file],title:`${artist.name} at Blues & Brews`}); return; } catch (error) { if (error.name === "AbortError") return; }
  }
  const link = Object.assign(document.createElement("a"), {href:URL.createObjectURL(blob),download:file.name}); link.click(); setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  showToast(fallbackMessage || "Calendar event downloaded");
}

async function createShareImage() {
  if (!state.favorites.size) return showToast("Choose artists before sharing");
  const button = document.getElementById("shareLineup");
  const original = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.innerHTML = "Building poster… <span>✦</span>";
  }
  try {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    const poster = await loadImage("assets/poster-source-preview.png");
    ctx.drawImage(poster, 0, 0, 1080, 1890, 0, 0, 1080, 1920);
    restorePosterLineupArea(ctx, poster);
    ctx.save();
    ctx.fillStyle = "#24236f"; ctx.textAlign = "center"; ctx.font = "30px 'Michroma', sans-serif";
    ctx.fillText("MY FESTIVAL PICKS", 540, 1420);
    ctx.restore();
    const selectedArtists = state.content.artists.filter(artist => state.favorites.has(artist.id));
    drawLineupNames(ctx, selectedArtists, 1450, 1788);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Poster encoding failed");
    state.shareFile = new File([blob], "my-blues-and-brews-festival-picks.png", { type: "image/png" });
    if (state.shareUrl) URL.revokeObjectURL(state.shareUrl);
    state.shareUrl = URL.createObjectURL(blob);
    document.getElementById("sharePreviewImage").src = state.shareUrl;
    document.getElementById("shareDialog").showModal();
  } catch (error) {
    console.error(error);
    showToast("Poster couldn’t be built. Try again.");
  } finally {
    if (button?.isConnected) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.innerHTML = original;
    }
  }
}

async function shareGeneratedImage() {
  const file = state.shareFile;
  if (!file) return;
  const nativePlugins = window.Capacitor?.Plugins;
  if (window.Capacitor?.isNativePlatform?.() && nativePlugins?.Filesystem && nativePlugins?.Share) {
    const base64 = await blobToBase64(file);
    const saved = await nativePlugins.Filesystem.writeFile({ path: file.name, data: base64, directory: "CACHE" });
    await nativePlugins.Share.share({ title: "My Blues & Brews festival picks", text: "My festival picks for Telluride Blues & Brews 2026.", url: saved.uri, dialogTitle: "Share my festival picks" });
    return;
  }
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "My Blues & Brews festival picks", text: "My festival picks for Telluride Blues & Brews 2026." }); return; } catch (error) { if (error.name === "AbortError") return; }
  }
  const link = document.createElement("a");
  link.href = state.shareUrl; link.download = file.name; link.click();
  showToast("Lineup graphic saved");
}

function invalidateSharePreview() {
  state.shareFile = null;
  if (state.shareUrl) URL.revokeObjectURL(state.shareUrl);
  state.shareUrl = null;
  const dialog = document.getElementById("shareDialog");
  if (dialog?.open) dialog.close();
}

function restorePosterLineupArea(ctx, poster) {
  const left = 40, top = 1358, width = 1000, height = 450;
  const pixels = ctx.getImageData(left, top, width, height).data;
  const paperColors = [];
  let red = 0, green = 0, blue = 0;
  for (let index = 0; index < pixels.length; index += 64) {
    const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
    if (r > 145 && g > 120 && b > 85 && r + g + b > 450) {
      paperColors.push([r,g,b]); red += r; green += g; blue += b;
    }
  }
  const count = paperColors.length || 1;
  const paper = `rgb(${Math.round(red/count)},${Math.round(green/count)},${Math.round(blue/count)})`;
  const feather = ctx.createLinearGradient(0, top - 22, 0, top);
  feather.addColorStop(0, "rgba(232,215,181,0)"); feather.addColorStop(1, paper);
  ctx.fillStyle = feather; ctx.fillRect(left, top - 22, width, 22);
  ctx.fillStyle = paper;
  ctx.fillRect(left, top, width, height);
  let seed = 2026;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.save(); ctx.globalAlpha = .24;
  for (let dot = 0; dot < 26000; dot += 1) {
    const color = paperColors[Math.floor(random() * paperColors.length)] || [215,198,164];
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(left + random() * width, top + random() * height, random() > .85 ? 2 : 1, random() > .9 ? 2 : 1);
  }
  ctx.restore();
  const scaleY = 1920 / poster.height;
  ctx.drawImage(poster, 270, 1225, 540, 125, 270, 1225 * scaleY, 540, 125 * scaleY);
  ctx.drawImage(poster, 0, 0, 40, poster.height, 0, 0, 40, 1920);
  ctx.drawImage(poster, 1040, 0, 40, poster.height, 1040, 0, 40, 1920);
}

function drawLineupNames(ctx, artists, top, bottom) {
  let baseSize = artists.length <= 8 ? 46 : 27;
  const makeLines = size => {
    ctx.font = `${size}px 'Archivo Black', sans-serif`;
    if (artists.length <= 8) return artists.map(artist => ({text:artist.name.toUpperCase(), headliner:artist.tier === "headliner"}));
    const lines = []; let text = ""; let headliner = true;
    artists.forEach(artist => {
      const name = artist.name.toUpperCase();
      const next = text ? `${text} ★ ${name}` : name;
      if (text && ctx.measureText(next).width > 930) { lines.push({text,headliner}); text = name; headliner = artist.tier === "headliner"; }
      else { text = next; headliner = headliner && artist.tier === "headliner"; }
    });
    if (text) lines.push({text,headliner});
    return lines;
  };
  let lines = makeLines(baseSize);
  const totalHeight = () => lines.reduce((height,line) => height + baseSize * (line.headliner ? 1.42 : 1.2), 0);
  while (baseSize > 16 && totalHeight() > bottom - top) { baseSize -= 1; lines = makeLines(baseSize); }
  let y = top;
  ctx.textAlign = "center";
  lines.forEach(line => {
    const size = line.headliner ? baseSize * 1.13 : baseSize;
    ctx.font = `${size}px 'Archivo Black', sans-serif`; ctx.fillStyle = line.headliner ? "#24236f" : "#191630";
    ctx.fillText(line.text, 540, y + size); y += baseSize * (line.headliner ? 1.42 : 1.2);
  });
}

function loadImage(src) { return new Promise((resolve,reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
function blobToBase64(blob) { return new Promise(resolve => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result.split(",")[1]); reader.readAsDataURL(blob); }); }
function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(" "); const lines = []; let line = "";
  words.forEach(word => { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; });
  if (line) lines.push(line); return lines;
}

function bindEvents() {
  if (state.bound) return;
  state.bound = true;
  document.addEventListener("click", event => {
    const route = event.target.closest("[data-route]")?.dataset.route;
    if (route) navigate(route);
    const favorite = event.target.closest("[data-favorite]")?.dataset.favorite;
    if (favorite) toggleFavorite(favorite);
    const day = event.target.closest("[data-day]")?.dataset.day;
    if (day) { state.day = day; renderLineup(); }
    if (event.target.closest("#clearFilters") || event.target.closest("#emptyClearFilters")) {
      state.day = "All";
      state.query = "";
      document.getElementById("artistSearch").value = "";
      renderLineup();
      document.getElementById("artistSearch").focus();
    }
    const mood = event.target.closest("[data-mood]")?.dataset.mood;
    if (mood) {
      if (mood === "favorites") state.moods = new Set(["favorites"]);
      else { state.moods.delete("favorites"); state.moods.has(mood) ? state.moods.delete(mood) : state.moods.add(mood); }
      renderMoodChips();
      syncPlanToInputs({ announce: true });
    }
    const pace = event.target.closest("[data-pace]")?.dataset.pace;
    if (pace) {
      state.pace = pace;
      document.querySelectorAll("[data-pace]").forEach(button => {
        const selected = button.dataset.pace === pace;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", selected);
      });
      syncPlanToInputs({ announce: true });
    }
    if (event.target.closest("#showAllPicks")) {
      state.moods = new Set(["favorites"]);
      renderMoodChips();
      syncPlanToInputs({ announce: true });
    }
    if (event.target.closest("#shareLineup")) createShareImage();
    if (event.target.closest("#shareGeneratedImage")) shareGeneratedImage();
    if (event.target.closest("#closeShareDialog")) document.getElementById("shareDialog").close();
    if (event.target.closest("#retryGuide")) init();
    const reminderId = event.target.closest("[data-remind]")?.dataset.remind;
    if (reminderId) setReminder(reminderId);
    const calendarId = event.target.closest("[data-calendar]")?.dataset.calendar;
    if (calendarId) addToCalendar(calendarId);
  });
  document.getElementById("artistSearch").addEventListener("input", event => { state.query = event.target.value; renderLineup(); });
  window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.installPrompt = event; document.getElementById("installButton").hidden = false; });
  document.getElementById("installButton").addEventListener("click", async () => { await state.installPrompt?.prompt(); state.installPrompt = null; document.getElementById("installButton").hidden = true; });
  const updateNetwork = () => {
    const status = document.getElementById("networkStatus");
    status.hidden = navigator.onLine;
    status.textContent = "Offline · guide saved";
    if (!navigator.onLine) showToast("Offline — your saved guide is ready");
  };
  window.addEventListener("online", updateNetwork); window.addEventListener("offline", updateNetwork); updateNetwork();
  window.addEventListener("hashchange", () => navigate(location.hash.slice(1) || "home"));
  window.addEventListener("storage", event => {
    if (event.key !== STORAGE.favorites) return;
    try {
      state.favorites = new Set(JSON.parse(event.newValue || "[]"));
      invalidateSharePreview();
      updateFavoriteUI();
      renderHome();
      renderLineup();
      syncPlanToInputs({ announce: true });
    } catch (_) { /* ignore invalid cross-tab state */ }
  });
}

function renderMoodChips() {
  const moods = [
    ["favorites", "All my picks"], ["headliners", "Big-stage energy"], ["side-stages", "Explore side stages"], ["stay-central", "Stay in Town Park"]
  ];
  document.getElementById("moodChips").innerHTML = moods.map(([id,label]) => `<button class="chip ${state.moods.has(id) ? "selected" : ""}" data-mood="${id}" aria-pressed="${state.moods.has(id)}">${label}</button>`).join("");
}

function setupPosterAssembly() {
  if (state.posterMotionReady) return;
  state.posterMotionReady = true;
  const hero = document.querySelector(".hero-card");
  const art = document.getElementById("heroArt");
  if (!hero || !art) return;
  const poster = new Image();
  poster.onerror = () => {
    art.hidden = true;
    hero.style.setProperty("--assembly-offset", "0px");
  };
  poster.src = "assets/poster-source-preview.png";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const useStatic = () => reduced.matches || window.innerWidth < 360 || Boolean(navigator.connection?.saveData);
  let queued = false;
  const update = () => {
    queued = false;
    if (useStatic()) {
      hero.style.setProperty("--assembly-offset", "0px");
      return;
    }
    const range = Math.min(260, hero.offsetHeight * .48);
    const progress = Math.min(1, Math.max(0, window.scrollY / range));
    hero.style.setProperty("--assembly-offset", `${((1 - progress) * 24).toFixed(2)}px`);
  };
  const requestUpdate = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  reduced.addEventListener?.("change", requestUpdate);
  update();
}

async function init() {
  bindEvents();
  const boot = document.getElementById("bootStatus");
  document.body.classList.add("app-loading");
  boot.hidden = false;
  boot.innerHTML = `<span class="boot-mark" aria-hidden="true">✦</span><div><strong>Tuning the festival guide…</strong><p>Loading the official 2026 lineup and your saved picks.</p></div>`;
  try {
    await loadContent();
    renderAnnouncement(); renderHome(); renderLineup(); renderInfo(); renderMoodChips(); updateFavoriteUI();
    document.querySelectorAll("[data-pace]").forEach(button => {
      const selected = button.dataset.pace === state.pace;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected);
    });
    syncPlanToInputs();
    document.body.classList.remove("app-loading");
    boot.hidden = true;
    setupPosterAssembly();
    navigate(location.hash.slice(1) || "home");
    registerServiceWorker();
  } catch (error) {
    boot.innerHTML = `<div class="empty-state"><span>↻</span><h3>Festival guide unavailable</h3><p>Reconnect once to save the guide for offline use.</p><button class="primary-button inline-button" id="retryGuide">Try again</button></div>`;
    console.error(error);
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
  const notice = document.getElementById("updateNotice");
  const showUpdate = worker => {
    notice.hidden = false;
    document.getElementById("applyUpdate").onclick = () => worker.postMessage({type:"SKIP_WAITING"});
  };
  if (registration.waiting) showUpdate(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker);
    });
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
  registration.update().catch(() => {});
}

init();
