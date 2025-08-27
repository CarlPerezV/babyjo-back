-- ==========================================================
-- CREACIÓN DE BASE DE DATOS
-- ==========================================================
CREATE DATABASE babyjo

\c babyjo; -- Conectarse a la BD

-- ==========================================================
-- TABLA: roles
-- ==========================================================
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- ==========================================================
-- TABLA: users
-- ==========================================================
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name  TEXT,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role_id INT NOT NULL DEFAULT 2 REFERENCES public.roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX ux_users_email ON public.users (lower(email));

-- ==========================================================
-- TABLA: products
-- ==========================================================
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5)
);

-- Índices
CREATE INDEX ix_products_active ON public.products(id) WHERE active = true;
CREATE INDEX ix_products_category ON public.products(category);

-- ==========================================================
-- TABLA: inventory (tallas / stock)
-- ==========================================================
CREATE TABLE public.inventory (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    CONSTRAINT ux_inventory_product_size UNIQUE (product_id, size)
);

-- ==========================================================
-- TABLA: shipping_addresses
-- ==========================================================
CREATE TABLE public.shipping_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    zip_code TEXT
);

CREATE INDEX ix_shipping_addresses_user ON public.shipping_addresses(user_id);

-- ==========================================================
-- TABLA: orders
-- ==========================================================
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id),
    shipping_address_id INT REFERENCES public.shipping_addresses(id),
    total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending','paid','cancelled','shipped')),
    payment_method TEXT NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX ix_orders_user ON public.orders(user_id);
CREATE INDEX ix_orders_status ON public.orders(status);

-- ==========================================================
-- TABLA: order_items
-- ==========================================================
CREATE TABLE public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES public.products(id),
    size TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX ix_order_items_order ON public.order_items(order_id);

-- ==========================================================
-- TABLA: cart
-- ==========================================================
CREATE TABLE public.cart (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT,
    quantity INT NOT NULL CHECK (quantity >= 1),
    CONSTRAINT ux_cart_unique UNIQUE (user_id, product_id, size)
);

-- ==========================================================
-- TABLA: favorites
-- ==========================================================
CREATE TABLE public.favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT ux_favorites_unique UNIQUE (user_id, product_id)
);

-- ==========================================================
-- TABLA: reviews
-- ==========================================================
CREATE TABLE public.reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT ux_reviews_unique UNIQUE (user_id, product_id)
);


-- 👇 Esto asegura que los emails sean únicos sin importar mayúsculas/minúsculas
CREATE UNIQUE INDEX ux_users_email ON public.users (lower(email));

INSERT INTO public.roles (id, name) VALUES
  (1, 'admin'),
  (2, 'customer')
ON CONFLICT (id) DO NOTHING;