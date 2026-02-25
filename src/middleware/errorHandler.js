function errorHandler(err, req, res, next) {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
    console.error('Stack:', err.stack);

    if (err.type === 'validation') {
        return res.status(400).json({ error: err.message });
    }

    if (err.type === 'unauthorized') {
        return res.status(401).json({ error: err.message });
    }

    if (err.type === 'forbidden') {
        return res.status(403).json({ error: err.message });
    }

    if (err.type === 'not_found') {
        return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message 
    });
}

function logger(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
}

module.exports = { errorHandler, logger };
