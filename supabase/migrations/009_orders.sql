-- ── Tabla de pedidos ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Destino
  code           text         NOT NULL DEFAULT '',
  city           text         NOT NULL,
  agency         text         NOT NULL DEFAULT '',

  -- Cliente
  client_name    text         NOT NULL,
  client_phone   text         NOT NULL DEFAULT '',
  client_address text         NOT NULL DEFAULT '',

  -- Producto
  product        text         NOT NULL,
  sku            text         NOT NULL DEFAULT '',
  unit_price     numeric(12,2) NOT NULL DEFAULT 0,
  units          integer      NOT NULL DEFAULT 1,
  total          numeric(12,2) NOT NULL DEFAULT 0,

  -- Estado
  status         text         NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('active', 'idle', 'pending', 'delivered')),

  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_tenant_isolation" ON orders
  FOR ALL
  USING (
    tenant_id = (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Auto updated_at
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índice para consultas por tenant
CREATE INDEX IF NOT EXISTS orders_tenant_id_idx ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
