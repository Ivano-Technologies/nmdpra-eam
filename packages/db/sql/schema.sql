CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_licenses_vendor_id ON licenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry_date ON licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- Placeholder computed logic for expiry analytics.
CREATE OR REPLACE VIEW license_expiry_metrics AS
SELECT
  l.id,
  l.vendor_id,
  l.license_type,
  l.issue_date,
  l.expiry_date,
  l.status,
  (l.expiry_date - CURRENT_DATE)::INT AS days_to_expiry,
  CASE
    WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END AS expiry_status
FROM licenses l;
