-- 1. Tabla: administradores
CREATE TABLE administradores (
  id_admin UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla: operarios
CREATE TABLE operarios (
  id_operario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  estado VARCHAR(20) DEFAULT 'activo', -- Ej: 'activo', 'inactivo'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla: turnos
CREATE TABLE turnos (
  id_turno UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_turno VARCHAR(50) NOT NULL, -- Ej: 'Mañana', 'Tarde', 'Noche'
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla: sectores
CREATE TABLE sectores (
  id_sector UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE, -- Ej: 'Patio A', 'Piso 1'
  estado VARCHAR(20) DEFAULT 'disponible', -- Ej: 'disponible', 'mantenimiento'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla: plazas
CREATE TABLE plazas (
  id_plaza UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL, -- 'A1', 'A2', '101'
  id_sector UUID REFERENCES sectores(id_sector) ON DELETE CASCADE,
  estado VARCHAR(20) DEFAULT 'libre', -- Ej: 'libre', 'ocupada', 'mantenimiento'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_sector, numero)
);

-- 6. Tabla: vehiculos
CREATE TABLE vehiculos (
  id_vehiculo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patente VARCHAR(15) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla: tickets
CREATE TABLE tickets (
  id_ticket UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hora_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hora_salida TIMESTAMP WITH TIME ZONE,
  estado VARCHAR(20) DEFAULT 'activo', -- 'activo', 'pagado'
  id_plaza UUID REFERENCES plazas(id_plaza),
  id_vehiculo UUID REFERENCES vehiculos(id_vehiculo),
  id_operario UUID REFERENCES operarios(id_operario), -- Operario que dio ingreso
  id_turno UUID REFERENCES turnos(id_turno),
  codigo_qr TEXT UNIQUE
);

-- 8. Tabla: pagos
CREATE TABLE pagos (
  id_pago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metodo_pago VARCHAR(50) DEFAULT 'efectivo', -- 'efectivo', 'qr'
  id_ticket UUID REFERENCES tickets(id_ticket) UNIQUE,
  id_operario UUID REFERENCES operarios(id_operario), -- Operario que cobró
  id_turno UUID REFERENCES turnos(id_turno)
);

-- 9. Tabla: cierres_diarios
CREATE TABLE cierres_diarios (
  id_cierre UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  total_recaudado DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opcional: Insertar datos por defecto para testing
INSERT INTO administradores (usuario, password) VALUES ('admin', 'admin123');
INSERT INTO operarios (nombre, apellido, usuario, password) VALUES ('Juan', 'Perez', 'operario1', 'op123');
INSERT INTO turnos (nombre_turno, hora_inicio, hora_fin) VALUES ('Mañana', '06:00', '14:00'), ('Tarde', '14:00', '22:00'), ('Noche', '22:00', '06:00');
