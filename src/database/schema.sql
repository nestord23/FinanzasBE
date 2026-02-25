-- Tabla de usuarios (perfiles)
-- Nota: Supabase Auth maneja la autenticación, esta tabla es para datos adicionales
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nombre TEXT,
    rol TEXT DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
    saldo DECIMAL(15, 2) DEFAULT 10000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de acciones (stocks disponibles para trading)
CREATE TABLE IF NOT EXISTS acciones (
    id SERIAL PRIMARY KEY,
    simbolo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    precio_actual DECIMAL(10, 2) NOT NULL,
    precio_anterior DECIMAL(10, 2),
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes (compras/ventas)
CREATE TABLE IF NOT EXISTS ordenes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    accion_id INTEGER REFERENCES acciones(id),
    tipo TEXT CHECK (tipo IN ('compra', 'venta')) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    precio_total DECIMAL(15, 2) NOT NULL,
    estado TEXT DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de posiciones (acciones que posee cada usuario)
CREATE TABLE IF NOT EXISTS posiciones (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    accion_id INTEGER REFERENCES acciones(id),
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio_promedio DECIMAL(10, 2) DEFAULT 0,
    UNIQUE(user_id, accion_id)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE posiciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para perfiles
CREATE POLICY "Users can view own profile" ON perfiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON perfiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para acciones (todos pueden ver)
CREATE POLICY "Anyone can view actions" ON acciones
    FOR SELECT USING (true);

-- Políticas RLS para órdenes
CREATE POLICY "Users can view own orders" ON ordenes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON ordenes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para posiciones
CREATE POLICY "Users can view own positions" ON posiciones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON posiciones
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON posiciones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre, saldo)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 10000.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar acciones iniciales de ejemplo
INSERT INTO acciones (simbolo, nombre, precio_actual) VALUES
    ('AAPL', 'Apple Inc.', 175.50),
    ('GOOGL', 'Alphabet Inc.', 140.25),
    ('MSFT', 'Microsoft Corporation', 378.90),
    ('TSLA', 'Tesla Inc.', 248.50),
    ('AMZN', 'Amazon.com Inc.', 178.35)
ON CONFLICT (simbolo) DO NOTHING;
