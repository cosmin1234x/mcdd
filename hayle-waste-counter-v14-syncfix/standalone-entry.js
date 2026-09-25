import { renderWaste } from "./waste-page.js";

const toastEl = document.getElementById("toast");
let toastTimer = null;

function toast(text) {
  if (!toastEl) return;
  toastEl.textContent = String(text || "");
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
}

async function api(path, options = {}) {
  const url = path === "/api/waste" ? "/api/store" : path;
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({
    ok: false,
    error: `Request failed (${response.status})`,
  }));
  return data;
}

const kit = {
  api,
  toast,
  preview: null,
  normaliseRole(role) {
    return String(role || "").trim().toLowerCase();
  },
};

renderWaste(
  {
    profile: {
      name: "Hayle",
      role: "crew",
    },
  },
  kit,
).catch((error) => {
  console.error("[hayle-waste] failed to start", error);
  const content = document.getElementById("content");
  if (content) {
    content.innerHTML =
      '<div style="max-width:680px;margin:48px auto;padding:24px;background:#fff;border:1px solid #e7e8e0;border-radius:20px"><h1>Waste Counter</h1><p style="margin-top:10px">The counter could not start. Refresh the page and try again.</p></div>';
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
