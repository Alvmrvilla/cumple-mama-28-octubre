const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "cambia-esta-clave";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id SERIAL PRIMARY KEY,
      name TEXT,
      attending BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
initDb().catch(err => console.error("Database initialization error:", err));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/api/rsvp", async (req, res) => {
  try {
    const { name = "", attending } = req.body || {};
    if (typeof attending !== "boolean") {
      return res.status(400).json({error:"Respuesta inválida."});
    }
    if (attending && !String(name).trim()) {
      return res.status(400).json({error:"El nombre es obligatorio para confirmar asistencia."});
    }

    await pool.query(
      "INSERT INTO rsvps (name, attending) VALUES ($1, $2)",
      [attending ? String(name).trim().slice(0,80) : null, attending]
    );

    res.json({ok:true});
  } catch (err) {
    console.error(err);
    res.status(500).json({error:"No se pudo guardar la respuesta. Inténtalo de nuevo."});
  }
});

app.get("/admin", async (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(401).send("No autorizado.");

  try {
    const { rows } = await pool.query(`
      SELECT id, name, attending, created_at
      FROM rsvps ORDER BY id DESC
    `);

    const yes = rows.filter(r => r.attending);
    const no = rows.filter(r => !r.attending);

    const list = yes.map(r =>
      `<li><strong>${escapeHtml(r.name)}</strong><small>${new Date(r.created_at).toLocaleString("es-SV")}</small></li>`
    ).join("");

    res.send(`<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Confirmaciones</title><style>
    body{font-family:Arial;background:#f4f7fa;margin:0;padding:25px;color:#26364a}
    .box{max-width:650px;margin:auto;background:white;padding:25px;border-radius:18px;box-shadow:0 8px 30px #0001}
    h1{margin-top:0}.stats{display:flex;gap:12px;flex-wrap:wrap}.stat{padding:15px;border-radius:12px;background:#eef6fb}
    ul{padding:0;list-style:none}li{padding:13px 0;border-bottom:1px solid #eee}small{display:block;color:#888;margin-top:4px}
    </style></head><body><div class="box"><h1>Confirmaciones</h1>
    <div class="stats"><div class="stat">❤️ Asistirán: <b>${yes.length}</b></div>
    <div class="stat">❌ No asistirán: <b>${no.length}</b></div>
    <div class="stat">👥 Total: <b>${rows.length}</b></div></div>
    <h2>Personas que asistirán</h2><ul>${list || "<li>Aún no hay confirmaciones.</li>"}</ul>
    </div></body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error consultando las confirmaciones.");
  }
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

app.get("/health", (req,res) => res.json({ok:true}));

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
