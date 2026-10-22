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

  function card(p) {
    const e = ejeById[p.eje];
    const arts = (p.articulado || []).map((a) => `<li>${esc(a.titulo)}</li>`).join("");
    const plan = (p.plan2050 || []).map((c) => `<a class="chip" href="${esc(PLAN[c].url)}" target="_blank" rel="noopener">Plan 2050 · ${esc(PLAN[c].nombre)}</a>`).join("");
    return `<details class="prop" style="--eje:${e.color}" id="${esc(p.id)}">
      <summary><span class="pid">${esc(p.id)}</span>
        <div><h3>${esc(p.titulo)}</h3><p class="sum">${esc(p.sumilla)}</p>
          <div class="tagline"><span class="pill prio-${esc(p.prioridad)}">Prioridad ${esc(p.prioridad)}</span>
          <span class="pill">Costo ${esc(p.costo_fiscal)}</span><span class="pill">${esc(p.comision_sugerida)}</span></div></div>
        <span class="chev">▶</span></summary>
      <div class="body">
        <h4>El problema</h4><p>${esc(p.problema)}</p>
        <h4>Articulado (${(p.articulado || []).length} artículos)</h4><ol>${arts}</ol>
        <h4>Indicador de éxito al 2031</h4><p>${esc(p.indicador_exito)}</p>
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
    $("#ant-sub").innerHTML = `En el periodo 2021–2026 se presentaron <b>${esc(nTech)}</b> proyectos de ley vinculados a tecnología${tot ? ` de ${esc(tot.toLocaleString("es-PE"))} en total` : ""}${m.leyes_tech ? `; <b>${esc(m.leyes_tech)}</b> llegaron a ser ley o autógrafa` : ""}. Fuente: ${esc(m.fuente || "API SPLEY del Congreso")}, consulta ${esc(m.fecha_consulta || "")}. Clasificación por palabras clave del título — puede tener falsos positivos.`;
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

  // scrollspy
  const links = [...document.querySelectorAll("#nav a")];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.block").forEach((s) => io.observe(s));
})();
