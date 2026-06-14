-- Usuario
INSERT INTO Usuario (
    mail, password, documento_tipo, documento_numeroDoc,
    direccion_calle, direccion_numero, direccion_codigoPostal,
    direccion_pais, direccion_localidad
) VALUES (
    'funcionario@test.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'CI', '33333333',
    'Av. Italia', '200', '11600',
    'Uruguay', 'Montevideo'
);

-- Perfil (será id=6)
INSERT INTO Perfil (mailUsuario) VALUES ('funcionario@test.com');

-- Funcionario con id=6
INSERT INTO Funcionario (id_funcionario, nroLegajo) VALUES (6, 'LEG-001');