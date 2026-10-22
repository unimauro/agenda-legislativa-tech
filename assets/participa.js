/* Participación ciudadana sin cuenta (api.tunky.net/agenda): votos 👍/👎 por dispositivo, comentarios y propuestas.
   Si la API no responde, `disponible()` devuelve false y las páginas muestran la alternativa con GitHub. */
(function () {
  const API = "https://api.tunky.net/agenda";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let vid = "";
  try { vid = localStorage.getItem("agenda_vid") || ""; if (!vid) { vid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/[^a-zA-Z0-9-]/g, ""); localStorage.setItem("agenda_vid", vid); } } catch (_) { vid = "anon" + Date.now(); }
  const misVotos = () => { try { return JSON.parse(localStorage.getItem("agenda_votos") || "{}"); } catch (_) { return {}; } };
  const guardarVoto = (pid, v) => { try { const m = misVotos(); v ? (m[pid] = v) : delete m[pid]; localStorage.setItem("agenda_votos", JSON.stringify(m)); } catch (_) {} };

  async function pedir(ruta, cuerpo) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
    try {
      const r = await fetch(API + ruta, cuerpo ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), signal: ctl.signal } : { signal: ctl.signal });
      const j = await r.json().catch(() => ({ ok: false, error: "Respuesta inválida." }));
      if (!r.ok && !j.error) j.error = "Error " + r.status;
      return j;
    } catch (e) { return { ok: false, error: "No se pudo conectar. Intenta de nuevo." }; } finally { clearTimeout(t); }
  }
  let _res = null;
  const resumen = () => (_res = _res || pedir("/resumen").then((j) => (j && j.ok ? j : null)));

  function hace(ts) {
    const s = (Date.now() - new Date(ts)) / 1000;
    if (s < 60) return "hace un momento"; if (s < 3600) return `hace ${Math.floor(s / 60)} min`; if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    return new Date(ts).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
  }

  // Widget de votos + comentarios para una propuesta (pid: "IA-07" o "C-12")
  async function montar(el, pid, opts = {}) {
    if (!el) return false;
    const R = await resumen();
    if (!R) { el.hidden = true; return false; }
    el.hidden = false;
    const [up, down] = ((R.votos && R.votos[pid]) || [0, 0]).map((x) => +x || 0);
    const mio = misVotos()[pid] || 0;
    el.innerHTML = `<div class="votos" role="group" aria-label="Apoyo ciudadano">
        <button class="voto up${mio === 1 ? " on" : ""}" data-v="1" aria-pressed="${mio === 1}">👍 Apoyo <b>${up}</b></button>
        <button class="voto down${mio === -1 ? " on" : ""}" data-v="-1" aria-pressed="${mio === -1}">👎 No apoyo <b>${down}</b></button>
        <span class="muted votos-nota">Un voto por dispositivo · sin registro</span></div>
      ${opts.sinComentarios ? "" : `<div class="coms"><h3>Comentarios <span class="muted" data-n></span></h3>
        <form class="com-f"><input name="nombre" maxlength="60" placeholder="Tu nombre o seudónimo (opcional)" autocomplete="nickname">
          <textarea name="texto" maxlength="1000" rows="3" placeholder="¿Qué opinas? ¿Qué le mejorarías?" required></textarea>
          <input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
          <div class="com-acts"><button class="btn" type="submit">Publicar comentario</button><span class="muted com-msg" aria-live="polite"></span></div>
          <p class="muted com-legal">Tu comentario es público. No compartas datos personales tuyos ni de terceros. Se moderan insultos y spam.</p></form>
        <div class="com-list"><p class="muted">Cargando…</p></div></div>`}`;
    el.querySelectorAll(".voto").forEach((b) => (b.onclick = async () => {
      const v = +b.dataset.v, nuevo = (misVotos()[pid] || 0) === v ? 0 : v;
      el.querySelectorAll(".voto").forEach((x) => (x.disabled = true));
      const j = await pedir("/voto", { pid, valor: nuevo, vid });
      el.querySelectorAll(".voto").forEach((x) => (x.disabled = false));
      if (!j.ok) return alertaSuave(el, j.error);
      guardarVoto(pid, nuevo);
      el.querySelector(".up b").textContent = +j.up || 0; el.querySelector(".down b").textContent = +j.down || 0;
      el.querySelectorAll(".voto").forEach((x) => { const on = +x.dataset.v === nuevo; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
    }));
    if (opts.sinComentarios) return true;
    const lista = el.querySelector(".com-list"), form = el.querySelector(".com-f"), msg = el.querySelector(".com-msg");
    const item = (c) => `<div class="cm" data-id="${+c.id}"><b>${esc(c.nombre || "Anónimo")}</b> <span class="muted">· ${hace(c.ts)}</span><p>${esc(c.texto)}</p>`;
    const pintar = (cs) => {
      el.querySelector("[data-n]").textContent = cs.length ? `(${cs.length})` : "";
      const raiz = cs.filter((c) => !c.parent).reverse(), hijos = {};
      cs.filter((c) => c.parent).forEach((c) => (hijos[c.parent] = hijos[c.parent] || []).push(c));
      lista.innerHTML = raiz.length ? raiz.map((c) => item(c) +
          `<div class="hilo">${(hijos[c.id] || []).map((r) => item(r) + "</div>").join("")}</div>` +
          `<button class="chip responder" data-r="${+c.id}">↩ Responder</button></div>`).join("")
        : `<p class="muted">Aún no hay comentarios. ¡Sé la primera persona en opinar!</p>`;
    };
    lista.addEventListener("click", (ev) => {
      const b = ev.target.closest(".responder"); if (!b) return;
      if (b.nextElementSibling && b.nextElementSibling.classList.contains("resp-f")) return b.nextElementSibling.remove();
      b.insertAdjacentHTML("afterend", `<form class="com-f resp-f"><input name="nombre" maxlength="60" placeholder="Tu nombre o seudónimo (opcional)">
        <textarea name="texto" maxlength="1000" rows="2" placeholder="Tu respuesta…" required></textarea><input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        <div class="com-acts"><button class="btn" type="submit">Responder</button><span class="muted com-msg" aria-live="polite"></span></div></form>`);
      const rf = b.nextElementSibling;
      rf.onsubmit = async (e) => {
        e.preventDefault(); const f = new FormData(rf), m = rf.querySelector(".com-msg"); m.textContent = "Publicando…";
        const j = await pedir("/comentario", { pid, parent: +b.dataset.r, nombre: f.get("nombre"), texto: f.get("texto"), website: f.get("website"), vid });
        if (!j.ok) { m.textContent = "⚠️ " + j.error; return; }
        cargar();
      };
    });
    const cargar = async () => { const j = await pedir("/comentarios?pid=" + encodeURIComponent(pid)); pintar(j.ok ? j.comentarios : []); };
    cargar();
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const f = new FormData(form), btn = form.querySelector("button");
      btn.disabled = true; msg.textContent = "Publicando…";
      const j = await pedir("/comentario", { pid, nombre: f.get("nombre"), texto: f.get("texto"), website: f.get("website"), vid });
      btn.disabled = false;
      if (!j.ok) { msg.textContent = "⚠️ " + j.error; return; }
      msg.textContent = "✅ ¡Gracias! Tu comentario ya es visible."; form.reset(); cargar();
    };
    return true;
  }
  function alertaSuave(el, t) { let n = el.querySelector(".votos-nota"); if (n) { n.textContent = "⚠️ " + t; setTimeout(() => (n.textContent = "Un voto por dispositivo · sin registro"), 4000); } }

  window.Participa = {
    API, vid, esc, hace, pedir, resumen, montar,
    disponible: async () => !!(await resumen()),
    proponer: (d) => pedir("/propuesta", d),
    propuestas: () => pedir("/propuestas"),
    recientes: () => pedir("/comentarios"),
    temas: () => pedir("/temas"),
    abrirTema: (d) => pedir("/tema", d),
  };
})();
