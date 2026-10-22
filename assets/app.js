(async function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // ---- tema
  $("#theme").onclick = () => {
    const r = document.documentElement;
    const cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    r.dataset.theme = cur === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", r.dataset.theme); } catch (_) {}
    drawCharts();
  };

  // ---- apoyo / compartir
  const yb = $("#yape-btn"), ybox = $("#yape-box");
  yb.onclick = () => { const on = ybox.classList.toggle("on"); yb.setAttribute("aria-expanded", on); };
  const url = location.origin + location.pathname;
  const txt = "Agenda Legislativa Tech Perú 2026–2031: propuestas de ley en tecnología, redactadas y listas para comisión";
  $("#sh-x").href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(txt) + "&url=" + encodeURIComponent(url);
  $("#sh-wa").href = "https://wa.me/?text=" + encodeURIComponent(txt + " " + url);
  $("#sh-in").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
  $("#sh-fb").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
  $("#sh-copy").onclick = async (ev) => {
    try { await navigator.clipboard.writeText(url); ev.target.textContent = "✅ Copiado"; } catch (_) { ev.target.textContent = url; }
  };

  // ---- datos
  const D = await fetch("data/propuestas.json", { cache: "no-cache" }).then((r) => r.json());
  const P = D.propuestas, EJES = D.meta.ejes, PLAN = D.plan2050;
  const ejeById = Object.fromEntries(EJES.map((e) => [e.id, e]));
  $("#h-total").textContent = P.length;
  $("#upd").textContent = D.meta.actualizado;

  const count = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
  const comisiones = count(P, (p) => p.comision_sugerida);
  const planUsados = new Set(P.flatMap((p) => p.plan2050 || []));
  const nulo = P.filter((p) => p.costo_fiscal === "nulo").length;
  const arts = P.reduce((s, p) => s + (p.articulado || []).length, 0);
  $("#kpis").innerHTML = [
    [P.length, "propuestas de ley"],
    [arts, "artículos redactados"],
    [Object.keys(comisiones).length, "comisiones dictaminadoras"],
    [planUsados.size, "comisiones del Plan 2050 alineadas"],
    [Math.round((100 * nulo) / P.length) + "%", "sin costo fiscal"],
    [P.filter((p) => p.prioridad === "alta").length, "de prioridad alta"],
  ].map(([b, s]) => `<div class="kpi"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("");

  // ---- filtros
  const st = { eje: "", q: "", com: "", prio: "", costo: "", plan: "" };
  $("#eje-pills").innerHTML = `<button class="eje-pill on" data-eje=""><i></i>Todos</button>` +
    EJES.map((e) => `<button class="eje-pill" data-eje="${e.id}" style="--c:${e.color}"><i></i>${esc(e.nombre)} (${P.filter((p) => p.eje === e.id).length})</button>`).join("");
  $("#eje-pills").onclick = (ev) => {
    const b = ev.target.closest(".eje-pill"); if (!b) return;
    st.eje = b.dataset.eje;
    document.querySelectorAll(".eje-pill").forEach((x) => x.classList.toggle("on", x === b));
    render();
  };
  Object.keys(comisiones).sort().forEach((c) => $("#f-com").insertAdjacentHTML("beforeend", `<option>${esc(c)}</option>`));
  [...planUsados].sort((a, b) => PLAN[a].nombre.localeCompare(PLAN[b].nombre)).forEach((c) =>
    $("#f-plan").insertAdjacentHTML("beforeend", `<option value="${c}">${esc(PLAN[c].nombre)}</option>`));
  const bind = (id, k) => $(id).addEventListener("input", (ev) => { st[k] = ev.target.value; render(); });
  bind("#q", "q"); bind("#f-com", "com"); bind("#f-prio", "prio"); bind("#f-costo", "costo"); bind("#f-plan", "plan");

  const hay = (p) => norm([p.id, p.titulo, p.titulo_corto, p.sumilla, p.problema, (p.tags || []).join(" "), (p.articulado || []).map((a) => a.titulo).join(" ")].join(" "));
  P.forEach((p) => (p._h = hay(p)));

  const VER = { conforme: 0, observaciones: 1, observaciones_graves: 2 };
  function revBadge(p) {
    const ra = p.revision_atendida || [];
    if (!ra.length) return "";
    const ok = ra.filter((x) => x.accion === "corregido").length;
    return `<span class="pill ver-conforme">✓ ${ok}/${ra.length} observaciones atendidas</span>`;
  }

  function card(p) {
    const e = ejeById[p.eje];
    const arts = (p.articulado || []).map((a) => `<li>${esc(a.titulo)}</li>`).join("");
    const plan = (p.plan2050 || []).map((c) => `<a class="chip" href="${esc(PLAN[c].url)}" target="_blank" rel="noopener">Plan 2050 · ${esc(PLAN[c].nombre)}</a>`).join("");
    return `<details class="prop" style="--eje:${e.color}" id="${esc(p.id)}">
      <summary><span class="pid">${esc(p.id)}</span>
        <div><h3>${esc(p.titulo)}</h3><p class="sum">${esc(p.sumilla)}</p>
          <div class="tagline"><span class="pill prio-${esc(p.prioridad)}">Prioridad ${esc(p.prioridad)}</span>
          <span class="pill">Costo ${esc(p.costo_fiscal)}</span>${revBadge(p)}<span class="pill">Diputados: ${esc(p.comision_sugerida)}</span></div></div>
        <span class="chev">▶</span></summary>
      <div class="body">
        <h4>El problema</h4><p>${esc(p.problema)}</p>
        <h4>Articulado (${(p.articulado || []).length} artículos)</h4><ol>${arts}</ol>
        <h4>Indicador de éxito al 2031</h4><p>${esc(p.indicador_exito)}</p>
        ${p.impacto ? `<h4>Impacto económico estimado</h4><p><b>${esc(p.impacto.tipo)}</b> · Costo para el Estado: ${esc((p.impacto.costo_estado || {}).rango || "—")}${p.impacto.beneficio_sociedad ? ` · Beneficio: ${esc(p.impacto.beneficio_sociedad)}` : ""}</p>` : ""}
        ${(p.implicados || {}).entidades ? `<h4>Quién hace qué</h4><p>${p.implicados.entidades.map((x) => `<span class="pill">${esc(x.sigla || x.entidad)} · ${esc(x.rol)}</span>`).join(" ")}</p>` : ""}
        <div class="chips">${plan}</div>
        <div class="acts"><a class="btn" href="p/${esc(p.id)}.html">Leer completo</a>
          <a class="btn ghost" href="pdf/${esc(p.id)}.pdf" download>⬇️ PDF</a>
          <a class="btn ghost" href="docx/${esc(p.id)}.docx" download>📝 Word editable</a>
          <a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(p.titulo + " " + url.replace(/[^/]*$/, "") + "p/" + p.id + ".html")}">🟢 Compartir</a></div>
      </div></details>`;
  }

  function render() {
    const q = norm(st.q).split(/\s+/).filter(Boolean);
    const f = P.filter((p) =>
      (!st.eje || p.eje === st.eje) && (!st.com || p.comision_sugerida === st.com) && (!st.prio || p.prioridad === st.prio) &&
      (!st.costo || p.costo_fiscal === st.costo) && (!st.plan || (p.plan2050 || []).includes(st.plan)) && q.every((w) => p._h.includes(w)));
    $("#count").textContent = `${f.length} de ${P.length} propuestas`;
    $("#plist").innerHTML = f.map(card).join("") || `<p class="muted">Sin resultados con esos filtros.</p>`;
  }
  render();
  if (location.hash && document.getElementById(location.hash.slice(1))?.tagName === "DETAILS") document.getElementById(location.hash.slice(1)).open = true;

  // ---- gráficos
  const charts = [];
  function drawCharts() {
    if (!window.Chart) return;
    charts.splice(0).forEach((c) => c.destroy());
    const css = getComputedStyle(document.documentElement);
    Chart.defaults.color = css.getPropertyValue("--muted").trim();
    Chart.defaults.borderColor = css.getPropertyValue("--border").trim();
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    const opt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
    charts.push(new Chart($("#ch-eje"), { type: "bar", data: { labels: EJES.map((e) => e.nombre), datasets: [{ data: EJES.map((e) => P.filter((p) => p.eje === e.id).length), backgroundColor: EJES.map((e) => e.color), borderRadius: 6 }] },
      options: { ...opt, indexAxis: "y", scales: { x: { ticks: { precision: 0 } } } } }));
    const cs = Object.entries(comisiones).sort((a, b) => b[1] - a[1]);
    charts.push(new Chart($("#ch-com"), { type: "bar", data: { labels: cs.map((c) => c[0].length > 38 ? c[0].slice(0, 36) + "…" : c[0]), datasets: [{ data: cs.map((c) => c[1]), backgroundColor: css.getPropertyValue("--accent2").trim(), borderRadius: 6 }] },
      options: { ...opt, indexAxis: "y", scales: { x: { ticks: { precision: 0 } } } } }));
    const ods = count(P.flatMap((p) => (p.ods || []).map(String)), (x) => x);
    const ok = Object.keys(ods).sort((a, b) => a - b);
    charts.push(new Chart($("#ch-ods"), { type: "bar", data: { labels: ok.map((o) => "ODS " + o), datasets: [{ data: ok.map((o) => ods[o]), backgroundColor: css.getPropertyValue("--accent").trim(), borderRadius: 6 }] },
      options: { ...opt, scales: { y: { ticks: { precision: 0 } } } } }));
    if (P.some((p) => p.impacto)) {
      const tipos = count(P.filter((p) => p.impacto), (p) => p.impacto.tipo || "s/d");
      const pal = ["#10b981", "#0ea5e9", "#f59e0b", "#7c5cff", "#ec4899", "#e5484d", "#94a3b8"];
      charts.push(new Chart($("#ch-imp"), { type: "doughnut", data: { labels: Object.keys(tipos), datasets: [{ data: Object.values(tipos), backgroundColor: pal, borderWidth: 0 }] },
        options: { ...opt, plugins: { legend: { display: true, position: "right" } } } }));
      const ents = Object.entries(count(P.flatMap((p) => ((p.implicados || {}).entidades || []).map((x) => x.sigla || x.entidad)), (x) => x)).sort((a, b) => b[1] - a[1]).slice(0, 15);
      charts.push(new Chart($("#ch-ent"), { type: "bar", data: { labels: ents.map((x) => x[0].length > 30 ? x[0].slice(0, 28) + "…" : x[0]), datasets: [{ data: ents.map((x) => x[1]), backgroundColor: css.getPropertyValue("--accent2").trim(), borderRadius: 6 }] },
        options: { ...opt, indexAxis: "y", scales: { x: { ticks: { precision: 0 } } } } }));
    }
  }
  drawCharts();

  // prioridad × costo
  const costos = ["nulo", "bajo", "medio"], prios = ["alta", "media"];
  $("#m-prio").innerHTML = `<table class="matrix"><tr><th></th>${costos.map((c) => `<th>Costo ${c}</th>`).join("")}</tr>` +
    prios.map((pr) => `<tr><td>Prioridad ${pr}</td>${costos.map((c) => {
      const n = P.filter((p) => p.prioridad === pr && p.costo_fiscal === c).length;
      return `<td class="h" style="background:color-mix(in srgb,var(--accent2) ${Math.min(80, n * 6)}%,transparent)">${n}</td>`;
    }).join("")}</tr>`).join("") + `</table><p class="muted" style="font-size:13px;margin:10px 0 0">La esquina “prioridad alta · costo nulo” es la cosecha temprana: impacto sin pedir presupuesto.</p>`;

  // matriz Plan 2050
  const pcs = [...planUsados].sort((a, b) => P.filter((p) => p.plan2050.includes(b)).length - P.filter((p) => p.plan2050.includes(a)).length);
  $("#m-plan").innerHTML = `<table class="matrix"><tr><th>Comisión Plan 2050</th>${EJES.map((e) => `<th style="color:${e.color}">${esc(e.nombre.split(/[ ,]/)[0])}</th>`).join("")}<th>Total</th></tr>` +
    pcs.map((c) => {
      const row = EJES.map((e) => P.filter((p) => p.eje === e.id && p.plan2050.includes(c)).length);
      const tot = row.reduce((a, b) => a + b, 0);
      return `<tr><td><a href="${esc(PLAN[c].url)}" target="_blank" rel="noopener">${esc(PLAN[c].nombre)}</a></td>${row.map((n, i) =>
        `<td style="background:${n ? `color-mix(in srgb,${EJES[i].color} ${Math.min(85, 18 + n * 14)}%,transparent)` : "transparent"}">${n || ""}</td>`).join("")}<td class="h">${tot}</td></tr>`;
    }).join("") + `</table>`;

  // hoja de ruta
  const lanes = [["corto", "Corto plazo · 2026–2027"], ["mediano", "Mediano plazo · 2027–2029"], ["largo", "Largo plazo · 2029–2031"]];
  $("#lanes").innerHTML = lanes.map(([k, t]) => `<div class="card lane"><h3>${t}</h3>` +
    P.filter((p) => p.plazo === k).sort((a, b) => (a.prioridad === "alta" ? -1 : 1) - (b.prioridad === "alta" ? -1 : 1))
      .map((p) => `<a href="#${esc(p.id)}" style="--eje:${ejeById[p.eje].color}" onclick="document.getElementById('${esc(p.id)}').open=true"><b>${esc(p.id)}</b> ${esc(p.titulo_corto)}</a>`).join("") + `</div>`).join("");

  // antecedentes
  const A = D.antecedentes;
  if (A && A.proyectos && A.proyectos.length) {
    const m = A.meta || {};
    const tp = m.total_proyectos_periodo, tot = tp && typeof tp === "object" ? tp["2021-2026"] : tp;
    const nTech = (m.total_tech_por_periodo || {})["2021-2026"] ?? m.total_tech ?? A.proyectos.length;
    const tp26 = tp && typeof tp === "object" ? tp["2026-2031"] : null, nTech26 = (m.total_tech_por_periodo || {})["2026-2031"];
    const inst = ((A.por_tema || []).find((t) => /institutos/i.test(t.tema)) || {}).n;
    $("#ant-sub").innerHTML = `En el periodo 2021–2026 se presentaron <b>${esc(nTech)}</b> proyectos de ley vinculados a tecnología${tot ? ` de ${esc(tot.toLocaleString("es-PE"))} en total` : ""}${m.leyes_tech ? `; <b>${esc(m.leyes_tech)}</b> (ambos periodos) se publicaron como ley` : ""}. En el nuevo Congreso bicameral ya van <b>${esc(nTech26 ?? 0)}</b> proyectos tech de ${esc(tp26 ?? "—")} presentados.${inst ? ` Ojo: ${esc(inst)} de ellos solo crean o convierten institutos/universidades “tecnológicas”.` : ""} Fuente: API SPLEY del Congreso, consulta ${esc(m.fecha_consulta || "")}; clasificación por palabras clave del título, puede tener falsos positivos.`;
    const temas = (A.por_tema || []).map((t) => `<tr><td>${esc(t.tema)}</td><td>${esc(t.n)}</td><td>${esc(t.leyes ?? "")}</td></tr>`).join("");
    const rows = A.proyectos.slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    $("#ant").innerHTML = `<div class="grid2"><div class="card"><h3>Por tema</h3><div class="tbl-scroll"><table class="tbl"><tr><th>Tema</th><th>Proyectos</th><th>Leyes</th></tr>${temas}</table></div></div>
      <div class="card"><h3>Buscar en el periodo anterior</h3><input id="aq" type="search" placeholder="Buscar proyecto…" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font:inherit;margin-bottom:8px">
      <div class="tbl-scroll" id="atbl"></div></div></div>`;
    const draw = (q) => {
      const w = norm(q).split(/\s+/).filter(Boolean);
      const f = rows.filter((r) => w.every((x) => norm(r.titulo + " " + r.codigo).includes(x))).slice(0, 200);
      $("#atbl").innerHTML = `<table class="tbl"><tr><th>Código</th><th>Título</th><th>Estado</th></tr>${f.map((r) =>
        `<tr><td>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.codigo)}</a>` : esc(r.codigo)}</td><td>${esc(r.titulo)}</td><td>${esc(r.estado)}</td></tr>`).join("")}</table>`;
    };
    draw(""); $("#aq").oninput = (ev) => draw(ev.target.value);
  } else {
    $("#ant").innerHTML = `<p class="muted">Datos de antecedentes en preparación. Mientras tanto, consulta <a href="https://unimauro.github.io/congreso-abierto-peru/">Congreso Abierto Perú</a>.</p>`;
  }

  // trámite y marco
  const C = D.contexto;
  $("#steps").innerHTML = (C && C.procedimiento ? C.procedimiento : []).map((s) =>
    `<li><b>${esc(s.paso)}</b><br><span class="muted">${esc(s.descripcion)}</span>${s.fuente_url ? ` <a href="${esc(s.fuente_url)}" target="_blank" rel="noopener">fuente</a>` : ""}</li>`).join("") || `<li>Procedimiento en preparación.</li>`;
  const M = D.marco || [];
  $("#marco").innerHTML = M.length ? `<table class="tbl"><tr><th>Norma</th><th>Tema</th></tr>${M.map((n) =>
    `<tr><td>${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.norma)}</a>` : esc(n.norma)}<br><span class="muted">${esc(n.nombre)}</span></td><td>${esc(n.tema)}</td></tr>`).join("")}</table>` : `<p class="muted">En preparación.</p>`;

  // ---- v2: actores, impacto, revisión
  const tieneV2 = P.some((p) => p.implicados || p.impacto);
  document.querySelectorAll(".v2").forEach((el) => (el.hidden = !tieneV2 && !P.some((p) => (p.revision || []).length)));
  if (tieneV2) {
    const filas = P.flatMap((p) => ((p.implicados || {}).entidades || []).map((x) => ({ ...x, pid: p.id, eje: p.eje, tc: p.titulo_corto })));
    const drawEnt = (q) => {
      const w = norm(q).split(/\s+/).filter(Boolean);
      const f = filas.filter((r) => w.every((x) => norm([r.entidad, r.sigla, r.sector, r.rol, r.responsabilidad].join(" ")).includes(x)));
      $("#ent-tbl").innerHTML = `<p class="count">${f.length} encargos en ${new Set(f.map((r) => r.pid)).size} propuestas</p><table class="tbl"><tr><th>Entidad</th><th>Rol</th><th>Propuesta</th><th>Responsabilidad</th></tr>${f.slice(0, 300).map((r) =>
        `<tr><td><b>${esc(r.sigla || "")}</b> ${esc(r.entidad)}</td><td><span class="pill rol">${esc(r.rol)}</span></td><td><a href="#${esc(r.pid)}" onclick="document.getElementById('${esc(r.pid)}').open=true" style="color:${ejeById[r.eje].color}">${esc(r.pid)}</a> ${esc(r.tc)}</td><td>${esc(r.responsabilidad)}</td></tr>`).join("")}</table>`;
    };
    drawEnt(""); $("#eq").oninput = (ev) => drawEnt(ev.target.value);
    const nNormas = new Set(P.flatMap((p) => ((p.implicados || {}).normas_modificadas || []).map((n) => n.norma))).size;
    const nEnt = new Set(filas.map((r) => r.sigla || r.entidad)).size;
    $("#kpis").insertAdjacentHTML("beforeend", `<div class="kpi"><b>${nNormas}</b><span>normas vigentes que se modifican</span></div><div class="kpi"><b>${nEnt}</b><span>entidades implicadas</span></div>`);
  }
  const rv = P.filter((p) => (p.revision || []).length);
  if (rv.length) {
    const esp = [...new Set(rv.flatMap((p) => p.revision.map((r) => r.especialidad)))];
    const lbl = { conforme: "✓", observaciones: "obs.", observaciones_graves: "graves" };
    $("#m-rev").innerHTML = `<table class="matrix"><tr><th>Propuesta</th>${esp.map((e) => `<th>${esc(e)}</th>`).join("")}<th>Atendidas</th></tr>${rv.map((p) => {
      const ra = p.revision_atendida || [];
      return `<tr><td><a href="p/${esc(p.id)}.html" style="color:${ejeById[p.eje].color}">${esc(p.id)}</a> ${esc(p.titulo_corto)}</td>${esp.map((e) => {
        const r = p.revision.find((x) => x.especialidad === e);
        return r ? `<td><span class="pill ver-${esc(r.veredicto)}" title="${esc(r.resumen)}">${lbl[r.veredicto] || esc(r.veredicto)}</span></td>` : "<td></td>";
      }).join("")}<td class="h">${ra.length ? `${ra.filter((x) => x.accion === "corregido").length}/${ra.length}` : "—"}</td></tr>`;
    }).join("")}</table>`;
  }

  // ---- comentarios ciudadanos (giscus → data/comentarios.json) ----
  fetch("data/comentarios.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then((C) => {
    const rows = C ? Object.entries(C.por_propuesta || {}).map(([id, v]) => ({ p: P.find((x) => x.id === id), ...v })).filter((x) => x.p) : [];
    rows.sort((a, b) => b.comentarios + b.respuestas + b.apoyo - (a.comentarios + a.respuestas + a.apoyo));
    $("#cm-rank").innerHTML = rows.length ? `<table class="tbl"><tr><th>Propuesta</th><th>💬</th><th>👍</th><th>👎</th></tr>${rows.slice(0, 20).map((r) =>
      `<tr><td><a href="p/${esc(r.p.id)}.html#comentarios" style="color:${ejeById[r.p.eje].color}">${esc(r.p.id)}</a> ${esc(r.p.titulo_corto)}</td><td>${r.comentarios + r.respuestas}</td><td>${r.apoyo}</td><td>${r.rechazo}</td></tr>`).join("")}</table>`
      : `<p class="muted">Aún no hay comentarios. ¡Sé la primera persona en opinar! Entra a cualquier propuesta y baja hasta «¿Qué opinas?».</p>`;
    const feed = (C && C.recientes) || [];
    $("#cm-feed").innerHTML = feed.length ? feed.slice(0, 15).map((c) => `<div class="cm"><a href="p/${esc(c.id)}.html#comentarios"><b>${esc(c.id)}</b></a> · <span class="muted">@${esc(c.autor)} · ${esc(String(c.fecha).slice(0, 10))}</span><p>${esc(c.texto)}</p></div>`).join("")
      : `<p class="muted">Los comentarios aparecerán aquí.</p>`;
    if (C) rows.forEach((r) => { const el = document.querySelector(`#${CSS.escape(r.p.id)} .tagline`); if (el) el.insertAdjacentHTML("beforeend", `<span class="pill">💬 ${r.comentarios + r.respuestas} · 👍 ${r.apoyo}</span>`); });
  }).catch(() => {});

  // ---- buscador global (todo el texto) ----
  const campos = (p) => ({
    t: norm([p.id, p.titulo, p.titulo_corto].join(" ")),
    s: norm([p.sumilla, (p.tags || []).join(" "), p.objeto].join(" ")),
    b: norm([p.problema, (p.articulado || []).map((a) => a.titulo + " " + a.texto).join(" "), (p.disposiciones || []).map((d) => d.texto).join(" "),
      ((p.implicados || {}).entidades || []).map((x) => [x.entidad, x.sigla, x.responsabilidad].join(" ")).join(" "),
      ((p.implicados || {}).normas_modificadas || []).map((n) => n.norma + " " + n.articulo).join(" "),
      (p.normas_relacionadas || []).map((n) => n.norma).join(" "), p.comision_sugerida].join(" ")),
  });
  P.forEach((p) => (p._c = campos(p)));
  const STOP = new Set("de la el los las y o a en que con por para del un una se su sus es al lo como mas sobre hay cual cuales me mi te tu le les esta este estas estos ley leyes propuesta propuestas proponen propone ayudaria ayuda quien quienes cuanto cuesta costaria algo alguna alguno tema temas sobre dime quiero saber".split(" "));
  const SINON = { robo: ["hurto", "imei", "sustraccion"], celular: ["movil", "imei", "linea", "sim"], celulares: ["movil", "imei", "linea", "sim"],
    estafa: ["fraude", "suplantacion"], estafas: ["fraude", "suplantacion"], internet: ["banda", "conectividad"], colegio: ["escuela", "educacion", "institucion educativa"],
    colegios: ["escuela", "educacion"], hospital: ["salud", "establecimiento"], trabajo: ["empleo", "laboral"], plata: ["financiamiento", "costo"],
    chamba: ["empleo", "laboral"], hackeo: ["ciberataque", "incidente"], virus: ["ransomware", "malware"], ninos: ["menores", "adolescentes"], niños: ["menores", "adolescentes"] };
  const palabras = (q) => norm(q).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const expandir = (q) => palabras(q).flatMap((w) => [w, ...(SINON[w] || [])]).join(" ");
  const raiz = (w) => (w.length > 5 ? w.slice(0, -2) : w); // robos→rob, celulares→celula
  function buscar(q, k = 12) {
    const ws = palabras(expandir(q));
    if (!ws.length) return [];
    return P.map((p) => {
      let sc = 0;
      for (const w of ws) {
        const st = raiz(w);
        if (p._c.t.includes(st)) sc += 6;
        if (p._c.s.includes(st)) sc += 3;
        sc += Math.min(p._c.b.split(st).length - 1, 6);
      }
      return { p, sc };
    }).filter((x) => x.sc >= 2).sort((a, b) => b.sc - a.sc).slice(0, k);
  }
  function snippet(p, q) {
    const ws = palabras(q), txt = [p.sumilla, ...(p.articulado || []).map((a) => a.texto), p.problema].join(" "), n = norm(txt);
    let i = -1;
    for (const w of ws) { i = n.indexOf(raiz(w)); if (i >= 0) break; }
    const a = Math.max(0, i - 70);
    let h = esc(txt.slice(a, a + 200));
    for (const w of ws) h = h.replace(new RegExp("(" + raiz(w).replace(/[^a-z0-9ñ]/g, "") + "[a-záéíóúñ]*)", "gi"), "<mark>$1</mark>");
    return (a ? "… " : "") + h + " …";
  }
  const gq = $("#gq"), gres = $("#gres");
  let gt;
  gq.addEventListener("input", () => {
    clearTimeout(gt);
    gt = setTimeout(() => {
      const r = buscar(gq.value);
      gres.hidden = !gq.value.trim();
      gres.innerHTML = r.length ? r.map(({ p }) => `<a class="gr" href="p/${esc(p.id)}.html" style="--eje:${ejeById[p.eje].color}"><span class="pid">${esc(p.id)}</span><b>${esc(p.titulo_corto)}</b><small>${snippet(p, gq.value)}</small></a>`).join("")
        : `<p class="muted" style="padding:10px">Sin coincidencias. Prueba otras palabras o pregúntale al asistente 💬</p>`;
    }, 150);
  });

  // ---- asistente ciudadano (sin IA externa: intención + buscador) ----
  const chat = $("#chat"), fab = $("#chat-fab"), log = $("#chat-log");
  const abrir = (on) => { chat.hidden = !on; fab.setAttribute("aria-expanded", on); fab.hidden = on; if (on) $("#chat-q").focus(); };
  fab.onclick = () => abrir(true); $("#chat-x").onclick = () => abrir(false);
  const add = (cls, html) => { log.insertAdjacentHTML("beforeend", `<div class="msg ${cls}">${html}</div>`); log.scrollTop = log.scrollHeight; };
  const L = (p) => `<a href="p/${p.id}.html"><b>${p.id}</b></a> ${esc(p.titulo_corto)}`;
  const corto = (t, n = 180) => { t = String(t || ""); return esc(t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t); };
  let ultimo = null; // propuesta en foco para preguntas de seguimiento ("¿y cuánto cuesta?")
  function responder(q) {
    const nq = norm(q);
    const idm = q.toUpperCase().match(/\b(IA|CIB|GOB|CON|ECO|TAL|SOB|DER)-?(\d{1,2})\b/);
    let foco = idm ? P.find((p) => p.id === `${idm[1]}-${idm[2].padStart(2, "0")}`) : null;
    const r = buscar(q, 4);
    if (!foco && r.length && (r.length === 1 || r[0].sc >= r[1].sc * 1.6)) foco = r[0].p;
    const INTENT = /cuest|cost|gast|presupuest|plata|dinero|financ|quien|entidad|implement|ejecut|encarg|supervis|responsable|benefic|ayuda|sirve|gana|norma|modific|deroga/;
    if (/present|tramit|congresista|diputad|senad|firmas|como se aprueba/.test(nq) && !idm)
      return 'Se presenta en la <b>Cámara de Diputados</b> (un diputado, el Ejecutivo o con firmas ciudadanas: 0.3% del padrón), va a una comisión (hasta 60 días hábiles), al Pleno y luego al <b>Senado</b>. Paso a paso en <a href="#tramite">Cómo se tramita</a>; cada propuesta trae su Word editable listo para un despacho.';
    if (/(no|nada|cero|sin)\s.*(cuest|cost|gast)|gratis|costo nulo/.test(nq)) {
      const n = P.filter((p) => p.costo_fiscal === "nulo");
      return `${n.length} propuestas tienen <b>costo fiscal nulo</b>. Algunas:<br>` + n.slice(0, 6).map((p) => "• " + L(p)).join("<br>") + '<br>Fíltralas en <a href="#propuestas">Propuestas</a> → «Costo nulo».';
    }
    if (!foco && ultimo && INTENT.test(nq) && palabras(q).length <= 3) foco = ultimo; // seguimiento: "¿y cuánto cuesta?"
    if (!foco && !r.length) return "No encontré una propuesta sobre eso 🤔. Prueba con otras palabras (por ejemplo «internet rural», «estafas», «startups») o usa el buscador de arriba.";
    if (foco) {
      ultimo = foco;
      const im = foco.implicados || {}, ip = foco.impacto || {};
      if (/cuest|cost|gast|presupuest|plata|dinero|financ/.test(nq))
        return `${L(foco)}: costo fiscal <b>${esc(foco.costo_fiscal)}</b>${ip.costo_estado ? ` — ${corto(ip.costo_estado.rango, 140)}. Se financia: ${corto(ip.costo_estado.financiamiento, 160).replace(/\.+$/, "")}` : ""}.`;
      if (/benefic|ayuda|sirve|gana|gente|ciudadan/.test(nq))
        return `${L(foco)} beneficia a: ${corto(im.beneficiarios || ip.beneficio_sociedad || foco.sumilla, 260)}`;
      if (/quien|entidad|implement|ejecut|encarg|supervis|responsable/.test(nq) && im.entidades)
        return `${L(foco)} la implementarían:<br>` + im.entidades.slice(0, 6).map((x) => `• <b>${esc(x.sigla || x.entidad)}</b> (${esc(x.rol)}): ${corto(x.responsabilidad, 120)}`).join("<br>");
      if (/norma|modific|deroga|ley vigente/.test(nq) && im.normas_modificadas)
        return `${L(foco)} cambia estas normas:<br>` + im.normas_modificadas.slice(0, 6).map((n) => `• ${esc(n.norma)}, ${esc(n.articulo)} — ${esc(n.accion)}`).join("<br>");
      return `${L(foco)}<br>${corto(foco.sumilla, 260)}<br><span class="muted">Comisión: ${esc(foco.comision_sugerida)} · Costo ${esc(foco.costo_fiscal)}</span><br>Puedes preguntarme <i>¿cuánto cuesta?</i>, <i>¿quién la implementa?</i> o <i>¿a quién beneficia?</i>`;
    }
    ultimo = r[0].p;
    return "Encontré estas propuestas relacionadas:<br>" + r.map(({ p }) => `• ${L(p)} — ${corto(p.sumilla, 110)}`).join("<br>") + "<br>Pregúntame por una (por ejemplo «" + r[0].p.id + " ¿cuánto cuesta?»).";
  }
  function preguntar(q) {
    add("user", esc(q));
    document.getElementById("chat-sug")?.remove();
    setTimeout(() => add("bot", responder(q)), 250);
  }
  $("#chat-f").onsubmit = (ev) => { ev.preventDefault(); const q = $("#chat-q").value.trim(); if (q) { $("#chat-q").value = ""; preguntar(q); } };
  log.addEventListener("click", (ev) => { const b = ev.target.closest("#chat-sug .chip"); if (b) preguntar(b.textContent); });
  if (location.hash === "#chat") abrir(true);

  // scrollspy
  const links = [...document.querySelectorAll("#nav a")];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.block").forEach((s) => io.observe(s));
})();
