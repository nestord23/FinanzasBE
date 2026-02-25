const express = require('express');
const cors = require('cors');
const ordenesRouter = require('./routes/ordenes');
const accionesRouter = require('./routes/acciones');
const authRouter = require('./routes/auth');
const usuarioRouter = require('./routes/usuario');
const adminRouter = require('./routes/admin');
const { errorHandler, logger } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get('/', (req, res) => {
    res.json({ message: 'Bitcoin Finances API running' });
});

app.use('/api', authRouter);
app.use('/api', accionesRouter);
app.use('/api', ordenesRouter);
app.use('/api', usuarioRouter);
app.use('/api', adminRouter);

app.use(errorHandler);

module.exports = app;
