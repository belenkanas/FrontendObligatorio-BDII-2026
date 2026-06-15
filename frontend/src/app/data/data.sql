-- Usuario base
INSERT INTO usuario (mail, password) VALUES ('funcionario@test.com', '1234');

-- Perfil
INSERT INTO perfil (id, mail_usuario) VALUES (2, 'funcionario@test.com');

-- Funcionario
INSERT INTO funcionario (id_funcionario, nro_legajo) VALUES (2, 'LEG-2');

-- Dispositivo de escaneo
INSERT INTO dispositivo_escaneo (nro_legajo) VALUES ('LEG-2');

--Dispositivo de prueba para el funcionario

INSERT INTO dispositivo_escaneo (nro_legajo) VALUES ('LEG-2');

-- Eventos de prueba para el funcionario
-- Equipo
INSERT INTO equipo (nombre_pais) VALUES ('Argentina');
INSERT INTO equipo (nombre_pais) VALUES ('Brasil');

-- Estadio
INSERT INTO estadio (nombre, direccion_pais, direccion_ciudad) 
VALUES ('Estadio Azteca', 'México', 'Ciudad de México');

-- Partido
INSERT INTO partido (fecha_hora) VALUES ('2025-08-15 20:00:00');

-- Evento
INSERT INTO evento (
    estadio_nombre, estadio_direccion_pais, estadio_direccion_ciudad,
    fecha_hora_partido,
    nombre_pais_equipo_local, nombre_pais_equipo_visitante
) VALUES (
    'Estadio Azteca', 'México', 'Ciudad de México',
    '2025-08-15 20:00:00',
    'Argentina', 'Brasil'
);

-- Sector
INSERT INTO sector (nombre, estadio_nombre, estadio_direccion_pais, estadio_direccion_ciudad, capacidad_max)
VALUES ('Palco', 'Estadio Azteca', 'México', 'Ciudad de México', 500);

-- Asignación del funcionario al sector
INSERT INTO funcionario_asignado_a_sector (nro_legajo, nombre_sector, estadio_nombre, estadio_direccion_pais, estadio_direccion_ciudad)
VALUES ('LEG-2', 'Palco', 'Estadio Azteca', 'México', 'Ciudad de México');


-- Evento del func pero pasados: 

-- Partido pasado
INSERT INTO partido (fecha_hora) VALUES ('2024-03-10 18:00:00');

-- Evento pasado
INSERT INTO evento (
    estadio_nombre, estadio_direccion_pais, estadio_direccion_ciudad,
    fecha_hora_partido,
    nombre_pais_equipo_local, nombre_pais_equipo_visitante
) VALUES (
    'Estadio Azteca', 'México', 'Ciudad de México',
    '2024-03-10 18:00:00',
    'Argentina', 'Brasil'
);

-- Asignación del funcionario al sector para ese evento
INSERT INTO funcionario_asignado_a_sector (nro_legajo, nombre_sector, estadio_nombre, estadio_direccion_pais, estadio_direccion_ciudad)
VALUES ('LEG-2', 'Palco', 'Estadio Azteca', 'México', 'Ciudad de México');