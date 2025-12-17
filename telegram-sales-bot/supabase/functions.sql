-- ================================================
-- SQL ФУНКЦИИ ДЛЯ МЕТАДАННЫХ
-- Выполните в Supabase SQL Editor
-- ================================================

-- ================================================
-- 1. ПОЛУЧЕНИЕ СПИСКА ТАБЛИЦ
-- ================================================
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

-- ================================================
-- 2. ПОЛУЧЕНИЕ КОЛОНОК ТАБЛИЦЫ
-- ================================================
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

-- ================================================
-- 3. ПОЛУЧЕНИЕ ПЕРВИЧНЫХ КЛЮЧЕЙ
-- ================================================
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

-- ================================================
-- 4. ПОЛУЧЕНИЕ ВНЕШНИХ КЛЮЧЕЙ
-- ================================================
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

-- ================================================
-- 5. ПОЛУЧЕНИЕ ИНДЕКСОВ
-- ================================================
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

-- ================================================
-- 6. ПОЛУЧЕНИЕ УНИКАЛЬНЫХ ОГРАНИЧЕНИЙ
-- ================================================
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

-- ================================================
-- 7. СТАТИСТИКИ ТАБЛИЦЫ
-- ================================================
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

-- ================================================
-- 8. СТАТИСТИКИ КОЛОНОК
-- ================================================
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

-- ================================================
-- 9. ТОП ЗНАЧЕНИЙ КОЛОНКИ
-- ================================================
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

-- ================================================
-- 10. ПРОЦЕНТИЛИ
-- ================================================
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

-- ================================================
-- 11. БЕЗОПАСНОЕ ВЫПОЛНЕНИЕ SQL (ТОЛЬКО SELECT)
-- ================================================
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

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
-- Для service role эти функции уже доступны
-- Для anon роли (если нужно):
-- GRANT EXECUTE ON FUNCTION get_tables_metadata TO anon;
-- и т.д.
