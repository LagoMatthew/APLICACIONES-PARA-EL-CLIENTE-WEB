
class AutorController {
    constructor(dbService) {
        this.db                  = dbService;
        this.formulario          = document.getElementById('form-nuevo-articulo');
        this.palabras            = [];
        this.contadorCoautores   = 0;

        this.inputPalabra        = document.getElementById('input_palabra');
        this.btnAgregar          = document.getElementById('btn_agregar_palabra');
        this.contenedorPalabras  = document.getElementById('contenedor_palabras');
        this.btnAgregarCoautor   = document.getElementById('btn_agregar_coautor');
        this.contenedorCoautores = document.getElementById('contenedor_coautores');

        this.cargarDatosAutorDesdeLocalStorage();
        this.inicializarEventos();
    }

    // CARGAR DATOS DEL AUTOR DESDE LOCAL STORAGE
    cargarDatosAutorDesdeLocalStorage() {
        let datos = localStorage.getItem('sesionUsuario');
        if (!datos) return;
        try {
            let sesion = JSON.parse(datos);
            let campoNombre = document.getElementById('nombre_autor_principal');
            let campoCorreo = document.getElementById('correo_autor');
            let campoAfil   = document.getElementById('afiliacion_autor');

            if (campoNombre && sesion.nombre)     campoNombre.value = sesion.nombre;
            if (campoCorreo && sesion.correo)     campoCorreo.value = sesion.correo;
            if (campoAfil   && sesion.afiliacion) campoAfil.value   = sesion.afiliacion;
        } catch (e) {
            console.error('Error al leer LocalStorage:', e);
        }
    }

    // EVENTOS
    inicializarEventos() {
        if (this.formulario) {
            this.formulario.addEventListener('submit', this.procesarEnvio.bind(this));
        }
        if (this.btnAgregar && this.inputPalabra) {
            this.btnAgregar.addEventListener('click', this.agregarPalabra.bind(this));
            this.inputPalabra.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.agregarPalabra(); }
            });
        }
        if (this.btnAgregarCoautor) {
            this.btnAgregarCoautor.addEventListener('click', this.agregarBloqueCoautor.bind(this));
        }
    }

    // PALABRAS CLAVE
    agregarPalabra() {
        let texto = this.inputPalabra.value.trim();
        if (texto.length > 0 && !this.palabras.includes(texto)) {
            this.palabras.push(texto);
            this.inputPalabra.value = '';
            this.renderizarPalabras();
        }
    }

    eliminarPalabra(index) {
        this.palabras.splice(index, 1);
        this.renderizarPalabras();
    }

    renderizarPalabras() {
        this.contenedorPalabras.innerHTML = '';
        for (let i = 0; i < this.palabras.length; i++) {
            let span = document.createElement('span');
            span.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-[#0d7377]/10 text-[#0d7377] border border-[#0d7377]/20';
            span.innerHTML = `
                ${this.palabras[i]}
                <button type="button" class="btn-eliminar hover:text-red-600" data-index="${i}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>`;
            this.contenedorPalabras.appendChild(span);
        }
        let btns = this.contenedorPalabras.querySelectorAll('.btn-eliminar');
        for (let j = 0; j < btns.length; j++) {
            btns[j].addEventListener('click', (e) => {
                this.eliminarPalabra(parseInt(e.currentTarget.getAttribute('data-index')));
            });
        }
    }

    // COAUTORES — CORRECCIÓN: ahora incluye Afiliación Institucional
    agregarBloqueCoautor() {
        this.contadorCoautores++;
        let div = document.createElement('div');
        div.className = 'p-4 border border-[#e2e8f0] rounded-lg bg-white relative shadow-sm coautor-item';
        div.id = 'coautor_' + this.contadorCoautores;

        div.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-[#64748b] titulo-coautor">Coautor #${this.contadorCoautores}</h4>
                <button type="button" class="text-red-500 hover:text-red-700 flex items-center btn-eliminar-coautor">
                    <span class="material-symbols-outlined text-sm">close</span>
                    <span class="text-xs font-medium ml-1">Quitar</span>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm mb-2 font-medium">Nombre Completo *</label>
                    <input type="text" class="input-coautor-nombre form-control" placeholder="Ej: Ing. Carlos Mendoza" required>
                </div>
                <div>
                    <label class="block text-sm mb-2 font-medium">Correo Electrónico *</label>
                    <input type="email" class="input-coautor-correo form-control" placeholder="ejemplo@uleam.edu.ec" required>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm mb-2 font-medium">Afiliación Institucional *</label>
                    <input type="text" class="input-coautor-afiliacion form-control" placeholder="Universidad, departamento...">
                </div>
            </div>`;

        let btnEliminar = div.querySelector('.btn-eliminar-coautor');
        btnEliminar.addEventListener('click', () => {
            div.remove();
            this.renumerarCoautores();
        });

        this.contenedorCoautores.appendChild(div);
    }

    renumerarCoautores() {
        let items = this.contenedorCoautores.querySelectorAll('.coautor-item');
        for (let i = 0; i < items.length; i++) {
            let titulo = items[i].querySelector('.titulo-coautor');
            if (titulo) titulo.textContent = 'Coautor #' + (i + 1);
        }
        this.contadorCoautores = items.length;
    }

    // RECOLECTAR DATOS DE COAUTORES DEL DOM
    recolectarCoautores() {
        let items = this.contenedorCoautores.querySelectorAll('.coautor-item');
        let lista = [];
        for (let i = 0; i < items.length; i++) {
            let nombre    = items[i].querySelector('.input-coautor-nombre')?.value.trim()    || '';
            let correo    = items[i].querySelector('.input-coautor-correo')?.value.trim()    || '';
            let afiliacion = items[i].querySelector('.input-coautor-afiliacion')?.value.trim() || '';
            if (nombre) lista.push({ nombre, correo, afiliacion });
        }
        return lista;
    }
    // VALIDACIONES
    validarCampos(titulo, abstract, correo, archivoInput) {
        if (!titulo.trim()) {
            alert('Error: El título del artículo es obligatorio.');
            return false;
        }
        if (!abstract.trim() || abstract.length < 50) {
            alert('Error: El resumen debe tener al menos 50 caracteres (actual: ' + abstract.length + ').');
            return false;
        }
        if (this.palabras.length === 0) {
            alert('Error: Ingrese al menos una palabra clave.');
            return false;
        }
        let regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!regex.test(correo)) {
            alert('Error: El formato del correo no es válido.');
            return false;
        }
        if (archivoInput.files.length === 0) {
            alert('Error: Debe adjuntar el PDF del manuscrito.');
            return false;
        }
        if (archivoInput.files[0].type !== 'application/pdf') {
            alert('Error: El archivo debe ser PDF.');
            return false;
        }
        if (archivoInput.files[0].size > 10 * 1024 * 1024) {
            alert('Error: El PDF no puede superar los 10MB.');
            return false;
        }
        return true;
    }


    // ENVÍO DEL FORMULARIO
    async procesarEnvio(evento) {
        evento.preventDefault();

        let titulo       = document.getElementById('titulo_articulo').value;
        let abstract     = document.getElementById('abstract_articulo').value;
        let correo       = document.getElementById('correo_autor').value;
        let afiliacion   = document.getElementById('afiliacion_autor')?.value || '';
        let archivoInput = document.getElementById('archivo_pdf');

        if (!this.validarCampos(titulo, abstract, correo, archivoInput)) return;

        let sesion = null;
        try { sesion = JSON.parse(localStorage.getItem('sesionUsuario')); } catch(e) {}

        // Recolectar coautores del formulario
        let coautores = this.recolectarCoautores();

        try {
            alert('Validación correcta. Enviando a la base de datos...');

            // Paso 1: Subir PDF
            let urlPdf = await this.db.subirPdf(archivoInput.files[0]);

            // Paso 2: Obtener ID del autor
            let autorId = (sesion && sesion.id)
                ? sesion.id
                : await this.db.obtenerIdUsuarioPorCorreo(correo);

            // Paso 3: Guardar artículo principal
            let datosArticulo = {
                autor_principal_id: autorId,
                titulo:             titulo,
                abstract:           abstract,
                palabras_clave:     this.palabras.join(', '),
                archivo_pdf_url:    urlPdf,
                estado:             'Nueva Presentacion'
            };
            let articuloGuardado = await this.db.guardarArticulo(datosArticulo);

            // Paso 4: Guardar coautores
            if (coautores.length > 0) {
                const { data: articuloRec } = await this.db.cliente
                    .from('articulos')
                    .select('id')
                    .eq('autor_principal_id', autorId)
                    .eq('titulo', titulo)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (articuloRec) {
                    await this.db.guardarCoautores(articuloRec.id, coautores);
                }
            }

            alert('¡Éxito! El manuscrito y coautores se han guardado correctamente.');

            // Limpiar formulario
            this.formulario.reset();
            this.palabras = [];
            this.renderizarPalabras();
            this.contenedorCoautores.innerHTML = '';
            this.contadorCoautores = 0;
            this.cargarDatosAutorDesdeLocalStorage();

        } catch (error) {
            console.error('Error al enviar:', error);
            alert('Ocurrió un problema: ' + error.message);
        }
    }
}

// BOOTSTRAP
document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://cevljsjgxdqhkvahuimc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_HKlo-eTR11cbtTc46ArzJg_wTHNZC6N';
    const miServicioDB     = new DatabaseService(SUPABASE_URL, SUPABASE_KEY);
    const controladorAutor = new AutorController(miServicioDB);
});