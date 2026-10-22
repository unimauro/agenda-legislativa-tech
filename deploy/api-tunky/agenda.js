// agenda.js — Participación ciudadana de la "Agenda Legislativa Tech Perú" (api.tunky.net/agenda/*)
// Propuestas ciudadanas (moderadas), votos 👍/👎 por dispositivo y comentarios por propuesta.
// Persistencia: Postgres (api-tunky-db) + respaldo append-only en data/agenda-*.jsonl.
// Seguridad: CORS del server (ALLOW_ORIGINS), rate-limit por IP, honeypot, filtro de groserías, máx. 1 enlace,
// IP guardada solo como hash (sha256 con sal = ADMIN_TOKEN), admin con token en el cuerpo (timingSafeEqual).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = function makeAgenda({ DATA_DIR, json, clean, readBody }) {
  const ADMIN = process.env.ADMIN_TOKEN || "";
  const PID = /^((IA|CIB|GOB|CON|ECO|TAL|SOB|DER)-\d{2}|C-\d{1,6})$/;
  const VID = /^[a-zA-Z0-9_-]{8,64}$/;
  const ESTADOS = ["recibida", "en-revision", "publicada", "incorporada", "archivada"];
  const BAD = ["mierda", "puta", "puto", "verga", "concha tu", "ctm", "pendejo", "cojud", "chucha", "reconcha", "conchatumadre", "maric", "huevon de mierda"];
  const ipOf = (req) => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
  const hashIp = (ip) => crypto.createHash("sha256").update(ADMIN + "|" + ip).digest("hex").slice(0, 24);
  const txt = (s, n) => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, n);
  const grosero = (s) => { const t = s.toLowerCase(); return BAD.some((b) => t.includes(b)); };
  const enlaces = (s) => (s.match(/https?:\/\/|www\./gi) || []).length;
  const respaldo = (f, o) => { try { fs.appendFileSync(path.join(DATA_DIR, f), JSON.stringify(o) + "\n"); } catch (e) {} };

  // ---- rate limit por clave (ventana deslizante) ----
  const RL = new Map();
  function limitado(key, max, win) {
    const now = Date.now(), arr = (RL.get(key) || []).filter((t) => now - t < win);
    arr.push(now); RL.set(key, arr); return arr.length > max;
  }
  setInterval(() => { const now = Date.now(); for (const [k, a] of RL) { const f = a.filter((t) => now - t < 3600e3); f.length ? RL.set(k, f) : RL.delete(k); } }, 600e3).unref();

  function esAdmin(tok) {
    if (!ADMIN || typeof tok !== "string") return false;
    const a = crypto.createHash("sha256").update(tok).digest(), b = crypto.createHash("sha256").update(ADMIN).digest();
    return crypto.timingSafeEqual(a, b);
  }

  // ---- Postgres ----
  let pool = null, ready = false;
  try {
    const { Pool } = require("pg");
    pool = new Pool({ host: process.env.PGHOST || "api-tunky-db", port: +(process.env.PGPORT || 5432), user: process.env.PGUSER || "tunky",
      password: process.env.PGPASSWORD || "", database: process.env.PGDATABASE || "tunky", max: 4, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 });
    pool.on("error", () => {});
    (async () => {
      for (let i = 0; i < 15 && !ready; i++) {
        try {
          await pool.query(`CREATE TABLE IF NOT EXISTS agenda_propuestas(
            id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ NOT NULL DEFAULT now(), estado TEXT NOT NULL DEFAULT 'recibida',
            publicada BOOLEAN NOT NULL DEFAULT false, titulo TEXT NOT NULL, eje TEXT, problema TEXT, propuesta TEXT,
            beneficiarios TEXT, entidades TEXT, costo TEXT, region TEXT, autor TEXT, nota_admin TEXT, iphash TEXT, ua TEXT)`);
          await pool.query(`CREATE TABLE IF NOT EXISTS agenda_comentarios(
            id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ NOT NULL DEFAULT now(), pid TEXT NOT NULL, nombre TEXT, texto TEXT NOT NULL,
            oculto BOOLEAN NOT NULL DEFAULT false, iphash TEXT, vid TEXT)`);
          await pool.query(`CREATE INDEX IF NOT EXISTS agenda_com_pid ON agenda_comentarios(pid, id DESC)`);
          await pool.query(`CREATE TABLE IF NOT EXISTS agenda_votos(
            pid TEXT NOT NULL, vid TEXT NOT NULL, valor SMALLINT NOT NULL, ts TIMESTAMPTZ NOT NULL DEFAULT now(), iphash TEXT,
            PRIMARY KEY(pid, vid))`);
          ready = true;
          console.log("[agenda] Postgres listo");
        } catch (e) { await new Promise((r) => setTimeout(r, 2000)); }
      }
      if (!ready) console.log("[agenda] Postgres no disponible");
    })();
  } catch (e) { console.log("[agenda] pg no instalado"); }
  const q = (sql, args) => pool.query(sql, args);
  const sinDB = (res) => json(res, 503, { ok: false, error: "Servicio temporalmente no disponible." });
  async function cuerpo(req, res, lim = 16384) {
    try { return JSON.parse(await readBody(req, lim)); } catch { json(res, 400, { ok: false, error: "Datos inválidos." }); return null; }
  }

  // caché corta del resumen (lo leen todas las páginas)
  let cache = { t: 0, v: null };

  return {
    "GET /agenda/resumen": async (req, res) => {
      if (!ready) return sinDB(res);
      if (Date.now() - cache.t < 30e3 && cache.v) return json(res, 200, cache.v);
      const v = await q(`SELECT pid, count(*) FILTER (WHERE valor=1)::int AS up, count(*) FILTER (WHERE valor=-1)::int AS down FROM agenda_votos GROUP BY pid`);
      const c = await q(`SELECT pid, count(*)::int AS n FROM agenda_comentarios WHERE NOT oculto GROUP BY pid`);
      const p = await q(`SELECT estado, count(*)::int AS n FROM agenda_propuestas GROUP BY estado`);
      const votos = {}, comentarios = {}, ciudadanas = { recibidas: 0 };
      v.rows.forEach((r) => (votos[r.pid] = [r.up, r.down]));
      c.rows.forEach((r) => (comentarios[r.pid] = r.n));
      p.rows.forEach((r) => { ciudadanas[r.estado] = r.n; ciudadanas.recibidas += r.n; });
      cache = { t: Date.now(), v: { ok: true, votos, comentarios, ciudadanas, ts: new Date().toISOString() } };
      return json(res, 200, cache.v);
    },

    "GET /agenda/comentarios": async (req, res) => {
      if (!ready) return sinDB(res);
      const pid = new URL(req.url, "http://x").searchParams.get("pid");
      if (pid && !PID.test(pid)) return json(res, 400, { ok: false, error: "Propuesta inválida." });
      const r = pid
        ? await q(`SELECT id, ts, pid, nombre, texto FROM agenda_comentarios WHERE pid=$1 AND NOT oculto ORDER BY id DESC LIMIT 200`, [pid])
        : await q(`SELECT id, ts, pid, nombre, texto FROM agenda_comentarios WHERE NOT oculto ORDER BY id DESC LIMIT 40`);
      return json(res, 200, { ok: true, comentarios: r.rows });
    },

    "POST /agenda/comentario": async (req, res) => {
      if (!ready) return sinDB(res);
      const ip = ipOf(req), h = hashIp(ip);
      if (limitado("c:" + h, 6, 10 * 60e3)) return json(res, 429, { ok: false, error: "Muchos comentarios seguidos; intenta en unos minutos." });
      const b = await cuerpo(req, res); if (!b) return;
      if (b.website) return json(res, 200, { ok: true });
      const pid = clean(b.pid, 12), nombre = txt(b.nombre, 60) || "Anónimo", texto = txt(b.texto, 1000);
      if (!PID.test(pid)) return json(res, 400, { ok: false, error: "Propuesta inválida." });
      if (texto.length < 5) return json(res, 400, { ok: false, error: "Escribe un comentario un poco más largo." });
      if (grosero(texto + " " + nombre)) return json(res, 400, { ok: false, error: "Tu comentario tiene palabras no permitidas." });
      if (enlaces(texto) > 1) return json(res, 400, { ok: false, error: "Máximo un enlace por comentario." });
      const vid = VID.test(b.vid || "") ? b.vid : null;
      const r = await q(`INSERT INTO agenda_comentarios(pid, nombre, texto, iphash, vid) VALUES($1,$2,$3,$4,$5) RETURNING id, ts`, [pid, nombre, texto, h, vid]);
      respaldo("agenda-comentarios.jsonl", { id: r.rows[0].id, ts: r.rows[0].ts, pid, nombre, texto, iphash: h });
      cache.t = 0;
      return json(res, 200, { ok: true, id: r.rows[0].id, ts: r.rows[0].ts });
    },

    "POST /agenda/voto": async (req, res) => {
      if (!ready) return sinDB(res);
      const h = hashIp(ipOf(req));
      if (limitado("v:" + h, 120, 10 * 60e3)) return json(res, 429, { ok: false, error: "Demasiados votos seguidos." });
      const b = await cuerpo(req, res, 2048); if (!b) return;
      const pid = clean(b.pid, 12), valor = +b.valor;
      if (!PID.test(pid) || !VID.test(b.vid || "") || ![1, -1, 0].includes(valor)) return json(res, 400, { ok: false, error: "Voto inválido." });
      if (valor === 0) await q(`DELETE FROM agenda_votos WHERE pid=$1 AND vid=$2`, [pid, b.vid]);
      else await q(`INSERT INTO agenda_votos(pid, vid, valor, iphash) VALUES($1,$2,$3,$4) ON CONFLICT (pid, vid) DO UPDATE SET valor=EXCLUDED.valor, ts=now()`, [pid, b.vid, valor, h]);
      const t = await q(`SELECT count(*) FILTER (WHERE valor=1)::int AS up, count(*) FILTER (WHERE valor=-1)::int AS down FROM agenda_votos WHERE pid=$1`, [pid]);
      cache.t = 0;
      return json(res, 200, { ok: true, up: t.rows[0].up, down: t.rows[0].down });
    },

    "POST /agenda/propuesta": async (req, res) => {
      if (!ready) return sinDB(res);
      const h = hashIp(ipOf(req));
      if (limitado("p:" + h, 3, 3600e3)) return json(res, 429, { ok: false, error: "Ya enviaste varias propuestas; intenta más tarde." });
      const b = await cuerpo(req, res); if (!b) return;
      if (b.website) return json(res, 200, { ok: true });
      const d = { titulo: txt(b.titulo, 220), eje: txt(b.eje, 60), problema: txt(b.problema, 2500), propuesta: txt(b.propuesta, 3500),
        beneficiarios: txt(b.beneficiarios, 800), entidades: txt(b.entidades, 400), costo: txt(b.costo, 60), region: txt(b.region, 40), autor: txt(b.autor, 80) };
      if (!b.acepto) return json(res, 400, { ok: false, error: "Debes aceptar las condiciones de publicación." });
      if (d.titulo.length < 10 || d.problema.length < 20 || d.propuesta.length < 20) return json(res, 400, { ok: false, error: "Completa título, problema y propuesta con un poco más de detalle." });
      if (grosero(Object.values(d).join(" "))) return json(res, 400, { ok: false, error: "La propuesta tiene palabras no permitidas." });
      if (enlaces(d.problema + d.propuesta) > 3) return json(res, 400, { ok: false, error: "Demasiados enlaces." });
      const r = await q(`INSERT INTO agenda_propuestas(titulo, eje, problema, propuesta, beneficiarios, entidades, costo, region, autor, iphash, ua)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, ts`,
        [d.titulo, d.eje, d.problema, d.propuesta, d.beneficiarios, d.entidades, d.costo, d.region, d.autor, h, clean(req.headers["user-agent"], 160)]);
      respaldo("agenda-propuestas.jsonl", { id: r.rows[0].id, ts: r.rows[0].ts, ...d, iphash: h });
      cache.t = 0;
      return json(res, 200, { ok: true, id: r.rows[0].id, codigo: "C-" + r.rows[0].id });
    },

    "GET /agenda/propuestas": async (req, res) => {
      if (!ready) return sinDB(res);
      const r = await q(`SELECT id, ts, estado, titulo, eje, problema, propuesta, beneficiarios, entidades, costo, region, autor
        FROM agenda_propuestas WHERE publicada ORDER BY (estado='incorporada') DESC, id DESC LIMIT 300`);
      return json(res, 200, { ok: true, propuestas: r.rows.map((x) => ({ ...x, codigo: "C-" + x.id })) });
    },

    // ---- moderación (token en el cuerpo; sin cabeceras personalizadas para no tocar CORS) ----
    "POST /agenda/admin/listar": async (req, res) => {
      const b = await cuerpo(req, res, 2048); if (!b) return;
      if (!esAdmin(b.token)) return json(res, 403, { ok: false, error: "No autorizado." });
      if (!ready) return sinDB(res);
      if (b.tipo === "comentarios") {
        const r = await q(`SELECT id, ts, pid, nombre, texto, oculto, iphash FROM agenda_comentarios ORDER BY id DESC LIMIT 500`);
        return json(res, 200, { ok: true, items: r.rows });
      }
      const r = await q(`SELECT id, ts, estado, publicada, titulo, eje, problema, propuesta, beneficiarios, entidades, costo, region, autor, nota_admin, iphash
        FROM agenda_propuestas ORDER BY id DESC LIMIT 500`);
      return json(res, 200, { ok: true, items: r.rows });
    },
    "POST /agenda/admin/estado": async (req, res) => {
      const b = await cuerpo(req, res, 4096); if (!b) return;
      if (!esAdmin(b.token)) return json(res, 403, { ok: false, error: "No autorizado." });
      if (!ready) return sinDB(res);
      if (!ESTADOS.includes(b.estado)) return json(res, 400, { ok: false, error: "Estado inválido." });
      const publicada = b.estado === "publicada" || b.estado === "incorporada" ? true : b.estado === "archivada" || b.estado === "recibida" ? false : !!b.publicada;
      await q(`UPDATE agenda_propuestas SET estado=$2, publicada=$3, nota_admin=COALESCE($4, nota_admin) WHERE id=$1`, [+b.id, b.estado, publicada, b.nota ? txt(b.nota, 500) : null]);
      cache.t = 0;
      return json(res, 200, { ok: true });
    },
    "POST /agenda/admin/ocultar": async (req, res) => {
      const b = await cuerpo(req, res, 2048); if (!b) return;
      if (!esAdmin(b.token)) return json(res, 403, { ok: false, error: "No autorizado." });
      if (!ready) return sinDB(res);
      await q(`UPDATE agenda_comentarios SET oculto=$2 WHERE id=$1`, [+b.id, b.oculto !== false]);
      cache.t = 0;
      return json(res, 200, { ok: true });
    },
  };
};
