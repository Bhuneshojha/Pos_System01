-- Migration script to fix tenant/store-scoped constraints.
-- Removes incorrect single-column UNIQUE(store_id) constraints,
-- then adds correct store-scoped unique indexes and compound constraints.

-- 1) Drop wrong single-column unique constraints on store_id
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.conrelid::regclass AS table_name,
           c.conname
    FROM pg_constraint c
    WHERE c.contype = 'u'
      AND c.conrelid::regclass::text IN (
        'brands',
        'categories',
        'employees',
        'invoices',
        'suppliers',
        'users'
      )
      AND array_length(c.conkey, 1) = 1
      AND (SELECT attname
           FROM pg_attribute
           WHERE attrelid = c.conrelid
             AND attnum = c.conkey[1]) = 'store_id'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I;', rec.table_name, rec.conname);
  END LOOP;
END $$;

-- 2) Drop incorrect unique constraints on product variant and inventory single columns
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.conrelid::regclass AS table_name,
           c.conname
    FROM pg_constraint c
    WHERE c.contype = 'u'
      AND c.conrelid::regclass::text = 'product_variants'
      AND array_length(c.conkey, 1) = 1
      AND (SELECT attname
           FROM pg_attribute
           WHERE attrelid = c.conrelid
             AND attnum = c.conkey[1]) IN ('product_id', 'size_id', 'color_id')
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I;', rec.table_name, rec.conname);
  END LOOP;

  FOR rec IN
    SELECT c.conrelid::regclass AS table_name,
           c.conname
    FROM pg_constraint c
    WHERE c.contype = 'u'
      AND c.conrelid::regclass::text = 'inventory'
      AND array_length(c.conkey, 1) = 1
      AND (SELECT attname
           FROM pg_attribute
           WHERE attrelid = c.conrelid
             AND attnum = c.conkey[1]) IN ('warehouse_id', 'variant_id')
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I;', rec.table_name, rec.conname);
  END LOOP;
END $$;

-- 3) Add proper tenant-scoped unique constraints
ALTER TABLE IF EXISTS brands
  ADD CONSTRAINT IF NOT EXISTS brands_store_name_unique UNIQUE(store_id, brand_name);

ALTER TABLE IF EXISTS categories
  ADD CONSTRAINT IF NOT EXISTS categories_store_name_unique UNIQUE(store_id, category_name);

ALTER TABLE IF EXISTS suppliers
  ADD CONSTRAINT IF NOT EXISTS suppliers_store_name_unique UNIQUE(store_id, supplier_name);

ALTER TABLE IF EXISTS invoices
  ADD CONSTRAINT IF NOT EXISTS invoices_store_number_unique UNIQUE(store_id, invoice_number);

ALTER TABLE IF EXISTS employees
  ADD CONSTRAINT IF NOT EXISTS employees_store_email_unique UNIQUE(store_id, email);

ALTER TABLE IF EXISTS users
  ADD CONSTRAINT IF NOT EXISTS users_store_username_unique UNIQUE(store_id, username);

ALTER TABLE IF EXISTS product_variants
  ADD CONSTRAINT IF NOT EXISTS product_variants_matrix_combination_unique UNIQUE(product_id, size_id, color_id);

ALTER TABLE IF EXISTS inventory
  ADD CONSTRAINT IF NOT EXISTS inventory_warehouse_variant_unique UNIQUE(warehouse_id, variant_id);

-- 4) Optional: add store_id foreign key references where missing
ALTER TABLE IF EXISTS brands
  ADD CONSTRAINT IF NOT EXISTS brands_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id);

ALTER TABLE IF EXISTS categories
  ADD CONSTRAINT IF NOT EXISTS categories_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id);

ALTER TABLE IF EXISTS employees
  ADD CONSTRAINT IF NOT EXISTS employees_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id);

ALTER TABLE IF EXISTS invoices
  ADD CONSTRAINT IF NOT EXISTS invoices_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id);

ALTER TABLE IF EXISTS suppliers
  ADD CONSTRAINT IF NOT EXISTS suppliers_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id);

ALTER TABLE IF EXISTS users
  ADD CONSTRAINT IF NOT EXISTS users_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id);
