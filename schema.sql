-- Tenant-aware schema for Pankh POS
-- Store-specific access is enforced by store_id and compound unique constraints.

CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE stores (
  store_id serial PRIMARY KEY,
  store_name varchar(150) NOT NULL,
  subdomain_or_slug varchar(100) NOT NULL UNIQUE,
  phone varchar(30),
  email varchar(150),
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brands (
  brand_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  brand_name varchar(100) NOT NULL,
  CONSTRAINT brands_store_name_unique UNIQUE(store_id, brand_name),
  CONSTRAINT brands_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE categories (
  category_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  category_name varchar(100) NOT NULL,
  CONSTRAINT categories_store_name_unique UNIQUE(store_id, category_name),
  CONSTRAINT categories_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE colors (
  color_id serial PRIMARY KEY,
  color_name varchar(50) NOT NULL UNIQUE
);

CREATE TABLE regions (
  region_id serial PRIMARY KEY,
  region_name varchar(100) NOT NULL UNIQUE
);

CREATE TABLE countries (
  country_id char(2) PRIMARY KEY,
  country_name varchar(100) NOT NULL,
  region_id integer,
  CONSTRAINT countries_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

CREATE TABLE departments (
  department_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  department_name varchar(100) NOT NULL,
  CONSTRAINT departments_store_name_unique UNIQUE(store_id, department_name),
  CONSTRAINT departments_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE jobs (
  job_id serial PRIMARY KEY,
  job_title varchar(100) NOT NULL,
  min_salary numeric(10, 2),
  max_salary numeric(10, 2)
);

CREATE TABLE employees (
  employee_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  first_name varchar(100),
  last_name varchar(100) NOT NULL,
  email varchar(150) NOT NULL,
  phone varchar(30),
  hire_date date NOT NULL,
  salary numeric(10, 2),
  manager_id integer,
  department_id integer,
  job_id integer,
  CONSTRAINT employees_store_email_unique UNIQUE(store_id, email),
  CONSTRAINT employees_salary_check CHECK (salary > 0),
  CONSTRAINT employees_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE customers (
  customer_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  email varchar(150),
  phone varchar(30),
  loyalty_points integer DEFAULT 0,
  CONSTRAINT customers_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE warehouses (
  warehouse_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  warehouse_name varchar(150) NOT NULL,
  location_id integer,
  CONSTRAINT warehouses_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE locations (
  location_id serial PRIMARY KEY,
  street_address varchar(255),
  city varchar(100) NOT NULL,
  state_province varchar(100),
  postal_code varchar(20),
  country_id char(2),
  CONSTRAINT locations_country_id_fkey FOREIGN KEY(country_id) REFERENCES countries(country_id)
);

CREATE TABLE payment_methods (
  payment_method_id serial PRIMARY KEY,
  method_name varchar(50) NOT NULL UNIQUE
);

CREATE TABLE products (
  product_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  category_id integer,
  brand_id integer,
  product_name varchar(200) NOT NULL,
  description text,
  base_price numeric(10, 2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE product_variants (
  variant_id serial PRIMARY KEY,
  product_id integer NOT NULL,
  size_id integer,
  color_id integer,
  sku varchar(100) NOT NULL UNIQUE,
  barcode varchar(100) UNIQUE,
  selling_price numeric(10, 2) NOT NULL,
  cost_price numeric(10, 2) NOT NULL,
  CONSTRAINT product_variants_matrix_combination_unique UNIQUE(product_id, size_id, color_id),
  CONSTRAINT product_variants_product_fk FOREIGN KEY(product_id) REFERENCES products(product_id)
);

CREATE TABLE inventory (
  inventory_id serial PRIMARY KEY,
  warehouse_id integer NOT NULL,
  variant_id integer NOT NULL,
  quantity_on_hand integer DEFAULT 0,
  reorder_level integer DEFAULT 10,
  CONSTRAINT inventory_warehouse_variant_unique UNIQUE(warehouse_id, variant_id),
  CONSTRAINT inventory_warehouse_fk FOREIGN KEY(warehouse_id) REFERENCES warehouses(warehouse_id),
  CONSTRAINT inventory_variant_fk FOREIGN KEY(variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE invoices (
  invoice_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  sale_id integer NOT NULL UNIQUE,
  invoice_number varchar(100) NOT NULL,
  generated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT invoices_store_number_unique UNIQUE(store_id, invoice_number),
  CONSTRAINT invoices_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE suppliers (
  supplier_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  supplier_name varchar(200) NOT NULL,
  CONSTRAINT suppliers_store_name_unique UNIQUE(store_id, supplier_name),
  CONSTRAINT suppliers_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE purchase_orders (
  po_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  supplier_id integer,
  ordered_by integer,
  order_date date NOT NULL,
  status varchar(30) DEFAULT 'PENDING',
  CONSTRAINT purchase_orders_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE purchase_order_items (
  po_item_id serial PRIMARY KEY,
  po_id integer NOT NULL,
  variant_id integer NOT NULL,
  quantity integer NOT NULL,
  unit_cost numeric(10, 2) NOT NULL,
  CONSTRAINT purchase_order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT purchase_order_items_po_fk FOREIGN KEY(po_id) REFERENCES purchase_orders(po_id),
  CONSTRAINT purchase_order_items_variant_fk FOREIGN KEY(variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE sales (
  sale_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  customer_id integer,
  cashier_id integer,
  sale_date timestamp DEFAULT CURRENT_TIMESTAMP,
  subtotal numeric(12, 2) NOT NULL,
  tax_amount numeric(12, 2) DEFAULT 0,
  discount_amount numeric(12, 2) DEFAULT 0,
  total_amount numeric(12, 2) NOT NULL,
  CONSTRAINT sales_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id)
);

CREATE TABLE sale_items (
  sale_item_id serial PRIMARY KEY,
  sale_id integer NOT NULL,
  variant_id integer NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  line_total numeric(12, 2) NOT NULL,
  CONSTRAINT sale_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT sale_items_sale_fk FOREIGN KEY(sale_id) REFERENCES sales(sale_id),
  CONSTRAINT sale_items_variant_fk FOREIGN KEY(variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE sizes (
  size_id serial PRIMARY KEY,
  size_name varchar(20) NOT NULL UNIQUE
);

CREATE TABLE stock_movements (
  movement_id serial PRIMARY KEY,
  warehouse_id integer NOT NULL,
  variant_id integer NOT NULL,
  movement_type varchar(20),
  quantity integer NOT NULL,
  movement_date timestamp DEFAULT CURRENT_TIMESTAMP,
  reference_note text,
  CONSTRAINT stock_movements_movement_type_check CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  CONSTRAINT stock_movements_warehouse_fk FOREIGN KEY(warehouse_id) REFERENCES warehouses(warehouse_id),
  CONSTRAINT stock_movements_variant_fk FOREIGN KEY(variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE roles (
  role_id serial PRIMARY KEY,
  role_name varchar(50) NOT NULL UNIQUE
);

INSERT INTO roles (role_name) VALUES ('admin') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles (role_name) VALUES ('manager') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles (role_name) VALUES ('cashier') ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE users (
  user_id serial PRIMARY KEY,
  store_id integer NOT NULL,
  employee_id integer UNIQUE,
  role_id integer NOT NULL,
  username varchar(100) NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_store_username_unique UNIQUE(store_id, username),
  CONSTRAINT users_store_fk FOREIGN KEY(store_id) REFERENCES stores(store_id),
  CONSTRAINT users_role_fk FOREIGN KEY(role_id) REFERENCES roles(role_id)
);
