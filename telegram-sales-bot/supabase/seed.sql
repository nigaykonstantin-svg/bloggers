-- ================================================
-- ТЕСТОВЫЕ ДАННЫЕ ДЛЯ TELEGRAM SALES BOT
-- ================================================

-- ================================================
-- 1. ЗАПОЛНЕНИЕ КАЛЕНДАРЯ (текущий год)
-- ================================================
INSERT INTO dim_calendar (date, year, month, day_of_month, day_of_week, week_of_year, is_weekend, month_name, quarter)
SELECT
    d::DATE,
    EXTRACT(YEAR FROM d)::INTEGER,
    EXTRACT(MONTH FROM d)::INTEGER,
    EXTRACT(DAY FROM d)::INTEGER,
    EXTRACT(ISODOW FROM d)::INTEGER,
    EXTRACT(WEEK FROM d)::INTEGER,
    EXTRACT(ISODOW FROM d) IN (6, 7),
    TO_CHAR(d, 'Month'),
    EXTRACT(QUARTER FROM d)::INTEGER
FROM generate_series('2024-01-01'::DATE, '2025-12-31'::DATE, '1 day'::INTERVAL) AS d
ON CONFLICT (date) DO NOTHING;

-- ================================================
-- 2. КАТЕГОРИИ
-- ================================================
INSERT INTO dim_categories (category_key, category_name, sort_order) VALUES
    ('face', 'Лицо', 1),
    ('hair', 'Волосы', 2),
    ('body', 'Тело', 3),
    ('makeup', 'Макияж', 4)
ON CONFLICT (category_key) DO UPDATE SET
    category_name = EXCLUDED.category_name,
    sort_order = EXCLUDED.sort_order;

-- ================================================
-- 3. ТОВАРЫ (примерно 80 товаров, по 20 на категорию)
-- ================================================

-- ЛИЦО (face)
INSERT INTO dim_products (sku, title, category_key, subcategory, brand, base_price, cost_price, margin_percent, commission_percent) VALUES
-- Кремы
('FC001', 'Крем увлажняющий дневной 50мл', 'face', 'Кремы', 'MIXIT', 890, 320, 64, 15),
('FC002', 'Крем ночной восстанавливающий 50мл', 'face', 'Кремы', 'MIXIT', 1190, 420, 65, 15),
('FC003', 'Крем-гель легкий SPF30 50мл', 'face', 'Кремы', 'MIXIT', 990, 350, 65, 15),
('FC004', 'Крем антивозрастной с ретинолом 30мл', 'face', 'Кремы', 'MIXIT', 1590, 520, 67, 15),
('FC005', 'Крем для жирной кожи матирующий 50мл', 'face', 'Кремы', 'MIXIT', 790, 280, 65, 15),
-- Сыворотки
('FS001', 'Сыворотка витамин С 15% 30мл', 'face', 'Сыворотки', 'MIXIT', 1890, 580, 69, 15),
('FS002', 'Сыворотка гиалуроновая 30мл', 'face', 'Сыворотки', 'MIXIT', 1290, 390, 70, 15),
('FS003', 'Сыворотка ниацинамид 10% 30мл', 'face', 'Сыворотки', 'MIXIT', 1090, 330, 70, 15),
('FS004', 'Сыворотка пептидная лифтинг 30мл', 'face', 'Сыворотки', 'MIXIT', 2190, 680, 69, 15),
('FS005', 'Сыворотка осветляющая 30мл', 'face', 'Сыворотки', 'MIXIT', 1490, 450, 70, 15),
-- Маски
('FM001', 'Маска тканевая увлажняющая 5шт', 'face', 'Маски', 'MIXIT', 590, 180, 69, 15),
('FM002', 'Маска глиняная очищающая 100мл', 'face', 'Маски', 'MIXIT', 690, 210, 70, 15),
('FM003', 'Маска ночная несмываемая 50мл', 'face', 'Маски', 'MIXIT', 890, 290, 67, 15),
('FM004', 'Патчи под глаза гидрогелевые 60шт', 'face', 'Маски', 'MIXIT', 990, 320, 68, 15),
('FM005', 'Маска пленка черная 100мл', 'face', 'Маски', 'MIXIT', 490, 150, 69, 15),
-- Тоники/Мисты
('FT001', 'Тоник увлажняющий 200мл', 'face', 'Тоники', 'MIXIT', 590, 180, 69, 15),
('FT002', 'Мист освежающий 100мл', 'face', 'Тоники', 'MIXIT', 490, 150, 69, 15),
('FT003', 'Эссенция восстанавливающая 150мл', 'face', 'Тоники', 'MIXIT', 890, 280, 69, 15),
('FT004', 'Тонер-эксфолиант AHA/BHA 200мл', 'face', 'Тоники', 'MIXIT', 790, 250, 68, 15),
('FT005', 'Лосьон балансирующий 200мл', 'face', 'Тоники', 'MIXIT', 590, 180, 69, 15);

-- ВОЛОСЫ (hair)
INSERT INTO dim_products (sku, title, category_key, subcategory, brand, base_price, cost_price, margin_percent, commission_percent) VALUES
-- Шампуни
('HS001', 'Шампунь увлажняющий 400мл', 'hair', 'Шампуни', 'MIXIT', 590, 180, 69, 15),
('HS002', 'Шампунь для объема 400мл', 'hair', 'Шампуни', 'MIXIT', 590, 180, 69, 15),
('HS003', 'Шампунь восстанавливающий 400мл', 'hair', 'Шампуни', 'MIXIT', 690, 210, 70, 15),
('HS004', 'Шампунь против перхоти 400мл', 'hair', 'Шампуни', 'MIXIT', 690, 210, 70, 15),
('HS005', 'Шампунь для окрашенных 400мл', 'hair', 'Шампуни', 'MIXIT', 690, 210, 70, 15),
-- Бальзамы/Кондиционеры
('HB001', 'Бальзам увлажняющий 400мл', 'hair', 'Бальзамы', 'MIXIT', 590, 180, 69, 15),
('HB002', 'Кондиционер несмываемый 200мл', 'hair', 'Бальзамы', 'MIXIT', 490, 150, 69, 15),
('HB003', 'Маска для волос восстановление 300мл', 'hair', 'Бальзамы', 'MIXIT', 790, 250, 68, 15),
('HB004', 'Бальзам для блеска 400мл', 'hair', 'Бальзамы', 'MIXIT', 590, 180, 69, 15),
('HB005', 'Кондиционер глубокое питание 400мл', 'hair', 'Бальзамы', 'MIXIT', 690, 210, 70, 15),
-- Стайлинг
('HST01', 'Спрей термозащита 200мл', 'hair', 'Стайлинг', 'MIXIT', 590, 180, 69, 15),
('HST02', 'Масло для кончиков 50мл', 'hair', 'Стайлинг', 'MIXIT', 490, 150, 69, 15),
('HST03', 'Мусс для укладки 200мл', 'hair', 'Стайлинг', 'MIXIT', 490, 150, 69, 15),
('HST04', 'Лак сильная фиксация 300мл', 'hair', 'Стайлинг', 'MIXIT', 390, 120, 69, 15),
('HST05', 'Сыворотка для волос 50мл', 'hair', 'Стайлинг', 'MIXIT', 690, 210, 70, 15),
-- Специальный уход
('HSP01', 'Ампулы против выпадения 10шт', 'hair', 'Спецуход', 'MIXIT', 1290, 400, 69, 15),
('HSP02', 'Скраб для кожи головы 200мл', 'hair', 'Спецуход', 'MIXIT', 590, 180, 69, 15),
('HSP03', 'Тоник для роста волос 100мл', 'hair', 'Спецуход', 'MIXIT', 890, 280, 69, 15),
('HSP04', 'Пилинг для кожи головы 100мл', 'hair', 'Спецуход', 'MIXIT', 690, 210, 70, 15),
('HSP05', 'Комплекс витамины для волос 30шт', 'hair', 'Спецуход', 'MIXIT', 1490, 480, 68, 15);

-- ТЕЛО (body)
INSERT INTO dim_products (sku, title, category_key, subcategory, brand, base_price, cost_price, margin_percent, commission_percent) VALUES
-- Гели для душа
('BG001', 'Гель для душа увлажняющий 400мл', 'body', 'Гели для душа', 'MIXIT', 390, 120, 69, 15),
('BG002', 'Гель для душа освежающий 400мл', 'body', 'Гели для душа', 'MIXIT', 390, 120, 69, 15),
('BG003', 'Масло для душа 200мл', 'body', 'Гели для душа', 'MIXIT', 490, 150, 69, 15),
('BG004', 'Гель-скраб для тела 300мл', 'body', 'Гели для душа', 'MIXIT', 490, 150, 69, 15),
('BG005', 'Крем-гель для душа 400мл', 'body', 'Гели для душа', 'MIXIT', 450, 140, 69, 15),
-- Кремы и лосьоны
('BC001', 'Крем для тела питательный 250мл', 'body', 'Кремы для тела', 'MIXIT', 590, 180, 69, 15),
('BC002', 'Лосьон для тела легкий 300мл', 'body', 'Кремы для тела', 'MIXIT', 490, 150, 69, 15),
('BC003', 'Масло для тела 150мл', 'body', 'Кремы для тела', 'MIXIT', 590, 180, 69, 15),
('BC004', 'Молочко для тела 300мл', 'body', 'Кремы для тела', 'MIXIT', 490, 150, 69, 15),
('BC005', 'Крем для рук 75мл', 'body', 'Кремы для тела', 'MIXIT', 290, 90, 69, 15),
-- Скрабы
('BS001', 'Скраб сахарный 300г', 'body', 'Скрабы', 'MIXIT', 490, 150, 69, 15),
('BS002', 'Скраб солевой 300г', 'body', 'Скрабы', 'MIXIT', 490, 150, 69, 15),
('BS003', 'Скраб кофейный 200г', 'body', 'Скрабы', 'MIXIT', 590, 180, 69, 15),
('BS004', 'Пилинг для тела 200мл', 'body', 'Скрабы', 'MIXIT', 490, 150, 69, 15),
('BS005', 'Скраб антицеллюлитный 300г', 'body', 'Скрабы', 'MIXIT', 690, 210, 70, 15),
-- Антицеллюлит
('BA001', 'Крем антицеллюлитный 200мл', 'body', 'Антицеллюлит', 'MIXIT', 890, 280, 69, 15),
('BA002', 'Масло антицеллюлитное 150мл', 'body', 'Антицеллюлит', 'MIXIT', 690, 210, 70, 15),
('BA003', 'Обертывание горячее 300мл', 'body', 'Антицеллюлит', 'MIXIT', 790, 250, 68, 15),
('BA004', 'Гель моделирующий 200мл', 'body', 'Антицеллюлит', 'MIXIT', 890, 280, 69, 15),
('BA005', 'Сыворотка для тела 100мл', 'body', 'Антицеллюлит', 'MIXIT', 990, 320, 68, 15);

-- МАКИЯЖ (makeup)
INSERT INTO dim_products (sku, title, category_key, subcategory, brand, base_price, cost_price, margin_percent, commission_percent) VALUES
-- Губы
('ML001', 'Помада матовая', 'makeup', 'Губы', 'MIXIT', 590, 180, 69, 15),
('ML002', 'Блеск для губ', 'makeup', 'Губы', 'MIXIT', 490, 150, 69, 15),
('ML003', 'Тинт для губ', 'makeup', 'Губы', 'MIXIT', 450, 140, 69, 15),
('ML004', 'Карандаш для губ', 'makeup', 'Губы', 'MIXIT', 290, 90, 69, 15),
('ML005', 'Бальзам для губ', 'makeup', 'Губы', 'MIXIT', 250, 80, 68, 15),
-- Глаза
('ME001', 'Тушь объемная', 'makeup', 'Глаза', 'MIXIT', 690, 210, 70, 15),
('ME002', 'Подводка жидкая', 'makeup', 'Глаза', 'MIXIT', 490, 150, 69, 15),
('ME003', 'Тени палетка 12 цветов', 'makeup', 'Глаза', 'MIXIT', 990, 320, 68, 15),
('ME004', 'Карандаш для глаз', 'makeup', 'Глаза', 'MIXIT', 290, 90, 69, 15),
('ME005', 'Гель для бровей', 'makeup', 'Глаза', 'MIXIT', 390, 120, 69, 15),
-- Лицо
('MF001', 'Тональный крем', 'makeup', 'Тон', 'MIXIT', 890, 280, 69, 15),
('MF002', 'Консилер', 'makeup', 'Тон', 'MIXIT', 590, 180, 69, 15),
('MF003', 'Пудра компактная', 'makeup', 'Тон', 'MIXIT', 690, 210, 70, 15),
('MF004', 'Хайлайтер', 'makeup', 'Тон', 'MIXIT', 590, 180, 69, 15),
('MF005', 'Румяна', 'makeup', 'Тон', 'MIXIT', 490, 150, 69, 15),
-- База
('MB001', 'Праймер матирующий', 'makeup', 'База', 'MIXIT', 690, 210, 70, 15),
('MB002', 'Праймер увлажняющий', 'makeup', 'База', 'MIXIT', 690, 210, 70, 15),
('MB003', 'Спрей-фиксатор макияжа', 'makeup', 'База', 'MIXIT', 490, 150, 69, 15),
('MB004', 'База под тени', 'makeup', 'База', 'MIXIT', 390, 120, 69, 15),
('MB005', 'Мицеллярная вода 400мл', 'makeup', 'База', 'MIXIT', 490, 150, 69, 15);

-- ================================================
-- 4. ГЕНЕРАЦИЯ ДАННЫХ ПРОДАЖ (последние 2 месяца)
-- ================================================

-- Функция для генерации случайных продаж
DO $$
DECLARE
    p RECORD;
    d DATE;
    base_units INTEGER;
    daily_units INTEGER;
    daily_revenue DECIMAL;
    daily_orders INTEGER;
BEGIN
    -- Для каждого товара
    FOR p IN SELECT product_id, base_price, category_key FROM dim_products LOOP
        -- Базовые продажи зависят от категории
        base_units := CASE p.category_key
            WHEN 'face' THEN 15
            WHEN 'hair' THEN 20
            WHEN 'body' THEN 25
            WHEN 'makeup' THEN 18
            ELSE 15
        END;

        -- Генерируем данные за последние 60 дней
        FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE, '1 day')::DATE LOOP
            -- Случайное колебание ±50%
            daily_units := GREATEST(1, base_units + (RANDOM() * base_units - base_units/2)::INTEGER);

            -- В выходные продажи выше
            IF EXTRACT(ISODOW FROM d) IN (6, 7) THEN
                daily_units := (daily_units * 1.3)::INTEGER;
            END IF;

            daily_revenue := daily_units * p.base_price * (0.9 + RANDOM() * 0.2); -- скидки 0-10%
            daily_orders := GREATEST(1, (daily_units * 0.7)::INTEGER); -- средний чек ~1.4 товара

            INSERT INTO fact_sales_daily (date, product_id, units, revenue, orders_count)
            VALUES (d, p.product_id, daily_units, daily_revenue, daily_orders)
            ON CONFLICT (date, product_id) DO UPDATE SET
                units = EXCLUDED.units,
                revenue = EXCLUDED.revenue,
                orders_count = EXCLUDED.orders_count;
        END LOOP;
    END LOOP;
END $$;

-- ================================================
-- 5. ГЕНЕРАЦИЯ ПЛАНА ПРОДАЖ
-- ================================================
DO $$
DECLARE
    cat RECORD;
    d DATE;
    daily_plan DECIMAL;
BEGIN
    FOR cat IN SELECT category_key FROM dim_categories LOOP
        -- План на день = средние продажи * 1.1 (рост 10%)
        daily_plan := CASE cat.category_key
            WHEN 'face' THEN 450000
            WHEN 'hair' THEN 380000
            WHEN 'body' THEN 320000
            WHEN 'makeup' THEN 280000
            ELSE 300000
        END;

        FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '30 days', '1 day')::DATE LOOP
            INSERT INTO plan_sales_daily (date, category_key, plan_revenue, plan_units)
            VALUES (d, cat.category_key, daily_plan * (0.95 + RANDOM() * 0.1), (daily_plan / 800)::INTEGER)
            ON CONFLICT (date, category_key, COALESCE(subcategory, '')) DO UPDATE SET
                plan_revenue = EXCLUDED.plan_revenue,
                plan_units = EXCLUDED.plan_units;
        END LOOP;
    END LOOP;
END $$;

-- ================================================
-- 6. ГЕНЕРАЦИЯ РЕКЛАМНЫХ РАСХОДОВ
-- ================================================
DO $$
DECLARE
    p RECORD;
    d DATE;
    daily_spend DECIMAL;
BEGIN
    FOR p IN SELECT product_id, base_price FROM dim_products WHERE RANDOM() > 0.3 LOOP -- 70% товаров с рекламой
        FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE, '1 day')::DATE LOOP
            -- DRR примерно 5-25%
            daily_spend := p.base_price * (3 + RANDOM() * 5) * (0.05 + RANDOM() * 0.2);

            INSERT INTO fact_ads_daily (date, product_id, spend, impressions, clicks, orders_from_ads)
            VALUES (
                d,
                p.product_id,
                daily_spend,
                (daily_spend * 10 + RANDOM() * 500)::INTEGER,
                (daily_spend * 0.5 + RANDOM() * 20)::INTEGER,
                GREATEST(0, (daily_spend * 0.05 + RANDOM() * 3)::INTEGER)
            )
            ON CONFLICT (date, product_id) DO UPDATE SET
                spend = EXCLUDED.spend,
                impressions = EXCLUDED.impressions,
                clicks = EXCLUDED.clicks;
        END LOOP;
    END LOOP;
END $$;

-- ================================================
-- 7. ГЕНЕРАЦИЯ ИСТОРИИ ЦЕН
-- ================================================
DO $$
DECLARE
    p RECORD;
    d DATE;
    current_price DECIMAL;
    volatility DECIMAL;
BEGIN
    FOR p IN SELECT product_id, base_price FROM dim_products LOOP
        -- Волатильность 0-15%
        volatility := RANDOM() * 0.15;
        current_price := p.base_price;

        FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE, '1 day')::DATE LOOP
            -- Случайное изменение цены
            current_price := p.base_price * (1 - volatility/2 + RANDOM() * volatility);

            INSERT INTO fact_price_daily (date, product_id, price, discount_percent)
            VALUES (
                d,
                p.product_id,
                current_price,
                GREATEST(0, ((p.base_price - current_price) / p.base_price * 100))
            )
            ON CONFLICT (date, product_id) DO UPDATE SET
                price = EXCLUDED.price,
                discount_percent = EXCLUDED.discount_percent;
        END LOOP;
    END LOOP;
END $$;

-- Проверка данных
SELECT 'dim_products' as table_name, COUNT(*) as rows FROM dim_products
UNION ALL
SELECT 'fact_sales_daily', COUNT(*) FROM fact_sales_daily
UNION ALL
SELECT 'plan_sales_daily', COUNT(*) FROM plan_sales_daily
UNION ALL
SELECT 'fact_ads_daily', COUNT(*) FROM fact_ads_daily
UNION ALL
SELECT 'fact_price_daily', COUNT(*) FROM fact_price_daily;
