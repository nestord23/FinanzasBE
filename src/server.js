const express = require ('express');
const app = express();
const port = 3000;

app.use(express.json());

//ruta de prueba
app.get('/', (req, res) => {
    res.send('Hola Mundo!');
});
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});