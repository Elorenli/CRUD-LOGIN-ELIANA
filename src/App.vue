<script setup>

import { onMounted } from "vue";

onMounted(() => {
  const formCrear = document.getElementById("form-crear");
  const listaTareas = document.getElementById("lista-tareas");

  const modalEditar = document.getElementById("modal-editar");
  const modalEliminar = document.getElementById("modal-eliminar");

  const formEditar = document.getElementById("form-editar");
  const inputEditarNombre = document.getElementById("editar-nombre");
  const inputEditarDescripcion = document.getElementById("editar-descripcion");

  const btnCancelarEditar = document.getElementById("cancelar-edicion");
  const btnConfirmarEliminar = document.getElementById("confirmar-eliminar");
  const btnCancelarEliminar = document.getElementById("cancelar-eliminar");

  let tareas = [];
  let idEditando = null;
  let idEliminando = null;


  const guardadas = localStorage.getItem("tareas");
  if (guardadas) {
    tareas = JSON.parse(guardadas);
  }


  
  const guardarLocal = () => {
    localStorage.setItem("tareas", JSON.stringify(tareas));
  };


  function mostrarTareas() {
    listaTareas.innerHTML = "";

    tareas.forEach(t => {
      const div = document.createElement("div");
      div.className = "tarea";

      div.innerHTML = `
        <div class="tarea-info">
          <h3>${t.nombre}</h3>
          <p>${t.descripcion}</p>
        </div>

        <div class="tarea-acciones">
          <button class="btn-editar" data-id="${t.id}">Editar</button>
          <button class="btn-eliminar" data-id="${t.id}">Eliminar</button>
        </div>
     `;

      listaTareas.appendChild(div);
    });

    // Botones editar
    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        abrirModalEditar(id);
      });
    });

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        abrirModalEliminar(id);
      });
    });
  }

  mostrarTareas(); 


  formCrear.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("Nombre").value;
    const descripcion = document.getElementById("text").value;

    const nuevaTarea = {
      id: Date.now(),
      nombre,
      descripcion,
    };

    tareas.push(nuevaTarea);

    guardarLocal();
    mostrarTareas();

    formCrear.reset();
  });


  function abrirModalEditar(id) {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea) return;

    idEditando = id;
    inputEditarNombre.value = tarea.nombre;
    inputEditarDescripcion.value = tarea.descripcion;

    modalEditar.style.display = "flex";
  }

  btnCancelarEditar.addEventListener("click", () => {
    modalEditar.style.display = "none";
    idEditando = null;
  });

  formEditar.addEventListener("submit", (e) => {
    e.preventDefault();

    const tarea = tareas.find(t => t.id === idEditando);
    if (!tarea) return;

    tarea.nombre = inputEditarNombre.value;
    tarea.descripcion = inputEditarDescripcion.value;

    guardarLocal();
    mostrarTareas();

    modalEditar.style.display = "none";
  });


  function abrirModalEliminar(id) {
    idEliminando = id;
    modalEliminar.style.display = "flex";
  }

  btnCancelarEliminar.addEventListener("click", () => {
    modalEliminar.style.display = "none";
    idEliminando = null;
  });

  btnConfirmarEliminar.addEventListener("click", () => {
    tareas = tareas.filter(t => t.id !== idEliminando);

    guardarLocal();
    mostrarTareas();

    modalEliminar.style.display = "none";
  });
});
</script>

<template>
    <header>
      <h1>Gestar the homework</h1>
    </header>

  <body>
  <form id="form-crear" class="max-w-sm mx-auto">
  <div class="mb-5">
    <label for="Nombre" class="block mb-2.5 text-sm font-medium text-heading">Nombre de tarea</label>
    <input type="text" id="Nombre" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Agregar nombre" required />
  </div>

  <div class="mb-5">
    <label for="Nombre" class="block mb-2.5 text-sm font-medium text-heading">Descripcion</label>
    <input type="text" id="text" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="" required />
  </div>
  <button type="submit" class="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Subir</button>
</form>


<section>
      <h1>Tareas</h1>
      <div id="lista-tareas"></div>

    <div id="modal-editar" class="modal" aria-hidden="true">
      <div class="modal-contenido">
        <h2>Editar tarea</h2>
        <form id="form-editar">
          <label>Nombre</label>
          <input type="text" id="editar-nombre" required />
          <label>Descripción</label>
          <input type="text" id="editar-descripcion" />

          <div style="margin-top:12px;">
            <button type="submit">Guardar cambios</button>
            <button type="button" id="cancelar-edicion">Cancelar</button>
          </div>

        </form>
      </div>
    </div>

    </section>

    <div id="modal-eliminar" class="modal" aria-hidden="true">
      <div class="modal-contenido">
        <h2>¿Eliminar tarea</h2>
        <p>Esta acción no se puede deshacer.</p>
        <div style="margin-top:12px;">
          <button id="confirmar-eliminar">Eliminar</button>
          <button id="cancelar-eliminar">Cancelar</button>
        </div>
      </div>
    </div>
  </body>
</template>

<style>
/* ======== ESTILO GENERAL ======== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
}

body {
  background: #f2f2f7;
  padding: 20px;
  color: #000000;
}

/* ======== HEADER ======== */
header {
  width: 100%;
  background: #4f46e5;
  padding: 15px 25px;
  border-radius: 10px;
  margin-bottom: 25px;
  text-align: left;
}

header h1 {
  font-size: 1.6rem;
  font-weight: bold;
  color: white;
}

/* ======== CONTENEDOR ======== */
main {
  display: flex;
  flex-direction: column;
  width: 450px;
  padding-left: 10px;
}

/* ======== FORMULARIO ======== */
#form-crear {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.11);
  margin-bottom: 25px;
}

label {
  color: #000000;
  font-weight: 600;
}

input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #000000;
  border-radius: 8px;
  margin-top: 5px;
  margin-bottom: 15px;
}

button[type="submit"] {
  background: #4f46e5;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
}

button[type="submit"]:hover {
  background: #3d34c7;
}

/* ======== LISTA ======== */
section h1 {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 12px;
  color: #ffffff;
  background: #4f46e5;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tarea {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.tarea-info h3 {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.tarea-info p {
  font-size: 0.9rem;
  color: #555;
}

.btn-editar {
  background: #eab308;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-eliminar {
  background: #ef4444;
  color: rgb(255, 255, 255);
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-editar:hover {
  background: #c99508;
}
.btn-eliminar:hover {
  background: #d13535;
}

/* ======== MODALES ======== */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  justify-content: center;
  align-items: center;
}

.modal-contenido {
  background: white;
  padding: 25px;
  width: 90%;
  max-width: 420px;
  border-radius: 12px;
}

.modal-contenido h2 {
  margin-bottom: 12px;
}

.modal-contenido button {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-right: 10px;
}

</style>
