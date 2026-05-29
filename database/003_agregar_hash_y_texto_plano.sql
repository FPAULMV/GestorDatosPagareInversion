-- Migración 003: agregar hash del archivo PDF y texto plano extraído
-- Ejecutar sobre la base de datos del aplicativo

ALTER TABLE pagare_inversiones
    ADD hash_archivo NVARCHAR(64) NULL;

ALTER TABLE pagare_inversiones
    ADD texto_plano NVARCHAR(MAX) NULL;
