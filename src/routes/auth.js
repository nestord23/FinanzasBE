const express = require('express');
const router = express.Router();
const supabaseAuth = require('../config/supabaseAuth');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY
);

router.post('/auth/registro', async (req, res) => {
    try {
        const { email, password, nombre } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre }
        });

        if (error) throw error;

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: data.user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        res.json({
            message: 'Login exitoso',
            user: data.user,
            session: data.session
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

module.exports = router;
