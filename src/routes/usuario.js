const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticate = require('../middleware/auth');

router.get('/mis-ordenes', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('ordenes')
            .select(`
                *,
                acciones (simbolo, nombre)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/mi-perfil', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/mis-posiciones', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { data, error } = await supabase
            .from('posiciones')
            .select(`
                *,
                acciones (simbolo, nombre, precio_actual)
            `)
            .eq('user_id', userId)
            .gt('cantidad', 0);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ordenes', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { accion_id, tipo, cantidad } = req.body;

        if (!accion_id || !tipo || !cantidad) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        if (!['compra', 'venta'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de orden inválido' });
        }

        if (cantidad <= 0 || !Number.isInteger(cantidad)) {
            return res.status(400).json({ error: 'La cantidad debe ser un número entero positivo' });
        }

        const { data: accion, error: errorAccion } = await supabase
            .from('acciones')
            .select('*')
            .eq('id', accion_id)
            .single();

        if (errorAccion || !accion) {
            return res.status(404).json({ error: 'Acción no encontrada' });
        }

        const precioUnitario = accion.precio_actual;
        const precioTotal = precioUnitario * cantidad;

        if (tipo === 'compra') {
            const { data: perfil, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('saldo')
                .eq('id', userId)
                .single();

            if (errorPerfil || !perfil) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            if (perfil.saldo < precioTotal) {
                return res.status(400).json({ error: 'Saldo insuficiente' });
            }

            await supabase
                .from('perfiles')
                .update({ saldo: perfil.saldo - precioTotal })
                .eq('id', userId);

            const { data: posicion, error: errorPosicion } = await supabase
                .from('posiciones')
                .select('*')
                .eq('user_id', userId)
                .eq('accion_id', accion_id)
                .single();

            if (posicion) {
                const nuevaCantidad = posicion.cantidad + cantidad;
                const nuevoPrecioPromedio = ((posicion.cantidad * posicion.precio_promedio) + precioTotal) / nuevaCantidad;

                await supabase
                    .from('posiciones')
                    .update({ cantidad: nuevaCantidad, precio_promedio: nuevoPrecioPromedio })
                    .eq('id', posicion.id);
            } else {
                await supabase
                    .from('posiciones')
                    .insert({ user_id: userId, accion_id, cantidad, precio_promedio: precioUnitario });
            }

        } else if (tipo === 'venta') {
            const { data: posicion, error: errorPosicion } = await supabase
                .from('posiciones')
                .select('*')
                .eq('user_id', userId)
                .eq('accion_id', accion_id)
                .single();

            if (errorPosicion || !posicion || posicion.cantidad < cantidad) {
                return res.status(400).json({ error: 'Cantidad insuficiente de acciones para vender' });
            }

            await supabase
                .from('posiciones')
                .update({ cantidad: posicion.cantidad - cantidad })
                .eq('id', posicion.id);

            const { data: perfil } = await supabase
                .from('perfiles')
                .select('saldo')
                .eq('id', userId)
                .single();

            await supabase
                .from('perfiles')
                .update({ saldo: perfil.saldo + precioTotal })
                .eq('id', userId);
        }

        const { data: orden, error: errorOrden } = await supabase
            .from('ordenes')
            .insert([{
                user_id: userId,
                accion_id,
                tipo,
                cantidad,
                precio_unitario: precioUnitario,
                precio_total: precioTotal,
                estado: 'completada'
            }])
            .select()
            .single();

        if (errorOrden) throw errorOrden;

        res.status(201).json(orden);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
