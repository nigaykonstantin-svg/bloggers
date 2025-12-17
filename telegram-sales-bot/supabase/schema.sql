-- ================================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ TELEGRAM SALES BOT
-- Маркетплейс: категории Лицо, Волосы, Тело, Макияж
-- ================================================

-- Удаление старых таблиц (для чистой установки)
DROP VIEW IF EXISTS v_profit_proxy CASCADE;
DROP VIEW IF EXISTS v_price_stability CASCADE;
DROP VIEW IF EXISTS v_top20_growth_candidates CASCADE;
DROP VIEW IF EXISTS v_top_products_mom_compare CASCADE;
DROP VIEW IF EXISTS v_top_products_by_category_mtd CASCADE;
DROP VIEW IF EXISTS v_subcategory_plan_fact_mtd CASCADE;
DROP VIEW IF EXISTS v_category_plan_fact_mtd CASCADE;
DROP VIEW IF EXISTS v_category_plan_fact_today CASCADE;
DROP TABLE IF EXISTS fact_price_daily CASCADE;
DROP TABLE IF EXISTS fact_ads_daily CASCADE;
DROP TABLE IF EXISTS plan_sales_daily CASCADE;
DROP TABLE IF EXISTS fact_sales_daily CASCADE;
DROP TABLE IF EXISTS dim_products CASCADE;
DROP TABLE IF EXISTS dim_categories CASCADE;
DROP TABLE IF EXISTS dim_calendar CASCADE;

-- ================================================
-- СПРАВОЧНЫЕ ТАБЛИЦЫ (DIM)
-- ================================================

-- Календарь
CREATE TABLE dim_calendar (
    date DATE PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 1=Mon, 7=Sun
    week_of_year INTEGER NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    quarter INTEGER NOT NULL
);

-- Категории
CREATE TABLE dim_categories (
    category_id SERIAL PRIMARY KEY,
    category_key VARCHAR(50) UNIQUE NOT NULL, -- face, hair, body, makeup
    category_name VARCHAR(100) NOT NULL,      -- Лицо, Волосы, Тело, Макияж
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Товары
CREATE TABLE dim_products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category_key VARCHAR(50) NOT NULL REFERENCES dim_categories(category_key),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2), -- себестоимость (COGS)
    margin_percent DECIMAL(5,2), -- маржа в процентах
    commission_percent DECIMAL(5,2) DEFAULT 15, -- комиссия площадки
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON dim_products(category_key);
CREATE INDEX idx_products_subcategory ON dim_products(subcategory);

-- ================================================
-- ФАКТОВЫЕ ТАБЛИЦЫ (FACT)
-- ================================================

-- Продажи по дням
CREATE TABLE fact_sales_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product_id INTEGER NOT NULL REFERENCES dim_products(product_id),
    units INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    orders_count INTEGER NOT NULL DEFAULT 0,
    returns_count INTEGER DEFAULT 0,
    returns_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, product_id)
);

CREATE INDEX idx_sales_date ON fact_sales_daily(date);
CREATE INDEX idx_sales_product ON fact_sales_daily(product_id);

-- План продаж по дням (по категориям/подкатегориям)
CREATE TABLE plan_sales_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category_key VARCHAR(50) NOT NULL REFERENCES dim_categories(category_key),
    subcategory VARCHAR(100),
    plan_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    plan_units INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, category_key, COALESCE(subcategory, ''))
);

CREATE INDEX idx_plan_date ON plan_sales_daily(date);
CREATE INDEX idx_plan_category ON plan_sales_daily(category_key);

-- Рекламные расходы по дням
CREATE TABLE fact_ads_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product_id INTEGER NOT NULL REFERENCES dim_products(product_id),
    spend DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    orders_from_ads INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, product_id)
);

CREATE INDEX idx_ads_date ON fact_ads_daily(date);
CREATE INDEX idx_ads_product ON fact_ads_daily(product_id);

-- Цены по дням (для анализа волатильности)
CREATE TABLE fact_price_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product_id INTEGER NOT NULL REFERENCES dim_products(product_id),
    price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    competitor_min_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, product_id)
);

CREATE INDEX idx_price_date ON fact_price_daily(date);
CREATE INDEX idx_price_product ON fact_price_daily(product_id);

-- ================================================
-- RLS (Row Level Security) - только чтение
-- ================================================

ALTER TABLE dim_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_sales_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_sales_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_ads_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_price_daily ENABLE ROW LEVEL SECURITY;

-- Политики только на чтение для сервисного аккаунта
CREATE POLICY "Allow read access" ON dim_calendar FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON dim_categories FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON dim_products FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON fact_sales_daily FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON plan_sales_daily FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON fact_ads_daily FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON fact_price_daily FOR SELECT USING (true);
