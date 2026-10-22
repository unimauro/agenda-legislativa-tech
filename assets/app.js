(async function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const json = (u) => fetch(u, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const PAGE = document.body.dataset.page;
  const count = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});

  // ---- común: tema, menú móvil, apoyo, compartir
  let onTheme = () => {};
  $("#theme").onclick = () => {
    const r = document.documentElement;
    const cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    r.dataset.theme = cur === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", r.dataset.theme); } catch (_) {}
    onTheme();
  };
  const navBtn = $("#nav-btn"), navM = $("#nav-m");
  navBtn.onclick = () => { navM.hidden = !navM.hidden; navBtn.setAttribute("aria-expanded", !navM.hidden); };
  const yb = $("#yape-btn"), ybox = $("#yape-box");
  yb.onclick = () => yb.setAttribute("aria-expanded", ybox.classList.toggle("on"));
  const url = location.origin + location.pathname;
  const txt = "Agenda Legislativa Tech Perú 2026–2031: propuestas de ley en tecnología, redactadas y listas para comisión";
  $("#sh-x").href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(txt) + "&url=" + encodeURIComponent(url);
  $("#sh-wa").href = "https://wa.me/?text=" + encodeURIComponent(txt + " " + url);
  $("#sh-in").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
  $("#sh-fb").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
  $("#sh-copy").onclick = async (ev) => { try { await navigator.clipboard.writeText(url); ev.target.textContent = "✅ Copiado"; } catch (_) { ev.target.textContent = url; } };

  // ---- datos livianos (todas las páginas) + prioridad (si existe)
  // portada y visión: resumen liviano (home.json); listados: índice completo; buscador/asistente: índice perezoso
  const LIVIANO = PAGE === "index" || PAGE === "vision";
  const [D, PRfull, H] = await Promise.all([LIVIANO ? null : json("data/indice.json"), PAGE === "vision" ? json("data/prioridad.json") : null, LIVIANO ? json("data/home.json") : null]);
  if (!D && !H) return;
  const EJES = (D || H).meta.ejes, PLAN = D ? D.plan2050 : {};
  let P = D ? D.propuestas : H.nodos.map(([id, eje, titulo_corto, prioridad, costo_fiscal]) => ({ id, eje, titulo_corto, prioridad, costo_fiscal }));
  const PR = PRfull || (H && Object.keys(H.score).length ? { ranking: Object.entries(H.score).map(([id, score]) => ({ id, score })), aristas: H.aristas,
    olas: Object.fromEntries(Object.entries(H.olas).map(([k, o]) => [k, { nombre: o.nombre, ids: Object.keys(H.ola).filter((i) => H.ola[i] === k) }])) } : null);
  const ejeById = Object.fromEntries(EJES.map((e) => [e.id, e]));
  let byId = Object.fromEntries(P.map((p) => [p.id, p]));
  let FULL = D ? D.propuestas : null;
  const cargarIndice = async () => { if (!FULL) { const d = await json("data/indice.json"); FULL = d ? d.propuestas : []; prep(FULL); } return FULL; };
  const score = Object.fromEntries(((PR && PR.ranking) || []).map((r) => [r.id, r.score]));
  const ola = {};
  Object.entries((PR && PR.olas) || {}).forEach(([k, o]) => (o.ids || []).forEach((id) => (ola[id] = k)));
  $("#upd").textContent = (D || H).meta.actualizado;
  const L = (p) => `<a href="p/${p.id}.html"><b>${p.id}</b></a> ${esc(p.titulo_corto)}`;
  const ejeTag = (p) => `<span class="pid" style="color:${ejeById[p.eje].color}">${esc(p.id)}</span>`;

  // ---- buscador (índice + texto completo perezoso)
  let TX = null;
  function prep(L) { L.forEach((p) => { p._t = norm([p.id, p.titulo, p.titulo_corto].join(" ")); p._s = norm([p.sumilla, (p.tags || []).join(" "), (p.arts || []).join(" "), (p.ent || []).map((e) => e[0]).join(" ")].join(" ")); }); }
  if (FULL) prep(FULL);
  const cargarTexto = async () => { const L = await cargarIndice(); if (!TX) { const t = await json("data/texto.json"); TX = {}; L.forEach((p) => (TX[p.id] = { raw: (t && t[p.id]) || "", n: norm((t && t[p.id]) || "") })); } return TX; };
  const STOP = new Set("de la el los las y o a en que con por para del un una se su sus es al lo como mas sobre hay cual cuales me mi te tu le les esta este estas estos ley leyes propuesta propuestas proponen propone ayudaria ayuda quien quienes cuanto cuesta costaria algo alguna alguno tema temas dime quiero saber".split(" "));
  const SINON = { robo: ["hurto", "imei", "sustraccion"], celular: ["movil", "imei", "linea", "sim"], celulares: ["movil", "imei", "linea", "sim"],
    estafa: ["fraude", "suplantacion"], estafas: ["fraude", "suplantacion"], internet: ["banda", "conectividad"], colegio: ["escuela", "educacion"],
    colegios: ["escuela", "educacion"], hospital: ["salud", "establecimiento"], trabajo: ["empleo", "laboral"], chamba: ["empleo", "laboral"],
    hackeo: ["ciberataque", "incidente"], virus: ["ransomware", "malware"], ninos: ["menores", "adolescentes"] };
  const palabras = (q) => norm(q).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const raiz = (w) => (w.length > 5 ? w.slice(0, -2) : w);
  function buscar(q, k = 12) {
    const ws = palabras(q).flatMap((w) => [w, ...(SINON[w] || [])]);
    if (!ws.length) return [];
    return (FULL || []).map((p) => {
      let sc = 0;
      for (const w of ws) {
        const r = raiz(w);
        if (p._t.includes(r)) sc += 6;
        if (p._s.includes(r)) sc += 3;
        if (TX) sc += Math.min(TX[p.id].n.split(r).length - 1, 6);
      }
      return { p, sc };
    }).filter((x) => x.sc >= 2).sort((a, b) => b.sc - a.sc).slice(0, k);
  }
  function snippet(p, q) {
    const raw = TX ? TX[p.id].raw : p.sumilla, n = norm(raw), ws = palabras(q);
    let i = -1;
    for (const w of ws) { i = n.indexOf(raiz(w)); if (i >= 0) break; }
    const a = Math.max(0, i - 70);
    let h = esc(raw.slice(a, a + 200));
    for (const w of ws) h = h.replace(new RegExp("(" + raiz(w).replace(/[^a-z0-9ñ]/g, "") + "[a-záéíóúñ]*)", "gi"), "<mark>$1</mark>");
    return (a ? "… " : "") + h + " …";
  }
  const gq = $("#gq");
  if (gq) {
    const gres = $("#gres");
    let gt;
    gq.addEventListener("focus", cargarTexto, { once: true });
    gq.addEventListener("input", () => {
      clearTimeout(gt);
      gt = setTimeout(async () => {
        await cargarTexto();
        const r = buscar(gq.value);
        gres.hidden = !gq.value.trim();
        gres.innerHTML = r.length ? r.map(({ p }) => `<a class="gr" href="p/${esc(p.id)}.html" style="--eje:${ejeById[p.eje].color}"><span class="pid">${esc(p.id)}</span><b>${esc(p.titulo_corto)}</b><small>${snippet(p, gq.value)}</small></a>`).join("")
          : `<p class="muted" style="padding:10px">Sin coincidencias. Prueba otras palabras o pregúntale al asistente 💬</p>`;
      }, 150);
    });
  }

  // ---- asistente ciudadano (sin IA externa)
  const chat = $("#chat"), fab = $("#chat-fab"), log = $("#chat-log");
  const abrir = (on) => { chat.hidden = !on; fab.setAttribute("aria-expanded", on); fab.hidden = on; if (on) { cargarTexto(); $("#chat-q").focus(); } };
  fab.onclick = () => abrir(true); $("#chat-x").onclick = () => abrir(false);
  const add = (cls, html) => { log.insertAdjacentHTML("beforeend", `<div class="msg ${cls}">${html}</div>`); log.scrollTop = log.scrollHeight; };
  const corto = (t, n = 180) => { t = String(t || ""); return esc(t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t); };
  let ultimo = null;
  function responder(q) {
    const nq = norm(q);
    const idm = q.toUpperCase().match(/\b(IA|CIB|GOB|CON|ECO|TAL|SOB|DER)-?(\d{1,2})\b/);
    const F = Object.fromEntries((FULL || []).map((p) => [p.id, p]));
    let foco = idm ? F[`${idm[1]}-${idm[2].padStart(2, "0")}`] : null;
    if (/propong|proponer|mi propia|mi idea|registrar/.test(nq)) return 'Puedes proponer tu propia ley en <a href="ciudadania.html">Ciudadanía → Propón una ley</a>: queda registrada, se revisa y, si procede, se incorpora a la agenda.';
    if (/present|tramit|congresista|diputad|senad|firmas|como se aprueba/.test(nq) && !idm)
      return 'Se presenta en la <b>Cámara de Diputados</b> (un diputado, el Ejecutivo o con firmas ciudadanas: 0.3% del padrón), va a comisión (hasta 60 días hábiles), al Pleno y luego al <b>Senado</b>. Paso a paso en <a href="tramite.html">Cómo se tramita</a>.';
    if (/urgent|primero|priori|crecer|crecimiento|import/.test(nq) && !idm && Object.keys(score).length) {
      const t = (FULL || []).filter((p) => ola[p.id] === Object.keys(PR.olas)[0]).sort((a, b) => (score[b.id] || 0) - (score[a.id] || 0)).slice(0, 6);
      return `Para liderar el crecimiento al 2036, el panel prospectivo recomienda empezar por:<br>${t.map((p) => "• " + L(p)).join("<br>")}<br>Detalle en <a href="vision.html">Visión 2036</a>.`;
    }
    if (/(no|nada|cero|sin)\s.*(cuest|cost|gast)|gratis|costo nulo/.test(nq)) {
      const n = (FULL || []).filter((p) => p.costo_fiscal === "nulo");
      return `${n.length} propuestas tienen <b>costo fiscal nulo</b>. Algunas:<br>` + n.slice(0, 6).map((p) => "• " + L(p)).join("<br>") + '<br>Fíltralas en <a href="propuestas.html">Propuestas</a>.';
    }
    const r = buscar(q, 4);
    if (!foco && r.length && (r.length === 1 || r[0].sc >= r[1].sc * 1.6)) foco = r[0].p;
    const INTENT = /cuest|cost|gast|presupuest|plata|dinero|financ|quien|entidad|implement|ejecut|encarg|supervis|responsable|benefic|ayuda|sirve|gana|norma|modific|deroga/;
    if (!foco && ultimo && INTENT.test(nq) && palabras(q).length <= 3) foco = ultimo;
    if (!foco && !r.length) return "No encontré una propuesta sobre eso 🤔. Prueba otras palabras («internet rural», «estafas», «startups») o <a href=\"ciudadania.html\">propón tu propia ley</a>.";
    if (foco) {
      ultimo = foco;
      const ip = foco.imp || {};
      if (/cuest|cost|gast|presupuest|plata|dinero|financ/.test(nq))
        return `${L(foco)}: costo fiscal <b>${esc(foco.costo_fiscal)}</b>${ip.costo ? ` — ${esc(ip.costo)}. Se financia: ${esc(String(ip.fin || "").replace(/\.+$/, ""))}` : ""}.`;
      if (/benefic|ayuda|sirve|gana|gente|ciudadan/.test(nq)) return `${L(foco)} beneficia a: ${esc(foco.benef || ip.bs || foco.sumilla)}`;
      if (/quien|entidad|implement|ejecut|encarg|supervis|responsable/.test(nq) && foco.ent.length)
        return `${L(foco)} la implementarían:<br>` + foco.ent.slice(0, 8).map((x) => `• <b>${esc(x[0])}</b> (${esc(x[1])})`).join("<br>");
      if (/norma|modific|deroga|ley vigente/.test(nq) && foco.normas.length)
        return `${L(foco)} cambia estas normas:<br>` + foco.normas.map((n) => `• ${esc(n[0])}, ${esc(n[1])} — ${esc(n[2])}`).join("<br>");
      return `${L(foco)}<br>${corto(foco.sumilla, 260)}<br><span class="muted">Comisión: ${esc(foco.comision_sugerida)} · Costo ${esc(foco.costo_fiscal)}</span><br>Pregúntame <i>¿cuánto cuesta?</i>, <i>¿quién la implementa?</i> o <i>¿a quién beneficia?</i>`;
    }
    ultimo = r[0].p;
    return "Encontré estas propuestas relacionadas:<br>" + r.map(({ p }) => `• ${L(p)} — ${corto(p.sumilla, 110)}`).join("<br>") + `<br>Pregúntame por una (por ejemplo «${r[0].p.id} ¿cuánto cuesta?»).`;
  }
  // Respuesta con IA (api.tunky.net/agenda/chat: el servidor busca las propuestas y llama al modelo); si falla, modo sin IA.
  const HIST = [];
  const enlazar = (t) => esc(String(t).replace(/^\s*#{1,6}\s*/gm, "").replace(/^\s*>\s?/gm, "").replace(/^\s*[*-]\s+/gm, "• ")).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\b((?:IA|CIB|GOB|CON|ECO|TAL|SOB|DER)-\d{2})\b/g, (m) => `<a href="p/${m}.html"><b>${m}</b></a>`)
    .replace(/(^|\s)#(tramite|ciudadania|foro|vision)\b/g, (_, a, k) => `${a}<a href="${k}.html">${k}</a>`).replace(/\n/g, "<br>");
  async function preguntaIA(q) {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 32000);
      const r = await fetch("https://api.tunky.net/agenda/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q, hist: HIST.slice(-4) }), signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json();
      return j && j.ok && j.reply ? j.reply : null;
    } catch (_) { return null; }
  }
  const preguntar = async (q) => {
    add("user", esc(q)); document.getElementById("chat-sug")?.remove();
    log.insertAdjacentHTML("beforeend", `<div class="msg bot escribiendo" aria-label="Escribiendo"><span></span><span></span><span></span></div>`); log.scrollTop = log.scrollHeight;
    const [ia] = await Promise.all([preguntaIA(q), cargarTexto()]);
    log.querySelector(".escribiendo")?.remove();
    if (ia) { add("bot", enlazar(ia)); HIST.push({ r: "u", t: q }, { r: "a", t: ia }); }
    else add("bot", responder(q));
  };
  $("#chat-f").onsubmit = (ev) => { ev.preventDefault(); const q = $("#chat-q").value.trim(); if (q) { $("#chat-q").value = ""; preguntar(q); } };
  log.addEventListener("click", (ev) => { const b = ev.target.closest("#chat-sug .chip"); if (b) preguntar(b.textContent); });
  if (location.hash === "#chat") abrir(true);

  // ---- tarjeta de propuesta (listados)
  function card(p) {
    const e = ejeById[p.eje], ip = p.imp || {};
    const plan = p.plan2050.map((c) => PLAN[c] ? `<a class="chip" href="${esc(PLAN[c].url)}" target="_blank" rel="noopener">Plan 2050 · ${esc(PLAN[c].nombre)}</a>` : "").join("");
    const aten = p.aten[1] ? `<span class="pill ver-conforme">✓ ${p.aten[0]}/${p.aten[1]} observaciones atendidas</span>` : `<span class="pill">Borrador sin revisión</span>`;
    const sc = score[p.id] != null ? `<span class="pill sc">Visión 2036: ${Math.round(score[p.id])}</span>` : "";
    return `<details class="prop" style="--eje:${e.color}" id="${esc(p.id)}">
      <summary><span class="pid">${esc(p.id)}</span>
        <div><h3>${esc(p.titulo)}</h3><p class="sum">${esc(p.sumilla)}</p>
          <div class="tagline"><span class="pill prio-${esc(p.prioridad)}">Prioridad ${esc(p.prioridad)}</span><span class="pill">Costo ${esc(p.costo_fiscal)}</span>${sc}${aten}</div></div>
        <span class="chev">▶</span></summary>
      <div class="body">
        <h4>El problema</h4><p>${esc(p.problema)}</p>
        <h4>Articulado (${p.arts.length} artículos)</h4><ol>${p.arts.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
        ${p.imp ? `<h4>Impacto estimado</h4><p><b>${esc(ip.tipo)}</b> · Costo para el Estado: ${esc(ip.costo || "—")}${ip.bs ? ` · Beneficio: ${esc(ip.bs)}` : ""}</p>` : ""}
        ${p.ent.length ? `<h4>Quién hace qué</h4><p>${p.ent.map((x) => `<span class="pill">${esc(x[0])} · ${esc(x[1])}</span>`).join(" ")}</p>` : ""}
        <h4>Meta 2031</h4><p>${esc(p.indicador_exito)}</p>
        <div class="chips">${plan}</div>
        <div class="acts"><a class="btn" href="p/${esc(p.id)}.html">Leer completo</a>
          <a class="btn ghost" href="pdf/${esc(p.id)}.pdf" download>⬇️ PDF</a><a class="btn ghost" href="docx/${esc(p.id)}.docx" download>📝 Word</a>
          <a class="btn ghost" href="p/${esc(p.id)}.html#comentarios">💬 Opinar</a></div>
      </div></details>`;
  }

  // ================= páginas =================
  if (PAGE === "index") {
    const m = H.meta;
    $("#kpis").innerHTML = [[P.length, "propuestas de ley"], [m.n_articulos, "artículos redactados"], [m.n_normas, "normas vigentes que se modifican"],
      [m.n_entidades, "entidades implicadas"], [Math.round((100 * H.kpi.nulo) / P.length) + "%", "sin costo fiscal"],
      [H.kpi.revisadas, "revisadas por 5 especialidades"]].map(([b, s]) => `<div class="kpi"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("");
    const ICON = { ia: "🧠", ciber: "🛡️", gob: "🏛️", conect: "📡", econ: "🚀", talento: "🎓", sober: "⚙️", derechos: "⚖️" };
    $("#ejes-grid").innerHTML = EJES.filter((e) => P.some((p) => p.eje === e.id)).map((e) => {
      const ps = P.filter((p) => p.eje === e.id);
      return `<a class="eje-card" href="propuestas.html#eje=${e.id}" style="--c:${e.color}"><span class="ic">${ICON[e.id] || "•"}</span><b>${esc(e.nombre)}</b><small>${ps.length} propuestas · ${ps.filter((p) => p.costo_fiscal === "nulo").length} sin costo</small><em>${ps.slice(0, 3).map((p) => esc(p.titulo_corto)).join(" · ")}</em></a>`;
    }).join("");
    const top = Object.keys(score).length
      ? P.filter((p) => !Object.keys(ola).length || ola[p.id] === Object.keys(PR.olas)[0]).sort((a, b) => (score[b.id] || 0) - (score[a.id] || 0)).slice(0, 8)
      : P.filter((p) => p.prioridad === "alta" && p.costo_fiscal === "nulo").slice(0, 8);
    if (!Object.keys(score).length) $("#top-sub").textContent = "Mientras el panel prospectivo termina, estas son las de prioridad alta y costo nulo.";
    $("#top-list").innerHTML = top.map((p, i) => `<a class="top-i" href="p/${p.id}.html" style="--c:${ejeById[p.eje].color}"><span class="n">${i + 1}</span><div><b>${esc(p.titulo_corto)}</b><small>${esc(p.id)} · ${esc(ejeById[p.eje].nombre)}${score[p.id] != null ? ` · ${Math.round(score[p.id])} pts` : ""}</small></div></a>`).join("");
    if (window.Esfera) window.Esfera.mini($("#esfera-mini"), P, EJES, PR);
  }

  if (PAGE === "propuestas") {
    const st = { eje: (location.hash.match(/eje=(\w+)/) || [])[1] || "", q: "", com: "", prio: "", costo: "", orden: "" };
    $("#eje-pills").innerHTML = `<button class="eje-pill${st.eje ? "" : " on"}" data-eje=""><i></i>Todos</button>` +
      EJES.filter((e) => P.some((p) => p.eje === e.id)).map((e) => `<button class="eje-pill${st.eje === e.id ? " on" : ""}" data-eje="${e.id}" style="--c:${e.color}"><i></i>${esc(e.nombre)} (${P.filter((p) => p.eje === e.id).length})</button>`).join("");
    $("#eje-pills").onclick = (ev) => {
      const b = ev.target.closest(".eje-pill"); if (!b) return;
      st.eje = b.dataset.eje; history.replaceState(null, "", st.eje ? "#eje=" + st.eje : location.pathname);
      document.querySelectorAll(".eje-pill").forEach((x) => x.classList.toggle("on", x === b)); render();
    };
    Object.keys(count(P, (p) => p.comision_sugerida)).sort().forEach((c) => $("#f-com").insertAdjacentHTML("beforeend", `<option>${esc(c)}</option>`));
    if (!Object.keys(score).length) $("#f-orden").hidden = true;
    const bind = (id, k) => $(id).addEventListener("input", (ev) => { st[k] = ev.target.value; render(); });
    bind("#q", "q"); bind("#f-com", "com"); bind("#f-prio", "prio"); bind("#f-costo", "costo"); bind("#f-orden", "orden");
    function render() {
      const q = palabras(st.q);
      let f = P.filter((p) => (!st.eje || p.eje === st.eje) && (!st.com || p.comision_sugerida === st.com) && (!st.prio || p.prioridad === st.prio) &&
        (!st.costo || p.costo_fiscal === st.costo) && q.every((w) => (p._t + " " + p._s).includes(raiz(w))));
      if (st.orden === "score") f = f.slice().sort((a, b) => (score[b.id] || 0) - (score[a.id] || 0));
      $("#count").textContent = `${f.length} de ${P.length} propuestas`;
      lista = f; mostrados = 0; $("#plist").innerHTML = f.length ? "" : `<p class="muted">Sin resultados con esos filtros.</p>`; mas();
    }
    let lista = [], mostrados = 0;
    const centinela = document.createElement("div"); centinela.className = "centinela"; $("#plist").after(centinela);
    function mas() {
      const lote = lista.slice(mostrados, mostrados + 20); mostrados += lote.length;
      $("#plist").insertAdjacentHTML("beforeend", lote.map(card).join(""));
      centinela.innerHTML = mostrados < lista.length ? `<button class="btn ghost">Ver más (${lista.length - mostrados} restantes)</button>` : "";
      const b = centinela.querySelector("button"); if (b) b.onclick = mas;
      pintarVotos();
    }
    new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && mostrados < lista.length && mas()), { rootMargin: "600px" }).observe(centinela);
    let RES = null;
    async function pintarVotos() {
      if (!window.Participa) return;
      RES = RES || (await Participa.resumen()); if (!RES) return;
      document.querySelectorAll("#plist .prop:not([data-v])").forEach((d) => {
        d.dataset.v = 1; const [u, n] = (RES.votos || {})[d.id] || [0, 0], c = (RES.comentarios || {})[d.id] || 0;
        if (u || n || c) d.querySelector(".tagline").insertAdjacentHTML("beforeend", `<span class="pill">👍 ${u} · 👎 ${n} · 💬 ${c}</span>`);
      });
    }
    render();
    const h = location.hash.slice(1);
    if (byId[h]) { while (!document.getElementById(h) && mostrados < lista.length) mas(); const d = document.getElementById(h); if (d) { d.open = true; d.scrollIntoView(); } }
  }

  if (PAGE === "panorama") {
    const comisiones = count(P, (p) => p.comision_sugerida);
    const charts = [];
    function dibujar() {
      if (!window.Chart) return;
      charts.splice(0).forEach((c) => c.destroy());
      const css = getComputedStyle(document.documentElement);
      Chart.defaults.color = css.getPropertyValue("--muted").trim(); Chart.defaults.borderColor = css.getPropertyValue("--border").trim();
      Chart.defaults.font.family = "Inter, system-ui, sans-serif";
      const opt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
      const ej = EJES.filter((e) => P.some((p) => p.eje === e.id));
      charts.push(new Chart($("#ch-eje"), { type: "bar", data: { labels: ej.map((e) => e.nombre), datasets: [{ data: ej.map((e) => P.filter((p) => p.eje === e.id).length), backgroundColor: ej.map((e) => e.color), borderRadius: 6 }] }, options: { ...opt, indexAxis: "y" } }));
      const cs = Object.entries(comisiones).sort((a, b) => b[1] - a[1]);
      charts.push(new Chart($("#ch-com"), { type: "bar", data: { labels: cs.map((c) => (c[0].length > 38 ? c[0].slice(0, 36) + "…" : c[0])), datasets: [{ data: cs.map((c) => c[1]), backgroundColor: css.getPropertyValue("--accent2").trim(), borderRadius: 6 }] }, options: { ...opt, indexAxis: "y" } }));
      const ods = count(P.flatMap((p) => p.ods.map(String)), (x) => x), ok = Object.keys(ods).sort((a, b) => a - b);
      charts.push(new Chart($("#ch-ods"), { type: "bar", data: { labels: ok.map((o) => "ODS " + o), datasets: [{ data: ok.map((o) => ods[o]), backgroundColor: css.getPropertyValue("--accent").trim(), borderRadius: 6 }] }, options: opt }));
      const tipos = count(P.filter((p) => p.imp), (p) => p.imp.tipo || "s/d");
      charts.push(new Chart($("#ch-imp"), { type: "doughnut", data: { labels: Object.keys(tipos), datasets: [{ data: Object.values(tipos), backgroundColor: ["#10b981", "#0ea5e9", "#f59e0b", "#7c5cff", "#ec4899", "#e5484d", "#94a3b8"], borderWidth: 0 }] }, options: { ...opt, plugins: { legend: { display: true, position: "right" } } } }));
      const ents = Object.entries(count(P.flatMap((p) => p.ent.map((x) => x[0])), (x) => x)).sort((a, b) => b[1] - a[1]).slice(0, 15);
      charts.push(new Chart($("#ch-ent"), { type: "bar", data: { labels: ents.map((x) => (x[0].length > 30 ? x[0].slice(0, 28) + "…" : x[0])), datasets: [{ data: ents.map((x) => x[1]), backgroundColor: css.getPropertyValue("--accent2").trim(), borderRadius: 6 }] }, options: { ...opt, indexAxis: "y" } }));
    }
    dibujar(); onTheme = dibujar;
    const costos = ["nulo", "bajo", "medio"], prios = ["alta", "media"];
    $("#m-prio").innerHTML = `<table class="matrix"><tr><th></th>${costos.map((c) => `<th>Costo ${c}</th>`).join("")}</tr>` + prios.map((pr) => `<tr><td>Prioridad ${pr}</td>${costos.map((c) => {
      const n = P.filter((p) => p.prioridad === pr && p.costo_fiscal === c).length;
      return `<td class="h" style="background:color-mix(in srgb,var(--accent2) ${Math.min(80, n * 6)}%,transparent)">${n}</td>`;
    }).join("")}</tr>`).join("") + `</table><p class="muted" style="font-size:13px;margin:10px 0 0">«Prioridad alta · costo nulo» es la cosecha temprana.</p>`;
    const A = await json("data/actores.json") || [];
    const drawEnt = (q) => {
      const w = palabras(q);
      const f = A.filter((r) => w.every((x) => norm(r.join(" ")).includes(raiz(x))));
      $("#ent-tbl").innerHTML = `<p class="count">${f.length} encargos en ${new Set(f.map((r) => r[0])).size} propuestas</p><table class="tbl"><tr><th>Entidad</th><th>Rol</th><th>Propuesta</th><th>Responsabilidad</th></tr>${f.slice(0, 300).map((r) => {
        const p = byId[r[0]];
        return `<tr><td><b>${esc(r[1])}</b> ${esc(r[2])}</td><td><span class="pill rol">${esc(r[3])}</span></td><td><a href="p/${esc(r[0])}.html" style="color:${ejeById[p.eje].color}">${esc(r[0])}</a> ${esc(p.titulo_corto)}</td><td>${esc(r[4])}</td></tr>`;
      }).join("")}</table>`;
    };
    drawEnt(""); $("#eq").oninput = (ev) => drawEnt(ev.target.value);
    const rv = P.filter((p) => p.rev.length);
    const esp = [...new Set(rv.flatMap((p) => p.rev.map((r) => r[0])))], lbl = { conforme: "✓", observaciones: "obs.", observaciones_graves: "graves" };
    $("#m-rev").innerHTML = `<table class="matrix"><tr><th>Propuesta</th>${esp.map((e) => `<th>${esc(e)}</th>`).join("")}<th>Atendidas</th></tr>${rv.map((p) =>
      `<tr><td><a href="p/${esc(p.id)}.html" style="color:${ejeById[p.eje].color}">${esc(p.id)}</a> ${esc(p.titulo_corto)}</td>${esp.map((e) => { const r = p.rev.find((x) => x[0] === e); return r ? `<td><span class="pill ver-${esc(r[1])}">${lbl[r[1]] || esc(r[1])}</span></td>` : "<td></td>"; }).join("")}<td class="h">${p.aten[1] ? `${p.aten[0]}/${p.aten[1]}` : "—"}</td></tr>`).join("")}</table>`;
    const planUsados = [...new Set(P.flatMap((p) => p.plan2050))].filter((c) => PLAN[c]).sort((a, b) => P.filter((p) => p.plan2050.includes(b)).length - P.filter((p) => p.plan2050.includes(a)).length);
    const ej = EJES.filter((e) => P.some((p) => p.eje === e.id));
    $("#m-plan").innerHTML = `<table class="matrix"><tr><th>Comisión Plan 2050</th>${ej.map((e) => `<th style="color:${e.color}">${esc(e.nombre.split(/[ ,]/)[0])}</th>`).join("")}<th>Total</th></tr>` + planUsados.map((c) => {
      const row = ej.map((e) => P.filter((p) => p.eje === e.id && p.plan2050.includes(c)).length);
      return `<tr><td><a href="${esc(PLAN[c].url)}" target="_blank" rel="noopener">${esc(PLAN[c].nombre)}</a></td>${row.map((n, i) => `<td style="background:${n ? `color-mix(in srgb,${ej[i].color} ${Math.min(85, 18 + n * 14)}%,transparent)` : "transparent"}">${n || ""}</td>`).join("")}<td class="h">${row.reduce((a, b) => a + b, 0)}</td></tr>`;
    }).join("") + `</table>`;
  }

  if (PAGE === "vision") {
    if (window.Esfera) window.Esfera.grande($("#esfera"), P, EJES, PR, { leyenda: $("#esfera-leyenda"), tip: $("#esfera-tip"), pausa: $("#es-pausa"), ola: $("#es-ola") });
    if (!PR) {
      $("#olas-sub").textContent = "El panel prospectivo (5 lentes) está terminando su trabajo; aquí aparecerán las olas, el ranking y los vacíos.";
    } else {
      const OL = Object.entries(PR.olas || {});
      $("#olas-sub").textContent = PR.olas_criterio || "Secuencia sugerida por dependencias, viabilidad e impacto.";
      $("#olas-grid").innerHTML = OL.map(([k, o]) => `<div class="card lane"><h3>${esc(o.nombre)}</h3><p class="muted" style="font-size:12.5px">${esc(o.criterio || "")}</p>${(o.ids || []).filter((id) => byId[id]).sort((a, b) => (score[b] || 0) - (score[a] || 0)).map((id) => `<a href="p/${id}.html" style="--eje:${ejeById[byId[id].eje].color}"><b>${id}</b> ${esc(byId[id].titulo_corto)}</a>`).join("")}</div>`).join("");
      const lentes = PR.lentes || [];
      $("#rank-tbl").innerHTML = `<table class="tbl"><tr><th>#</th><th>Propuesta</th><th>Consolidado</th>${lentes.map((l) => `<th>${esc(l.nombre)}</th>`).join("")}</tr>${PR.ranking.filter((r) => byId[r.id]).map((r, i) =>
        `<tr><td>${i + 1}</td><td>${ejeTag(byId[r.id])} <a href="p/${r.id}.html">${esc(byId[r.id].titulo_corto)}</a></td><td><b>${Math.round(r.score)}</b><div class="bar"><i style="width:${r.score}%"></i></div></td>${lentes.map((l) => `<td>${r.por_lente[l.lente] != null ? Math.round(r.por_lente[l.lente]) : "—"}</td>`).join("")}</tr>`).join("")}</table>`;
      $("#tesis-grid").innerHTML = lentes.map((l) => `<details class="card tesis"><summary><b>${esc(l.nombre)}</b><span class="muted">${esc((l.tesis || "").slice(0, 160))}…</span></summary><p>${esc(l.tesis)}</p>${(l.fuentes || []).length ? `<p class="muted" style="font-size:12.5px">Fuentes: ${(l.fuentes || []).slice(0, 8).map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titulo)}</a>`).join(" · ")}</p>` : ""}</details>`).join("");
      $("#vacios-list").innerHTML = (PR.vacios || []).map((v) => `<div class="vacio"><b>${esc(v.titulo)}</b><p>${esc(v.por_que)}</p><small class="muted">Sugerido por: ${esc((v.lentes || []).join(", "))}${v.eje_sugerido ? " · eje " + esc(v.eje_sugerido) : ""}</small></div>`).join("") || `<p class="muted">Sin vacíos registrados.</p>`;
    }
  }

  if (PAGE === "ciudadania") {
    const R = window.Participa ? await Participa.resumen() : null;
    if (!R) { $("#prop-off").hidden = false; }
    else {
      $("#prop-f").hidden = false;
      $("#prop-f").onsubmit = async (ev) => {
        ev.preventDefault();
        const f = Object.fromEntries(new FormData(ev.target)); f.acepto = !!f.acepto;
        const btn = ev.target.querySelector("button[type=submit]"), msg = $("#prop-msg");
        btn.disabled = true; msg.textContent = "Enviando…";
        const j = await Participa.proponer(f); btn.disabled = false;
        if (!j.ok) { msg.textContent = "⚠️ " + j.error; return; }
        ev.target.reset(); msg.innerHTML = `✅ ¡Recibida! Tu propuesta es la <b>${esc(j.codigo)}</b>. Pasará por revisión y, si procede, se publicará aquí.`;
      };
    }
    const rc = (R && R.ciudadanas) || {}, n = (k) => +(rc[k] || 0);
    $("#cd-kpis").innerHTML = [[n("recibidas"), "propuestas recibidas"], [n("en-revision"), "en revisión"], [n("publicada") + n("incorporada"), "publicadas"], [n("incorporada"), "incorporadas a la agenda"]]
      .map(([b, s]) => `<div class="kpi"><b>${b}</b><span>${esc(s)}</span></div>`).join("");
    const EST = { recibida: "Recibida", "en-revision": "En revisión", publicada: "Publicada", incorporada: "Incorporada ✓", archivada: "Archivada" };
    const items = R ? ((await Participa.propuestas()).propuestas || []) : [];
    $("#cd-list").innerHTML = items.length ? items.map((x) => `<details class="prop ciud" id="${esc(x.codigo)}"><summary><span class="pid">${esc(x.codigo)}</span><div><h3>${esc(x.titulo)}</h3>
      <div class="tagline"><span class="pill">${esc(EST[x.estado] || x.estado)}</span>${x.eje ? `<span class="pill">${esc(x.eje)}</span>` : ""}${x.region ? `<span class="pill">📍 ${esc(x.region)}</span>` : ""}${R.votos[x.codigo] ? `<span class="pill">👍 ${+R.votos[x.codigo][0]}</span>` : ""}</div></div><span class="chev">▶</span></summary>
      <div class="body"><h4>Problema</h4><p>${esc(x.problema)}</p><h4>Propuesta</h4><p>${esc(x.propuesta)}</p>${x.beneficiarios ? `<h4>Beneficia a</h4><p>${esc(x.beneficiarios)}</p>` : ""}
      <p class="muted" style="font-size:12.5px">${x.autor ? "Por " + esc(x.autor) + " · " : ""}${esc(String(x.ts).slice(0, 10))}</p><div class="participa" data-pid="${esc(x.codigo)}"></div></div></details>`).join("")
      : `<p class="muted">Aún no hay propuestas ciudadanas publicadas. ¡Sé la primera persona en proponer!</p>`;
    $("#cd-list").addEventListener("toggle", (ev) => { const w = ev.target.querySelector && ev.target.querySelector(".participa:not([data-ok])"); if (ev.target.open && w) { w.dataset.ok = 1; Participa.montar(w, w.dataset.pid); } }, true);
    const filas = R ? Object.keys({ ...R.votos, ...R.comentarios }).map((id) => ({ id, u: +((R.votos[id] || [])[0] || 0), n: +((R.votos[id] || [])[1] || 0), c: +(R.comentarios[id] || 0) })) : [];
    const rows = filas.filter((r) => byId[r.id]).sort((a, b) => b.u + b.c - (a.u + a.c));
    $("#cm-rank").innerHTML = rows.length ? `<table class="tbl"><tr><th>Propuesta</th><th>👍</th><th>👎</th><th>💬</th></tr>${rows.slice(0, 25).map((r) =>
      `<tr><td>${ejeTag(byId[r.id])} <a href="p/${esc(r.id)}.html#comentarios">${esc(byId[r.id].titulo_corto)}</a></td><td>${r.u}</td><td>${r.n}</td><td>${r.c}</td></tr>`).join("")}</table>`
      : `<p class="muted">Aún no hay apoyos ni comentarios. Entra a cualquier propuesta y baja hasta «¿Qué opinas?».</p>`;
    const feed = R ? ((await Participa.recientes()).comentarios || []) : [];
    const enlace = (id) => /^T-\d+$/.test(id) ? "foro.html#" + id : /^C-\d+$/.test(id) ? "#" + id : "p/" + id + ".html#comentarios";
    $("#cm-feed").innerHTML = feed.length ? feed.slice(0, 20).map((c) => `<div class="cm"><a href="${esc(enlace(c.pid))}"><b>${esc(c.pid)}</b></a> · <span class="muted">${esc(c.nombre || "Anónimo")} · ${esc(String(c.ts).slice(0, 10))}</span><p>${esc(c.texto)}</p></div>`).join("")
      : `<p class="muted">Los comentarios aparecerán aquí.</p>`;
  }

  if (PAGE === "foro") {
    const CAT = { "": "Todos", ideas: "💡 Ideas", dudas: "❓ Dudas", debate: "⚖️ Debate", regiones: "📍 Regiones", otros: "💬 Otros" };
    const R = window.Participa ? await Participa.resumen() : null;
    if (!R) { $("#foro-list").innerHTML = `<p class="muted">El foro no está disponible en este momento. Intenta más tarde.</p>`; $("#foro-nuevo-btn").hidden = true; }
    else {
      let temas = (await Participa.temas()).temas || [], cat = "";
      $("#foro-cats").innerHTML = Object.entries(CAT).map(([k, v]) => `<button class="eje-pill${k ? "" : " on"}" data-c="${k}">${v}</button>`).join("");
      $("#foro-cats").onclick = (ev) => { const b = ev.target.closest("[data-c]"); if (!b) return; cat = b.dataset.c; document.querySelectorAll("#foro-cats .eje-pill").forEach((x) => x.classList.toggle("on", x === b)); pintar(); };
      const pintar = () => {
        const f = temas.filter((t) => !cat || t.categoria === cat);
        $("#foro-estado").textContent = `${temas.length} temas`;
        $("#foro-list").innerHTML = f.length ? f.map((t) => `<details class="prop tema" id="${esc(t.codigo)}"><summary><span class="pid">${esc(t.codigo)}</span><div><h3>${esc(t.titulo)}</h3>
          <div class="tagline"><span class="pill">${esc(CAT[t.categoria] || t.categoria)}</span><span class="pill">${esc(t.nombre || "Anónimo")} · ${Participa.hace(t.ts)}</span><span class="pill">💬 ${+t.respuestas || 0} · 👍 ${+t.apoyos || 0}</span></div></div><span class="chev">▶</span></summary>
          <div class="body"><p class="tema-txt">${esc(t.texto)}</p><div class="participa" data-pid="${esc(t.codigo)}"></div></div></details>`).join("")
          : `<p class="muted">Aún no hay temas${cat ? " en esta categoría" : ""}. ¡Abre el primero!</p>`;
      };
      pintar();
      $("#foro-list").addEventListener("toggle", (ev) => { const w = ev.target.querySelector && ev.target.querySelector(".participa:not([data-ok])"); if (ev.target.open && w) { w.dataset.ok = 1; Participa.montar(w, w.dataset.pid); } }, true);
      const btn = $("#foro-nuevo-btn"), form = $("#foro-f");
      btn.onclick = () => { form.hidden = !form.hidden; btn.setAttribute("aria-expanded", !form.hidden); };
      form.onsubmit = async (ev) => {
        ev.preventDefault(); const d = Object.fromEntries(new FormData(form)), b = form.querySelector("button[type=submit]");
        b.disabled = true; $("#foro-msg").textContent = "Publicando…";
        const j = await Participa.abrirTema(d); b.disabled = false;
        if (!j.ok) { $("#foro-msg").textContent = "⚠️ " + j.error; return; }
        form.reset(); form.hidden = true; $("#foro-msg").textContent = "";
        temas = (await Participa.temas()).temas || []; pintar();
        const el = document.getElementById(j.codigo); if (el) { el.open = true; el.scrollIntoView({ behavior: "smooth" }); }
      };
      let h = ""; try { h = decodeURIComponent(location.hash.slice(1)); } catch (_) {} if (/^T-\d+$/.test(h) && document.getElementById(h)) { document.getElementById(h).open = true; document.getElementById(h).scrollIntoView(); }
    }
  }

  if (PAGE === "tramite") {
    const X = await json("data/contexto.json") || {};
    const C = X.contexto;
    $("#steps").innerHTML = (C && C.procedimiento ? C.procedimiento : []).map((s) => `<li><b>${esc(s.paso)}</b><br><span class="muted">${esc(s.descripcion)}</span>${s.fuente_url ? ` <a href="${esc(s.fuente_url)}" target="_blank" rel="noopener">fuente</a>` : ""}</li>`).join("");
    $("#marco").innerHTML = `<table class="tbl"><tr><th>Norma</th><th>Tema</th></tr>${(X.marco || []).map((n) => `<tr><td>${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.norma)}</a>` : esc(n.norma)}<br><span class="muted">${esc(n.nombre)}</span></td><td>${esc(n.tema)}</td></tr>`).join("")}</table>`;
    const lanes = [["corto", "Corto plazo · 2026–2027"], ["mediano", "Mediano plazo · 2027–2029"], ["largo", "Largo plazo · 2029–2031"]];
    $("#lanes").innerHTML = lanes.map(([k, t]) => `<div class="card lane"><h3>${t}</h3>` + P.filter((p) => p.plazo === k).map((p) => `<a href="p/${esc(p.id)}.html" style="--eje:${ejeById[p.eje].color}"><b>${esc(p.id)}</b> ${esc(p.titulo_corto)}</a>`).join("") + `</div>`).join("");
    let A = null;
    await new Promise((ok) => new IntersectionObserver((es, io) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); ok(); } }, { rootMargin: "400px" }).observe($("#antecedentes")));
    $("#ant").innerHTML = `<p class="muted">Cargando antecedentes…</p>`;
    A = await json("data/antecedentes.json");
    if (A && A.proyectos) {
      const m = A.meta || {}, tp = m.total_proyectos_periodo || {}, tt = m.total_tech_por_periodo || {};
      $("#ant-sub").innerHTML = `En 2021–2026 se presentaron <b>${esc(tt["2021-2026"])}</b> proyectos de ley vinculados a tecnología de ${esc((tp["2021-2026"] || 0).toLocaleString("es-PE"))}; <b>${esc(m.leyes_tech)}</b> se publicaron como ley. En el Congreso bicameral ya van <b>${esc(tt["2026-2031"] ?? 0)}</b> de ${esc(tp["2026-2031"] ?? "—")}. Fuente: API SPLEY, consulta ${esc(m.fecha_consulta || "")}; clasificación por palabras clave del título.`;
      const rows = A.proyectos.slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
      $("#ant").innerHTML = `<div class="grid2"><div class="card"><h3>Por tema</h3><div class="tbl-scroll"><table class="tbl"><tr><th>Tema</th><th>Proyectos</th><th>Leyes</th></tr>${(A.por_tema || []).map((t) => `<tr><td>${esc(t.tema)}</td><td>${esc(t.n)}</td><td>${esc(t.leyes ?? "")}</td></tr>`).join("")}</table></div></div>
        <div class="card"><h3>Buscar en el periodo anterior</h3><input id="aq" type="search" placeholder="Buscar proyecto…" class="search-wide" style="margin-bottom:8px"><div class="tbl-scroll" id="atbl"></div></div></div>`;
      const draw = (q) => {
        const w = norm(q).split(/\s+/).filter(Boolean);
        $("#atbl").innerHTML = `<table class="tbl"><tr><th>Código</th><th>Título</th><th>Estado</th></tr>${rows.filter((r) => w.every((x) => norm(r.titulo + " " + r.codigo).includes(x))).slice(0, 200).map((r) =>
          `<tr><td>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.codigo)}</a>` : esc(r.codigo)}</td><td>${esc(r.titulo)}</td><td>${esc(r.estado)}</td></tr>`).join("")}</table>`;
      };
      draw(""); $("#aq").oninput = (ev) => draw(ev.target.value);
    }
  }
})();
