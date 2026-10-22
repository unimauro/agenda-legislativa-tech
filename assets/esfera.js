/* Esfera de la Visión 2036: propuestas como vértices sobre una esfera que gira; color = eje, tamaño = prioridad,
   líneas = propuestas que se habilitan entre sí. Canvas 2D con proyección en perspectiva, sin dependencias. */
(function () {
  const TAU = Math.PI * 2;
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  // Direcciones bien repartidas (Fibonacci) para el centro de cada eje; las propuestas se agrupan alrededor.
  function fib(n, i) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    return [Math.cos(th) * r, y, Math.sin(th) * r];
  }
  function normaliza(v) { const m = Math.hypot(...v); return v.map((c) => c / m); }
  function cruz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  function modelo(P, EJES, PR) {
    const ejes = EJES.filter((e) => P.some((p) => p.eje === e.id));
    const score = Object.fromEntries(((PR && PR.ranking) || []).map((r) => [r.id, r.score]));
    const ola = {};
    Object.entries((PR && PR.olas) || {}).forEach(([k, o]) => (o.ids || []).forEach((id) => (ola[id] = k)));
    const nodos = [];
    ejes.forEach((e, ei) => {
      const c = fib(ejes.length, ei), lista = P.filter((p) => p.eje === e.id);
      const u = normaliza(cruz(c, Math.abs(c[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), w = cruz(c, u);
      lista.forEach((p, j) => {
        const rr = 0.52 * Math.sqrt((j + 0.5) / lista.length), th = j * 2.39996; // espiral áurea dentro del casquete
        const v = normaliza([0, 1, 2].map((k) => c[k] + rr * (Math.cos(th) * u[k] + Math.sin(th) * w[k])));
        const s = score[p.id] != null ? score[p.id] : p.prioridad === "alta" ? 70 : 45;
        nodos.push({ p, eje: e, rgb: hexRgb(e.color), v, s, ola: ola[p.id], r: 2.6 + (s / 100) * 6.5 });
      });
    });
    const idx = Object.fromEntries(nodos.map((n, i) => [n.p.id, i]));
    let aristas = ((PR && PR.aristas) || []).map(([a, b]) => [idx[a], idx[b]]).filter(([a, b]) => a != null && b != null);
    if (!aristas.length) { // sin priorización aún: anillo por eje
      ejes.forEach((e) => { const g = nodos.map((n, i) => (n.eje.id === e.id ? i : -1)).filter((i) => i >= 0); g.forEach((i, k) => k && aristas.push([g[k - 1], i])); });
    }
    const vecinos = nodos.map(() => new Set());
    aristas.forEach(([a, b]) => { vecinos[a].add(b); vecinos[b].add(a); });
    return { nodos, aristas, vecinos, ejes };
  }

  function motor(canvas, M, opts) {
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, R = 0, dpr = 1, yaw = 0.6, pitch = -0.32, vy = reducido ? 0 : 0.0032, auto = !reducido;
    let hover = -1, fijo = -1, filtroOla = "", arrastre = null, proy = [];
    const css = () => getComputedStyle(document.documentElement);
    function tam() {
      dpr = Math.min(2, devicePixelRatio || 1);
      const b = canvas.getBoundingClientRect();
      W = b.width; H = b.height; R = Math.min(W, H) * (opts.mini ? 0.40 : 0.38);
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    new ResizeObserver(tam).observe(canvas); tam();
    function proyectar(v) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = v[0] * cy - v[2] * sy, z1 = v[0] * sy + v[2] * cy;
      const y2 = v[1] * cp - z1 * sp, z2 = v[1] * sp + z1 * cp;
      const f = 3.2 / (3.2 - z2);
      return [W / 2 + x1 * R * f, H / 2 + y2 * R * f, z2, f];
    }
    function dibujar() {
      const C = css(), txt = C.getPropertyValue("--text").trim(), mut = C.getPropertyValue("--muted").trim();
      ctx.clearRect(0, 0, W, H);
      // halo y núcleo
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R * 1.25);
      g.addColorStop(0, "rgba(200,16,46,.20)"); g.addColorStop(0.55, "rgba(200,16,46,.05)"); g.addColorStop(1, "rgba(200,16,46,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.25, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(127,127,127,.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.02, 0, TAU); ctx.stroke();
      proy = M.nodos.map((n) => proyectar(n.v));
      const foco = fijo >= 0 ? fijo : hover;
      // aristas
      M.aristas.forEach(([a, b]) => {
        const A = proy[a], B = proy[b], z = (A[2] + B[2]) / 2;
        const activa = foco >= 0 && (a === foco || b === foco);
        const atenua = filtroOla && (M.nodos[a].ola !== filtroOla || M.nodos[b].ola !== filtroOla);
        const al = activa ? 0.85 : atenua ? 0.03 : 0.07 + 0.16 * (z + 1) / 2;
        const [r, gg, bb] = M.nodos[a].rgb;
        ctx.strokeStyle = `rgba(${r},${gg},${bb},${al})`; ctx.lineWidth = activa ? 1.8 : 1;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]);
        ctx.quadraticCurveTo((A[0] + B[0]) / 2 + (W / 2 - (A[0] + B[0]) / 2) * 0.25, (A[1] + B[1]) / 2 + (H / 2 - (A[1] + B[1]) / 2) * 0.25, B[0], B[1]);
        ctx.stroke();
      });
      // núcleo "Perú 2036"
      if (!opts.mini) {
        ctx.fillStyle = "rgba(200,16,46,.92)"; ctx.beginPath(); ctx.arc(W / 2, H / 2, 30, 0, TAU); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "700 12px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("PERÚ", W / 2, H / 2 - 7); ctx.fillText("2036", W / 2, H / 2 + 8);
      } else {
        ctx.fillStyle = "rgba(200,16,46,.9)"; ctx.beginPath(); ctx.arc(W / 2, H / 2, 9, 0, TAU); ctx.fill();
      }
      // nodos (de atrás hacia adelante)
      const orden = M.nodos.map((_, i) => i).sort((a, b) => proy[a][2] - proy[b][2]);
      for (const i of orden) {
        const n = M.nodos[i], [x, y, z, f] = proy[i], [r, gg, bb] = n.rgb;
        const vec = foco >= 0 && (i === foco || M.vecinos[foco].has(i));
        const atenua = (filtroOla && n.ola !== filtroOla) || (foco >= 0 && !vec);
        const al = atenua ? 0.16 : 0.35 + 0.65 * (z + 1) / 2;
        const rad = n.r * f * (opts.mini ? 0.62 : 1) * (i === foco ? 1.5 : 1);
        if (!atenua && z > 0.2 && !opts.mini) { ctx.fillStyle = `rgba(${r},${gg},${bb},.18)`; ctx.beginPath(); ctx.arc(x, y, rad * 2.1, 0, TAU); ctx.fill(); }
        ctx.fillStyle = `rgba(${r},${gg},${bb},${al})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
        if (i === foco) { ctx.strokeStyle = txt; ctx.lineWidth = 2; ctx.stroke(); }
      }
      // etiquetas de ejes (cara visible) y de la propuesta en foco
      if (!opts.mini) {
        ctx.textAlign = "center"; ctx.font = "600 11.5px Inter, sans-serif";
        M.ejes.forEach((e, ei) => {
          const c = proyectar(fib(M.ejes.length, ei).map((k) => k * 1.22));
          if (c[2] > 0.15) { ctx.fillStyle = e.color; ctx.globalAlpha = Math.min(1, c[2] * 1.4); ctx.fillText(e.nombre.split(/,| y /)[0], c[0], c[1]); ctx.globalAlpha = 1; }
        });
        if (foco >= 0) {
          const [x, y] = proy[foco], n = M.nodos[foco];
          ctx.font = "700 12.5px Inter, sans-serif"; ctx.fillStyle = txt; ctx.textAlign = x > W / 2 ? "right" : "left";
          ctx.fillText(`${n.p.id} · ${n.p.titulo_corto}`, x + (x > W / 2 ? -14 : 14), y - 12);
        }
      }
      ctx.fillStyle = mut;
    }
    function cuadro() {
      if (!arrastre) { yaw += auto ? vy : 0; if (!auto) { vy *= 0.95; yaw += vy; } }
      dibujar(); requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
    function cercano(ev) {
      const b = canvas.getBoundingClientRect(), mx = ev.clientX - b.left, my = ev.clientY - b.top;
      let best = -1, bd = 1e9;
      proy.forEach((q, i) => { if (q[2] < -0.25) return; const d = Math.hypot(q[0] - mx, q[1] - my); if (d < Math.max(12, M.nodos[i].r * q[3] + 6) && d < bd) { bd = d; best = i; } });
      return best;
    }
    return {
      canvas, M, set ola(v) { filtroOla = v; }, get auto() { return auto; }, set auto(v) { auto = v; vy = v ? 0.0032 : 0; },
      interactivo(tip) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("pointerdown", (ev) => { arrastre = { x: ev.clientX, y: ev.clientY, yaw, pitch, t: Date.now(), mov: 0 }; canvas.setPointerCapture(ev.pointerId); });
        canvas.addEventListener("pointermove", (ev) => {
          if (arrastre) {
            const dx = ev.clientX - arrastre.x, dy = ev.clientY - arrastre.y; arrastre.mov = Math.max(arrastre.mov, Math.hypot(dx, dy));
            const ny = arrastre.yaw + dx * 0.008; vy = ny - yaw; yaw = ny; pitch = Math.max(-1.2, Math.min(1.2, arrastre.pitch + dy * 0.008));
          } else { hover = cercano(ev); canvas.style.cursor = hover >= 0 ? "pointer" : "grab"; mostrar(tip, hover); }
        });
        canvas.addEventListener("pointerup", (ev) => {
          const clic = arrastre && arrastre.mov < 6; arrastre = null;
          if (!clic) { if (!reducido) auto = false; return; }
          const i = cercano(ev);
          if (i < 0) { fijo = -1; mostrar(tip, -1); return; }
          if (ev.pointerType === "mouse" || fijo === i) location.href = "p/" + M.nodos[i].p.id + ".html";
          else { fijo = i; mostrar(tip, i); }
        });
        canvas.addEventListener("pointerleave", () => { hover = -1; if (fijo < 0) mostrar(tip, -1); });
      },
    };
    function mostrar(tip, i) {
      if (!tip) return;
      if (i < 0) { tip.hidden = true; return; }
      const n = M.nodos[i], olaTxt = n.ola && opts.olas && opts.olas[n.ola] ? opts.olas[n.ola].nombre : "";
      tip.hidden = false;
      tip.innerHTML = `<b style="color:${n.eje.color}">${n.p.id}</b> ${n.p.titulo_corto}<br><small>${n.eje.nombre}${olaTxt ? " · " + olaTxt : ""} · prioridad ${Math.round(n.s)} · ${M.vecinos[i].size} conexiones</small><br><small class="muted">${matchMedia("(pointer:coarse)").matches ? "Toca de nuevo para abrir" : "Clic para abrir"}</small>`;
    }
  }

  window.Esfera = {
    mini(canvas, P, EJES, PR) { if (canvas) motor(canvas, modelo(P, EJES, PR), { mini: true }); },
    grande(canvas, P, EJES, PR, ui) {
      if (!canvas) return;
      const M = modelo(P, EJES, PR), E = motor(canvas, M, { olas: PR && PR.olas });
      E.interactivo(ui.tip);
      ui.leyenda.innerHTML = M.ejes.map((e) => `<span><i style="background:${e.color}"></i>${e.nombre}</span>`).join("");
      ui.pausa.onclick = () => { E.auto = !E.auto; ui.pausa.textContent = E.auto ? "⏸ Pausar" : "▶ Girar"; };
      if (reducido) ui.pausa.textContent = "▶ Girar";
      Object.entries((PR && PR.olas) || {}).forEach(([k, o]) => ui.ola.insertAdjacentHTML("beforeend", `<option value="${k}">${o.nombre} (${o.ids.length})</option>`));
      if (!PR) ui.ola.hidden = true;
      ui.ola.onchange = () => (E.ola = ui.ola.value);
    },
  };
})();
