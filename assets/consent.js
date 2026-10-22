/* Analítica solo con consentimiento (Ley 29733): GA4 no se carga hasta que la persona acepta. */
(function () {
  const ID = "G-YKRRVYDYQ8", KEY = "agenda_consent";
  let v = null; try { v = localStorage.getItem(KEY); } catch (_) {}
  function cargarGA() {
    const s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", ID, { anonymize_ip: true });
  }
  if (v === "si") return cargarGA();
  if (v === "no") return;
  const raiz = location.pathname.includes("/p/") ? "../" : "";
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("div");
    b.className = "consent"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Preferencias de privacidad");
    b.innerHTML = 'Usamos analítica anónima (Google Analytics) para saber qué propuestas interesan más. ¿La aceptas? <a href="' + raiz + 'privacidad.html">Privacidad</a>' +
      '<span><button class="btn" data-c="si">Aceptar</button><button class="btn ghost" data-c="no">No, gracias</button></span>';
    b.onclick = (e) => { const c = e.target.dataset && e.target.dataset.c; if (!c) return; try { localStorage.setItem(KEY, c); } catch (_) {} b.remove(); if (c === "si") cargarGA(); };
    document.body.appendChild(b);
  });
})();
