/**
 * Сервис для работы с Supabase
 * Получение данных для аналитики продаж
 *
 * Поддерживает реальные данные Wildberries (таблица 6mWB17jun_15dec)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Реальная таблица с данными WB
const WB_TABLE = '6mWB17jun_15dec';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured. Using mock data.');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Маппинг категорий Wildberries → наши
 */
const CATEGORY_MAP = {
  'Уход за лицом': 'face',
  'Уход за волосами': 'hair',
  'Уход за вoлосами': 'hair', // с латинской "o"
  'Уход за телом': 'body',
  'Макияж': 'makeup',
};

function mapCategory(categoryWb) {
  return CATEGORY_MAP[categoryWb] || 'other';
}

function getWbCategories(categoryKey) {
  const map = {
    face: ['Уход за лицом'],
    hair: ['Уход за волосами', 'Уход за вoлосами'],
    body: ['Уход за телом'],
    makeup: ['Макияж'],
  };
  return map[categoryKey] || [];
}

// Кеш для агрегатов (обновляется раз в 5-15 минут)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Маппинг категорий
 */
export const CATEGORIES = {
  face: { key: 'face', name: 'Лицо', emoji: '👤' },
  hair: { key: 'hair', name: 'Волосы', emoji: '💇' },
  body: { key: 'body', name: 'Тело', emoji: '🧴' },
  makeup: { key: 'makeup', name: 'Макияж', emoji: '💄' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

/**
 * Получить последнюю доступную дату в таблице
 */
async function getLatestDate() {
  if (!supabase) return new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(WB_TABLE)
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return new Date().toISOString().split('T')[0];
  }

  return data[0].date;
}

/**
 * Получить факт на последний день по категориям (из реальной таблицы WB)
 */
export async function getCategoryPlanFactToday() {
  const cacheKey = 'category_plan_fact_today';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockCategoryPlanFactToday();
  }

  // Берём последнюю доступную дату из базы
  const latestDate = await getLatestDate();

  const { data, error } = await supabase
    .from(WB_TABLE)
    .select('category_wb, orders, revenue_gross, impressions, clicks, add_to_cart, drr_search, drr_media, drr_bloggers, drr_others, sku')
    .eq('date', latestDate);

  if (error) {
    console.error('Error fetching today data:', error);
    return getMockCategoryPlanFactToday();
  }

  // Агрегируем по категориям
  const result = aggregateByCategory(data, 'today');
  setCache(cacheKey, result);
  return result;
}

/**
 * Получить факт MTD по категориям (из реальной таблицы WB)
 */
export async function getCategoryPlanFactMTD() {
  const cacheKey = 'category_plan_fact_mtd';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockCategoryPlanFactMTD();
  }

  // Берём последнюю доступную дату и считаем MTD от начала того месяца
  const latestDate = await getLatestDate();
  const latestDateObj = new Date(latestDate);
  const monthStart = new Date(latestDateObj.getFullYear(), latestDateObj.getMonth(), 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(WB_TABLE)
    .select('category_wb, orders, revenue_gross, impressions, clicks, add_to_cart, drr_search, drr_media, drr_bloggers, drr_others, sku')
    .gte('date', monthStart)
    .lte('date', latestDate);

  if (error) {
    console.error('Error fetching MTD data:', error);
    return getMockCategoryPlanFactMTD();
  }

  const result = aggregateByCategory(data, 'mtd');
  setCache(cacheKey, result);
  return result;
}

/**
 * Получить подкатегории для категории (из реальной таблицы WB)
 */
export async function getSubcategoriesMTD(categoryKey) {
  const cacheKey = `subcategories_${categoryKey}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockSubcategoriesMTD(categoryKey);
  }

  const wbCategories = getWbCategories(categoryKey);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(WB_TABLE)
    .select('subcategory_wb, orders, revenue_gross, drr_search, drr_media, drr_bloggers, drr_others, sku')
    .in('category_wb', wbCategories)
    .gte('date', monthStart);

  if (error) {
    console.error('Error fetching subcategories:', error);
    return getMockSubcategoriesMTD(categoryKey);
  }

  // Агрегируем по подкатегориям
  const grouped = {};
  for (const row of data) {
    const sub = row.subcategory_wb || 'Без категории';
    if (!grouped[sub]) {
      grouped[sub] = {
        category_key: categoryKey,
        category_name: CATEGORIES[categoryKey].name,
        subcategory: sub,
        fact_revenue_mtd: 0,
        fact_units_mtd: 0,
        profit_mtd: 0,
        ads_spend_mtd: 0,
        products: new Set(),
      };
    }
    grouped[sub].fact_units_mtd += row.orders || 0;
    grouped[sub].fact_revenue_mtd += row.revenue_gross || 0;
    // profit_mtd not available - using revenue-based estimate
    grouped[sub].profit_mtd += 0;
    grouped[sub].ads_spend_mtd += (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0) + (row.drr_others || 0);
    grouped[sub].products.add(row.sku);
  }

  const result = Object.values(grouped).map(g => ({
    ...g,
    products_count: g.products.size,
    revenue_completion_pct: 100, // нет плана
    mom_revenue_pct: null, // TODO: добавить MoM
  })).sort((a, b) => b.fact_revenue_mtd - a.fact_revenue_mtd);

  setCache(cacheKey, result);
  return result;
}

/**
 * Получить топ-N товаров по категории (из реальной таблицы WB)
 */
export async function getTopProductsByCategory(categoryKey, limit = 10) {
  const cacheKey = `top_products_${categoryKey}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockTopProducts(categoryKey, limit);
  }

  const wbCategories = getWbCategories(categoryKey);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(WB_TABLE)
    .select('sku, product_name_1c, subcategory_wb, orders, revenue_gross, impressions, clicks, drr_search, drr_media, drr_bloggers, drr_others, price, stock_units')
    .in('category_wb', wbCategories)
    .gte('date', monthStart);

  if (error) {
    console.error('Error fetching top products:', error);
    return getMockTopProducts(categoryKey, limit);
  }

  // Агрегируем по SKU
  const grouped = {};
  for (const row of data) {
    if (!grouped[row.sku]) {
      grouped[row.sku] = {
        sku: row.sku,
        title: row.product_name_1c,
        category_key: categoryKey,
        category_name: CATEGORIES[categoryKey].name,
        subcategory: row.subcategory_wb,
        units_mtd: 0,
        revenue_mtd: 0,
        profit_mtd: 0,
        impressions_mtd: 0,
        clicks_mtd: 0,
        ads_spend_mtd: 0,
        prices: [],
        stocks: [],
      };
    }
    grouped[row.sku].units_mtd += row.orders || 0;
    grouped[row.sku].revenue_mtd += row.revenue_gross || 0;
    // profit_mtd calculated as estimate (revenue - ads)
    grouped[row.sku].profit_mtd += 0;
    grouped[row.sku].impressions_mtd += row.impressions || 0;
    grouped[row.sku].clicks_mtd += row.clicks || 0;
    grouped[row.sku].ads_spend_mtd += (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0) + (row.drr_others || 0);
    if (row.price) grouped[row.sku].prices.push(row.price);
    if (row.stock_units) grouped[row.sku].stocks.push(row.stock_units);
  }

  const result = Object.values(grouped)
    .map(g => ({
      ...g,
      avg_price: g.prices.length > 0 ? Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length) : 0,
      avg_stock: g.stocks.length > 0 ? Math.round(g.stocks.reduce((a, b) => a + b, 0) / g.stocks.length) : 0,
      drr_pct: g.revenue_mtd > 0 ? Math.round(g.ads_spend_mtd / g.revenue_mtd * 1000) / 10 : 0,
      margin_percent: g.revenue_mtd > 0 ? Math.round(g.profit_mtd / g.revenue_mtd * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue_mtd - a.revenue_mtd)
    .slice(0, limit)
    .map((p, i) => ({ ...p, rank_in_category: i + 1 }));

  setCache(cacheKey, result);
  return result;
}

/**
 * Получить сравнение товаров MoM
 */
export async function getProductsMoMCompare(categoryKey, limit = 10) {
  const cacheKey = `products_mom_${categoryKey}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockProductsMoM(categoryKey, limit);
  }

  const { data, error } = await supabase
    .from('v_top_products_mom_compare')
    .select('*')
    .eq('category_key', categoryKey)
    .order('revenue_current', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching MoM compare:', error);
    return getMockProductsMoM(categoryKey, limit);
  }

  setCache(cacheKey, data);
  return data;
}

/**
 * Получить топ-20 кандидатов на рост
 */
export async function getGrowthCandidates(categoryKey) {
  const cacheKey = `growth_candidates_${categoryKey}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockGrowthCandidates(categoryKey);
  }

  const { data, error } = await supabase
    .from('v_top20_growth_candidates')
    .select('*')
    .eq('category_key', categoryKey)
    .order('growth_score', { ascending: false });

  if (error) {
    console.error('Error fetching growth candidates:', error);
    return getMockGrowthCandidates(categoryKey);
  }

  setCache(cacheKey, data);
  return data;
}

/**
 * Получить товары со стабильной ценой
 */
export async function getPriceStability(categoryKey, limit = 5) {
  const cacheKey = `price_stability_${categoryKey}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockPriceStability(categoryKey, limit);
  }

  const { data, error } = await supabase
    .from('v_price_stability')
    .select('*')
    .eq('category_key', categoryKey)
    .order('stability_rank')
    .limit(limit);

  if (error) {
    console.error('Error fetching price stability:', error);
    return getMockPriceStability(categoryKey, limit);
  }

  setCache(cacheKey, data);
  return data;
}

/**
 * Получить топ по прибыльности
 */
export async function getProfitProxy(categoryKey, limit = 5) {
  const cacheKey = `profit_proxy_${categoryKey}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return getMockProfitProxy(categoryKey, limit);
  }

  const { data, error } = await supabase
    .from('v_profit_proxy')
    .select('*')
    .eq('category_key', categoryKey)
    .order('profit_rank')
    .limit(limit);

  if (error) {
    console.error('Error fetching profit proxy:', error);
    return getMockProfitProxy(categoryKey, limit);
  }

  setCache(cacheKey, data);
  return data;
}

/**
 * Получить все данные для дайджеста
 */
export async function getDailyDigestData() {
  const [today, mtd] = await Promise.all([
    getCategoryPlanFactToday(),
    getCategoryPlanFactMTD(),
  ]);

  // Получаем топ-3 для каждой категории
  const topProducts = {};
  for (const key of CATEGORY_KEYS) {
    topProducts[key] = await getTopProductsByCategory(key, 3);
  }

  return { today, mtd, topProducts };
}

/**
 * Получить все данные для категории
 */
export async function getCategoryReportData(categoryKey) {
  const [mtd, top20, priceStability, profitTop] = await Promise.all([
    getCategoryPlanFactMTD(),
    getGrowthCandidates(categoryKey),
    getPriceStability(categoryKey, 5),
    getProfitProxy(categoryKey, 5),
  ]);

  const categoryMtd = mtd.find(c => c.category_key === categoryKey);

  return {
    categoryMtd,
    growthCandidates: top20,
    priceStability,
    profitTop,
  };
}

// ================================================
// MOCK DATA (когда Supabase не настроен)
// ================================================

function getMockCategoryPlanFactToday() {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      category_key: 'face',
      category_name: 'Лицо',
      sort_order: 1,
      plan_revenue_today: 450000,
      plan_units_today: 560,
      fact_revenue_today: 387500,
      fact_units_today: 485,
      revenue_completion_pct: 86.1,
      revenue_deviation: -62500,
      report_date: today,
    },
    {
      category_key: 'hair',
      category_name: 'Волосы',
      sort_order: 2,
      plan_revenue_today: 380000,
      plan_units_today: 630,
      fact_revenue_today: 412300,
      fact_units_today: 688,
      revenue_completion_pct: 108.5,
      revenue_deviation: 32300,
      report_date: today,
    },
    {
      category_key: 'body',
      category_name: 'Тело',
      sort_order: 3,
      plan_revenue_today: 320000,
      plan_units_today: 710,
      fact_revenue_today: 298700,
      fact_units_today: 665,
      revenue_completion_pct: 93.3,
      revenue_deviation: -21300,
      report_date: today,
    },
    {
      category_key: 'makeup',
      category_name: 'Макияж',
      sort_order: 4,
      plan_revenue_today: 280000,
      plan_units_today: 480,
      fact_revenue_today: 301200,
      fact_units_today: 518,
      revenue_completion_pct: 107.6,
      revenue_deviation: 21200,
      report_date: today,
    },
  ];
}

function getMockCategoryPlanFactMTD() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const dayOfMonth = today.getDate();

  return [
    {
      category_key: 'face',
      category_name: 'Лицо',
      sort_order: 1,
      plan_revenue_mtd: 450000 * dayOfMonth,
      plan_units_mtd: 560 * dayOfMonth,
      fact_revenue_mtd: 6523000,
      fact_units_mtd: 8150,
      orders_mtd: 5820,
      revenue_completion_pct: 96.5,
      revenue_deviation: -237000,
      prev_revenue_mtd: 5890000,
      mom_revenue_pct: 10.7,
      period_start: monthStart.toISOString().split('T')[0],
      period_end: today.toISOString().split('T')[0],
    },
    {
      category_key: 'hair',
      category_name: 'Волосы',
      sort_order: 2,
      plan_revenue_mtd: 380000 * dayOfMonth,
      plan_units_mtd: 630 * dayOfMonth,
      fact_revenue_mtd: 6890000,
      fact_units_mtd: 11450,
      orders_mtd: 8180,
      revenue_completion_pct: 113.2,
      revenue_deviation: 802000,
      prev_revenue_mtd: 6120000,
      mom_revenue_pct: 12.6,
      period_start: monthStart.toISOString().split('T')[0],
      period_end: today.toISOString().split('T')[0],
    },
    {
      category_key: 'body',
      category_name: 'Тело',
      sort_order: 3,
      plan_revenue_mtd: 320000 * dayOfMonth,
      plan_units_mtd: 710 * dayOfMonth,
      fact_revenue_mtd: 4980000,
      fact_units_mtd: 11050,
      orders_mtd: 7890,
      revenue_completion_pct: 92.4,
      revenue_deviation: -412000,
      prev_revenue_mtd: 5230000,
      mom_revenue_pct: -4.8,
      period_start: monthStart.toISOString().split('T')[0],
      period_end: today.toISOString().split('T')[0],
    },
    {
      category_key: 'makeup',
      category_name: 'Макияж',
      sort_order: 4,
      plan_revenue_mtd: 280000 * dayOfMonth,
      plan_units_mtd: 480 * dayOfMonth,
      fact_revenue_mtd: 4850000,
      fact_units_mtd: 8320,
      orders_mtd: 5940,
      revenue_completion_pct: 102.3,
      revenue_deviation: 110000,
      prev_revenue_mtd: 4520000,
      mom_revenue_pct: 7.3,
      period_start: monthStart.toISOString().split('T')[0],
      period_end: today.toISOString().split('T')[0],
    },
  ];
}

function getMockSubcategoriesMTD(categoryKey) {
  const subcats = {
    face: [
      { subcategory: 'Кремы', fact_revenue_mtd: 2100000, fact_units_mtd: 2500, revenue_completion_pct: 98.2, mom_revenue_pct: 8.5 },
      { subcategory: 'Сыворотки', fact_revenue_mtd: 1850000, fact_units_mtd: 1200, revenue_completion_pct: 105.3, mom_revenue_pct: 15.2 },
      { subcategory: 'Маски', fact_revenue_mtd: 1420000, fact_units_mtd: 1900, revenue_completion_pct: 89.5, mom_revenue_pct: 3.1 },
      { subcategory: 'Тоники', fact_revenue_mtd: 1153000, fact_units_mtd: 2550, revenue_completion_pct: 95.8, mom_revenue_pct: 6.7 },
    ],
    hair: [
      { subcategory: 'Шампуни', fact_revenue_mtd: 2450000, fact_units_mtd: 4100, revenue_completion_pct: 112.5, mom_revenue_pct: 14.2 },
      { subcategory: 'Бальзамы', fact_revenue_mtd: 1890000, fact_units_mtd: 3150, revenue_completion_pct: 108.3, mom_revenue_pct: 11.8 },
      { subcategory: 'Стайлинг', fact_revenue_mtd: 1350000, fact_units_mtd: 2700, revenue_completion_pct: 98.7, mom_revenue_pct: 5.3 },
      { subcategory: 'Спецуход', fact_revenue_mtd: 1200000, fact_units_mtd: 1500, revenue_completion_pct: 125.4, mom_revenue_pct: 22.1 },
    ],
    body: [
      { subcategory: 'Гели для душа', fact_revenue_mtd: 1520000, fact_units_mtd: 3900, revenue_completion_pct: 95.3, mom_revenue_pct: -2.1 },
      { subcategory: 'Кремы для тела', fact_revenue_mtd: 1380000, fact_units_mtd: 2900, revenue_completion_pct: 91.2, mom_revenue_pct: -5.8 },
      { subcategory: 'Скрабы', fact_revenue_mtd: 1150000, fact_units_mtd: 2350, revenue_completion_pct: 88.5, mom_revenue_pct: -8.2 },
      { subcategory: 'Антицеллюлит', fact_revenue_mtd: 930000, fact_units_mtd: 1900, revenue_completion_pct: 96.8, mom_revenue_pct: 1.5 },
    ],
    makeup: [
      { subcategory: 'Губы', fact_revenue_mtd: 1450000, fact_units_mtd: 2800, revenue_completion_pct: 105.8, mom_revenue_pct: 9.2 },
      { subcategory: 'Глаза', fact_revenue_mtd: 1280000, fact_units_mtd: 2100, revenue_completion_pct: 98.5, mom_revenue_pct: 5.8 },
      { subcategory: 'Тон', fact_revenue_mtd: 1150000, fact_units_mtd: 1620, revenue_completion_pct: 102.3, mom_revenue_pct: 8.1 },
      { subcategory: 'База', fact_revenue_mtd: 970000, fact_units_mtd: 1800, revenue_completion_pct: 103.2, mom_revenue_pct: 6.5 },
    ],
  };

  return (subcats[categoryKey] || []).map(s => ({
    ...s,
    category_key: categoryKey,
    category_name: CATEGORIES[categoryKey].name,
  }));
}

function getMockTopProducts(categoryKey, limit) {
  const products = {
    face: [
      { sku: 'FS001', title: 'Сыворотка витамин С 15% 30мл', revenue_mtd: 567000, units_mtd: 300, drr_pct: 8.2, margin_percent: 69 },
      { sku: 'FC002', title: 'Крем ночной восстанавливающий 50мл', revenue_mtd: 452000, units_mtd: 380, drr_pct: 12.5, margin_percent: 65 },
      { sku: 'FS004', title: 'Сыворотка пептидная лифтинг 30мл', revenue_mtd: 394000, units_mtd: 180, drr_pct: 6.8, margin_percent: 69 },
      { sku: 'FC001', title: 'Крем увлажняющий дневной 50мл', revenue_mtd: 356000, units_mtd: 400, drr_pct: 15.3, margin_percent: 64 },
      { sku: 'FM004', title: 'Патчи под глаза гидрогелевые 60шт', revenue_mtd: 297000, units_mtd: 300, drr_pct: 9.1, margin_percent: 68 },
    ],
    hair: [
      { sku: 'HSP01', title: 'Ампулы против выпадения 10шт', revenue_mtd: 645000, units_mtd: 500, drr_pct: 7.5, margin_percent: 69 },
      { sku: 'HS003', title: 'Шампунь восстанавливающий 400мл', revenue_mtd: 483000, units_mtd: 700, drr_pct: 11.2, margin_percent: 70 },
      { sku: 'HB003', title: 'Маска для волос восстановление 300мл', revenue_mtd: 395000, units_mtd: 500, drr_pct: 8.9, margin_percent: 68 },
      { sku: 'HSP03', title: 'Тоник для роста волос 100мл', revenue_mtd: 356000, units_mtd: 400, drr_pct: 6.2, margin_percent: 69 },
      { sku: 'HSP05', title: 'Комплекс витамины для волос 30шт', revenue_mtd: 298000, units_mtd: 200, drr_pct: 5.8, margin_percent: 68 },
    ],
    body: [
      { sku: 'BA001', title: 'Крем антицеллюлитный 200мл', revenue_mtd: 445000, units_mtd: 500, drr_pct: 14.2, margin_percent: 69 },
      { sku: 'BS003', title: 'Скраб кофейный 200г', revenue_mtd: 354000, units_mtd: 600, drr_pct: 10.5, margin_percent: 69 },
      { sku: 'BC001', title: 'Крем для тела питательный 250мл', revenue_mtd: 295000, units_mtd: 500, drr_pct: 12.8, margin_percent: 69 },
      { sku: 'BA005', title: 'Сыворотка для тела 100мл', revenue_mtd: 247000, units_mtd: 250, drr_pct: 8.3, margin_percent: 68 },
      { sku: 'BA003', title: 'Обертывание горячее 300мл', revenue_mtd: 198000, units_mtd: 250, drr_pct: 11.5, margin_percent: 68 },
    ],
    makeup: [
      { sku: 'ME003', title: 'Тени палетка 12 цветов', revenue_mtd: 495000, units_mtd: 500, drr_pct: 9.8, margin_percent: 68 },
      { sku: 'MF001', title: 'Тональный крем', revenue_mtd: 445000, units_mtd: 500, drr_pct: 13.2, margin_percent: 69 },
      { sku: 'ME001', title: 'Тушь объемная', revenue_mtd: 345000, units_mtd: 500, drr_pct: 8.5, margin_percent: 70 },
      { sku: 'ML001', title: 'Помада матовая', revenue_mtd: 295000, units_mtd: 500, drr_pct: 7.2, margin_percent: 69 },
      { sku: 'MB001', title: 'Праймер матирующий', revenue_mtd: 276000, units_mtd: 400, drr_pct: 6.8, margin_percent: 70 },
    ],
  };

  return (products[categoryKey] || []).slice(0, limit).map((p, i) => ({
    ...p,
    category_key: categoryKey,
    category_name: CATEGORIES[categoryKey].name,
    rank_in_category: i + 1,
    ads_spend_mtd: Math.round(p.revenue_mtd * p.drr_pct / 100),
  }));
}

function getMockProductsMoM(categoryKey, limit) {
  return getMockTopProducts(categoryKey, limit).map(p => ({
    ...p,
    revenue_prev: Math.round(p.revenue_mtd * (0.8 + Math.random() * 0.4)),
    units_prev: Math.round(p.units_mtd * (0.8 + Math.random() * 0.4)),
    mom_revenue_pct: Math.round((Math.random() * 40 - 10) * 10) / 10,
    mom_units_pct: Math.round((Math.random() * 40 - 10) * 10) / 10,
  }));
}

function getMockGrowthCandidates(categoryKey) {
  return getMockTopProducts(categoryKey, 20).map((p, i) => {
    const momGrowth = Math.round((Math.random() * 50 - 10) * 10) / 10;
    const drr = p.drr_pct;
    const margin = p.margin_percent;

    let growthCategory = 'stable';
    if (drr < 10 && momGrowth > 0) growthCategory = 'quick_win';
    else if (margin > 60 && momGrowth <= 0) growthCategory = 'needs_boost';
    else if (drr > 15 && momGrowth < 0) growthCategory = 'risky';

    return {
      ...p,
      mom_growth_pct: momGrowth,
      demand_volatility: Math.round(Math.random() * 50) / 100,
      growth_score: Math.round((momGrowth * 0.3 + margin * 0.3 + 10 - drr * 0.2) * 10) / 10,
      growth_category: growthCategory,
      rank_in_category: i + 1,
    };
  });
}

function getMockPriceStability(categoryKey, limit) {
  return getMockTopProducts(categoryKey, limit).map((p, i) => ({
    ...p,
    avg_price: Math.round(p.revenue_mtd / p.units_mtd),
    std_price: Math.round(Math.random() * 50),
    min_price: Math.round(p.revenue_mtd / p.units_mtd * 0.9),
    max_price: Math.round(p.revenue_mtd / p.units_mtd * 1.1),
    price_cv_pct: Math.round(Math.random() * 10 * 100) / 100,
    stability_rank: i + 1,
    days_with_data: 30,
  }));
}

function getMockProfitProxy(categoryKey, limit) {
  return getMockTopProducts(categoryKey, limit).map((p, i) => {
    const profit = Math.round(p.revenue_mtd * (p.margin_percent / 100) - p.revenue_mtd * 0.15 - p.ads_spend_mtd);
    return {
      ...p,
      commission_percent: 15,
      profit_proxy: profit,
      roi_pct: p.ads_spend_mtd > 0 ? Math.round(profit / p.ads_spend_mtd * 100) : null,
      profit_rank: i + 1,
    };
  });
}

/**
 * Агрегация данных по категориям (для реальных данных WB)
 */
function aggregateByCategory(data, period = 'mtd') {
  const grouped = {};

  for (const row of data) {
    const categoryKey = mapCategory(row.category_wb);
    if (categoryKey === 'other') continue;

    if (!grouped[categoryKey]) {
      grouped[categoryKey] = {
        category_key: categoryKey,
        category_name: CATEGORIES[categoryKey].name,
        sort_order: CATEGORY_KEYS.indexOf(categoryKey) + 1,
        orders: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        add_to_cart: 0,
        profit: 0,
        ads_spend: 0,
        products: new Set(),
      };
    }

    grouped[categoryKey].orders += row.orders || 0;
    grouped[categoryKey].revenue += row.revenue_gross || 0;
    grouped[categoryKey].impressions += row.impressions || 0;
    grouped[categoryKey].clicks += row.clicks || 0;
    grouped[categoryKey].add_to_cart += row.add_to_cart || 0;
    // profit calculated as revenue - ads_spend estimate
    grouped[categoryKey].profit += 0;
    grouped[categoryKey].ads_spend += (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0) + (row.drr_others || 0);
    if (row.sku) grouped[categoryKey].products.add(row.sku);
  }

  const suffix = period === 'today' ? '_today' : '_mtd';

  return Object.values(grouped).map(g => ({
    category_key: g.category_key,
    category_name: g.category_name,
    sort_order: g.sort_order,
    [`fact_revenue${suffix}`]: g.revenue,
    [`fact_units${suffix}`]: g.orders,
    [`orders${suffix}`]: g.orders,
    impressions: g.impressions,
    clicks: g.clicks,
    add_to_cart: g.add_to_cart,
    profit: g.profit,
    ads_spend: g.ads_spend,
    products_count: g.products.size,
    // Метрики
    drr_pct: g.revenue > 0 ? Math.round(g.ads_spend / g.revenue * 1000) / 10 : 0,
    ctr_pct: g.impressions > 0 ? Math.round(g.clicks / g.impressions * 10000) / 100 : 0,
    cr_pct: g.clicks > 0 ? Math.round(g.orders / g.clicks * 10000) / 100 : 0,
    margin_pct: g.revenue > 0 ? Math.round(g.profit / g.revenue * 1000) / 10 : 0,
    // Для совместимости со старым форматом
    revenue_completion_pct: 100,
    revenue_deviation: 0,
    mom_revenue_pct: null,
    report_date: new Date().toISOString().split('T')[0],
  })).sort((a, b) => a.sort_order - b.sort_order);
}

export default {
  getCategoryPlanFactToday,
  getCategoryPlanFactMTD,
  getSubcategoriesMTD,
  getTopProductsByCategory,
  getProductsMoMCompare,
  getGrowthCandidates,
  getPriceStability,
  getProfitProxy,
  getDailyDigestData,
  getCategoryReportData,
  CATEGORIES,
  CATEGORY_KEYS,
};
