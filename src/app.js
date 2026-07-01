const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const ordenesRouter = require('./routes/ordenes');
const accionesRouter = require('./routes/acciones');
const authRouter = require('./routes/auth');
const usuarioRouter = require('./routes/usuario');
const adminRouter = require('./routes/admin');
const { errorHandler, logger } = require('./middleware/errorHandler');

const app = express();

app.set('etag', false);

app.use(cors({
    origin: true,
    credentials: true,
    maxAge: 86400,
}));

app.use(cookieParser());

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});
app.use(express.json({
    verify: (req, res, buf) => {
        if (buf.length === 0) {
            throw new Error('Cuerpo de solicitud vacío');
        }
    }
}));
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
