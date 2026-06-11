// 1. INICIALIZACIÓN GLOBAL ÚNICA (Evita múltiples instancias)
if (!window.clienteSupabase) {
    const SUPABASE_URL = 'https://cevljsjgxdqhkvahuimc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_HKlo-eTR11cbtTc46ArzJg_wTHNZC6N';
    window.clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

class DatabaseService {
    constructor() {
        // Usamos la instancia global en lugar de crear una nueva
        this.cliente = window.clienteSupabase;
    }

    async validarLogin(correo, clave) {
        const { data, error } = await this.cliente.from('usuarios').select('*').eq('correo', correo).eq('password', clave).single();
        if (error || !data) throw new Error('Correo o contraseña incorrectos.');
        return data;
    }

    async obtenerIdUsuarioPorCorreo(correo) {
        const { data, error } = await this.cliente.from('usuarios').select('id').eq('correo', correo).single();
        if (error || !data) throw new Error('Correo no encontrado.');
        return data.id;
    }

    async subirPdf(archivo) {
        let nombreLimpio = archivo.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
        let nombreUnico = Date.now() + '_' + nombreLimpio;
        const { error } = await this.cliente.storage.from('Manuscritos').upload(nombreUnico, archivo);
        if (error) throw new Error('Fallo al subir el archivo.');
        const { data: urlData } = this.cliente.storage.from('Manuscritos').getPublicUrl(nombreUnico);
        return urlData.publicUrl;
    }

    async guardarArticulo(datosArticulo) {
        const { data, error } = await this.cliente.from('articulos').insert([datosArticulo]).select().single();
        if (error) throw new Error('Fallo al registrar el artículo.');
        return data;
    }

    async guardarCoautores(articulo_id, listaCoautores) {
        if (!listaCoautores || listaCoautores.length === 0) return true;
        let registros = listaCoautores.map(c => ({ articulo_id: articulo_id, nombre_completo: c.nombre, correo: c.correo, afiliacion: c.afiliacion }));
        const { error } = await this.cliente.from('coautores').insert(registros);
        if (error) throw new Error('Fallo al guardar coautores.');
        return true;
    }

    async listarArticulos() {
        // Corrección definitiva para evitar error 400 y relaciones ambiguas
        const { data, error } = await this.cliente
            .from('articulos')
            .select(`
                id, titulo, estado, fecha_envio, archivo_pdf_url, palabras_clave, revisor_id, autor_principal_id,
                usuarios!articulos_autor_principal_id_fkey(nombre_completo)
            `)
            .order('fecha_envio', { ascending: false });
        if (error) throw new Error('Error BD: ' + error.message);
        return data || [];
    }

    async listarArticulosPorAutor(autorId) {
        const { data, error } = await this.cliente
            .from('articulos')
            .select('id, titulo, estado, fecha_envio, archivo_pdf_url')
            .eq('autor_principal_id', autorId)
            .order('fecha_envio', { ascending: false });
        if (error) throw new Error('Error BD: ' + error.message);
        return data || [];
    }

    async asignarRevisor(articulo_id, revisor_id) {
        const { error } = await this.cliente.from('articulos').update({ revisor_id: revisor_id, estado: 'En Revision' }).eq('id', articulo_id);
        if (error) throw new Error('Error al asignar revisor.');
        return true;
    }
    // USUARIOS — LISTAR TODOS 
    async listarUsuarios(filtroRol = null) {
        // Hacemos la consulta base
        let query = this.cliente
            .from('usuarios')
            .select('id, nombre_completo, correo, rol, afiliacion, created_at')
            .order('created_at', { ascending: false });

        // Si el Editor usó el select para filtrar, aplicamos el filtro
        if (filtroRol && filtroRol !== "") {
            query = query.eq('rol', filtroRol);
        }

        const { data, error } = await query;
        
        if (error) throw new Error('Error al listar usuarios: ' + error.message);
        return data || [];
    }
}

