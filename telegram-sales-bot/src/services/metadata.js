/**
 * Сервис для работы с метаданными Supabase
 * Схемы, связи, статистики, примеры данных
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Лимиты безопасности
const LIMITS = {
  MAX_SAMPLE_ROWS: 100,
  DEFAULT_SAMPLE_ROWS: 10,
  MAX_QUERY_TIMEOUT: 30000, // 30 сек
  MAX_STATS_ROWS: 1000000, // Предупреждение для больших таблиц
  MAX_TOP_VALUES: 20,
};

/**
 * ================================================
 * 1. СХЕМЫ И ТИПЫ
 * ================================================
 */

/**
 * Получить список всех таблиц и views
 */
export async function getTables(schema = 'public') {
  if (!supabase) return getMockTables();

  const { data, error } = await supabase.rpc('get_tables_metadata', { p_schema: schema });

  if (error) {
    // Fallback к прямому запросу
    const { data: tables, error: err2 } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', schema);

    if (err2) {
      console.error('Error fetching tables:', err2);
      return getMockTables();
    }
    return tables;
  }

  return data;
}

/**
 * SQL функция для получения таблиц (создать в Supabase)
 */
export const SQL_GET_TABLES = `
CREATE OR REPLACE FUNCTION get_tables_metadata(p_schema TEXT DEFAULT 'public')
RETURNS TABLE (
  table_name TEXT,
  table_type TEXT,
  row_count BIGINT,
  size_bytes BIGINT,
  description TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.table_name::TEXT,
    t.table_type::TEXT,
    (SELECT reltuples::BIGINT FROM pg_class WHERE relname = t.table_name) as row_count,
    (SELECT pg_total_relation_size(quote_ident(t.table_name))::BIGINT) as size_bytes,
    obj_description((quote_ident(p_schema) || '.' || quote_ident(t.table_name))::regclass) as description
  FROM information_schema.tables t
  WHERE t.table_schema = p_schema
  ORDER BY t.table_name;
END;
$$;
`;

/**
 * Получить колонки таблицы с типами
 */
export async function getColumns(tableName, schema = 'public') {
  if (!supabase) return getMockColumns(tableName);

  const { data, error } = await supabase.rpc('get_columns_metadata', {
    p_table: tableName,
    p_schema: schema,
  });

  if (error) {
    console.error('Error fetching columns:', error);
    return getMockColumns(tableName);
  }

  return data;
}

/**
 * SQL функция для получения колонок
 */
export const SQL_GET_COLUMNS = `
CREATE OR REPLACE FUNCTION get_columns_metadata(p_table TEXT, p_schema TEXT DEFAULT 'public')
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable BOOLEAN,
  column_default TEXT,
  character_maximum_length INTEGER,
  numeric_precision INTEGER,
  description TEXT,
  ordinal_position INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::TEXT,
    c.data_type::TEXT,
    (c.is_nullable = 'YES')::BOOLEAN,
    c.column_default::TEXT,
    c.character_maximum_length::INTEGER,
    c.numeric_precision::INTEGER,
    col_description(
      (quote_ident(p_schema) || '.' || quote_ident(p_table))::regclass,
      c.ordinal_position
    )::TEXT as description,
    c.ordinal_position::INTEGER
  FROM information_schema.columns c
  WHERE c.table_schema = p_schema
    AND c.table_name = p_table
  ORDER BY c.ordinal_position;
END;
$$;
`;

/**
 * ================================================
 * 2. СВЯЗИ (PK, FK, ИНДЕКСЫ)
 * ================================================
 */

/**
 * Получить первичные ключи
 */
export async function getPrimaryKeys(tableName, schema = 'public') {
  if (!supabase) return getMockPrimaryKeys(tableName);

  const { data, error } = await supabase.rpc('get_primary_keys', {
    p_table: tableName,
    p_schema: schema,
  });

  if (error) {
    console.error('Error fetching primary keys:', error);
    return getMockPrimaryKeys(tableName);
  }

  return data;
}

/**
 * SQL функция для получения первичных ключей
 */
export const SQL_GET_PRIMARY_KEYS = `
CREATE OR REPLACE FUNCTION get_primary_keys(p_table TEXT, p_schema TEXT DEFAULT 'public')
RETURNS TABLE (
  constraint_name TEXT,
  column_name TEXT,
  ordinal_position INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.constraint_name::TEXT,
    kcu.column_name::TEXT,
    kcu.ordinal_position::INTEGER
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = p_schema
    AND tc.table_name = p_table
  ORDER BY kcu.ordinal_position;
END;
$$;
`;

/**
 * Получить внешние ключи
 */
export async function getForeignKeys(tableName = null, schema = 'public') {
  if (!supabase) return getMockForeignKeys(tableName);

  const { data, error } = await supabase.rpc('get_foreign_keys', {
    p_table: tableName,
    p_schema: schema,
  });

  if (error) {
    console.error('Error fetching foreign keys:', error);
    return getMockForeignKeys(tableName);
  }

  return data;
}

/**
 * SQL функция для получения внешних ключей
 */
export const SQL_GET_FOREIGN_KEYS = `
CREATE OR REPLACE FUNCTION get_foreign_keys(p_table TEXT DEFAULT NULL, p_schema TEXT DEFAULT 'public')
RETURNS TABLE (
  constraint_name TEXT,
  source_table TEXT,
  source_column TEXT,
  target_table TEXT,
  target_column TEXT,
  update_rule TEXT,
  delete_rule TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.constraint_name::TEXT,
    tc.table_name::TEXT as source_table,
    kcu.column_name::TEXT as source_column,
    ccu.table_name::TEXT as target_table,
    ccu.column_name::TEXT as target_column,
    rc.update_rule::TEXT,
    rc.delete_rule::TEXT
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = p_schema
    AND (p_table IS NULL OR tc.table_name = p_table)
  ORDER BY tc.table_name, kcu.column_name;
END;
$$;
`;

/**
 * Получить индексы таблицы
 */
export async function getIndexes(tableName, schema = 'public') {
  if (!supabase) return getMockIndexes(tableName);

  const { data, error } = await supabase.rpc('get_indexes', {
    p_table: tableName,
    p_schema: schema,
  });

  if (error) {
    console.error('Error fetching indexes:', error);
    return getMockIndexes(tableName);
  }

  return data;
}

/**
 * SQL функция для получения индексов
 */
export const SQL_GET_INDEXES = `
CREATE OR REPLACE FUNCTION get_indexes(p_table TEXT, p_schema TEXT DEFAULT 'public')
RETURNS TABLE (
  index_name TEXT,
  column_names TEXT[],
  is_unique BOOLEAN,
  is_primary BOOLEAN,
  index_type TEXT,
  size_bytes BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.relname::TEXT as index_name,
    array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum))::TEXT[] as column_names,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary,
    am.amname::TEXT as index_type,
    pg_relation_size(i.oid)::BIGINT as size_bytes
  FROM pg_index ix
  JOIN pg_class t ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_am am ON am.oid = i.relam
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE n.nspname = p_schema
    AND t.relname = p_table
  GROUP BY i.relname, ix.indisunique, ix.indisprimary, am.amname, i.oid
  ORDER BY i.relname;
END;
$$;
`;

/**
 * Получить уникальные ограничения
 */
export async function getUniqueConstraints(tableName, schema = 'public') {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_unique_constraints', {
    p_table: tableName,
    p_schema: schema,
  });

  if (error) {
    console.error('Error fetching unique constraints:', error);
    return [];
  }

  return data;
}

/**
 * SQL функция для уникальных ограничений
 */
export const SQL_GET_UNIQUE_CONSTRAINTS = `
CREATE OR REPLACE FUNCTION get_unique_constraints(p_table TEXT, p_schema TEXT DEFAULT 'public')
RETURNS TABLE (
  constraint_name TEXT,
  column_names TEXT[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.constraint_name::TEXT,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position)::TEXT[] as column_names
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = p_schema
    AND tc.table_name = p_table
  GROUP BY tc.constraint_name
  ORDER BY tc.constraint_name;
END;
$$;
`;

/**
 * ================================================
 * 3. ПРИМЕРЫ СТРОК (SAMPLE ROWS)
 * ================================================
 */

/**
 * Получить примеры строк из таблицы
 */
export async function getSampleRows(tableName, options = {}) {
  const {
    limit = LIMITS.DEFAULT_SAMPLE_ROWS,
    offset = 0,
    where = null,
    orderBy = null,
    columns = '*',
  } = options;

  // Безопасный лимит
  const safeLimit = Math.min(limit, LIMITS.MAX_SAMPLE_ROWS);

  if (!supabase) return getMockSampleRows(tableName, safeLimit);

  try {
    let query = supabase
      .from(tableName)
      .select(columns)
      .limit(safeLimit)
      .range(offset, offset + safeLimit - 1);

    // Добавляем сортировку если указана
    if (orderBy) {
      const [column, direction] = orderBy.split(' ');
      query = query.order(column, { ascending: direction?.toLowerCase() !== 'desc' });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sample rows:', error);
      return getMockSampleRows(tableName, safeLimit);
    }

    return {
      rows: data,
      count: data.length,
      limit: safeLimit,
      offset,
      hasMore: data.length === safeLimit,
    };
  } catch (err) {
    console.error('Error in getSampleRows:', err);
    return getMockSampleRows(tableName, safeLimit);
  }
}

/**
 * Выполнить безопасный SQL запрос
 */
export async function executeQuery(sql, options = {}) {
  const {
    timeout = LIMITS.MAX_QUERY_TIMEOUT,
    params = [],
  } = options;

  if (!supabase) {
    return { error: 'Supabase not configured', data: null };
  }

  // Проверка на опасные операции
  const sqlUpper = sql.toUpperCase().trim();
  const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];

  for (const keyword of dangerousKeywords) {
    if (sqlUpper.startsWith(keyword)) {
      return {
        error: `Операция ${keyword} запрещена. Разрешены только SELECT запросы.`,
        data: null,
      };
    }
  }

  try {
    const { data, error } = await supabase.rpc('execute_readonly_query', {
      p_sql: sql,
      p_timeout: timeout,
    });

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (err) {
    return { error: err.message, data: null };
  }
}

/**
 * SQL функция для безопасного выполнения запросов
 */
export const SQL_EXECUTE_READONLY = `
CREATE OR REPLACE FUNCTION execute_readonly_query(p_sql TEXT, p_timeout INTEGER DEFAULT 30000)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSONB;
BEGIN
  -- Установка таймаута
  EXECUTE format('SET LOCAL statement_timeout = %s', p_timeout);

  -- Проверка что это SELECT
  IF NOT (upper(trim(p_sql)) LIKE 'SELECT%' OR upper(trim(p_sql)) LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Выполнение запроса
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', p_sql) INTO result;

  RETURN COALESCE(result, '[]'::JSONB);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query error: %', SQLERRM;
END;
$$;
`;

/**
 * ================================================
 * 4. СТАТИСТИКИ
 * ================================================
 */

/**
 * Получить базовые статистики таблицы
 */
export async function getTableStats(tableName, schema = 'public') {
  if (!supabase) return getMockTableStats(tableName);

  const { data, error } = await supabase.rpc('get_table_stats', {
    p_table: tableName,
    p_schema: schema,
  });

  if (error) {
    console.error('Error fetching table stats:', error);
    return getMockTableStats(tableName);
  }

  return data;
}

/**
 * SQL функция для статистик таблицы
 */
export const SQL_GET_TABLE_STATS = `
CREATE OR REPLACE FUNCTION get_table_stats(p_table TEXT, p_schema TEXT DEFAULT 'public')
RETURNS TABLE (
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  last_vacuum TIMESTAMP,
  last_analyze TIMESTAMP,
  dead_tuples BIGINT,
  live_tuples BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.reltuples::BIGINT as row_count,
    pg_size_pretty(pg_table_size(c.oid)) as table_size,
    pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    s.last_vacuum,
    s.last_analyze,
    s.n_dead_tup as dead_tuples,
    s.n_live_tup as live_tuples
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
  WHERE n.nspname = p_schema
    AND c.relname = p_table;
END;
$$;
`;

/**
 * Получить статистики по колонкам
 */
export async function getColumnStats(tableName, columns = null, options = {}) {
  const {
    sampleSize = null, // null = вся таблица
    where = null,
  } = options;

  if (!supabase) return getMockColumnStats(tableName, columns);

  const { data, error } = await supabase.rpc('get_column_stats', {
    p_table: tableName,
    p_columns: columns,
    p_sample_size: sampleSize,
    p_where: where,
  });

  if (error) {
    console.error('Error fetching column stats:', error);
    return getMockColumnStats(tableName, columns);
  }

  return data;
}

/**
 * SQL функция для статистик колонок (сложная, генерируется динамически)
 */
export const SQL_GET_COLUMN_STATS = `
CREATE OR REPLACE FUNCTION get_column_stats(
  p_table TEXT,
  p_columns TEXT[] DEFAULT NULL,
  p_sample_size INTEGER DEFAULT NULL,
  p_where TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  col RECORD;
  result JSONB := '[]'::JSONB;
  col_stats JSONB;
  sample_clause TEXT := '';
  where_clause TEXT := '';
  query TEXT;
BEGIN
  -- Подготовка clauses
  IF p_sample_size IS NOT NULL THEN
    sample_clause := format(' TABLESAMPLE SYSTEM (%s)', LEAST(100, p_sample_size * 100.0 / GREATEST(1, (SELECT reltuples FROM pg_class WHERE relname = p_table))));
  END IF;

  IF p_where IS NOT NULL THEN
    where_clause := ' WHERE ' || p_where;
  END IF;

  -- Для каждой колонки
  FOR col IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = p_table
      AND (p_columns IS NULL OR column_name = ANY(p_columns))
    ORDER BY ordinal_position
  LOOP
    -- Базовые статистики
    query := format(
      'SELECT jsonb_build_object(
        ''column_name'', %L,
        ''data_type'', %L,
        ''row_count'', COUNT(*),
        ''null_count'', COUNT(*) - COUNT(%I),
        ''null_rate'', ROUND((COUNT(*) - COUNT(%I))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2),
        ''distinct_count'', COUNT(DISTINCT %I),
        ''distinct_rate'', ROUND(COUNT(DISTINCT %I)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2)',
      col.column_name, col.data_type,
      col.column_name, col.column_name,
      col.column_name, col.column_name
    );

    -- Числовые статистики для числовых типов
    IF col.data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision', 'decimal') THEN
      query := query || format(
        ', ''min'', MIN(%I)::TEXT,
         ''max'', MAX(%I)::TEXT,
         ''avg'', ROUND(AVG(%I)::NUMERIC, 2)::TEXT,
         ''stddev'', ROUND(STDDEV(%I)::NUMERIC, 2)::TEXT',
        col.column_name, col.column_name, col.column_name, col.column_name
      );
    -- Статистики для дат
    ELSIF col.data_type IN ('date', 'timestamp', 'timestamp with time zone', 'timestamp without time zone') THEN
      query := query || format(
        ', ''min'', MIN(%I)::TEXT,
         ''max'', MAX(%I)::TEXT',
        col.column_name, col.column_name
      );
    -- Статистики для текста
    ELSIF col.data_type IN ('text', 'varchar', 'character varying', 'char') THEN
      query := query || format(
        ', ''min_length'', MIN(LENGTH(%I)),
         ''max_length'', MAX(LENGTH(%I)),
         ''avg_length'', ROUND(AVG(LENGTH(%I))::NUMERIC, 1)',
        col.column_name, col.column_name, col.column_name
      );
    END IF;

    query := query || format(') FROM %I%s%s', p_table, sample_clause, where_clause);

    EXECUTE query INTO col_stats;
    result := result || col_stats;
  END LOOP;

  RETURN result;
END;
$$;
`;

/**
 * Получить топ значений для категориальной колонки
 */
export async function getTopValues(tableName, columnName, options = {}) {
  const {
    limit = LIMITS.MAX_TOP_VALUES,
    where = null,
  } = options;

  if (!supabase) return getMockTopValues(tableName, columnName, limit);

  const { data, error } = await supabase.rpc('get_top_values', {
    p_table: tableName,
    p_column: columnName,
    p_limit: Math.min(limit, LIMITS.MAX_TOP_VALUES),
    p_where: where,
  });

  if (error) {
    console.error('Error fetching top values:', error);
    return getMockTopValues(tableName, columnName, limit);
  }

  return data;
}

/**
 * SQL функция для топ значений
 */
export const SQL_GET_TOP_VALUES = `
CREATE OR REPLACE FUNCTION get_top_values(
  p_table TEXT,
  p_column TEXT,
  p_limit INTEGER DEFAULT 20,
  p_where TEXT DEFAULT NULL
)
RETURNS TABLE (
  value TEXT,
  count BIGINT,
  percentage NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  query TEXT;
  total BIGINT;
BEGIN
  -- Получаем общее количество
  IF p_where IS NOT NULL THEN
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE %s', p_table, p_where) INTO total;
  ELSE
    EXECUTE format('SELECT COUNT(*) FROM %I', p_table) INTO total;
  END IF;

  -- Формируем запрос
  query := format(
    'SELECT
      %I::TEXT as value,
      COUNT(*) as count,
      ROUND(COUNT(*)::NUMERIC / %s * 100, 2) as percentage
    FROM %I',
    p_column, total, p_table
  );

  IF p_where IS NOT NULL THEN
    query := query || ' WHERE ' || p_where;
  END IF;

  query := query || format(
    ' GROUP BY %I ORDER BY count DESC LIMIT %s',
    p_column, p_limit
  );

  RETURN QUERY EXECUTE query;
END;
$$;
`;

/**
 * Получить процентили для числовой колонки
 */
export async function getPercentiles(tableName, columnName, percentiles = [0.25, 0.5, 0.75, 0.9, 0.95, 0.99]) {
  if (!supabase) return getMockPercentiles(tableName, columnName, percentiles);

  const { data, error } = await supabase.rpc('get_percentiles', {
    p_table: tableName,
    p_column: columnName,
    p_percentiles: percentiles,
  });

  if (error) {
    console.error('Error fetching percentiles:', error);
    return getMockPercentiles(tableName, columnName, percentiles);
  }

  return data;
}

/**
 * SQL функция для процентилей
 */
export const SQL_GET_PERCENTILES = `
CREATE OR REPLACE FUNCTION get_percentiles(
  p_table TEXT,
  p_column TEXT,
  p_percentiles NUMERIC[] DEFAULT ARRAY[0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  pct NUMERIC;
  val NUMERIC;
BEGIN
  FOREACH pct IN ARRAY p_percentiles LOOP
    EXECUTE format(
      'SELECT PERCENTILE_CONT(%s) WITHIN GROUP (ORDER BY %I) FROM %I',
      pct, p_column, p_table
    ) INTO val;
    result := result || jsonb_build_object(('p' || (pct * 100)::INTEGER)::TEXT, val);
  END LOOP;

  RETURN result;
END;
$$;
`;

/**
 * ================================================
 * 5. ПРОВЕРКА НАГРУЗКИ
 * ================================================
 */

/**
 * Оценить стоимость запроса перед выполнением
 */
export async function estimateQueryCost(tableName, options = {}) {
  if (!supabase) {
    return {
      estimated_rows: 1000,
      warning: null,
      recommendation: 'Supabase not configured',
    };
  }

  const { data: stats } = await supabase.rpc('get_table_stats', {
    p_table: tableName,
    p_schema: 'public',
  });

  const rowCount = stats?.[0]?.row_count || 0;

  let warning = null;
  let recommendation = null;

  if (rowCount > LIMITS.MAX_STATS_ROWS) {
    warning = `Таблица содержит ${rowCount.toLocaleString()} строк. Запрос может быть медленным.`;
    recommendation = 'Рекомендуется использовать LIMIT, выборку по партициям или WHERE условие.';
  }

  return {
    estimated_rows: rowCount,
    warning,
    recommendation,
    limits: LIMITS,
  };
}

/**
 * Получить полную схему таблицы (всё вместе)
 */
export async function getFullTableSchema(tableName, schema = 'public') {
  const [columns, primaryKeys, foreignKeys, indexes, uniqueConstraints, stats] = await Promise.all([
    getColumns(tableName, schema),
    getPrimaryKeys(tableName, schema),
    getForeignKeys(tableName, schema),
    getIndexes(tableName, schema),
    getUniqueConstraints(tableName, schema),
    getTableStats(tableName, schema),
  ]);

  return {
    tableName,
    schema,
    columns,
    primaryKeys,
    foreignKeys,
    indexes,
    uniqueConstraints,
    stats: stats?.[0] || null,
  };
}

/**
 * Получить схему всей базы данных
 */
export async function getDatabaseSchema(schema = 'public') {
  const tables = await getTables(schema);
  const foreignKeys = await getForeignKeys(null, schema);

  // Группируем FK по таблицам
  const fkByTable = {};
  for (const fk of foreignKeys) {
    if (!fkByTable[fk.source_table]) {
      fkByTable[fk.source_table] = [];
    }
    fkByTable[fk.source_table].push(fk);
  }

  // Добавляем колонки к каждой таблице
  const tablesWithColumns = await Promise.all(
    tables.map(async (table) => ({
      ...table,
      columns: await getColumns(table.table_name, schema),
      foreignKeys: fkByTable[table.table_name] || [],
    }))
  );

  return {
    schema,
    tables: tablesWithColumns,
    relationships: foreignKeys,
  };
}

// ================================================
// MOCK DATA (когда Supabase не настроен)
// ================================================

function getMockTables() {
  return [
    { table_name: 'dim_products', table_type: 'BASE TABLE', row_count: 80, description: 'Справочник товаров' },
    { table_name: 'dim_categories', table_type: 'BASE TABLE', row_count: 4, description: 'Справочник категорий' },
    { table_name: 'dim_calendar', table_type: 'BASE TABLE', row_count: 730, description: 'Календарь' },
    { table_name: 'fact_sales_daily', table_type: 'BASE TABLE', row_count: 4800, description: 'Продажи по дням' },
    { table_name: 'plan_sales_daily', table_type: 'BASE TABLE', row_count: 360, description: 'План продаж' },
    { table_name: 'fact_ads_daily', table_type: 'BASE TABLE', row_count: 3360, description: 'Рекламные расходы' },
    { table_name: 'fact_price_daily', table_type: 'BASE TABLE', row_count: 4800, description: 'История цен' },
    { table_name: 'v_category_plan_fact_today', table_type: 'VIEW', row_count: 4, description: 'План/факт сегодня' },
    { table_name: 'v_category_plan_fact_mtd', table_type: 'VIEW', row_count: 4, description: 'План/факт MTD' },
  ];
}

function getMockColumns(tableName) {
  const schemas = {
    dim_products: [
      { column_name: 'product_id', data_type: 'integer', is_nullable: false, column_default: "nextval('dim_products_product_id_seq')" },
      { column_name: 'sku', data_type: 'varchar', is_nullable: false, character_maximum_length: 50 },
      { column_name: 'title', data_type: 'varchar', is_nullable: false, character_maximum_length: 255 },
      { column_name: 'category_key', data_type: 'varchar', is_nullable: false, character_maximum_length: 50 },
      { column_name: 'subcategory', data_type: 'varchar', is_nullable: true, character_maximum_length: 100 },
      { column_name: 'brand', data_type: 'varchar', is_nullable: true, character_maximum_length: 100 },
      { column_name: 'base_price', data_type: 'numeric', is_nullable: false, numeric_precision: 10 },
      { column_name: 'margin_percent', data_type: 'numeric', is_nullable: true, numeric_precision: 5 },
      { column_name: 'is_active', data_type: 'boolean', is_nullable: false, column_default: 'true' },
    ],
    fact_sales_daily: [
      { column_name: 'id', data_type: 'integer', is_nullable: false },
      { column_name: 'date', data_type: 'date', is_nullable: false },
      { column_name: 'product_id', data_type: 'integer', is_nullable: false },
      { column_name: 'units', data_type: 'integer', is_nullable: false, column_default: '0' },
      { column_name: 'revenue', data_type: 'numeric', is_nullable: false, numeric_precision: 12 },
      { column_name: 'orders_count', data_type: 'integer', is_nullable: false, column_default: '0' },
    ],
  };

  return schemas[tableName] || [
    { column_name: 'id', data_type: 'integer', is_nullable: false },
    { column_name: 'created_at', data_type: 'timestamp', is_nullable: true },
  ];
}

function getMockPrimaryKeys(tableName) {
  const pks = {
    dim_products: [{ constraint_name: 'dim_products_pkey', column_name: 'product_id', ordinal_position: 1 }],
    fact_sales_daily: [{ constraint_name: 'fact_sales_daily_pkey', column_name: 'id', ordinal_position: 1 }],
    dim_categories: [{ constraint_name: 'dim_categories_pkey', column_name: 'category_id', ordinal_position: 1 }],
  };
  return pks[tableName] || [];
}

function getMockForeignKeys(tableName) {
  const allFks = [
    { constraint_name: 'fk_product_category', source_table: 'dim_products', source_column: 'category_key', target_table: 'dim_categories', target_column: 'category_key' },
    { constraint_name: 'fk_sales_product', source_table: 'fact_sales_daily', source_column: 'product_id', target_table: 'dim_products', target_column: 'product_id' },
    { constraint_name: 'fk_ads_product', source_table: 'fact_ads_daily', source_column: 'product_id', target_table: 'dim_products', target_column: 'product_id' },
    { constraint_name: 'fk_price_product', source_table: 'fact_price_daily', source_column: 'product_id', target_table: 'dim_products', target_column: 'product_id' },
    { constraint_name: 'fk_plan_category', source_table: 'plan_sales_daily', source_column: 'category_key', target_table: 'dim_categories', target_column: 'category_key' },
  ];

  if (tableName) {
    return allFks.filter(fk => fk.source_table === tableName);
  }
  return allFks;
}

function getMockIndexes(tableName) {
  const indexes = {
    dim_products: [
      { index_name: 'idx_products_category', column_names: ['category_key'], is_unique: false, is_primary: false, index_type: 'btree' },
      { index_name: 'idx_products_subcategory', column_names: ['subcategory'], is_unique: false, is_primary: false, index_type: 'btree' },
      { index_name: 'dim_products_sku_key', column_names: ['sku'], is_unique: true, is_primary: false, index_type: 'btree' },
    ],
    fact_sales_daily: [
      { index_name: 'idx_sales_date', column_names: ['date'], is_unique: false, is_primary: false, index_type: 'btree' },
      { index_name: 'idx_sales_product', column_names: ['product_id'], is_unique: false, is_primary: false, index_type: 'btree' },
    ],
  };
  return indexes[tableName] || [];
}

function getMockSampleRows(tableName, limit) {
  const samples = {
    dim_products: [
      { product_id: 1, sku: 'FC001', title: 'Крем увлажняющий дневной 50мл', category_key: 'face', base_price: 890 },
      { product_id: 2, sku: 'FC002', title: 'Крем ночной восстанавливающий 50мл', category_key: 'face', base_price: 1190 },
      { product_id: 3, sku: 'HS001', title: 'Шампунь увлажняющий 400мл', category_key: 'hair', base_price: 590 },
    ],
    fact_sales_daily: [
      { id: 1, date: '2024-12-17', product_id: 1, units: 15, revenue: 13350, orders_count: 12 },
      { id: 2, date: '2024-12-17', product_id: 2, units: 8, revenue: 9520, orders_count: 7 },
    ],
  };

  const rows = samples[tableName]?.slice(0, limit) || [];
  return { rows, count: rows.length, limit, offset: 0, hasMore: false };
}

function getMockTableStats(tableName) {
  const stats = {
    dim_products: [{ row_count: 80, table_size: '64 kB', index_size: '32 kB', total_size: '96 kB' }],
    fact_sales_daily: [{ row_count: 4800, table_size: '512 kB', index_size: '128 kB', total_size: '640 kB' }],
  };
  return stats[tableName] || [{ row_count: 0, table_size: '0 bytes', index_size: '0 bytes', total_size: '0 bytes' }];
}

function getMockColumnStats(tableName, columns) {
  return [
    { column_name: 'revenue', data_type: 'numeric', row_count: 4800, null_count: 0, null_rate: 0, distinct_count: 3500, min: '0', max: '50000', avg: '12500', stddev: '8500' },
    { column_name: 'units', data_type: 'integer', row_count: 4800, null_count: 0, null_rate: 0, distinct_count: 50, min: '1', max: '100', avg: '25', stddev: '15' },
  ];
}

function getMockTopValues(tableName, columnName, limit) {
  if (columnName === 'category_key') {
    return [
      { value: 'face', count: 20, percentage: 25 },
      { value: 'hair', count: 20, percentage: 25 },
      { value: 'body', count: 20, percentage: 25 },
      { value: 'makeup', count: 20, percentage: 25 },
    ];
  }
  return [
    { value: 'value1', count: 100, percentage: 50 },
    { value: 'value2', count: 60, percentage: 30 },
    { value: 'value3', count: 40, percentage: 20 },
  ];
}

function getMockPercentiles(tableName, columnName, percentiles) {
  return {
    p25: 5000,
    p50: 12500,
    p75: 22000,
    p90: 35000,
    p95: 42000,
    p99: 48000,
  };
}

// Экспорт SQL функций для создания в Supabase
export const ALL_SQL_FUNCTIONS = [
  SQL_GET_TABLES,
  SQL_GET_COLUMNS,
  SQL_GET_PRIMARY_KEYS,
  SQL_GET_FOREIGN_KEYS,
  SQL_GET_INDEXES,
  SQL_GET_UNIQUE_CONSTRAINTS,
  SQL_EXECUTE_READONLY,
  SQL_GET_TABLE_STATS,
  SQL_GET_COLUMN_STATS,
  SQL_GET_TOP_VALUES,
  SQL_GET_PERCENTILES,
];

export default {
  // Схемы и типы
  getTables,
  getColumns,

  // Связи
  getPrimaryKeys,
  getForeignKeys,
  getIndexes,
  getUniqueConstraints,

  // Примеры данных
  getSampleRows,
  executeQuery,

  // Статистики
  getTableStats,
  getColumnStats,
  getTopValues,
  getPercentiles,

  // Утилиты
  estimateQueryCost,
  getFullTableSchema,
  getDatabaseSchema,

  // SQL функции
  ALL_SQL_FUNCTIONS,

  // Лимиты
  LIMITS,
};
