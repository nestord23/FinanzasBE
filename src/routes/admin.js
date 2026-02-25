const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticate = require('../middleware/auth');

router.get('/admin/ordenes', authenticate, async (req, res) => {
    try {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .single();

        if (!perfil || perfil.rol !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de admin' });
        }

        const { data, error } = await supabase
            .from('ordenes')
            .select(`
                *,
                acciones (simbolo, nombre),
                perfiles (email, nombre)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/admin/usuarios', authenticate, async (req, res) => {
    try {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', req.user.id)
            .single();

        if (!perfil || perfil.rol !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de admin' });
        }

        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
