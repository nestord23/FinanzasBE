const app = require('./app');
const { setupSSE } = require('./sse');

const PORT = process.env.PORT || 3000;

setupSSE(app);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`SSE disponible en http://localhost:${PORT}/api/eventos`);
});
