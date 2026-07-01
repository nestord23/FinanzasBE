const supabase = require('../config/supabase');

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = req.cookies?.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

        if (!token) {
            return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error de autenticación' });
    }
}

module.exports = authenticate;
