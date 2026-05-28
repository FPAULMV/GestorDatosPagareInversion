-- ============================================================
-- 002_eliminar_pie_pagina.sql
-- Descripción : Elimina las columnas de pie de página
--               (institucion, sitio_web) de la tabla principal
--               porque ya no se requieren en el aplicativo.
-- Fecha       : 2026-05-27
-- ============================================================

USE Aplicativo_LectorInversion;
GO

ALTER TABLE pagare_inversiones DROP COLUMN institucion;
GO

ALTER TABLE pagare_inversiones DROP COLUMN sitio_web;
GO
