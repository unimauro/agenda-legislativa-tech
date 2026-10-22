// agenda.js — Participación ciudadana de la "Agenda Legislativa Tech Perú" (api.tunky.net/agenda/*)
// Propuestas ciudadanas (moderadas), votos 👍/👎 por dispositivo y comentarios por propuesta.
// Persistencia: Postgres (api-tunky-db); sin respaldos en archivo para que borrar sea borrar (Ley 29733).
// Foro: respuestas en hilo (parent) en cualquier propuesta y temas generales (T-n) abiertos por la ciudadanía.
// Seguridad: CORS del server (ALLOW_ORIGINS), rate-limit por IP, honeypot, filtro de groserías, máx. 1 enlace,
// IP guardada solo como hash (sha256 con sal = ADMIN_TOKEN), admin con token en el cuerpo (timingSafeEqual) y con
// límite de intentos, tope de votos por red y propuesta, cuerpo acotado con 413 (sin cortar la conexión).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


const PANEL = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Moderación · Agenda Legislativa Tech</title>
<style nonce="__N__">body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#0f1115;color:#ece8e1}main{max-width:1100px;margin:0 auto;padding:20px 16px}
input,select,button,textarea{font:inherit}input{padding:9px 11px;border-radius:9px;border:1px solid #2b303a;background:#171a21;color:inherit}
button{cursor:pointer;border-radius:999px;border:1px solid #2b303a;background:#171a21;color:inherit;padding:6px 12px}button.on,button.pri{background:#c8102e;border-color:#c8102e;color:#fff}
.it{border:1px solid #2b303a;border-radius:12px;padding:12px 14px;margin:10px 0;background:#171a21}.it.off{opacity:.45}.m{color:#9a9488;font-size:12.5px}p{white-space:pre-line;margin:6px 0}
.tabs,.acts{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}h1{font-size:26px}</style></head>
<body><main><h1>Moderación · Agenda Legislativa Tech</h1>
<p class="m">El token queda solo en la memoria de esta pestaña (se pierde al recargar). Panel servido por api.tunky.net con CSP estricta.</p>
<form id="tk"><input id="tok" type="password" autocomplete="off" placeholder="ADMIN_TOKEN" size="40"> <button class="pri">Entrar</button> <span id="st" class="m"></span></form>
<div class="tabs"><button data-t="propuestas" class="on">Propuestas</button><button data-t="comentarios">Comentarios</button><button data-t="temas">Temas del foro</button></div>
<div id="out"></div></main>
<script nonce="__N__">
(()=>{let TOKEN="",tipo="propuestas";const $=s=>document.querySelector(s);
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const api=(r,b)=>fetch("/agenda/admin/"+r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({token:TOKEN},b))}).then(x=>x.json()).catch(()=>({ok:false,error:"Sin conexión"}));
$("#tk").onsubmit=e=>{e.preventDefault();TOKEN=$("#tok").value;$("#tok").value="";cargar()};
document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{tipo=b.dataset.t;document.querySelectorAll("[data-t]").forEach(x=>x.classList.toggle("on",x===b));cargar()});
const EST=["recibida","en-revision","publicada","incorporada","archivada"];
async function cargar(){if(!TOKEN)return;$("#st").textContent="Cargando…";const j=await api("listar",{tipo});
 if(!j.ok){$("#st").textContent="⚠️ "+j.error;if(j.error==="No autorizado.")TOKEN="";return}$("#st").textContent=j.items.length+" registros";const out=$("#out");
 if(tipo==="propuestas"){out.innerHTML=j.items.map(p=>'<div class="it"><b>C-'+(+p.id)+' · '+E(p.titulo)+'</b><div class="m">'+E(p.estado)+' · '+E(p.eje)+' · '+E(p.region)+' · '+E(String(p.ts).slice(0,16))+' · '+E(p.autor||"—")+' · red '+E(p.iphash)+'</div><p><b>Problema:</b> '+E(p.problema)+'</p><p><b>Propuesta:</b> '+E(p.propuesta)+'</p><p class="m">Beneficia: '+E(p.beneficiarios)+' · Entidades: '+E(p.entidades)+' · Costo: '+E(p.costo)+'</p><input data-nota="'+(+p.id)+'" placeholder="Nota (opcional)" value="'+E(p.nota_admin||"")+'" size="60"><div class="acts">'+EST.map(s=>'<button data-id="'+(+p.id)+'" data-e="'+s+'"'+(s===p.estado?' class="on"':'')+'>'+s+'</button>').join("")+'</div></div>').join("");
  out.querySelectorAll("[data-e]").forEach(b=>b.onclick=async()=>{const r=await api("estado",{id:+b.dataset.id,estado:b.dataset.e,nota:out.querySelector('[data-nota="'+b.dataset.id+'"]').value});if(!r.ok)$("#st").textContent="⚠️ "+r.error;cargar()});return}
 const t=tipo==="temas";out.innerHTML=j.items.map(c=>'<div class="it'+(c.oculto?' off':'')+'"><b>'+(t?'T-'+(+c.id)+' · '+E(c.titulo):'#'+(+c.id)+' en '+E(c.pid)+(c.parent?' (resp. a '+(+c.parent)+')':''))+'</b><div class="m">'+E(c.nombre)+' · '+E(String(c.ts).slice(0,16))+(t?' · '+E(c.categoria):'')+' · red '+E(c.iphash)+'</div><p>'+E(c.texto)+'</p><button data-o="'+(+c.id)+'" data-v="'+(!c.oculto)+'">'+(c.oculto?'Mostrar':'Ocultar')+'</button></div>').join("");
 out.querySelectorAll("[data-o]").forEach(b=>b.onclick=async()=>{await api("ocultar",{tipo:t?"tema":"comentario",id:+b.dataset.o,oculto:b.dataset.v==="true"});cargar()});}
})();
</script></body></html>`;

module.exports = function makeAgenda({ DATA_DIR, json: jsonBase, clean }) {
  const json = (res, code, obj) => { res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Cache-Control", "no-store"); jsonBase(res, code, obj); };
  const ADMIN = process.env.ADMIN_TOKEN || "";
  const PID = /^((IA|CIB|GOB|CON|ECO|TAL|SOB|DER)-\d{2}|[CT]-\d{1,7})$/;
  const MAXEJE = { IA: 14, CIB: 14, GOB: 14, CON: 14, ECO: 14, TAL: 14, SOB: 8, DER: 8 }; // propuestas publicadas por eje
  const entero = (v) => (Number.isInteger(+v) && +v > 0 && +v < 1e9 ? +v : null);
  // datos personales evidentes (DNI, celular, correo): se rechazan para proteger a quien comenta y a terceros
  const PII = /\b\d{8}\b|\b9\d{2}[\s-]?\d{3}[\s-]?\d{3}\b|[\w.+-]+@[\w-]+\.[\w.]+/;
  const CATEGORIAS = ["ideas", "dudas", "debate", "regiones", "otros"];
  const VOTOS_POR_RED = 5; // votos distintos por propuesta desde una misma red (IP); holgura para colegios y universidades
  const VID = /^[a-zA-Z0-9_-]{8,64}$/;
  const ESTADOS = ["recibida", "en-revision", "publicada", "incorporada", "archivada"];
  const BAD = ["mierda", "puta", "puto", "verga", "concha tu", "ctm", "pendejo", "cojud", "chucha", "reconcha", "conchatumadre", "maric", "huevon de mierda"];
  const ipOf = (req) => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
  // Sal propia (independiente del token), generada una vez y guardada en el volumen de datos.
  const SAL = (() => { const p = path.join(DATA_DIR, "agenda-salt"); try { return fs.readFileSync(p, "utf8").trim(); } catch { const s = crypto.randomBytes(32).toString("hex"); try { fs.writeFileSync(p, s, { mode: 0o600 }); } catch (e) {} return s; } })();
  const hashIp = (ip) => crypto.createHash("sha256").update(SAL + "|ip|" + ip).digest("hex").slice(0, 24);
  const hashVid = (v) => crypto.createHash("sha256").update(SAL + "|vid|" + v).digest("hex").slice(0, 32);
  const txt = (s, n) => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, n);
  const grosero = (s) => { const t = s.toLowerCase(); return BAD.some((b) => t.includes(b)); };
  const enlaces = (s) => (s.match(/https?:\/\/|www\./gi) || []).length;

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
          await pool.query(`ALTER TABLE agenda_comentarios ADD COLUMN IF NOT EXISTS parent BIGINT`);
          await pool.query(`CREATE TABLE IF NOT EXISTS agenda_temas(
            id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ NOT NULL DEFAULT now(), titulo TEXT NOT NULL, texto TEXT NOT NULL,
            nombre TEXT, categoria TEXT, oculto BOOLEAN NOT NULL DEFAULT false, iphash TEXT)`);
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
  // Lee el cuerpo sin destruir el socket: si excede el límite, descarta el resto y responde 413 al terminar.
  function leer(req, lim) {
    return new Promise((ok, mal) => {
      let buf = "", grande = false;
      req.on("data", (c) => { if (grande) return; buf += c; if (buf.length > lim) { grande = true; buf = ""; } });
      req.on("end", () => (grande ? mal(Object.assign(new Error("payload"), { code: 413 })) : ok(buf)));
      req.on("error", mal);
    });
  }
  async function cuerpo(req, res, lim = 16384) {
    let raw;
    try { raw = await leer(req, lim); } catch (e) { json(res, e.code === 413 ? 413 : 400, { ok: false, error: e.code === 413 ? "Contenido demasiado grande." : "Datos inválidos." }); return null; }
    try { const o = JSON.parse(raw); if (!o || typeof o !== "object" || Array.isArray(o)) throw 0; return o; } catch { json(res, 400, { ok: false, error: "Datos inválidos." }); return null; }
  }
  // admin: máx. 10 intentos por red cada 15 min (antifuerza bruta)
  async function admin(req, res, lim = 4096) {
    const h = hashIp(ipOf(req));
    if (limitado("a:" + h, 10, 15 * 60e3)) { json(res, 429, { ok: false, error: "Demasiados intentos." }); return null; }
    const b = await cuerpo(req, res, lim); if (!b) return null;
    if (!esAdmin(b.token)) { json(res, 403, { ok: false, error: "No autorizado." }); return null; }
    if (!ready) { sinDB(res); return null; }
    return b;
  }
  // ¿se puede comentar/votar en este pid? (las ciudadanas deben estar publicadas y los temas visibles)
  async function pidValido(pid) {
    if (!PID.test(pid)) return false;
    const m = pid.match(/^([A-Z]+)-(\d+)$/);
    if (MAXEJE[m[1]]) return +m[2] >= 1 && +m[2] <= MAXEJE[m[1]];
    if (pid[0] === "C") return (await q(`SELECT 1 FROM agenda_propuestas WHERE id=$1 AND publicada`, [+pid.slice(2)])).rowCount > 0;
    if (pid[0] === "T") return (await q(`SELECT 1 FROM agenda_temas WHERE id=$1 AND NOT oculto`, [+pid.slice(2)])).rowCount > 0;
    return true;
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
        ? await q(`SELECT id, ts, pid, parent, nombre, texto FROM agenda_comentarios WHERE pid=$1 AND NOT oculto ORDER BY id ASC LIMIT 500`, [pid])
        : await q(`SELECT id, ts, pid, parent, nombre, texto FROM agenda_comentarios WHERE NOT oculto ORDER BY id DESC LIMIT 40`);
      return json(res, 200, { ok: true, comentarios: r.rows });
    },

    "POST /agenda/comentario": async (req, res) => {
      if (!ready) return sinDB(res);
      const ip = ipOf(req), h = hashIp(ip);
      if (limitado("c:" + h, 6, 10 * 60e3)) return json(res, 429, { ok: false, error: "Muchos comentarios seguidos; intenta en unos minutos." });
      const b = await cuerpo(req, res); if (!b) return;
      if (b.website) return json(res, 200, { ok: true });
      const pid = clean(b.pid, 12), nombre = txt(b.nombre, 60) || "Anónimo", texto = txt(b.texto, 1000);
      if (!(await pidValido(pid))) return json(res, 400, { ok: false, error: "Propuesta o tema inválido." });
      let parent = null;
      if (b.parent != null) {
        parent = entero(b.parent);
        if (!parent) return json(res, 400, { ok: false, error: "Comentario a responder inválido." });
        const pr = await q(`SELECT parent FROM agenda_comentarios WHERE id=$1 AND pid=$2 AND NOT oculto`, [parent, pid]);
        if (!pr.rowCount) return json(res, 400, { ok: false, error: "Comentario a responder inválido." });
        if (pr.rows[0].parent) parent = +pr.rows[0].parent; // un solo nivel de hilo
      }
      if (texto.length < 5) return json(res, 400, { ok: false, error: "Escribe un comentario un poco más largo." });
      if (grosero(texto + " " + nombre)) return json(res, 400, { ok: false, error: "Tu comentario tiene palabras no permitidas." });
      if (enlaces(texto) > 1) return json(res, 400, { ok: false, error: "Máximo un enlace por comentario." });
      if (PII.test(texto + " " + nombre)) return json(res, 400, { ok: false, error: "No incluyas DNI, teléfonos ni correos en comentarios públicos." });
      const vid = VID.test(b.vid || "") ? hashVid(b.vid) : null;
      const r = await q(`INSERT INTO agenda_comentarios(pid, parent, nombre, texto, iphash, vid) VALUES($1,$2,$3,$4,$5,$6) RETURNING id, ts`, [pid, parent, nombre, texto, h, vid]);
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
      if (!(await pidValido(pid))) return json(res, 400, { ok: false, error: "Voto inválido." });
      if (valor !== 0) {
        const red = await q(`SELECT count(*)::int AS n FROM agenda_votos WHERE pid=$1 AND iphash=$2 AND vid<>$3`, [pid, h, hashVid(b.vid)]);
        if (red.rows[0].n >= VOTOS_POR_RED) return json(res, 429, { ok: false, error: "Se alcanzó el límite de votos desde tu red para esta propuesta." });
      }
      const hv = hashVid(b.vid);
      if (valor === 0) await q(`DELETE FROM agenda_votos WHERE pid=$1 AND vid=$2`, [pid, hv]);
      else await q(`INSERT INTO agenda_votos(pid, vid, valor, iphash) VALUES($1,$2,$3,$4) ON CONFLICT (pid, vid) DO UPDATE SET valor=EXCLUDED.valor, ts=now()`, [pid, hv, valor, h]);
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
      if (PII.test(Object.values(d).join(" "))) return json(res, 400, { ok: false, error: "No incluyas DNI, teléfonos ni correos: la propuesta será pública." });
      const r = await q(`INSERT INTO agenda_propuestas(titulo, eje, problema, propuesta, beneficiarios, entidades, costo, region, autor, iphash)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, ts`,
        [d.titulo, d.eje, d.problema, d.propuesta, d.beneficiarios, d.entidades, d.costo, d.region, d.autor, h]);
      cache.t = 0;
      return json(res, 200, { ok: true, id: r.rows[0].id, codigo: "C-" + r.rows[0].id });
    },

    "GET /agenda/propuestas": async (req, res) => {
      if (!ready) return sinDB(res);
      const r = await q(`SELECT id, ts, estado, titulo, eje, problema, propuesta, beneficiarios, entidades, costo, region, autor
        FROM agenda_propuestas WHERE publicada ORDER BY (estado='incorporada') DESC, id DESC LIMIT 300`);
      return json(res, 200, { ok: true, propuestas: r.rows.map((x) => ({ ...x, codigo: "C-" + x.id })) });
    },


    // ---- panel de moderación servido desde api.tunky.net (origen propio, cabeceras reales; token solo en memoria) ----
    "GET /agenda/admin": (req, res) => {
      const n = crypto.randomBytes(16).toString("base64");
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow",
        "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${n}'; style-src 'nonce-${n}'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
      });
      res.end(PANEL.replace(/__N__/g, n));
    },
    // ---- moderación (token en el cuerpo; sin cabeceras personalizadas para no tocar CORS) ----
    "POST /agenda/admin/listar": async (req, res) => {
      const b = await admin(req, res); if (!b) return;
      if (b.tipo === "temas") {
        const r = await q(`SELECT id, ts, titulo, texto, nombre, categoria, oculto, iphash FROM agenda_temas ORDER BY id DESC LIMIT 500`);
        return json(res, 200, { ok: true, items: r.rows });
      }
      if (b.tipo === "comentarios") {
        const r = await q(`SELECT id, ts, pid, parent, nombre, texto, oculto, iphash FROM agenda_comentarios ORDER BY id DESC LIMIT 500`);
        return json(res, 200, { ok: true, items: r.rows });
      }
      const r = await q(`SELECT id, ts, estado, publicada, titulo, eje, problema, propuesta, beneficiarios, entidades, costo, region, autor, nota_admin, iphash
        FROM agenda_propuestas ORDER BY id DESC LIMIT 500`);
      return json(res, 200, { ok: true, items: r.rows });
    },
    "POST /agenda/admin/estado": async (req, res) => {
      const b = await admin(req, res); if (!b) return;
      if (!ESTADOS.includes(b.estado)) return json(res, 400, { ok: false, error: "Estado inválido." });
      const publicada = b.estado === "publicada" || b.estado === "incorporada" ? true : b.estado === "archivada" || b.estado === "recibida" ? false : !!b.publicada;
      await q(`UPDATE agenda_propuestas SET estado=$2, publicada=$3, nota_admin=COALESCE($4, nota_admin) WHERE id=$1`, [entero(b.id), b.estado, publicada, b.nota ? txt(b.nota, 500) : null]);
      cache.t = 0;
      return json(res, 200, { ok: true });
    },
    "POST /agenda/admin/ocultar": async (req, res) => {
      const b = await admin(req, res); if (!b) return;
      const tabla = b.tipo === "tema" ? "agenda_temas" : "agenda_comentarios";
      if (!entero(b.id)) return json(res, 400, { ok: false, error: "Id inválido." });
      await q(`UPDATE ${tabla} SET oculto=$2 WHERE id=$1`, [entero(b.id), b.oculto !== false]);
      cache.t = 0;
      return json(res, 200, { ok: true });
    },

    // ---- foro general ----
    "GET /agenda/temas": async (req, res) => {
      if (!ready) return sinDB(res);
      const r = await q(`SELECT t.id, t.ts, t.titulo, t.texto, t.nombre, t.categoria,
          (SELECT count(*)::int FROM agenda_comentarios c WHERE c.pid='T-'||t.id AND NOT c.oculto) AS respuestas,
          (SELECT max(c.ts) FROM agenda_comentarios c WHERE c.pid='T-'||t.id AND NOT c.oculto) AS ultima,
          (SELECT count(*)::int FROM agenda_votos v WHERE v.pid='T-'||t.id AND v.valor=1) AS apoyos
        FROM agenda_temas t WHERE NOT t.oculto ORDER BY COALESCE((SELECT max(c.ts) FROM agenda_comentarios c WHERE c.pid='T-'||t.id AND NOT c.oculto), t.ts) DESC LIMIT 300`);
      return json(res, 200, { ok: true, temas: r.rows.map((x) => ({ ...x, codigo: "T-" + x.id })) });
    },
    "POST /agenda/tema": async (req, res) => {
      if (!ready) return sinDB(res);
      const h = hashIp(ipOf(req));
      if (limitado("t:" + h, 3, 3600e3)) return json(res, 429, { ok: false, error: "Ya abriste varios temas; intenta más tarde." });
      const b = await cuerpo(req, res, 8192); if (!b) return;
      if (b.website) return json(res, 200, { ok: true });
      const titulo = txt(b.titulo, 160), texto = txt(b.texto, 3000), nombre = txt(b.nombre, 60) || "Anónimo";
      const categoria = CATEGORIAS.includes(b.categoria) ? b.categoria : "otros";
      if (titulo.length < 8 || texto.length < 15) return json(res, 400, { ok: false, error: "Escribe un título y un texto un poco más largos." });
      if (grosero(titulo + " " + texto + " " + nombre)) return json(res, 400, { ok: false, error: "El tema tiene palabras no permitidas." });
      if (enlaces(texto) > 2) return json(res, 400, { ok: false, error: "Máximo dos enlaces." });
      if (PII.test(titulo + " " + texto + " " + nombre)) return json(res, 400, { ok: false, error: "No incluyas DNI, teléfonos ni correos en el foro." });
      const r = await q(`INSERT INTO agenda_temas(titulo, texto, nombre, categoria, iphash) VALUES($1,$2,$3,$4,$5) RETURNING id, ts`, [titulo, texto, nombre, categoria, h]);
      cache.t = 0;
      return json(res, 200, { ok: true, id: r.rows[0].id, codigo: "T-" + r.rows[0].id });
    },
  };
};
