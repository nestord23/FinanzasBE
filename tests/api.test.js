const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
    it('debería retornar un mensaje de bienvenida', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
    });
});

describe('GET /api/acciones', () => {
    it('debería retornar las acciones disponibles', async () => {
        const response = await request(app).get('/api/acciones');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

describe('Validaciones de ordenes', () => {
    it('debería rechazar orden sin datos requeridos', async () => {
        const response = await request(app)
            .post('/api/ordenes')
            .send({});
        
        expect(response.status).toBe(400);
    });

    it('debería rechazar tipo de orden inválido', async () => {
        const response = await request(app)
            .post('/api/ordenes')
            .send({
                user_id: 'test-user',
                accion_id: 1,
                tipo: 'invalid',
                cantidad: 10
            });
        
        expect(response.status).toBe(400);
    });

    it('debería rechazar cantidad negativa', async () => {
        const response = await request(app)
            .post('/api/ordenes')
            .send({
                user_id: 'test-user',
                accion_id: 1,
                tipo: 'compra',
                cantidad: -5
            });
        
        expect(response.status).toBe(400);
    });
});
