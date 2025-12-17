-- ================================================
-- VIEWS ДЛЯ РЕАЛЬНЫХ ДАННЫХ WILDBERRIES
-- Таблица: 6mWB17jun_15dec
-- ================================================

-- ================================================
-- МАППИНГ КАТЕГОРИЙ
-- ================================================
-- Создаём функцию для маппинга категорий WB → наши категории
CREATE OR REPLACE FUNCTION map_category(category_wb TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN category_wb = 'Уход за лицом' THEN 'face'
    WHEN category_wb IN ('Уход за волосами', 'Уход за вoлосами') THEN 'hair'
    WHEN category_wb = 'Уход за телом' THEN 'body'
    WHEN category_wb = 'Макияж' THEN 'makeup'
    ELSE 'other'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Названия категорий
CREATE OR REPLACE FUNCTION category_name(category_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE category_key
    WHEN 'face' THEN 'Лицо'
    WHEN 'hair' THEN 'Волосы'
    WHEN 'body' THEN 'Тело'
    WHEN 'makeup' THEN 'Макияж'
    ELSE 'Прочее'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- 1. ФАКТ ПО КАТЕГОРИЯМ НА СЕГОДНЯ
-- ================================================
CREATE OR REPLACE VIEW v_category_fact_today AS
SELECT
  map_category(category_wb) as category_key,
  category_name(map_category(category_wb)) as category_name,
  CASE map_category(category_wb)
    WHEN 'face' THEN 1
    WHEN 'hair' THEN 2
    WHEN 'body' THEN 3
    WHEN 'makeup' THEN 4
    ELSE 5
  END as sort_order,
  -- Продажи
  SUM(orders) as orders_today,
  SUM(revenue_gross) as revenue_today,
  -- Воронка
  SUM(impressions) as impressions_today,
  SUM(clicks) as clicks_today,
  SUM(add_to_cart) as add_to_cart_today,
  -- Прибыль
  SUM(profit_before_marketing) as profit_before_marketing_today,
  SUM(profit_incl_marketing) as profit_incl_marketing_today,
  -- DRR
  SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) as total_ads_spend_today,
  -- Конверсии
  CASE WHEN SUM(impressions) > 0
    THEN ROUND(SUM(clicks)::NUMERIC / SUM(impressions) * 100, 2)
    ELSE 0
  END as ctr_pct,
  CASE WHEN SUM(clicks) > 0
    THEN ROUND(SUM(orders)::NUMERIC / SUM(clicks) * 100, 2)
    ELSE 0
  END as cr_pct,
  COUNT(DISTINCT sku) as products_count,
  CURRENT_DATE as report_date
FROM "6mWB17jun_15dec"
WHERE date = CURRENT_DATE
  AND map_category(category_wb) != 'other'
GROUP BY map_category(category_wb)
ORDER BY sort_order;

-- ================================================
-- 2. ФАКТ ПО КАТЕГОРИЯМ MTD (С НАЧАЛА МЕСЯЦА)
-- ================================================
CREATE OR REPLACE VIEW v_category_fact_mtd AS
WITH mtd_data AS (
  SELECT
    map_category(category_wb) as category_key,
    SUM(orders) as orders_mtd,
    SUM(revenue_gross) as revenue_mtd,
    SUM(impressions) as impressions_mtd,
    SUM(clicks) as clicks_mtd,
    SUM(add_to_cart) as add_to_cart_mtd,
    SUM(profit_before_marketing) as profit_before_marketing_mtd,
    SUM(profit_incl_marketing) as profit_incl_marketing_mtd,
    SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) as total_ads_spend_mtd,
    COUNT(DISTINCT sku) as products_count
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date <= CURRENT_DATE
  GROUP BY map_category(category_wb)
),
prev_mtd_data AS (
  SELECT
    map_category(category_wb) as category_key,
    SUM(revenue_gross) as revenue_prev_mtd,
    SUM(orders) as orders_prev_mtd,
    SUM(profit_incl_marketing) as profit_prev_mtd
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND date <= CURRENT_DATE - INTERVAL '1 month'
  GROUP BY map_category(category_wb)
)
SELECT
  m.category_key,
  category_name(m.category_key) as category_name,
  CASE m.category_key
    WHEN 'face' THEN 1
    WHEN 'hair' THEN 2
    WHEN 'body' THEN 3
    WHEN 'makeup' THEN 4
    ELSE 5
  END as sort_order,
  -- MTD
  m.orders_mtd,
  m.revenue_mtd,
  m.impressions_mtd,
  m.clicks_mtd,
  m.add_to_cart_mtd,
  m.profit_before_marketing_mtd,
  m.profit_incl_marketing_mtd,
  m.total_ads_spend_mtd,
  m.products_count,
  -- DRR %
  CASE WHEN m.revenue_mtd > 0
    THEN ROUND(m.total_ads_spend_mtd / m.revenue_mtd * 100, 1)
    ELSE 0
  END as drr_pct,
  -- MoM
  COALESCE(p.revenue_prev_mtd, 0) as revenue_prev_mtd,
  CASE WHEN COALESCE(p.revenue_prev_mtd, 0) > 0
    THEN ROUND((m.revenue_mtd - p.revenue_prev_mtd) / p.revenue_prev_mtd * 100, 1)
    ELSE NULL
  END as mom_revenue_pct,
  CASE WHEN COALESCE(p.orders_prev_mtd, 0) > 0
    THEN ROUND((m.orders_mtd - p.orders_prev_mtd)::NUMERIC / p.orders_prev_mtd * 100, 1)
    ELSE NULL
  END as mom_orders_pct,
  -- Конверсии
  CASE WHEN m.impressions_mtd > 0
    THEN ROUND(m.clicks_mtd::NUMERIC / m.impressions_mtd * 100, 2)
    ELSE 0
  END as ctr_pct,
  CASE WHEN m.clicks_mtd > 0
    THEN ROUND(m.orders_mtd::NUMERIC / m.clicks_mtd * 100, 2)
    ELSE 0
  END as cr_pct,
  -- Период
  DATE_TRUNC('month', CURRENT_DATE)::DATE as period_start,
  CURRENT_DATE as period_end
FROM mtd_data m
LEFT JOIN prev_mtd_data p ON m.category_key = p.category_key
WHERE m.category_key != 'other'
ORDER BY sort_order;

-- ================================================
-- 3. ПОДКАТЕГОРИИ MTD
-- ================================================
CREATE OR REPLACE VIEW v_subcategory_fact_mtd AS
WITH mtd_data AS (
  SELECT
    map_category(category_wb) as category_key,
    subcategory_wb as subcategory,
    SUM(orders) as orders_mtd,
    SUM(revenue_gross) as revenue_mtd,
    SUM(profit_incl_marketing) as profit_mtd,
    SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) as ads_spend_mtd,
    COUNT(DISTINCT sku) as products_count
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date <= CURRENT_DATE
  GROUP BY map_category(category_wb), subcategory_wb
),
prev_mtd AS (
  SELECT
    map_category(category_wb) as category_key,
    subcategory_wb as subcategory,
    SUM(revenue_gross) as revenue_prev_mtd
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND date <= CURRENT_DATE - INTERVAL '1 month'
  GROUP BY map_category(category_wb), subcategory_wb
)
SELECT
  m.category_key,
  category_name(m.category_key) as category_name,
  m.subcategory,
  m.orders_mtd,
  m.revenue_mtd,
  m.profit_mtd,
  m.ads_spend_mtd,
  m.products_count,
  CASE WHEN m.revenue_mtd > 0
    THEN ROUND(m.ads_spend_mtd / m.revenue_mtd * 100, 1)
    ELSE 0
  END as drr_pct,
  CASE WHEN COALESCE(p.revenue_prev_mtd, 0) > 0
    THEN ROUND((m.revenue_mtd - p.revenue_prev_mtd) / p.revenue_prev_mtd * 100, 1)
    ELSE NULL
  END as mom_revenue_pct
FROM mtd_data m
LEFT JOIN prev_mtd p ON m.category_key = p.category_key AND m.subcategory = p.subcategory
WHERE m.category_key != 'other'
ORDER BY m.category_key, m.revenue_mtd DESC;

-- ================================================
-- 4. ТОП ТОВАРОВ ПО КАТЕГОРИЯМ MTD
-- ================================================
CREATE OR REPLACE VIEW v_top_products_mtd AS
WITH product_mtd AS (
  SELECT
    map_category(category_wb) as category_key,
    sku,
    product_name_1c as title,
    subcategory_wb as subcategory,
    SUM(orders) as orders_mtd,
    SUM(revenue_gross) as revenue_mtd,
    SUM(profit_incl_marketing) as profit_mtd,
    SUM(impressions) as impressions_mtd,
    SUM(clicks) as clicks_mtd,
    SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) as ads_spend_mtd,
    AVG(price) as avg_price,
    AVG(stock_units) as avg_stock
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date <= CURRENT_DATE
  GROUP BY map_category(category_wb), sku, product_name_1c, subcategory_wb
),
prev_mtd AS (
  SELECT
    sku,
    SUM(revenue_gross) as revenue_prev,
    SUM(orders) as orders_prev
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND date <= CURRENT_DATE - INTERVAL '1 month'
  GROUP BY sku
),
ranked AS (
  SELECT
    p.*,
    COALESCE(pm.revenue_prev, 0) as revenue_prev,
    COALESCE(pm.orders_prev, 0) as orders_prev,
    -- DRR %
    CASE WHEN p.revenue_mtd > 0
      THEN ROUND(p.ads_spend_mtd / p.revenue_mtd * 100, 1)
      ELSE 0
    END as drr_pct,
    -- MoM %
    CASE WHEN COALESCE(pm.revenue_prev, 0) > 0
      THEN ROUND((p.revenue_mtd - pm.revenue_prev) / pm.revenue_prev * 100, 1)
      ELSE NULL
    END as mom_revenue_pct,
    -- CTR & CR
    CASE WHEN p.impressions_mtd > 0
      THEN ROUND(p.clicks_mtd::NUMERIC / p.impressions_mtd * 100, 2)
      ELSE 0
    END as ctr_pct,
    CASE WHEN p.clicks_mtd > 0
      THEN ROUND(p.orders_mtd::NUMERIC / p.clicks_mtd * 100, 2)
      ELSE 0
    END as cr_pct,
    -- Ранг
    ROW_NUMBER() OVER (PARTITION BY p.category_key ORDER BY p.revenue_mtd DESC) as rank_in_category
  FROM product_mtd p
  LEFT JOIN prev_mtd pm ON p.sku = pm.sku
)
SELECT
  category_name(category_key) as category_name,
  r.*
FROM ranked r
WHERE r.category_key != 'other' AND r.rank_in_category <= 50
ORDER BY r.category_key, r.rank_in_category;

-- ================================================
-- 5. ТОП-20 КАНДИДАТОВ НА РОСТ (GROWTH SCORE)
-- ================================================
CREATE OR REPLACE VIEW v_growth_candidates AS
WITH product_data AS (
  SELECT
    map_category(category_wb) as category_key,
    sku,
    product_name_1c as title,
    subcategory_wb as subcategory,
    SUM(orders) as orders_mtd,
    SUM(revenue_gross) as revenue_mtd,
    SUM(profit_incl_marketing) as profit_mtd,
    SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) as ads_spend_mtd,
    AVG(stock_units) as avg_stock,
    -- Волатильность спроса
    CASE WHEN AVG(orders) > 0
      THEN COALESCE(STDDEV(orders) / NULLIF(AVG(orders), 0), 0)
      ELSE 1
    END as demand_volatility
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date <= CURRENT_DATE
  GROUP BY map_category(category_wb), sku, product_name_1c, subcategory_wb
),
prev_mtd AS (
  SELECT
    sku,
    SUM(revenue_gross) as revenue_prev
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    AND date <= CURRENT_DATE - INTERVAL '1 month'
  GROUP BY sku
),
scored AS (
  SELECT
    p.*,
    COALESCE(pm.revenue_prev, 0) as revenue_prev,
    -- MoM рост %
    CASE WHEN COALESCE(pm.revenue_prev, 0) > 0
      THEN (p.revenue_mtd - pm.revenue_prev) / pm.revenue_prev * 100
      ELSE 0
    END as mom_growth_pct,
    -- DRR %
    CASE WHEN p.revenue_mtd > 0
      THEN p.ads_spend_mtd / p.revenue_mtd * 100
      ELSE 0
    END as drr_pct,
    -- Margin proxy (profit/revenue)
    CASE WHEN p.revenue_mtd > 0
      THEN p.profit_mtd / p.revenue_mtd * 100
      ELSE 0
    END as margin_pct,
    -- Growth Score
    (
      CASE WHEN COALESCE(pm.revenue_prev, 0) > 0
        THEN (p.revenue_mtd - pm.revenue_prev) / pm.revenue_prev * 100 * 0.3
        ELSE 0
      END
      + CASE WHEN p.revenue_mtd > 0
          THEN p.profit_mtd / p.revenue_mtd * 100 * 0.3
          ELSE 0
        END
      + (1 - LEAST(p.demand_volatility, 1)) * 20
      - CASE WHEN p.revenue_mtd > 0
          THEN p.ads_spend_mtd / p.revenue_mtd * 100 * 0.2
          ELSE 0
        END
    ) as growth_score
  FROM product_data p
  LEFT JOIN prev_mtd pm ON p.sku = pm.sku
  WHERE p.revenue_mtd > 10000 -- Минимальная выручка для включения
),
categorized AS (
  SELECT
    s.*,
    CASE
      WHEN s.drr_pct < 10 AND s.mom_growth_pct > 0 THEN 'quick_win'
      WHEN s.margin_pct > 30 AND s.mom_growth_pct <= 0 THEN 'needs_boost'
      WHEN s.drr_pct > 20 AND s.mom_growth_pct < 0 THEN 'risky'
      ELSE 'stable'
    END as growth_category,
    ROW_NUMBER() OVER (PARTITION BY s.category_key ORDER BY s.growth_score DESC) as rank_in_category
  FROM scored s
)
SELECT
  category_name(category_key) as category_name,
  c.*
FROM categorized c
WHERE c.category_key != 'other' AND c.rank_in_category <= 20
ORDER BY c.category_key, c.growth_score DESC;

-- ================================================
-- 6. АНАЛИЗ DRR ПО КАНАЛАМ
-- ================================================
CREATE OR REPLACE VIEW v_drr_by_channel AS
SELECT
  map_category(category_wb) as category_key,
  category_name(map_category(category_wb)) as category_name,
  SUM(revenue_gross) as revenue_mtd,
  SUM(drr_search) as drr_search_total,
  SUM(drr_media) as drr_media_total,
  SUM(drr_bloggers) as drr_bloggers_total,
  SUM(drr_others) as drr_others_total,
  SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) as total_ads_spend,
  -- DRR % по каналам
  CASE WHEN SUM(revenue_gross) > 0 THEN ROUND(SUM(drr_search) / SUM(revenue_gross) * 100, 2) ELSE 0 END as drr_search_pct,
  CASE WHEN SUM(revenue_gross) > 0 THEN ROUND(SUM(drr_media) / SUM(revenue_gross) * 100, 2) ELSE 0 END as drr_media_pct,
  CASE WHEN SUM(revenue_gross) > 0 THEN ROUND(SUM(drr_bloggers) / SUM(revenue_gross) * 100, 2) ELSE 0 END as drr_bloggers_pct,
  CASE WHEN SUM(revenue_gross) > 0 THEN ROUND(SUM(drr_others) / SUM(revenue_gross) * 100, 2) ELSE 0 END as drr_others_pct
FROM "6mWB17jun_15dec"
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date <= CURRENT_DATE
GROUP BY map_category(category_wb)
HAVING map_category(category_wb) != 'other'
ORDER BY
  CASE map_category(category_wb)
    WHEN 'face' THEN 1
    WHEN 'hair' THEN 2
    WHEN 'body' THEN 3
    WHEN 'makeup' THEN 4
  END;

-- ================================================
-- 7. ТОП ПРИБЫЛЬНЫХ ТОВАРОВ
-- ================================================
CREATE OR REPLACE VIEW v_profit_top AS
WITH product_profit AS (
  SELECT
    map_category(category_wb) as category_key,
    sku,
    product_name_1c as title,
    subcategory_wb as subcategory,
    SUM(revenue_gross) as revenue_mtd,
    SUM(profit_incl_marketing) as profit_mtd,
    SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) as ads_spend_mtd,
    CASE WHEN SUM(revenue_gross) > 0
      THEN ROUND(SUM(profit_incl_marketing) / SUM(revenue_gross) * 100, 1)
      ELSE 0
    END as margin_pct,
    CASE WHEN SUM(revenue_gross) > 0
      THEN ROUND(SUM(COALESCE(drr_search, 0) + COALESCE(drr_media, 0) + COALESCE(drr_bloggers, 0) + COALESCE(drr_others, 0)) / SUM(revenue_gross) * 100, 1)
      ELSE 0
    END as drr_pct,
    ROW_NUMBER() OVER (
      PARTITION BY map_category(category_wb)
      ORDER BY SUM(profit_incl_marketing) DESC
    ) as profit_rank
  FROM "6mWB17jun_15dec"
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date <= CURRENT_DATE
  GROUP BY map_category(category_wb), sku, product_name_1c, subcategory_wb
)
SELECT
  category_name(category_key) as category_name,
  p.*
FROM product_profit p
WHERE p.category_key != 'other' AND p.profit_rank <= 10
ORDER BY p.category_key, p.profit_rank;

-- ================================================
-- ГРАНТЫ (если нужны для anon роли)
-- ================================================
-- GRANT SELECT ON v_category_fact_today TO anon;
-- GRANT SELECT ON v_category_fact_mtd TO anon;
-- GRANT SELECT ON v_subcategory_fact_mtd TO anon;
-- GRANT SELECT ON v_top_products_mtd TO anon;
-- GRANT SELECT ON v_growth_candidates TO anon;
-- GRANT SELECT ON v_drr_by_channel TO anon;
-- GRANT SELECT ON v_profit_top TO anon;
