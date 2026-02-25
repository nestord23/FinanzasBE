const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/acciones', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('acciones')
            .select('*')
            .order('simbolo');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
