const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.post('/ordenes', async (req, res) => {
    try {
        const { user_id, accion_id, tipo, cantidad } = req.body;

        if (!user_id || !accion_id || !tipo || !cantidad) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        if (!['compra', 'venta'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de orden inválido. Use: compra o venta' });
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
                .eq('id', user_id)
                .single();

            if (errorPerfil || !perfil) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            if (perfil.saldo < precioTotal) {
                return res.status(400).json({ error: 'Saldo insuficiente' });
            }

            const { error: errorUpdateSaldo } = await supabase
                .from('perfiles')
                .update({ saldo: perfil.saldo - precioTotal })
                .eq('id', user_id);

            if (errorUpdateSaldo) {
                return res.status(500).json({ error: 'Error al actualizar saldo' });
            }

            const { data: posicion, error: errorPosicion } = await supabase
                .from('posiciones')
                .select('*')
                .eq('user_id', user_id)
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
                    .insert({ user_id, accion_id, cantidad, precio_promedio: precioUnitario });
            }

        } else if (tipo === 'venta') {
            const { data: posicion, error: errorPosicion } = await supabase
                .from('posiciones')
                .select('*')
                .eq('user_id', user_id)
                .eq('accion_id', accion_id)
                .single();

            if (errorPosicion || !posicion || posicion.cantidad < cantidad) {
                return res.status(400).json({ error: 'Cantidad insuficiente de acciones para vender' });
            }

            const { error: errorVenta } = await supabase
                .from('posiciones')
                .update({ cantidad: posicion.cantidad - cantidad })
                .eq('id', posicion.id);

            if (errorVenta) {
                return res.status(500).json({ error: 'Error al actualizar posición' });
            }

            const { data: perfil, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('saldo')
                .eq('id', user_id)
                .single();

            await supabase
                .from('perfiles')
                .update({ saldo: perfil.saldo + precioTotal })
                .eq('id', user_id);
        }

        const { data: orden, error: errorOrden } = await supabase
            .from('ordenes')
            .insert([{
                user_id,
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
