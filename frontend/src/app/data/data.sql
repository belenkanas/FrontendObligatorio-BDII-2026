-- Funcionario de prueba (contraseña: 123456)
INSERT INTO Usuario (
    mail, password, documento_tipo, documento_numeroDoc,
    direccion_calle, direccion_numero, direccion_codigoPostal,
    direccion_pais, direccion_localidad
) VALUES (
    'funcionario@test.com',
    '$2a$10$SKPFrxz96JA7z76SdlyI.ehBB/9hppEx8.wOLonpFsuZkbr8Svhhy',
    'CI', '22222222',
    'Av. Italia', '100', '11600',
    'Uruguay', 'Montevideo'
);

INSERT INTO Perfil (mailUsuario) VALUES ('funcionario@test.com');

INSERT INTO General (id_general, estado_verificacion_id, fecha_registro)
SELECT id, 'activo', CURDATE() FROM Perfil WHERE mailUsuario = 'funcionario@test.com';

INSERT INTO Funcionario (id_funcionario, nro_legajo)
SELECT id, 'LEG-001' FROM Perfil WHERE mailUsuario = 'funcionario@test.com';