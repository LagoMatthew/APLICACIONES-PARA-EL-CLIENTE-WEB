// Esperar a que todo el HTML cargue para evitar errores
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Referencias al DOM
    const formularioEstudiantes = document.getElementById('formulario-estudiantes');
    const listaEstudiantes = document.getElementById('lista-estudiantes');
    const cajaErrores = document.getElementById('caja-errores');

    const inputCedula = document.getElementById('cedula-estudiante');
    const inputNombres = document.getElementById('nombres-estudiante');
    const inputApellidos = document.getElementById('apellidos-estudiante');
    const inputDireccion = document.getElementById('direccion-estudiante');
    const inputTelefono = document.getElementById('telefono-estudiante');
    const inputCorreo = document.getElementById('correo-estudiante');
    const selectFacultad = document.getElementById('facultad-estudiante');
    const inputNivel = document.getElementById('nivel-estudiante');
    const inputParalelo = document.getElementById('paralelo-estudiante');

    // 2. Estado de la Aplicación
    let coleccionEstudiantes = JSON.parse(localStorage.getItem('estudiantesGuardados')) || [];

    // 3. Pintar estudiantes en el HTML
    function redibujarInterfaz() {
        listaEstudiantes.innerHTML = ''; 
        
        coleccionEstudiantes.forEach((estudiante, indice) => {
            const elementoLista = document.createElement('li');
            elementoLista.className = 'elemento-estudiante';
            
            elementoLista.innerHTML = `
                <div>
                    <h3>${estudiante.apellidos} ${estudiante.nombres}</h3>
                    <p><strong>Cédula:</strong> ${estudiante.cedula} | <strong>Facultad:</strong> ${estudiante.facultad}</p>
                    <p><strong>Nivel:</strong> ${estudiante.nivel} | <strong>Paralelo:</strong> ${estudiante.paralelo}</p>
                    <small style="color: #45a29e;">Contacto: ${estudiante.telefono} - ${estudiante.correo}</small>
                </div>
                <button class="btn-eliminar" onclick="removerEstudiante(${indice})">Eliminar</button>
            `;
            listaEstudiantes.appendChild(elementoLista);
        });
    }

    // 4. Guardar en LocalStorage
    function actualizarAlmacenamientoLocal() {
        localStorage.setItem('estudiantesGuardados', JSON.stringify(coleccionEstudiantes));
    }

    // 5. Validaciones y Envío del Formulario
    formularioEstudiantes.addEventListener('submit', (evento) => {
        evento.preventDefault(); // ¡ESTO EVITA QUE LA PÁGINA SE RECARGUE!

        // Expresiones Regulares Oficiales
        const regexCedula = /^\d{10}$/; 
        const regexTexto = /^[a-zA-ZÁ-ÿ\s]+$/; 
        const regexTelefono = /^[0-9]{9,10}$/; 
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Validación de Email
        const regexParalelo = /^[A-Za-z]$/; 

        // Evaluaciones
        if (!regexCedula.test(inputCedula.value.trim())) {
            return mostrarError("Error: La cédula debe tener exactamente 10 números.");
        }
        if (!regexTexto.test(inputNombres.value.trim()) || !regexTexto.test(inputApellidos.value.trim())) {
            return mostrarError("Error: Nombres y apellidos solo deben contener letras.");
        }
        if (!regexTelefono.test(inputTelefono.value.trim())) {
            return mostrarError("Error: El teléfono debe tener entre 9 y 10 números.");
        }
        if (!regexCorreo.test(inputCorreo.value.trim())) {
            return mostrarError("Error: Ingrese un correo electrónico válido (ej: usuario@correo.com).");
        }
        if (!regexParalelo.test(inputParalelo.value.trim())) {
            return mostrarError("Error: El paralelo debe ser una sola letra.");
        }

        // Si pasa todas las validaciones, ocultar caja de errores
        cajaErrores.classList.add('oculto'); 

        // 6. Crear y guardar el objeto
        const nuevoEstudiante = {
            cedula: inputCedula.value.trim(),
            nombres: inputNombres.value.trim(),
            apellidos: inputApellidos.value.trim(),
            direccion: inputDireccion.value.trim(),
            telefono: inputTelefono.value.trim(),
            correo: inputCorreo.value.trim(),
            facultad: selectFacultad.value,
            nivel: inputNivel.value,
            paralelo: inputParalelo.value.trim().toUpperCase()
        };

        coleccionEstudiantes.push(nuevoEstudiante);
        actualizarAlmacenamientoLocal();
        redibujarInterfaz();
        
        formularioEstudiantes.reset(); // Limpiar inputs
    });

    // 7. Funciones Auxiliares
    window.removerEstudiante = function(indice) {
        coleccionEstudiantes.splice(indice, 1);
        actualizarAlmacenamientoLocal();
        redibujarInterfaz();
    };

    function mostrarError(mensaje) {
        cajaErrores.textContent = mensaje;
        cajaErrores.classList.remove('oculto');
    }

    // Renderizar al iniciar
    redibujarInterfaz();
});