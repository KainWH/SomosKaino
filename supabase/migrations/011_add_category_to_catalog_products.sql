-- ════════════════════════════════════════════════════════════
--  Migración 011: Añadir columna category a catalog_products
--
--  Permite clasificar productos por categoría en el inventario.
--  Las categorías se muestran como badges en la vista de inventario.
-- ════════════════════════════════════════════════════════════

ALTER TABLE catalog_products ADD COLUMN category text;
