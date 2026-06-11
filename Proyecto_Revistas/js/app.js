// 1. ÚNICA DECLARACIÓN GLOBAL DE SUPABASE
var SUPABASE_URL = 'https://cevljsjgxdqhkvahuimc.supabase.co';
var SUPABASE_KEY = 'sb_publishable_HKlo-eTR11cbtTc46ArzJg_wTHNZC6N';

var clienteSupabase = null;
var dbGlobal = null; 

if (typeof window.supabase !== 'undefined') {
    clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    if (typeof DatabaseService !== 'undefined') {
        dbGlobal = new DatabaseService(SUPABASE_URL, SUPABASE_KEY);
    }
}


// 2. UTILIDADES DE SESIÓN Y COOKIES
function guardarAccesoCookie() {
    let fecha = new Date();
    document.cookie = 'ultimoAcceso=' + fecha.toUTCString() + '; path=/; max-age=86400';
}

function obtenerSesion() {
    let datos = localStorage.getItem('sesionUsuario');
    if (!datos) return null;
    try { return JSON.parse(datos); } catch(e) { return null; }
}

function cerrarSesion() {
    localStorage.removeItem('sesionUsuario');
    window.location.href = 'Login.html';
}

function protegerPagina(rolRequerido) {
    let sesion = obtenerSesion();
    if (!sesion) { 
        window.location.href = 'Login.html'; 
        return null; 
    }
    if (rolRequerido && sesion.rol !== rolRequerido) {
        alert('Acceso denegado. No tiene permisos para esta página.');
        cerrarSesion();
        return null;
    }
    return sesion;
}

function cargarDatosUsuarioEnUI(sesion) {
    if (!sesion) return;
    let elNombre = document.getElementById('ui-nombre-usuario');
    let elRol    = document.getElementById('ui-rol-usuario');
    if (elNombre) elNombre.textContent = sesion.nombre;
    if (elRol)    elRol.textContent    = sesion.rol;

    let btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            if (confirm('¿Desea cerrar sesión?')) cerrarSesion();
        });
    }
}

// 3. EVENTO PRINCIPAL AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', function () {
    guardarAccesoCookie();

    let esPaginaEditor = !!document.getElementById('count-nuevos');
    let esPaginaAutor  = !!document.getElementById('form-nuevo-articulo');
    let sesion = null;

    if (esPaginaEditor)     sesion = protegerPagina('Editor');
    else if (esPaginaAutor) sesion = protegerPagina('Autor');
    else                    sesion = obtenerSesion();

    if (sesion) cargarDatosUsuarioEnUI(sesion);

    // Lógica del Sidebar
    let logoToggle = document.getElementById('toggle-sidebar-logo');
    let sidebar    = document.getElementById('sidebar');
    if (logoToggle) {
        logoToggle.addEventListener('click', () => sidebar && sidebar.classList.toggle('collapsed'));
    }

    // Navegación por Pestañas
    let menuLinks = document.querySelectorAll('.menu-item');
    let sections  = document.querySelectorAll('.view-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            let targetId = this.getAttribute('data-target');
            if (!targetId) return;

            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none';
            });

            let target = document.getElementById(targetId);
            if (target) { 
                target.classList.add('active'); 
                target.style.display = 'block'; 
            }
            
            // LÓGICA DE CARGA DINÁMICA SEGÚN LA PESTAÑA
            if (esPaginaEditor) {
                if (targetId === 'revision-pares') cargarTablaRevisionesPares();
                if (targetId === 'usuarios') cargarTablaUsuarios(); // NUEVO: Cargar usuarios
            }
        });
    });

    // Iniciar KPIs si es el Editor
    if (esPaginaEditor && clienteSupabase) {
        obtenerContadoresSupabase();
        iniciarSuscripcionTiempoReal();
    }
});

// 4. FUNCIONES GLOBALES DE NAVEGACIÓN
window.navegarA = function (targetId) {
    let sections  = document.querySelectorAll('.view-section');
    let menuLinks = document.querySelectorAll('.menu-item');

    sections.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    let target = document.getElementById(targetId);
    if (target) { 
        target.classList.add('active'); 
        target.style.display = 'block'; 
    }

    menuLinks.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-target') === targetId) l.classList.add('active');
    });

    if (targetId === 'revision-pares') cargarTablaRevisionesPares();
    if (targetId === 'usuarios') cargarTablaUsuarios(); // NUEVO: Cargar usuarios vía botón
};

window.mostrarEvaluacion = function () {
    window.navegarA('vista-evaluacion');
};

// 5. KPIs Y TABLA REVISIÓN POR PARES
async function obtenerContadoresSupabase() {
    if (!clienteSupabase) return;
    try {
        const { data: articulos, error } = await clienteSupabase.from('articulos').select('estado');
        if (error) throw error;

        let nuevas = 0, revision = 0, pendiente = 0, publicado = 0;
        (articulos || []).forEach(art => {
            let e = (art.estado || '').trim();
            if      (e === 'Nueva Presentacion') nuevas++;
            else if (e === 'En Revision')        revision++;
            else if (e === 'Decision Pendiente') pendiente++;
            else if (e === 'Publicado')          publicado++;
        });

        document.getElementById('count-nuevos').innerText     = nuevas;
        document.getElementById('count-revision').innerText   = revision;
        document.getElementById('count-decisiones').innerText = pendiente;
        document.getElementById('count-publicados').innerText = publicado;

        let badge = document.querySelector('.badge');
        if (badge) badge.textContent = nuevas;

    } catch (err) { console.error('Error KPIs:', err.message); }
}

var suscripcionActiva = false;
function iniciarSuscripcionTiempoReal() {
    if (!clienteSupabase || suscripcionActiva) return;
    suscripcionActiva = true;
    
    clienteSupabase
        .channel('canal-articulos-editor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articulos' }, function () {
            obtenerContadoresSupabase();
        })
        .subscribe();
}

async function cargarTablaRevisionesPares() {
    if (!dbGlobal) return;
    
    try {
        const articulos = await dbGlobal.listarArticulos();
        const tbody = document.querySelector('#tabla-revisiones tbody');
        if (!tbody) return; 

        tbody.innerHTML = ''; 

        if (articulos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay artículos registrados.</td></tr>';
            return;
        }

        articulos.forEach(art => {
            let btnAccion = '';
            if (art.estado === 'Nueva Presentacion') {
                btnAccion = `<button class="btn btn-primary btn-sm" onclick="asignarRevisorPrompt('${art.id}', '${art.titulo.replace(/'/g, "\\'")}')">Asignar Revisor</button>`;
            } else {
                btnAccion = `<button class="btn btn-outline btn-sm" onclick="mostrarEvaluacion()">Ver Evaluación</button>`;
            }

            let claseTag = 'tag-yellow';
            if (art.estado === 'En Revision') claseTag = 'tag-blue';
            if (art.estado === 'Decision Pendiente' || art.estado === 'Publicado') claseTag = 'tag-green';

            let nombreAutor = art.usuarios && art.usuarios.nombre_completo ? art.usuarios.nombre_completo : 'Desconocido';

            tbody.innerHTML += `
                <tr>
                    <td class="main-td">${art.titulo}</td>
                    <td>${nombreAutor}</td>
                    <td><span style="color: var(--text-muted);">${art.revisor_id ? 'Asignado' : 'Sin asignar'}</span></td>
                    <td><span class="tag ${claseTag}">${art.estado}</span></td>
                    <td>${btnAccion}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error al cargar tabla de revisión:", e);
        const tbody = document.querySelector('#tabla-revisiones tbody');
        if(tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">${e.message}</td></tr>`;
    }
}

window.asignarRevisorPrompt = async function(articuloId, titulo) {
    if (confirm(`¿Desea asignar un revisor al artículo:\n"${titulo}"\ny cambiar su estado a "En Revision"?`)) {
        try {
            await clienteSupabase.from('articulos').update({ estado: 'En Revision' }).eq('id', articuloId);
            alert('Estado actualizado a En Revisión correctamente.');
            cargarTablaRevisionesPares(); 
            obtenerContadoresSupabase();  
        } catch (e) {
            alert(e.message);
        }
    }
}

// 6. GESTIÓN DE USUARIOS (NUEVO BLOQUE)
// Carga los usuarios desde la base de datos a la tabla
async function cargarTablaUsuarios(filtroRol = '') {
    if (!dbGlobal) return;
    
    try {
        // Obtenemos los usuarios usando la función que ya habías creado
        const usuarios = await dbGlobal.listarUsuarios(filtroRol);
        const tbody = document.querySelector('#tabla-usuarios-sistema tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; 

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No se encontraron usuarios con ese criterio.</td></tr>';
            return;
        }

        usuarios.forEach(u => {
            // Asignamos colores según el rol
            let claseTag = 'tag-green'; // Por defecto Autor
            if (u.rol === 'Revisor') claseTag = 'tag-blue';
            if (u.rol === 'Editor') claseTag = 'tag-yellow';

            tbody.innerHTML += `
                <tr>
                    <td class="main-td" style="font-weight: 600;">${u.nombre_completo}</td>
                    <td>${u.correo}</td>
                    <td>${u.afiliacion || '-'}</td>
                    <td><span class="tag ${claseTag}">${u.rol}</span></td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error al cargar usuarios:", e);
        const tbody = document.querySelector('#tabla-usuarios-sistema tbody');
        if(tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">${e.message}</td></tr>`;
    }
}

// Función conectada al `<select>` del HTML para filtrar en tiempo real
window.filtrarUsuarios = function() {
    let selectRol = document.getElementById('filtro-rol-usuarios');
    if (selectRol) {
        cargarTablaUsuarios(selectRol.value);
    }
}
