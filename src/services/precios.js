function variacionAleatoria(precio) {
    const cambio = (Math.random() - 0.5) * 2;
    const porcentajeCambio = cambio / 100;
    const nuevoPrecio = precio * (1 + porcentajeCambio);
    return Math.round(nuevoPrecio * 100) / 100;
}

module.exports = {
    variacionAleatoria
};
