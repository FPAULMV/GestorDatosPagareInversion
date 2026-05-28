-- ============================================================
-- 001_crear_base_y_tabla.sql
-- Descripción : Creación inicial de la base de datos y la
--               tabla principal del Lector BBVA.
-- Fecha       : 2026-05-27
-- ============================================================

-- 1. Crear la base de datos
CREATE DATABASE Aplicativo_LectorInversion;
GO

-- 2. Usarla
USE Aplicativo_LectorInversion;
GO

-- 3. Crear la tabla
CREATE TABLE pagare_inversiones (
    id                                      INT IDENTITY(1,1) PRIMARY KEY,
    fecha_carga                             DATETIME2 DEFAULT GETDATE() NOT NULL,
    nombre_archivo                          NVARCHAR(255),

    -- Encabezado
    fecha_hora_consulta                     DATETIME2,
    contrato                                NVARCHAR(8),
    nombre_cliente                          NVARCHAR(255),

    -- Producto
    producto_tipo                           NVARCHAR(255),
    producto_moneda                         NVARCHAR(3),

    -- Notas legales
    garantia_ipab                           NVARCHAR(MAX),
    nota_gat                                NVARCHAR(MAX),

    -- Estado
    estado_operacion                        NVARCHAR(50),

    -- Detalle comprobante
    fecha_hora_operacion                    DATETIME2,
    fecha_vencimiento                       DATE,
    cuenta_cargo                            NVARCHAR(10),
    cuenta_deposito                         NVARCHAR(10),
    contrato_inversion                      NVARCHAR(20),
    isr_impuesto_mxn                        DECIMAL(18,4),
    importe_inversion_mxn                   DECIMAL(18,4),
    interes_mxn                             DECIMAL(18,4),
    plazo_dias                              INT,
    importe_neto_vencimiento_mxn            DECIMAL(18,4),
    tasa_fija_anual_antes_impuestos_pct     DECIMAL(10,4),
    gat_nominal_antes_impuestos             NVARCHAR(20),
    tasa_fija_anual_despues_impuestos_pct   DECIMAL(10,4),
    gat_real_antes_impuestos                NVARCHAR(20),

    -- Confirmación
    folio_inversion                         NVARCHAR(50),
    folio_internet                          NVARCHAR(50),

    -- Pie de página
    institucion                             NVARCHAR(255),
    sitio_web                               NVARCHAR(255),

    -- Validación y JSON completo
    schema_valido                           BIT,
    validacion_json                         NVARCHAR(MAX),
    json_extraido                           NVARCHAR(MAX)
);
GO
