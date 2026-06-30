const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/acciones', async (req, res) => {
    try {
        const { limit, offset } = req.query;

        let query = supabase
            .from('acciones')
            .select('id, simbolo, nombre, precio_actual, precio_anterior, ultima_actualizacion')
            .order('simbolo');

        if (limit) {
            const from = Number(offset) || 0;
            const to = from + Number(limit) - 1;
            query = query.range(from, to);
        }

        const { data, error } = await query;
        if (error) throw error;

        const result = (data || []).map((a) => ({
            id: a.id,
            simbolo: a.simbolo,
            nombre: a.nombre,
            precio_actual: a.precio_actual,
            variacion: a.precio_anterior
                ? Number(((a.precio_actual - a.precio_anterior) / a.precio_anterior * 100).toFixed(2))
                : 0,
            created_at: a.ultima_actualizacion,
            updated_at: a.ultima_actualizacion,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error en GET /acciones:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Error interno del servidor'
                : error.message
        });
    }
});

module.exports = router;