const WebSocket = require('ws');
const { iniciarActualizacionPrecios, detenerActualizacionPrecios } = require('./services/precios');
const supabase = require('./config/supabase');

let wss = null;

function setupWebSocket(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('Cliente WebSocket conectado');
        
        ws.on('close', () => {
            console.log('Cliente WebSocket desconectado');
        });
    });

    iniciarActualizacionPrecios(5000);

    setInterval(async () => {
        if (wss) {
            const { data } = await supabase
                .from('acciones')
                .select('*');
            
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'precios', data }));
                }
            });
        }
    }, 5000);

    console.log('WebSocket server configurado');
    return wss;
}

function broadcastMensaje(mensaje) {
    if (wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(mensaje));
            }
        });
    }
}

module.exports = { setupWebSocket, broadcastMensaje };
