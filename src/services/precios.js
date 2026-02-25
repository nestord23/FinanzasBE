const supabase = require('../config/supabase');

let actualizarPreciosInterval = null;

function variacionAleatoria(precio) {
    const cambio = (Math.random() - 0.5) * 2;
    const porcentajeCambio = cambio / 100;
    const nuevoPrecio = precio * (1 + porcentajeCambio);
    return Math.round(nuevoPrecio * 100) / 100;
}

async function actualizarPrecios() {
    try {
        const { data: acciones, error } = await supabase
            .from('acciones')
            .select('*');

        if (error) throw error;

        for (const accion of acciones) {
            const nuevoPrecio = variacionAleatoria(accion.precio_actual);
            
            await supabase
                .from('acciones')
                .update({ 
                    precio_anterior: accion.precio_actual,
                    precio_actual: nuevoPrecio,
                    ultima_actualizacion: new Date().toISOString()
                })
                .eq('id', accion.id);
        }

        console.log(`[${new Date().toISOString()}] Precios actualizados`);
    } catch (error) {
        console.error('Error al actualizar precios:', error.message);
    }
}

function iniciarActualizacionPrecios(intervaloMs = 5000) {
    if (actualizarPreciosInterval) {
        console.log('El proceso de actualización ya está en ejecución');
        return;
    }

    actualizarPrecios();
    actualizarPreciosInterval = setInterval(actualizarPrecios, intervaloMs);
    console.log(`Actualización de precios iniciada cada ${intervaloMs}ms`);
}

function detenerActualizacionPrecios() {
    if (actualizarPreciosInterval) {
        clearInterval(actualizarPreciosInterval);
        actualizarPreciosInterval = null;
        console.log('Actualización de precios detenida');
    }
}

module.exports = {
    iniciarActualizacionPrecios,
    detenerActualizacionPrecios,
    actualizarPrecios
};
