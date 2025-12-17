-- ================================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS) ДЛЯ АНАЛИТИКИ
-- ================================================

-- ================================================
-- 1. ПЛАН/ФАКТ ПО КАТЕГОРИЯМ НА СЕГОДНЯ
-- ================================================
CREATE OR REPLACE VIEW v_category_plan_fact_today AS
SELECT
    c.category_key,
    c.category_name,
    c.sort_order,
    -- План на сегодня
    COALESCE(p.plan_revenue, 0) as plan_revenue_today,
    COALESCE(p.plan_units, 0) as plan_units_today,
    -- Факт на сегодня
    COALESCE(SUM(s.revenue), 0) as fact_revenue_today,
    COALESCE(SUM(s.units), 0) as fact_units_today,
    -- Выполнение плана
    CASE WHEN COALESCE(p.plan_revenue, 0) > 0
        THEN ROUND(COALESCE(SUM(s.revenue), 0) / p.plan_revenue * 100, 1)
        ELSE 0
    END as revenue_completion_pct,
    -- Отклонение
    COALESCE(SUM(s.revenue), 0) - COALESCE(p.plan_revenue, 0) as revenue_deviation,
    CURRENT_DATE as report_date
FROM dim_categories c
LEFT JOIN plan_sales_daily p ON c.category_key = p.category_key
    AND p.date = CURRENT_DATE
    AND p.subcategory IS NULL
LEFT JOIN dim_products pr ON pr.category_key = c.category_key AND pr.is_active = true
LEFT JOIN fact_sales_daily s ON s.product_id = pr.product_id AND s.date = CURRENT_DATE
GROUP BY c.category_key, c.category_name, c.sort_order, p.plan_revenue, p.plan_units
ORDER BY c.sort_order;

-- ================================================
-- 2. ПЛАН/ФАКТ ПО КАТЕГОРИЯМ MTD (С НАЧАЛА МЕСЯЦА)
-- ================================================
CREATE OR REPLACE VIEW v_category_plan_fact_mtd AS
WITH mtd_dates AS (
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start,
        CURRENT_DATE as current_date
),
plan_mtd AS (
    SELECT
        p.category_key,
        SUM(p.plan_revenue) as plan_revenue_mtd,
        SUM(p.plan_units) as plan_units_mtd
    FROM plan_sales_daily p, mtd_dates d
    WHERE p.date >= d.month_start
        AND p.date <= d.current_date
        AND p.subcategory IS NULL
    GROUP BY p.category_key
),
fact_mtd AS (
    SELECT
        pr.category_key,
        SUM(s.revenue) as fact_revenue_mtd,
        SUM(s.units) as fact_units_mtd,
        SUM(s.orders_count) as orders_mtd
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id AND pr.is_active = true
    CROSS JOIN mtd_dates d
    WHERE s.date >= d.month_start AND s.date <= d.current_date
    GROUP BY pr.category_key
),
-- Предыдущий месяц MTD (те же дни)
prev_month_mtd AS (
    SELECT
        pr.category_key,
        SUM(s.revenue) as prev_revenue_mtd,
        SUM(s.units) as prev_units_mtd
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id
    CROSS JOIN mtd_dates d
    WHERE s.date >= (d.month_start - INTERVAL '1 month')::DATE
        AND s.date <= (d.current_date - INTERVAL '1 month')::DATE
    GROUP BY pr.category_key
)
SELECT
    c.category_key,
    c.category_name,
    c.sort_order,
    -- План MTD
    COALESCE(p.plan_revenue_mtd, 0) as plan_revenue_mtd,
    COALESCE(p.plan_units_mtd, 0) as plan_units_mtd,
    -- Факт MTD
    COALESCE(f.fact_revenue_mtd, 0) as fact_revenue_mtd,
    COALESCE(f.fact_units_mtd, 0) as fact_units_mtd,
    COALESCE(f.orders_mtd, 0) as orders_mtd,
    -- Выполнение плана
    CASE WHEN COALESCE(p.plan_revenue_mtd, 0) > 0
        THEN ROUND(COALESCE(f.fact_revenue_mtd, 0) / p.plan_revenue_mtd * 100, 1)
        ELSE 0
    END as revenue_completion_pct,
    -- Отклонение
    COALESCE(f.fact_revenue_mtd, 0) - COALESCE(p.plan_revenue_mtd, 0) as revenue_deviation,
    -- MoM (сравнение с прошлым месяцем)
    COALESCE(pm.prev_revenue_mtd, 0) as prev_revenue_mtd,
    CASE WHEN COALESCE(pm.prev_revenue_mtd, 0) > 0
        THEN ROUND((COALESCE(f.fact_revenue_mtd, 0) - pm.prev_revenue_mtd) / pm.prev_revenue_mtd * 100, 1)
        ELSE NULL
    END as mom_revenue_pct,
    (SELECT month_start FROM mtd_dates) as period_start,
    (SELECT current_date FROM mtd_dates) as period_end
FROM dim_categories c
LEFT JOIN plan_mtd p ON c.category_key = p.category_key
LEFT JOIN fact_mtd f ON c.category_key = f.category_key
LEFT JOIN prev_month_mtd pm ON c.category_key = pm.category_key
ORDER BY c.sort_order;

-- ================================================
-- 3. ПЛАН/ФАКТ ПО ПОДКАТЕГОРИЯМ MTD
-- ================================================
CREATE OR REPLACE VIEW v_subcategory_plan_fact_mtd AS
WITH mtd_dates AS (
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start,
        CURRENT_DATE as current_date
),
fact_mtd AS (
    SELECT
        pr.category_key,
        pr.subcategory,
        SUM(s.revenue) as fact_revenue_mtd,
        SUM(s.units) as fact_units_mtd,
        COUNT(DISTINCT pr.product_id) as products_count
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id AND pr.is_active = true
    CROSS JOIN mtd_dates d
    WHERE s.date >= d.month_start AND s.date <= d.current_date
    GROUP BY pr.category_key, pr.subcategory
),
plan_mtd AS (
    SELECT
        p.category_key,
        p.subcategory,
        SUM(p.plan_revenue) as plan_revenue_mtd,
        SUM(p.plan_units) as plan_units_mtd
    FROM plan_sales_daily p, mtd_dates d
    WHERE p.date >= d.month_start AND p.date <= d.current_date
        AND p.subcategory IS NOT NULL
    GROUP BY p.category_key, p.subcategory
),
prev_month_mtd AS (
    SELECT
        pr.category_key,
        pr.subcategory,
        SUM(s.revenue) as prev_revenue_mtd
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id
    CROSS JOIN mtd_dates d
    WHERE s.date >= (d.month_start - INTERVAL '1 month')::DATE
        AND s.date <= (d.current_date - INTERVAL '1 month')::DATE
    GROUP BY pr.category_key, pr.subcategory
)
SELECT
    c.category_key,
    c.category_name,
    COALESCE(f.subcategory, p.subcategory) as subcategory,
    COALESCE(f.products_count, 0) as products_count,
    COALESCE(p.plan_revenue_mtd, 0) as plan_revenue_mtd,
    COALESCE(f.fact_revenue_mtd, 0) as fact_revenue_mtd,
    COALESCE(f.fact_units_mtd, 0) as fact_units_mtd,
    CASE WHEN COALESCE(p.plan_revenue_mtd, 0) > 0
        THEN ROUND(COALESCE(f.fact_revenue_mtd, 0) / p.plan_revenue_mtd * 100, 1)
        ELSE 0
    END as revenue_completion_pct,
    CASE WHEN COALESCE(pm.prev_revenue_mtd, 0) > 0
        THEN ROUND((COALESCE(f.fact_revenue_mtd, 0) - pm.prev_revenue_mtd) / pm.prev_revenue_mtd * 100, 1)
        ELSE NULL
    END as mom_revenue_pct
FROM dim_categories c
LEFT JOIN fact_mtd f ON c.category_key = f.category_key
LEFT JOIN plan_mtd p ON c.category_key = p.category_key
    AND COALESCE(f.subcategory, '') = COALESCE(p.subcategory, '')
LEFT JOIN prev_month_mtd pm ON c.category_key = pm.category_key
    AND COALESCE(f.subcategory, '') = COALESCE(pm.subcategory, '')
WHERE f.subcategory IS NOT NULL OR p.subcategory IS NOT NULL
ORDER BY c.sort_order, f.fact_revenue_mtd DESC NULLS LAST;

-- ================================================
-- 4. ТОП ТОВАРОВ ПО КАТЕГОРИЯМ MTD
-- ================================================
CREATE OR REPLACE VIEW v_top_products_by_category_mtd AS
WITH mtd_dates AS (
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start,
        CURRENT_DATE as current_date
),
product_mtd AS (
    SELECT
        pr.product_id,
        pr.sku,
        pr.title,
        pr.category_key,
        pr.subcategory,
        pr.brand,
        pr.margin_percent,
        SUM(s.revenue) as revenue_mtd,
        SUM(s.units) as units_mtd,
        SUM(s.orders_count) as orders_mtd
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id AND pr.is_active = true
    CROSS JOIN mtd_dates d
    WHERE s.date >= d.month_start AND s.date <= d.current_date
    GROUP BY pr.product_id, pr.sku, pr.title, pr.category_key, pr.subcategory, pr.brand, pr.margin_percent
),
ads_mtd AS (
    SELECT
        product_id,
        SUM(spend) as ads_spend_mtd
    FROM fact_ads_daily a, mtd_dates d
    WHERE a.date >= d.month_start AND a.date <= d.current_date
    GROUP BY product_id
),
ranked AS (
    SELECT
        p.*,
        COALESCE(a.ads_spend_mtd, 0) as ads_spend_mtd,
        CASE WHEN p.revenue_mtd > 0
            THEN ROUND(COALESCE(a.ads_spend_mtd, 0) / p.revenue_mtd * 100, 1)
            ELSE 0
        END as drr_pct,
        ROW_NUMBER() OVER (PARTITION BY p.category_key ORDER BY p.revenue_mtd DESC) as rank_in_category
    FROM product_mtd p
    LEFT JOIN ads_mtd a ON a.product_id = p.product_id
)
SELECT
    c.category_name,
    r.*
FROM ranked r
JOIN dim_categories c ON c.category_key = r.category_key
WHERE r.rank_in_category <= 50 -- Берём топ-50 для гибкости
ORDER BY r.category_key, r.rank_in_category;

-- ================================================
-- 5. СРАВНЕНИЕ ТОВАРОВ MoM (MTD vs предыдущий MTD)
-- ================================================
CREATE OR REPLACE VIEW v_top_products_mom_compare AS
WITH mtd_dates AS (
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start,
        CURRENT_DATE as current_date
),
current_mtd AS (
    SELECT
        pr.product_id,
        pr.sku,
        pr.title,
        pr.category_key,
        pr.subcategory,
        SUM(s.revenue) as revenue_current,
        SUM(s.units) as units_current
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id AND pr.is_active = true
    CROSS JOIN mtd_dates d
    WHERE s.date >= d.month_start AND s.date <= d.current_date
    GROUP BY pr.product_id, pr.sku, pr.title, pr.category_key, pr.subcategory
),
prev_mtd AS (
    SELECT
        pr.product_id,
        SUM(s.revenue) as revenue_prev,
        SUM(s.units) as units_prev
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id
    CROSS JOIN mtd_dates d
    WHERE s.date >= (d.month_start - INTERVAL '1 month')::DATE
        AND s.date <= (d.current_date - INTERVAL '1 month')::DATE
    GROUP BY pr.product_id
)
SELECT
    c.category_name,
    cur.product_id,
    cur.sku,
    cur.title,
    cur.category_key,
    cur.subcategory,
    cur.revenue_current,
    cur.units_current,
    COALESCE(prev.revenue_prev, 0) as revenue_prev,
    COALESCE(prev.units_prev, 0) as units_prev,
    -- MoM изменение
    cur.revenue_current - COALESCE(prev.revenue_prev, 0) as revenue_change,
    CASE WHEN COALESCE(prev.revenue_prev, 0) > 0
        THEN ROUND((cur.revenue_current - prev.revenue_prev) / prev.revenue_prev * 100, 1)
        ELSE NULL
    END as mom_revenue_pct,
    CASE WHEN COALESCE(prev.units_prev, 0) > 0
        THEN ROUND((cur.units_current - prev.units_prev)::DECIMAL / prev.units_prev * 100, 1)
        ELSE NULL
    END as mom_units_pct
FROM current_mtd cur
JOIN dim_categories c ON c.category_key = cur.category_key
LEFT JOIN prev_mtd prev ON prev.product_id = cur.product_id
ORDER BY cur.category_key, cur.revenue_current DESC;

-- ================================================
-- 6. ТОП-20 КАНДИДАТОВ НА РОСТ (GROWTH SCORE)
-- ================================================
CREATE OR REPLACE VIEW v_top20_growth_candidates AS
WITH mtd_dates AS (
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start,
        CURRENT_DATE as current_date
),
product_stats AS (
    SELECT
        pr.product_id,
        pr.sku,
        pr.title,
        pr.category_key,
        pr.subcategory,
        pr.brand,
        pr.margin_percent,
        SUM(s.revenue) as revenue_mtd,
        SUM(s.units) as units_mtd,
        -- Стабильность спроса (std/avg по дневным продажам)
        CASE WHEN AVG(s.revenue) > 0
            THEN COALESCE(STDDEV(s.revenue) / NULLIF(AVG(s.revenue), 0), 0)
            ELSE 1
        END as demand_volatility
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id AND pr.is_active = true
    CROSS JOIN mtd_dates d
    WHERE s.date >= d.month_start AND s.date <= d.current_date
    GROUP BY pr.product_id, pr.sku, pr.title, pr.category_key, pr.subcategory, pr.brand, pr.margin_percent
),
prev_mtd AS (
    SELECT
        pr.product_id,
        SUM(s.revenue) as revenue_prev
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id
    CROSS JOIN mtd_dates d
    WHERE s.date >= (d.month_start - INTERVAL '1 month')::DATE
        AND s.date <= (d.current_date - INTERVAL '1 month')::DATE
    GROUP BY pr.product_id
),
ads_mtd AS (
    SELECT
        product_id,
        SUM(spend) as ads_spend
    FROM fact_ads_daily a, mtd_dates d
    WHERE a.date >= d.month_start AND a.date <= d.current_date
    GROUP BY product_id
),
scored AS (
    SELECT
        ps.*,
        COALESCE(pm.revenue_prev, 0) as revenue_prev,
        COALESCE(a.ads_spend, 0) as ads_spend,
        -- MoM рост %
        CASE WHEN COALESCE(pm.revenue_prev, 0) > 0
            THEN (ps.revenue_mtd - pm.revenue_prev) / pm.revenue_prev * 100
            ELSE 0
        END as mom_growth_pct,
        -- DRR %
        CASE WHEN ps.revenue_mtd > 0
            THEN COALESCE(a.ads_spend, 0) / ps.revenue_mtd * 100
            ELSE 0
        END as drr_pct,
        -- Growth Score = MoM*0.3 + Margin*0.3 + (1-Volatility)*0.2 - DRR*0.2
        (
            CASE WHEN COALESCE(pm.revenue_prev, 0) > 0
                THEN (ps.revenue_mtd - pm.revenue_prev) / pm.revenue_prev * 100 * 0.3
                ELSE 0
            END
            + COALESCE(ps.margin_percent, 0) * 0.3
            + (1 - LEAST(ps.demand_volatility, 1)) * 20 -- нормализуем
            - CASE WHEN ps.revenue_mtd > 0
                THEN COALESCE(a.ads_spend, 0) / ps.revenue_mtd * 100 * 0.2
                ELSE 0
            END
        ) as growth_score
    FROM product_stats ps
    LEFT JOIN prev_mtd pm ON pm.product_id = ps.product_id
    LEFT JOIN ads_mtd a ON a.product_id = ps.product_id
),
ranked AS (
    SELECT
        s.*,
        -- Классификация
        CASE
            WHEN s.drr_pct < 10 AND s.mom_growth_pct > 0 THEN 'quick_win'
            WHEN COALESCE(s.margin_percent, 0) > 30 AND s.mom_growth_pct <= 0 THEN 'needs_boost'
            WHEN s.drr_pct > 20 AND s.mom_growth_pct < 0 THEN 'risky'
            ELSE 'stable'
        END as growth_category,
        ROW_NUMBER() OVER (PARTITION BY s.category_key ORDER BY s.growth_score DESC) as rank_in_category
    FROM scored s
)
SELECT
    c.category_name,
    r.*
FROM ranked r
JOIN dim_categories c ON c.category_key = r.category_key
WHERE r.rank_in_category <= 20
ORDER BY r.category_key, r.growth_score DESC;

-- ================================================
-- 7. СТАБИЛЬНОСТЬ ЦЕНЫ (ВОЛАТИЛЬНОСТЬ)
-- ================================================
CREATE OR REPLACE VIEW v_price_stability AS
WITH price_stats AS (
    SELECT
        pr.product_id,
        pr.sku,
        pr.title,
        pr.category_key,
        pr.subcategory,
        AVG(fp.price) as avg_price,
        STDDEV(fp.price) as std_price,
        MIN(fp.price) as min_price,
        MAX(fp.price) as max_price,
        COUNT(*) as days_with_data
    FROM fact_price_daily fp
    JOIN dim_products pr ON pr.product_id = fp.product_id AND pr.is_active = true
    WHERE fp.date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY pr.product_id, pr.sku, pr.title, pr.category_key, pr.subcategory
    HAVING COUNT(*) >= 7 -- минимум неделя данных
)
SELECT
    c.category_name,
    ps.*,
    -- Коэффициент вариации (чем ниже - тем стабильнее)
    CASE WHEN ps.avg_price > 0
        THEN ROUND(COALESCE(ps.std_price, 0) / ps.avg_price * 100, 2)
        ELSE 0
    END as price_cv_pct,
    -- Ранг стабильности внутри категории
    ROW_NUMBER() OVER (
        PARTITION BY ps.category_key
        ORDER BY CASE WHEN ps.avg_price > 0
            THEN COALESCE(ps.std_price, 0) / ps.avg_price
            ELSE 999
        END ASC
    ) as stability_rank
FROM price_stats ps
JOIN dim_categories c ON c.category_key = ps.category_key
ORDER BY ps.category_key, stability_rank;

-- ================================================
-- 8. ПРИБЫЛЬНОСТЬ (PROFIT PROXY)
-- ================================================
CREATE OR REPLACE VIEW v_profit_proxy AS
WITH mtd_dates AS (
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start,
        CURRENT_DATE as current_date
),
product_revenue AS (
    SELECT
        pr.product_id,
        pr.sku,
        pr.title,
        pr.category_key,
        pr.subcategory,
        pr.margin_percent,
        pr.commission_percent,
        SUM(s.revenue) as revenue_mtd,
        SUM(s.units) as units_mtd
    FROM fact_sales_daily s
    JOIN dim_products pr ON pr.product_id = s.product_id AND pr.is_active = true
    CROSS JOIN mtd_dates d
    WHERE s.date >= d.month_start AND s.date <= d.current_date
    GROUP BY pr.product_id, pr.sku, pr.title, pr.category_key, pr.subcategory, pr.margin_percent, pr.commission_percent
),
ads_mtd AS (
    SELECT
        product_id,
        SUM(spend) as ads_spend
    FROM fact_ads_daily a, mtd_dates d
    WHERE a.date >= d.month_start AND a.date <= d.current_date
    GROUP BY product_id
)
SELECT
    c.category_name,
    pr.product_id,
    pr.sku,
    pr.title,
    pr.category_key,
    pr.subcategory,
    pr.revenue_mtd,
    pr.units_mtd,
    COALESCE(pr.margin_percent, 0) as margin_percent,
    COALESCE(pr.commission_percent, 15) as commission_percent,
    COALESCE(a.ads_spend, 0) as ads_spend_mtd,
    -- Profit Proxy = Revenue * Margin% - Commission - Ads
    ROUND(
        pr.revenue_mtd * COALESCE(pr.margin_percent, 0) / 100
        - pr.revenue_mtd * COALESCE(pr.commission_percent, 15) / 100
        - COALESCE(a.ads_spend, 0)
    , 2) as profit_proxy,
    -- ROI = Profit / Ads * 100
    CASE WHEN COALESCE(a.ads_spend, 0) > 0
        THEN ROUND(
            (pr.revenue_mtd * COALESCE(pr.margin_percent, 0) / 100
            - pr.revenue_mtd * COALESCE(pr.commission_percent, 15) / 100
            - a.ads_spend) / a.ads_spend * 100
        , 1)
        ELSE NULL
    END as roi_pct,
    -- DRR
    CASE WHEN pr.revenue_mtd > 0
        THEN ROUND(COALESCE(a.ads_spend, 0) / pr.revenue_mtd * 100, 1)
        ELSE 0
    END as drr_pct,
    ROW_NUMBER() OVER (
        PARTITION BY pr.category_key
        ORDER BY (
            pr.revenue_mtd * COALESCE(pr.margin_percent, 0) / 100
            - pr.revenue_mtd * COALESCE(pr.commission_percent, 15) / 100
            - COALESCE(a.ads_spend, 0)
        ) DESC
    ) as profit_rank
FROM product_revenue pr
JOIN dim_categories c ON c.category_key = pr.category_key
LEFT JOIN ads_mtd a ON a.product_id = pr.product_id
ORDER BY pr.category_key, profit_proxy DESC;
