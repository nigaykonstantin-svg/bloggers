/**
 * Сервис для работы с реальными данными Supabase (Wildberries)
 * Таблица: 6mWB17jun_15dec
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Кеш (5 минут)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

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
 * Маппинг категорий WB → наши
 */
export const CATEGORY_MAP = {
  'Уход за лицом': 'face',
  'Уход за волосами': 'hair',
  'Уход за вoлосами': 'hair', // с латинской "o"
  'Уход за телом': 'body',
  'Макияж': 'makeup',
};

export const CATEGORIES = {
  face: { key: 'face', name: 'Лицо', emoji: '👤', wb: 'Уход за лицом' },
  hair: { key: 'hair', name: 'Волосы', emoji: '💇', wb: 'Уход за волосами' },
  body: { key: 'body', name: 'Тело', emoji: '🧴', wb: 'Уход за телом' },
  makeup: { key: 'makeup', name: 'Макияж', emoji: '💄', wb: 'Макияж' },
};

export const CATEGORY_KEYS = ['face', 'hair', 'body', 'makeup'];

/**
 * Получить категорию по WB названию
 */
function mapCategory(categoryWb) {
  return CATEGORY_MAP[categoryWb] || 'other';
}

/**
 * Получить WB категории для ключа
 */
function getWbCategories(categoryKey) {
  if (categoryKey === 'hair') {
    return ['Уход за волосами', 'Уход за вoлосами'];
  }
  return [CATEGORIES[categoryKey]?.wb].filter(Boolean);
}

/**
 * ================================================
 * ОСНОВНЫЕ ЗАПРОСЫ
 * ================================================
 */

/**
 * Факт по категориям на сегодня
 */
export async function getCategoryFactToday() {
  const cacheKey = 'category_fact_today';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) return [];

  // Если view создан - используем его
  try {
    const { data, error } = await supabase
      .from('v_category_fact_today')
      .select('*')
      .order('sort_order');

    if (!error && data) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) {
    // View не создан, делаем запрос напрямую
  }

  // Прямой запрос к таблице
  const { data, error } = await supabase
    .from('6mWB17jun_15dec')
    .select('category_wb, orders, revenue_gross, impressions, clicks, add_to_cart, profit_before_marketing, profit_incl_marketing, drr_search, drr_media, drr_bloggers, drr_others, sku')
    .eq('date', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching today data:', error);
    return [];
  }

  // Агрегируем по категориям
  const result = aggregateByCategory(data);
  setCache(cacheKey, result);
  return result;
}

/**
 * Факт по категориям MTD
 */
export async function getCategoryFactMTD() {
  const cacheKey = 'category_fact_mtd';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) return [];

  // Если view создан
  try {
    const { data, error } = await supabase
      .from('v_category_fact_mtd')
      .select('*')
      .order('sort_order');

    if (!error && data) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) {}

  // Прямой запрос
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('6mWB17jun_15dec')
    .select('*')
    .gte('date', monthStart)
    .lte('date', today);

  if (error) {
    console.error('Error fetching MTD data:', error);
    return [];
  }

  const result = aggregateByCategory(data, true);
  setCache(cacheKey, result);
  return result;
}

/**
 * Подкатегории MTD
 */
export async function getSubcategoriesMTD(categoryKey) {
  const cacheKey = `subcategories_${categoryKey}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) return [];

  const wbCategories = getWbCategories(categoryKey);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('6mWB17jun_15dec')
    .select('subcategory_wb, orders, revenue_gross, profit_incl_marketing, drr_search, drr_media, drr_bloggers, drr_others, sku')
    .in('category_wb', wbCategories)
    .gte('date', monthStart);

  if (error) {
    console.error('Error fetching subcategories:', error);
    return [];
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
        orders_mtd: 0,
        revenue_mtd: 0,
        profit_mtd: 0,
        ads_spend_mtd: 0,
        products: new Set(),
      };
    }
    grouped[sub].orders_mtd += row.orders || 0;
    grouped[sub].revenue_mtd += row.revenue_gross || 0;
    grouped[sub].profit_mtd += row.profit_incl_marketing || 0;
    grouped[sub].ads_spend_mtd += (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0) + (row.drr_others || 0);
    grouped[sub].products.add(row.sku);
  }

  const result = Object.values(grouped).map(g => ({
    ...g,
    products_count: g.products.size,
    drr_pct: g.revenue_mtd > 0 ? Math.round(g.ads_spend_mtd / g.revenue_mtd * 1000) / 10 : 0,
  })).sort((a, b) => b.revenue_mtd - a.revenue_mtd);

  setCache(cacheKey, result);
  return result;
}

/**
 * Топ товаров по категории
 */
export async function getTopProductsByCategory(categoryKey, limit = 10) {
  const cacheKey = `top_products_${categoryKey}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) return [];

  const wbCategories = getWbCategories(categoryKey);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('6mWB17jun_15dec')
    .select('sku, product_name_1c, subcategory_wb, orders, revenue_gross, profit_incl_marketing, impressions, clicks, drr_search, drr_media, drr_bloggers, drr_others, price, stock_units')
    .in('category_wb', wbCategories)
    .gte('date', monthStart);

  if (error) {
    console.error('Error fetching products:', error);
    return [];
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
        orders_mtd: 0,
        revenue_mtd: 0,
        profit_mtd: 0,
        impressions_mtd: 0,
        clicks_mtd: 0,
        ads_spend_mtd: 0,
        prices: [],
        stocks: [],
      };
    }
    grouped[row.sku].orders_mtd += row.orders || 0;
    grouped[row.sku].revenue_mtd += row.revenue_gross || 0;
    grouped[row.sku].profit_mtd += row.profit_incl_marketing || 0;
    grouped[row.sku].impressions_mtd += row.impressions || 0;
    grouped[row.sku].clicks_mtd += row.clicks || 0;
    grouped[row.sku].ads_spend_mtd += (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0) + (row.drr_others || 0);
    if (row.price) grouped[row.sku].prices.push(row.price);
    if (row.stock_units) grouped[row.sku].stocks.push(row.stock_units);
  }

  const result = Object.values(grouped)
    .map((g, i) => ({
      ...g,
      avg_price: g.prices.length > 0 ? Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length) : 0,
      avg_stock: g.stocks.length > 0 ? Math.round(g.stocks.reduce((a, b) => a + b, 0) / g.stocks.length) : 0,
      drr_pct: g.revenue_mtd > 0 ? Math.round(g.ads_spend_mtd / g.revenue_mtd * 1000) / 10 : 0,
      ctr_pct: g.impressions_mtd > 0 ? Math.round(g.clicks_mtd / g.impressions_mtd * 10000) / 100 : 0,
      cr_pct: g.clicks_mtd > 0 ? Math.round(g.orders_mtd / g.clicks_mtd * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.revenue_mtd - a.revenue_mtd)
    .slice(0, limit)
    .map((p, i) => ({ ...p, rank_in_category: i + 1 }));

  setCache(cacheKey, result);
  return result;
}

/**
 * Кандидаты на рост
 */
export async function getGrowthCandidates(categoryKey) {
  const products = await getTopProductsByCategory(categoryKey, 30);

  // TODO: добавить сравнение с прошлым месяцем для расчёта MoM

  return products.map(p => {
    // Простой скоринг
    const margin = p.revenue_mtd > 0 ? p.profit_mtd / p.revenue_mtd * 100 : 0;
    const growthScore = margin * 0.4 - p.drr_pct * 0.3 + p.cr_pct * 10;

    let growthCategory = 'stable';
    if (p.drr_pct < 10 && margin > 30) growthCategory = 'quick_win';
    else if (margin > 40 && p.cr_pct < 2) growthCategory = 'needs_boost';
    else if (p.drr_pct > 20 && margin < 20) growthCategory = 'risky';

    return {
      ...p,
      margin_pct: Math.round(margin * 10) / 10,
      growth_score: Math.round(growthScore * 10) / 10,
      growth_category: growthCategory,
      mom_growth_pct: null, // TODO
    };
  }).slice(0, 20);
}

/**
 * Топ по прибыльности
 */
export async function getProfitProxy(categoryKey, limit = 5) {
  const products = await getTopProductsByCategory(categoryKey, 20);

  return products
    .sort((a, b) => b.profit_mtd - a.profit_mtd)
    .slice(0, limit)
    .map((p, i) => ({
      ...p,
      margin_pct: p.revenue_mtd > 0 ? Math.round(p.profit_mtd / p.revenue_mtd * 1000) / 10 : 0,
      profit_rank: i + 1,
    }));
}

/**
 * Стабильность цены (заглушка)
 */
export async function getPriceStability(categoryKey, limit = 5) {
  // TODO: реализовать анализ волатильности цен
  return [];
}

/**
 * ================================================
 * АГРЕГАЦИЯ
 * ================================================
 */

function aggregateByCategory(data, includeMom = false) {
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
        profit_before_marketing: 0,
        profit_incl_marketing: 0,
        ads_spend: 0,
        products: new Set(),
      };
    }

    grouped[categoryKey].orders += row.orders || 0;
    grouped[categoryKey].revenue += row.revenue_gross || 0;
    grouped[categoryKey].impressions += row.impressions || 0;
    grouped[categoryKey].clicks += row.clicks || 0;
    grouped[categoryKey].add_to_cart += row.add_to_cart || 0;
    grouped[categoryKey].profit_before_marketing += row.profit_before_marketing || 0;
    grouped[categoryKey].profit_incl_marketing += row.profit_incl_marketing || 0;
    grouped[categoryKey].ads_spend += (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0) + (row.drr_others || 0);
    if (row.sku) grouped[categoryKey].products.add(row.sku);
  }

  return Object.values(grouped).map(g => ({
    ...g,
    products_count: g.products.size,
    drr_pct: g.revenue > 0 ? Math.round(g.ads_spend / g.revenue * 1000) / 10 : 0,
    ctr_pct: g.impressions > 0 ? Math.round(g.clicks / g.impressions * 10000) / 100 : 0,
    cr_pct: g.clicks > 0 ? Math.round(g.orders / g.clicks * 10000) / 100 : 0,
    // Переименовываем для совместимости
    revenue_mtd: g.revenue,
    orders_mtd: g.orders,
    profit_mtd: g.profit_incl_marketing,
  })).sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * ================================================
 * АГРЕГИРОВАННЫЕ ДАННЫЕ
 * ================================================
 */

export async function getDailyDigestData() {
  const [today, mtd] = await Promise.all([
    getCategoryFactToday(),
    getCategoryFactMTD(),
  ]);

  const topProducts = {};
  for (const key of CATEGORY_KEYS) {
    topProducts[key] = await getTopProductsByCategory(key, 3);
  }

  return { today, mtd, topProducts };
}

export async function getCategoryReportData(categoryKey) {
  const [mtd, top20, profitTop] = await Promise.all([
    getCategoryFactMTD(),
    getGrowthCandidates(categoryKey),
    getProfitProxy(categoryKey, 5),
  ]);

  const categoryMtd = mtd.find(c => c.category_key === categoryKey);

  return {
    categoryMtd,
    growthCandidates: top20,
    priceStability: [],
    profitTop,
  };
}

export default {
  getCategoryFactToday,
  getCategoryFactMTD,
  getSubcategoriesMTD,
  getTopProductsByCategory,
  getGrowthCandidates,
  getPriceStability,
  getProfitProxy,
  getDailyDigestData,
  getCategoryReportData,
  CATEGORIES,
  CATEGORY_KEYS,
};
