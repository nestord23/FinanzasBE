const { variacionAleatoria } = require('./services/precios');
const supabase = require('./config/supabase');

let broadcastTimer = null;
let heartbeatInterval = null;
const userClients = new Map();

function broadcastMensaje(mensaje) {
    const data = `data: ${JSON.stringify(mensaje)}\n\n`;
    userClients.forEach((clients) => {
        clients.forEach((res) => {
            try {
                res.write(data);
            } catch {
                // ignorar clientes desconectados
            }
        });
    });
}

function enviarMensajeAUsuario(userId, mensaje) {
    const clients = userClients.get(userId);
    if (clients) {
        const data = `data: ${JSON.stringify(mensaje)}\n\n`;
        clients.forEach((res) => {
            try {
                res.write(data);
            } catch {
                // ignorar clientes desconectados
            }
        });
    }
}

async function actualizarBroadcastPrecios() {
    try {
        const { data: acciones, error: selectError } = await supabase
            .from('acciones')
            .select('*')
            .order('id');

        if (selectError) throw selectError;
        if (!acciones || acciones.length === 0) return;

        const preciosActualizados = acciones.map(accion => ({
            id: accion.id,
            nuevo_precio: variacionAleatoria(accion.precio_actual)
        }));

        const { data: accionesActualizadas, error: rpcError } = await supabase
            .rpc('actualizar_precios', { data_json: preciosActualizados });

        if (rpcError) throw rpcError;

        const resultado = (accionesActualizadas || []).map(a => ({
            id: a.id,
            simbolo: a.simbolo,
            nombre: a.nombre,
            precio_actual: a.precio_actual,
            precio_anterior: a.precio_anterior,
            variacion: a.precio_anterior
                ? Number(((a.precio_actual - a.precio_anterior) / a.precio_anterior * 100).toFixed(2))
                : 0,
            ultima_actualizacion: a.ultima_actualizacion
        }));

        broadcastMensaje({ type: 'precios', data: resultado });
    } catch (error) {
        console.error('Error en actualización de precios:', error.message);
    }

    broadcastTimer = setTimeout(actualizarBroadcastPrecios, 5000);
}

async function enviarSnapshot(res) {
    try {
        const { data: acciones, error } = await supabase
            .from('acciones')
            .select('*')
            .order('id');

        if (error) throw error;
        if (!acciones) return;

        const resultado = acciones.map(a => ({
            id: a.id,
            simbolo: a.simbolo,
            nombre: a.nombre,
            precio_actual: a.precio_actual,
            precio_anterior: a.precio_anterior,
            variacion: a.precio_anterior
                ? Number(((a.precio_actual - a.precio_anterior) / a.precio_anterior * 100).toFixed(2))
                : 0,
            ultima_actualizacion: a.ultima_actualizacion
        }));

        res.write(`data: ${JSON.stringify({ type: 'precios', data: resultado })}\n\n`);
    } catch (error) {
        console.error('Error al enviar snapshot:', error.message);
    }
}

function setupSSE(app) {
    app.get('/api/eventos', async (req, res) => {
        const token = req.cookies?.token || req.query.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

        if (!token) {
            return res.status(401).json({ error: 'Token de autenticación requerido' });
        }

        try {
            const { data, error } = await supabase.auth.getUser(token);
            if (error || !data.user) {
                return res.status(401).json({ error: 'Token inválido o expirado' });
            }

            const user = data.user;
            const userId = user.id;

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Accel-Buffering': 'no',
            });
            res.flushHeaders();

            res.write(`data: ${JSON.stringify({ type: 'auth_ok' })}\n\n`);

            if (!userClients.has(userId)) {
                userClients.set(userId, new Set());
            }
            userClients.get(userId).add(res);

            console.log(`Cliente SSE conectado: ${user.email}`);

            enviarSnapshot(res);

            req.on('close', () => {
                if (userClients.has(userId)) {
                    userClients.get(userId).delete(res);
                    if (userClients.get(userId).size === 0) {
                        userClients.delete(userId);
                    }
                }
            });
        } catch (err) {
            console.error('Error en conexión SSE:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error de autenticación' });
            }
        }
    });

    heartbeatInterval = setInterval(() => {
        userClients.forEach((clients) => {
            clients.forEach((res) => {
                try {
                    res.write(':keepalive\n\n');
                } catch {
                    // ignorar clientes desconectados
                }
            });
        });
    }, 30000);

    broadcastTimer = setTimeout(actualizarBroadcastPrecios, 5000);

    console.log('SSE server configurado');
}

function closeSSE() {
    if (broadcastTimer) clearTimeout(broadcastTimer);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    userClients.forEach((clients) => {
        clients.forEach((res) => {
            try { res.end(); } catch { /* ignorar */ }
        });
    });
    userClients.clear();
}

module.exports = { setupSSE, broadcastMensaje, enviarMensajeAUsuario, closeSSE };
