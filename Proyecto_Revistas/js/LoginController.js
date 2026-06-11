// Aplica: OOP, Eventos, async/await, LocalStorage, Regex

class LoginController {
    constructor(dbService) {
        this.db = dbService;

        // Paneles
        this.divLogin    = document.getElementById('form-login-container');
        this.divRegistro = document.getElementById('form-registro-container');
        this.divRecuperar = document.getElementById('form-recuperar-container');

        // Formularios
        this.formLogin    = document.getElementById('form-login');
        this.formRegistro = document.getElementById('form-registro');
        this.formRecuperar = document.getElementById('form-recuperar');

        // Inputs login
        this.correoInput   = document.getElementById('inp-correo');
        this.passwordInput = document.getElementById('inp-password');
        this.btnLogin      = document.getElementById('btn-login');
        this.btnTogglePass = document.getElementById('btn-toggle-pass');
        this.iconoOjo      = document.getElementById('icono-ojo');

        this.inicializarEventos();
        this.verificarSesionExistente();
    }

    // INICIALIZAR TODOS LOS EVENTOS
    inicializarEventos() {
        // Login
        if (this.formLogin) {
            this.formLogin.addEventListener('submit', (e) => this.procesarLogin(e));
        }
        // Ojito ver/ocultar contraseña
        if (this.btnTogglePass) {
            this.btnTogglePass.addEventListener('click', () => {
                if (this.passwordInput.type === 'password') {
                    this.passwordInput.type = 'text';
                    this.iconoOjo.textContent = 'visibility_off';
                } else {
                    this.passwordInput.type = 'password';
                    this.iconoOjo.textContent = 'visibility';
                }
            });
        }
        // Registro
        if (this.formRegistro) {
            this.formRegistro.addEventListener('submit', (e) => this.procesarRegistro(e));
        }
        // Recuperar contraseña
        if (this.formRecuperar) {
            this.formRecuperar.addEventListener('submit', (e) => this.procesarRecuperar(e));
        }
        // Función global para botones demo
        window.rellenarCredenciales = (correo, pass) => {
            this.correoInput.value = correo;
            this.passwordInput.value = pass;
            this.correoInput.classList.remove('error');
            this.passwordInput.classList.remove('error');
            this.ocultarError('error-msg');
        };
    }

    
    // NAVEGACIÓN ENTRE PANELES
    mostrarLogin() {
        this.divLogin.style.display    = 'block';
        this.divRegistro.style.display = 'none';
        this.divRecuperar.style.display = 'none';
    }
    mostrarRegistro() {
        this.divLogin.style.display    = 'none';
        this.divRegistro.style.display = 'block';
        this.divRecuperar.style.display = 'none';
    }
    mostrarRecuperar() {
        this.divLogin.style.display    = 'none';
        this.divRegistro.style.display = 'none';
        this.divRecuperar.style.display = 'block';
    }

    // PROCESO DE LOGIN
    async procesarLogin(e) {
        e.preventDefault();
        let correo   = this.correoInput.value.trim();
        let password = this.passwordInput.value.trim();

        this.ocultarError('error-msg');
        this.correoInput.classList.remove('error');
        this.passwordInput.classList.remove('error');

        if (!correo || !password) {
            this.mostrarError('error-msg', 'error-texto', 'Complete todos los campos.');
            if (!correo)   this.correoInput.classList.add('error');
            if (!password) this.passwordInput.classList.add('error');
            return;
        }

        let regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!regex.test(correo)) {
            this.mostrarError('error-msg', 'error-texto', 'Ingrese un correo válido.');
            this.correoInput.classList.add('error');
            return;
        }

        this.btnLogin.disabled = true;
        this.btnLogin.innerHTML = '<span class="material-symbols-outlined text-base">hourglass_empty</span> Verificando...';

        try {
            let usuario = await this.db.validarLogin(correo, password);

            // Guardar sesión en LocalStorage (JSON)
            let sesion = {
                id:         usuario.id,
                nombre:     usuario.nombre_completo,
                correo:     usuario.correo,
                rol:        usuario.rol,
                afiliacion: usuario.afiliacion || '',
                login:      new Date().toISOString()
            };
            localStorage.setItem('sesionUsuario', JSON.stringify(sesion));

            // Redirigir según rol
            if (usuario.rol === 'Editor')      window.location.href = 'Editor_jefe.html';
            else if (usuario.rol === 'Autor')  window.location.href = 'Autor.html';
            else this.mostrarError('error-msg', 'error-texto', 'Rol no reconocido. Contacte al administrador.');

        } catch (err) {
            this.mostrarError('error-msg', 'error-texto', 'Correo o contraseña incorrectos.');
            this.correoInput.classList.add('error');
            this.passwordInput.classList.add('error');
            console.error(err);
        } finally {
            this.btnLogin.disabled = false;
            this.btnLogin.innerHTML = '<span class="material-symbols-outlined text-base">login</span> Ingresar al Sistema';
        }
    }

    // PROCESO DE REGISTRO
    async procesarRegistro(e) {
        e.preventDefault();
        let nombre     = document.getElementById('reg_nombre').value.trim();
        let correo     = document.getElementById('reg_correo').value.trim();
        let password   = document.getElementById('reg_password').value.trim();
        let afiliacion = document.getElementById('reg_afiliacion').value.trim();
        let btnReg     = document.getElementById('btn-registrar');

        this.ocultarError('error-msg-reg');
        document.getElementById('ok-msg-reg').style.display = 'none';

        if (!nombre || !correo || !password || !afiliacion) {
            this.mostrarError('error-msg-reg', 'error-texto-reg', 'Todos los campos son obligatorios.');
            return;
        }
        if (password.length < 6) {
            this.mostrarError('error-msg-reg', 'error-texto-reg', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        btnReg.disabled = true;
        btnReg.innerHTML = '<span class="material-symbols-outlined text-base">hourglass_empty</span> Registrando...';

        try {
            await this.db.registrarNuevoUsuario({
                nombre_completo: nombre,
                correo:          correo,
                password:        password,
                rol:             'Autor',    // Por defecto todos se registran como Autor
                afiliacion:      afiliacion
            });
            document.getElementById('ok-msg-reg').style.display = 'block';
            this.formRegistro.reset();
            // Regresar al login tras 2 segundos
            setTimeout(() => this.mostrarLogin(), 2000);
        } catch (err) {
            this.mostrarError('error-msg-reg', 'error-texto-reg', err.message);
            console.error(err);
        } finally {
            btnReg.disabled = false;
            btnReg.innerHTML = '<span class="material-symbols-outlined text-base">person_add</span> Crear Cuenta';
        }
    }
    // PROCESO DE RECUPERAR CONTRASEÑA
    async procesarRecuperar(e) {
        e.preventDefault();
        let correo    = document.getElementById('rec_correo').value.trim();
        let nueva     = document.getElementById('rec_password_nueva').value.trim();
        let confirmar = document.getElementById('rec_password_confirmar').value.trim();
        let btnRec    = document.getElementById('btn-recuperar');

        this.ocultarError('error-msg-rec');
        document.getElementById('ok-msg-rec').style.display = 'none';

        if (!correo || !nueva || !confirmar) {
            this.mostrarError('error-msg-rec', 'error-texto-rec', 'Todos los campos son obligatorios.');
            return;
        }
        if (nueva.length < 6) {
            this.mostrarError('error-msg-rec', 'error-texto-rec', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (nueva !== confirmar) {
            this.mostrarError('error-msg-rec', 'error-texto-rec', 'Las contraseñas no coinciden.');
            return;
        }

        btnRec.disabled = true;
        btnRec.innerHTML = '<span class="material-symbols-outlined text-base">hourglass_empty</span> Actualizando...';

        try {
            await this.db.cambiarPassword(correo, nueva);
            document.getElementById('ok-msg-rec').style.display = 'block';
            this.formRecuperar.reset();
            setTimeout(() => this.mostrarLogin(), 2000);
        } catch (err) {
            this.mostrarError('error-msg-rec', 'error-texto-rec', err.message);
            console.error(err);
        } finally {
            btnRec.disabled = false;
            btnRec.innerHTML = '<span class="material-symbols-outlined text-base">lock_reset</span> Actualizar Contraseña';
        }
    }

    // Concepto: LocalStorage
    verificarSesionExistente() {
        let datos = localStorage.getItem('sesionUsuario');
        if (!datos) return;
        try {
            let sesion = JSON.parse(datos);
            if (sesion && sesion.rol) {
                if (sesion.rol === 'Editor')     window.location.href = 'Editor_jefe.html';
                else if (sesion.rol === 'Autor') window.location.href = 'Autor.html';
            }
        } catch(e) {}
    }

    // HELPERS DE UI
    mostrarError(idDiv, idSpan, texto) {
        document.getElementById(idSpan).textContent = texto;
        document.getElementById(idDiv).classList.add('visible');
    }
    ocultarError(idDiv) {
        let el = document.getElementById(idDiv);
        if (el) el.classList.remove('visible');
    }
}

// BOOTSTRAP
var loginCtrl = null;
document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://cevljsjgxdqhkvahuimc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_HKlo-eTR11cbtTc46ArzJg_wTHNZC6N';
    const dbService = new DatabaseService(SUPABASE_URL, SUPABASE_KEY);
    // Guardamos en variable global para que el HTML pueda llamar loginCtrl.mostrarRegistro()
    loginCtrl = new LoginController(dbService);
});
