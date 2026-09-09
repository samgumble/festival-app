const editor = document.getElementById("jsonEditor");
const validation = document.getElementById("validation");

function parseContent() {
  try {
    const value = JSON.parse(editor.value);
    const required = ["meta", "festival", "announcement", "artists", "events", "guide"];
    const missing = required.filter(key => !(key in value));
    if (missing.length) throw new Error(`Missing: ${missing.join(", ")}`);
    if (!Array.isArray(value.artists) || !Array.isArray(value.events)) throw new Error("artists and events must be arrays");
    const artistIds = new Set(value.artists.map(artist => artist.id));
    const orphan = value.events.find(event => !artistIds.has(event.artistId));
    if (orphan) throw new Error(`Event ${orphan.id} references unknown artist ${orphan.artistId}`);
    validation.className = "validation";
    validation.textContent = `✓ Valid · ${value.artists.length} artists · ${value.events.length} scheduled sets · version ${value.meta.contentVersion || "not set"}`;
    return value;
  } catch (error) {
    validation.className = "validation error";
    validation.textContent = `Fix before publishing: ${error.message}`;
    return null;
  }
}

function syncAnnouncementFields(value) {
  document.getElementById("announcementLabel").value = value.announcement?.label || "";
  document.getElementById("announcementMessage").value = value.announcement?.message || "";
  document.getElementById("announcementDate").value = value.announcement?.updated || "";
  document.getElementById("announcementActive").checked = Boolean(value.announcement?.active);
  document.getElementById("announcementUrgent").checked = Boolean(value.announcement?.urgent);
}

fetch("data/content.json").then(response => response.json()).then(value => {
  editor.value = JSON.stringify(value, null, 2); syncAnnouncementFields(value); parseContent();
}).catch(error => { validation.textContent = `Could not load content: ${error.message}`; validation.className = "validation error"; });

editor.addEventListener("input", parseContent);
document.getElementById("formatJson").addEventListener("click", () => { const value = parseContent(); if (value) editor.value = JSON.stringify(value, null, 2); });
document.getElementById("applyAnnouncement").addEventListener("click", () => {
  const value = parseContent(); if (!value) return;
  value.announcement = {
    label: document.getElementById("announcementLabel").value.trim(),
    message: document.getElementById("announcementMessage").value.trim(),
    updated: document.getElementById("announcementDate").value,
    active: document.getElementById("announcementActive").checked,
    urgent: document.getElementById("announcementUrgent").checked
  };
  value.meta.contentVersion = `${value.announcement.updated || new Date().toISOString().slice(0,10)}.${Date.now().toString().slice(-4)}`;
  editor.value = JSON.stringify(value, null, 2); parseContent();
});
document.getElementById("openJson").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return; editor.value = await file.text(); const value = parseContent(); if (value) syncAnnouncementFields(value);
});
document.getElementById("downloadJson").addEventListener("click", () => {
  const value = parseContent(); if (!value) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], {type:"application/json"}));
  const link = Object.assign(document.createElement("a"), {href:url, download:"content.json"}); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.getElementById("copyJson").addEventListener("click", async () => { if (!parseContent()) return; await navigator.clipboard.writeText(editor.value); validation.textContent = "✓ Copied valid JSON to clipboard"; });
