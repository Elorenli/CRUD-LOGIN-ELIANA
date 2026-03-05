<script setup>
import { onMounted, ref } from "vue";

const logueado = ref(false);
const username = ref("");
const password = ref("");
// Refs para el registro con email
const registroUsername = ref("");
const registroEmail = ref("");
const registroPassword = ref("");
const modo = ref("login"); // 'login' o 'registro'

// Cambiar tareas a ref reactive
const tareas = ref([]);
let idEditando = null;
let idEliminando = null;

if (localStorage.getItem("token")) {
  logueado.value = true;
}

async function iniciarSesion() {
  const res = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
    logueado.value = true;
    await cargarTareas();
  } else {
    alert(data.error);
  }
}

// Función para registrar con email
async function registrar() {
  // Validación básica
  if (!registroUsername.value || !registroEmail.value || !registroPassword.value) {
    alert("Por favor completa todos los campos");
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registroEmail.value)) {
    alert("Por favor ingresa un email válido");
    return;
  }

  const res = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: registroUsername.value,
      email: registroEmail.value,
      password: registroPassword.value
    })
  });
  const data = await res.json();
  if (data.mensaje) {
    alert("Usuario registrado correctamente. Ahora puedes iniciar sesión.");
    modo.value = "login";
    // Limpiar campos de registro
    registroUsername.value = "";
    registroEmail.value = "";
    registroPassword.value = "";
    // Auto-completar el username en el login
    username.value = registroUsername.value;
  } else {
    alert(data.error);
  }
}

function cerrarSesion() {
  localStorage.removeItem("token");
  logueado.value = false;
  tareas.value = []; // Limpiar tareas al cerrar sesión
}

async function cargarTareas() {
  if (!logueado.value) return;
  try {
    const respuesta = await fetch("http://localhost:3000/tarea", {
      headers: {
        Authorization: localStorage.getItem("token")
      }
    });
    
    if (respuesta.status === 401) {
      cerrarSesion();
      return;
    }
    
    const data = await respuesta.json();
    tareas.value = data; // Asignar a tareas.value
  } catch (error) {
    console.error("Error al cargar tareas:", error);
    alert("Error al cargar las tareas");
  }
}

// Funciones para editar y eliminar
function editarTarea(id) {
  idEditando = id;
  // Buscar la tarea para precargar los datos en el modal
  const tarea = tareas.value.find(t => t.id === id);
  if (tarea) {
    const [nombre, descripcion] = tarea.tarea.split(" - ");
    setTimeout(() => {
      document.getElementById("editar-nombre").value = nombre || "";
      document.getElementById("editar-descripcion").value = descripcion || "";
    }, 100);
  }
  document.getElementById("modal-editar").style.display = "flex";
}

function eliminarTarea(id) {
  idEliminando = id;
  document.getElementById("modal-eliminar").style.display = "flex";
}

onMounted(() => {
  const formCrear = document.getElementById("form-crear");
  const formEditar = document.getElementById("form-editar");
  const btnCancelarEditar = document.getElementById("cancelar-edicion");
  const btnConfirmarEliminar = document.getElementById("confirmar-eliminar");
  const btnCancelarEliminar = document.getElementById("cancelar-eliminar");

  formCrear?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("Nombre").value;
    const descripcion = document.getElementById("text").value;
    
    try {
      await fetch("http://localhost:3000/tarea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({
          tarea: nombre + " - " + descripcion
        })
      });
      formCrear.reset();
      await cargarTareas();
    } catch (error) {
      console.error("Error al crear tarea:", error);
      alert("Error al crear la tarea");
    }
  });

  formEditar?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevoTexto = document.getElementById("editar-nombre").value + " - " + document.getElementById("editar-descripcion").value;
    
    try {
      await fetch(`http://localhost:3000/tarea/${idEditando}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({
          tarea: nuevoTexto
        })
      });
      document.getElementById("modal-editar").style.display = "none";
      await cargarTareas();
    } catch (error) {
      console.error("Error al editar tarea:", error);
      alert("Error al editar la tarea");
    }
  });

  btnConfirmarEliminar?.addEventListener("click", async () => {
    try {
      await fetch(`http://localhost:3000/tarea/${idEliminando}`, {
        method: "DELETE",
        headers: {
          Authorization: localStorage.getItem("token")
        }
      });
      document.getElementById("modal-eliminar").style.display = "none";
      await cargarTareas();
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      alert("Error al eliminar la tarea");
    }
  });

  btnCancelarEditar?.addEventListener("click", () => {
    document.getElementById("modal-editar").style.display = "none";
  });

  btnCancelarEliminar?.addEventListener("click", () => {
    document.getElementById("modal-eliminar").style.display = "none";
  });

  if (logueado.value) {
    cargarTareas();
  }
});
</script>

<template>
  <div v-if="!logueado" class="login-container">
    <div class="tabs">
      <button 
        :class="['tab', { 'active': modo === 'login' }]" 
        @click="modo = 'login'"
      >
        Iniciar Sesión
      </button>
      <button 
        :class="['tab', { 'active': modo === 'registro' }]" 
        @click="modo = 'registro'"
      >
        Registrarse
      </button>
    </div>

    <!-- Formulario de Login -->
    <div v-if="modo === 'login'" class="form-container">
      <h2>Iniciar Sesión</h2>
      <input 
        v-model="username" 
        type="text" 
        placeholder="Usuario o Email" 
        @keyup.enter="iniciarSesion"
      />
      <input 
        v-model="password" 
        type="password" 
        placeholder="Contraseña" 
        @keyup.enter="iniciarSesion"
      />
      <button @click="iniciarSesion">Entrar</button>
      <p class="cambiar-modo">
        ¿No tienes cuenta? 
        <a href="#" @click.prevent="modo = 'registro'">Regístrate aquí</a>
      </p>
    </div>

    <!-- Formulario de Registro con Email -->
    <div v-else class="form-container">
      <h2>Registrarse</h2>
      <input 
        v-model="registroUsername" 
        type="text" 
        placeholder="Nombre de usuario" 
        required
        @keyup.enter="registrar"
      />
      <input 
        v-model="registroEmail" 
        type="email" 
        placeholder="Correo electrónico" 
        required
        @keyup.enter="registrar"
      />
      <input 
        v-model="registroPassword" 
        type="password" 
        placeholder="Contraseña" 
        required
        @keyup.enter="registrar"
      />
      <button @click="registrar">Registrarse</button>
      <p class="cambiar-modo">
        ¿Ya tienes cuenta? 
        <a href="#" @click.prevent="modo = 'login'">Inicia sesión aquí</a>
      </p>
    </div>
  </div>

  <div v-else>
    <header>
      <h1>Gestor de tareas</h1>
      <button @click="cerrarSesion">Cerrar sesión</button>
    </header>

    <form id="form-crear" class="max-w-sm mx-auto">
      <div class="mb-5">
        <label for="Nombre">Nombre de tarea</label>
        <input type="text" id="Nombre" required />
      </div>
      <div class="mb-5">
        <label for="text">Descripción</label>
        <input type="text" id="text" required />
      </div>
      <button type="submit">Subir</button>
    </form>

    <section>
      <h1>Tareas</h1>
      
      <!-- Mostrar mensaje si no hay tareas -->
      <div v-if="tareas.length === 0" class="no-tareas">
        No hay tareas aún. Crea una nueva.
      </div>
      
      <!-- Lista de tareas con Vue -->
      <div v-else class="lista-tareas">
        <div v-for="tarea in tareas" :key="tarea.id" class="tarea">
          <div class="tarea-info">
            <h3>{{ tarea.tarea }}</h3>
          </div>
          <div class="tarea-acciones">
            <button class="btn-editar" @click="editarTarea(tarea.id)">Editar</button>
            <button class="btn-eliminar" @click="eliminarTarea(tarea.id)">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- Modal Editar -->
      <div id="modal-editar" class="modal">
        <div class="modal-contenido">
          <h2>Editar tarea</h2>
          <form id="form-editar">
            <label for="editar-nombre">Nombre</label>
            <input type="text" id="editar-nombre" required />
            <label for="editar-descripcion">Descripción</label>
            <input type="text" id="editar-descripcion" />
            <div style="margin-top:12px;">
              <button type="submit">Guardar cambios</button>
              <button type="button" id="cancelar-edicion">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Modal Eliminar -->
    <div id="modal-eliminar" class="modal">
      <div class="modal-contenido">
        <h2>¿Eliminar tarea?</h2>
        <p>Esta acción no se puede deshacer.</p>
        <div style="margin-top:12px;">
          <button id="confirmar-eliminar">Eliminar</button>
          <button id="cancelar-eliminar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
:root {
  --color-50: #440649;
  --color-100: #F4BDFA;
  --color-200: #EC92F6;
  --color-300: #E568F3;
  --color-400: #DE3EEF;
  --color-500: #D613EC;
  --color-600: #B010C1;
  --color-700: #890C97;
  --color-800: #5D0866;
  --color-900: #3C0542;
  --color-950: #150218;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Poppins", "Segoe UI", sans-serif;
}

body {
  background: linear-gradient(135deg, var(--color-50), var(--color-100));
  padding: 40px;
  color: #5a3b3b;
}

header {
  background: rgb(103, 30, 105);
  padding: 18px 25px;
  border-radius: 20px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

header h1 {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-400);
}

header button {
  background: var(--color-200);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  color: rgb(129, 28, 124);
  font-weight: 500;
  transition: 0.3s;
}

header button:hover {
  background: var(--color-300);
}

.login-container {
  background: rgb(255, 255, 255);
  padding: 0;
  border-radius: 25px;
  width: 400px;
  margin: 100px auto;
  box-shadow: 0 15px 35px rgba(0,0,0,0.08);
  overflow: hidden;
}

.tabs {
  display: flex;
  background: var(--color-50);
}

.tab {
  flex: 1;
  padding: 15px;
  border: none;
  background: transparent;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: 0.3s;
  font-size: 1rem;
}

.tab.active {
  background: var(--color-300);
  color: white;
}

.tab:hover {
  background: var(--color-200);
  color: var(--color-800);
}

.form-container {
  padding: 40px;
  text-align: center;
}

.form-container h2 {
  margin-bottom: 25px;
  font-weight: 600;
  color: var(--color-400);
}

.form-container input {
  width: 100%;
  padding: 12px;
  margin-bottom: 18px;
  border-radius: 15px;
  border: 1px solid var(--color-100);
  background: var(--color-50);
  outline: none;
}

.form-container input:focus {
  border: 1px solid var(--color-300);
}

.form-container button {
  width: 100%;
  padding: 12px;
  border-radius: 25px;
  border: none;
  background: var(--color-300);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: 0.3s;
  margin-bottom: 15px;
}

.form-container button:hover {
  background: var(--color-400);
}

.cambiar-modo {
  color: var(--color-600);
  font-size: 0.9rem;
}

.cambiar-modo a {
  color: var(--color-400);
  text-decoration: none;
  font-weight: 500;
}

.cambiar-modo a:hover {
  text-decoration: underline;
}

#form-crear {
  background: rgb(255, 254, 254);
  padding: 25px;
  border-radius: 25px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
  margin-bottom: 30px;
  max-width: 500px;
}

label {
  font-weight: 500;
  color: var(--color-400);
}

input[type="text"],
input[type="email"] {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-100);
  border-radius: 15px;
  margin-top: 5px;
  margin-bottom: 18px;
  background: var(--color-50);
}

button[type="submit"] {
  background: var(--color-300);
  color: rgb(255, 255, 255);
  padding: 12px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  width: 100%;
  font-size: 1rem;
  font-weight: 500;
  transition: 0.3s;
}

button[type="submit"]:hover {
  background: var(--color-400);
}

section h1 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--color-500);
}

.lista-tareas {
  margin-top: 20px;
}

.no-tareas {
  background: white;
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  color: var(--color-600);
  font-style: italic;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
}

.tarea {
  background: white;
  padding: 18px;
  border-radius: 20px;
  margin-bottom: 15px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tarea-info h3 {
  font-size: 1rem;
  font-weight: 500;
  color: #6b4b4b;
}

.btn-editar {
  background: var(--color-200);
  color: white;
  padding: 7px 14px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin-right: 8px;
  transition: 0.3s;
}

.btn-eliminar {
  background: var(--color-400);
  color: white;
  padding: 7px 14px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: 0.3s;
}

.btn-editar:hover {
  background: var(--color-300);
}

.btn-eliminar:hover {
  background: var(--color-500);
}

.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.2);
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-contenido {
  background: white;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  border-radius: 25px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

.modal-contenido h2 {
  margin-bottom: 15px;
  color: var(--color-400);
}

.modal-contenido button {
  padding: 8px 14px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  background: var(--color-300);
  color: white;
  transition: 0.3s;
}

.modal-contenido button:hover {
  background: var(--color-400);
}

.modal-contenido button#cancelar-edicion,
.modal-contenido button#cancelar-eliminar {
  background: var(--color-200);
  color: var(--color-800);
}

.modal-contenido button#cancelar-edicion:hover,
.modal-contenido button#cancelar-eliminar:hover {
  background: var(--color-300);
}
</style>