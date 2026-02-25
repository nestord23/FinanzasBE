const app = require('./app');
const http = require('http');
const { setupWebSocket } = require('./websocket');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

setupWebSocket(server);

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`WebSocket disponible en ws://localhost:${PORT}`);
});
