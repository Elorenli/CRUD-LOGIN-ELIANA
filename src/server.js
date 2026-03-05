import express from "express";
import sqlite3 from "sqlite3";
import jwt from "jsonwebtoken";
import cors from "cors";
import bcrypt from "bcrypt";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;
const SECRET = "mi_clave_secreta";

app.use(cors());
app.use(express.json());

const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database("./database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tareas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarea TEXT,
      usuario_id INTEGER,
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    )
  `);
});

function verificarToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).json({ error: "Token requerido" });

  jwt.verify(token, SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ error: "Token inválido" });

    req.usuario = usuario;
    next();
  });
}

// Registro con email
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Validar que todos los campos estén presentes
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Email no válido" });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const stmt = db.prepare("INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)");
    const result = stmt.run(username, email, hash);
    res.json({ 
      mensaje: "Usuario registrado correctamente", 
      id: result.lastInsertRowid 
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: usuarios.username')) {
      return res.status(400).json({ error: "El nombre de usuario ya existe" });
    } else if (err.message.includes('UNIQUE constraint failed: usuarios.email')) {
      return res.status(400).json({ error: "El email ya está registrado" });
    } else {
      return res.status(400).json({ error: "Error al registrar usuario" });
    }
  }
});

// Login con username o email
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Buscar por username o email
  const stmt = db.prepare("SELECT * FROM usuarios WHERE username = ? OR email = ?");
  const user = stmt.get(username, username);

  if (!user) {
    return res.status(400).json({ error: "Usuario o email no existe" });
  }

  bcrypt.compare(password, user.password, (err, valido) => {
    if (!valido) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  });
});

// Rutas de tareas (sin cambios)
app.get("/tarea", verificarToken, (req, res) => {
  const stmt = db.prepare("SELECT * FROM tareas WHERE usuario_id = ?");
  const rows = stmt.all(req.usuario.id);
  res.json(rows);
});

app.post("/tarea", verificarToken, (req, res) => {
  const { tarea } = req.body;

  const stmt = db.prepare("INSERT INTO tareas (tarea, usuario_id) VALUES (?, ?)");
  const result = stmt.run(tarea, req.usuario.id);
  
  res.json({ id: result.lastInsertRowid, tarea });
});

app.put("/tarea/:id", verificarToken, (req, res) => {
  const { tarea } = req.body;

  const stmt = db.prepare("UPDATE tareas SET tarea = ? WHERE id = ? AND usuario_id = ?");
  stmt.run(tarea, req.params.id, req.usuario.id);
  
  res.json({ mensaje: "Tarea actualizada" });
});

app.delete("/tarea/:id", verificarToken, (req, res) => {
  const stmt = db.prepare("DELETE FROM tareas WHERE id = ? AND usuario_id = ?");
  stmt.run(req.params.id, req.usuario.id);
  
  res.json({ mensaje: "Tarea eliminada" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});