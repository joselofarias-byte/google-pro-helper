/* popup.js */
const LABELS = { off: "Desactivado", "12m": "12 meses", "6m_ss": "6 meses (SS)", "6m": "6 meses", "6m_2": "6 meses (reserva)" };
const stateEl = document.getElementById("state");

function paintState(st) {
  const layer = (st && st.layer) || "off";
  const mounted = !!(st && st.mounted) && layer !== "off";
  stateEl.className = mounted ? "ok" : "warn";
  stateEl.textContent = mounted
    ? "Extensión activa: " + (LABELS[layer] || layer) + " — revisá las condiciones de la oferta"
    : "No se detecta la extensión en esta página. Abrí one.google.com/plans y actualizá.";
}

function queryTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const t = tabs && tabs[0];
    if (!t) return paintState(null);
    chrome.tabs.sendMessage(t.id, { type: "getState" }, (resp) => {
      if (chrome.runtime.lastError || !resp) return paintState(null);
      paintState(resp);
    });
  });
}

chrome.storage.local.get(["gapt_layer"], (r) => {
  const layer = (r && r.gapt_layer) || "off";
  document.querySelectorAll('input[name="layer"]').forEach((el) => {
    el.checked = el.value === layer;
    el.addEventListener("change", () => {
      if (!el.checked) return;
      chrome.storage.local.set({ gapt_layer: el.value }, () => {
        // Actualizar la pestaña activa
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const t = tabs && tabs[0];
          if (!t) return queryTab();
          chrome.tabs.sendMessage(t.id, { type: "setLayer", layer: el.value }, () => {
            void chrome.runtime.lastError;
            setTimeout(queryTab, 350);
          });
        });
      });
    });
  });
  queryTab();
  setTimeout(queryTab, 800);
});

setInterval(queryTab, 1500);
