/**
 * Обработчики команд Telegram бота
 */

import { Markup } from 'telegraf';
import supabaseService, { CATEGORIES, CATEGORY_KEYS } from '../services/supabase.js';
import claudeService from '../services/claude.js';
import metadataService from '../services/metadata.js';
import {
  formatCurrency,
  formatPercent,
  formatPlanFact,
  getTrendIndicator,
  getCompletionIndicator,
  getMTDPeriod,
  formatDate,
  truncateTitle,
  formatDRR,
  progressBar,
} from '../utils/formatters.js';

/**
 * /start - Приветствие
 */
export async function handleStart(ctx) {
  const username = ctx.from.first_name || 'Руководитель';

  await ctx.replyWithMarkdown(
    `👋 *Привет, ${username}!*\n\n` +
    `Я — бот аналитики продаж маркетплейса.\n\n` +
    `📊 *Категории:*\n` +
    `• 👤 Лицо\n` +
    `• 💇 Волосы\n` +
    `• 🧴 Тело\n` +
    `• 💄 Макияж\n\n` +
    `Используй /help для списка команд.`,
    getMainKeyboard()
  );
}

/**
 * /help - Помощь по командам
 */
export async function handleHelp(ctx) {
  await ctx.replyWithMarkdown(
    `📋 *Команды бота:*\n\n` +
    `*Основные отчёты:*\n` +
    `/daily — 📊 Ежедневный дайджест по всем категориям\n\n` +
    `*По категориям:*\n` +
    `/face — 👤 Отчёт по категории Лицо\n` +
    `/hair — 💇 Отчёт по категории Волосы\n` +
    `/body — 🧴 Отчёт по категории Тело\n` +
    `/makeup — 💄 Отчёт по категории Макияж\n\n` +
    `*Детализация:*\n` +
    `/drill <категория> — Подкатегории (drill-down)\n` +
    `/top10 <категория> — Топ-10 товаров по выручке\n` +
    `/top20 <категория> — Топ-20 с потенциалом роста\n\n` +
    `*Метаданные:*\n` +
    `/tables — Список таблиц\n` +
    `/schema <таблица> — Схема таблицы\n` +
    `/stats <таблица> — Статистики таблицы\n\n` +
    `*Примеры:*\n` +
    `\`/top10 face\`\n` +
    `\`/drill hair\`\n` +
    `\`/schema dim_products\``,
    getMainKeyboard()
  );
}

/**
 * /daily - Ежедневный дайджест
 */
export async function handleDaily(ctx) {
  await ctx.reply('⏳ Формирую ежедневный дайджест...');

  try {
    const data = await supabaseService.getDailyDigestData();
    const report = await claudeService.generateDailyDigest(data);

    // Разбиваем на части если слишком длинное
    const chunks = splitMessage(report);

    for (const chunk of chunks) {
      await ctx.replyWithMarkdown(chunk, { disable_web_page_preview: true });
    }

    // Добавляем кнопки действий
    await ctx.reply(
      '🎯 Выберите действие:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('👤 Лицо', 'category_face'),
          Markup.button.callback('💇 Волосы', 'category_hair'),
        ],
        [
          Markup.button.callback('🧴 Тело', 'category_body'),
          Markup.button.callback('💄 Макияж', 'category_makeup'),
        ],
        [Markup.button.callback('🔄 Обновить', 'refresh_daily')],
      ])
    );
  } catch (error) {
    console.error('Error in handleDaily:', error);
    await ctx.reply('❌ Ошибка при формировании отчёта. Попробуйте позже.');
  }
}

/**
 * Обработчик команд категорий (/face, /hair, /body, /makeup)
 */
export async function handleCategoryReport(ctx, categoryKey) {
  const category = CATEGORIES[categoryKey];
  if (!category) {
    return ctx.reply('❌ Неизвестная категория. Используйте: face, hair, body, makeup');
  }

  await ctx.reply(`⏳ Формирую отчёт по категории ${category.emoji} ${category.name}...`);

  try {
    const data = await supabaseService.getCategoryReportData(categoryKey);
    const report = await claudeService.generateCategoryReport(data, category);

    const chunks = splitMessage(report);
    for (const chunk of chunks) {
      await ctx.replyWithMarkdown(chunk, { disable_web_page_preview: true });
    }

    await ctx.reply(
      'Детализация:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('📊 Топ-10', `top10_${categoryKey}`),
          Markup.button.callback('📈 Топ-20 рост', `top20_${categoryKey}`),
        ],
        [
          Markup.button.callback('📂 Подкатегории', `drill_${categoryKey}`),
          Markup.button.callback('🔙 К дайджесту', 'back_to_daily'),
        ],
      ])
    );
  } catch (error) {
    console.error(`Error in handleCategoryReport(${categoryKey}):`, error);
    await ctx.reply('❌ Ошибка при формировании отчёта.');
  }
}

/**
 * /drill <категория> - Подкатегории
 */
export async function handleDrill(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const categoryKey = args[0]?.toLowerCase();

  if (!categoryKey || !CATEGORIES[categoryKey]) {
    return ctx.reply(
      '❓ Укажите категорию:\n' +
      '/drill face\n/drill hair\n/drill body\n/drill makeup',
      getDrillKeyboard()
    );
  }

  await showDrillDown(ctx, categoryKey);
}

/**
 * Показать drill-down по категории
 */
async function showDrillDown(ctx, categoryKey) {
  const category = CATEGORIES[categoryKey];
  await ctx.reply(`⏳ Загружаю подкатегории ${category.emoji} ${category.name}...`);

  try {
    const subcategories = await supabaseService.getSubcategoriesMTD(categoryKey);
    const report = await claudeService.generateDrillDownReport(subcategories, category);

    await ctx.replyWithMarkdown(report);

    // Кнопки подкатегорий
    const buttons = subcategories.slice(0, 8).map((sub) => [
      Markup.button.callback(
        `${getCompletionIndicator(sub.revenue_completion_pct)} ${sub.subcategory}`,
        `subcat_${categoryKey}_${sub.subcategory.slice(0, 20)}`
      ),
    ]);

    buttons.push([Markup.button.callback('🔙 Назад', `category_${categoryKey}`)]);

    await ctx.reply('Выберите подкатегорию:', Markup.inlineKeyboard(buttons));
  } catch (error) {
    console.error(`Error in showDrillDown(${categoryKey}):`, error);
    await ctx.reply('❌ Ошибка при загрузке подкатегорий.');
  }
}

/**
 * /top10 <категория> - Топ-10 товаров
 */
export async function handleTop10(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const categoryKey = args[0]?.toLowerCase();

  if (!categoryKey || !CATEGORIES[categoryKey]) {
    return ctx.reply(
      '❓ Укажите категорию:\n' +
      '/top10 face\n/top10 hair\n/top10 body\n/top10 makeup'
    );
  }

  await showTop10(ctx, categoryKey);
}

/**
 * Показать топ-10 товаров
 */
async function showTop10(ctx, categoryKey) {
  const category = CATEGORIES[categoryKey];
  await ctx.reply(`⏳ Загружаю топ-10 ${category.emoji} ${category.name}...`);

  try {
    const [products, momData] = await Promise.all([
      supabaseService.getTopProductsByCategory(categoryKey, 10),
      supabaseService.getProductsMoMCompare(categoryKey, 10),
    ]);

    const report = await claudeService.generateTop10Report(products, category, momData);

    const chunks = splitMessage(report);
    for (const chunk of chunks) {
      await ctx.replyWithMarkdown(chunk, { disable_web_page_preview: true });
    }

    await ctx.reply(
      'Действия:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('📈 Топ-20 рост', `top20_${categoryKey}`),
          Markup.button.callback('📂 Подкатегории', `drill_${categoryKey}`),
        ],
        [Markup.button.callback('🔙 К категории', `category_${categoryKey}`)],
      ])
    );
  } catch (error) {
    console.error(`Error in showTop10(${categoryKey}):`, error);
    await ctx.reply('❌ Ошибка при загрузке топ-10.');
  }
}

/**
 * /top20 <категория> - Топ-20 с потенциалом роста
 */
export async function handleTop20(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const categoryKey = args[0]?.toLowerCase();

  if (!categoryKey || !CATEGORIES[categoryKey]) {
    return ctx.reply(
      '❓ Укажите категорию:\n' +
      '/top20 face\n/top20 hair\n/top20 body\n/top20 makeup'
    );
  }

  await showTop20(ctx, categoryKey);
}

/**
 * Показать топ-20 с потенциалом роста
 */
async function showTop20(ctx, categoryKey) {
  const category = CATEGORIES[categoryKey];
  await ctx.reply(`⏳ Анализирую топ-20 с потенциалом роста ${category.emoji} ${category.name}...`);

  try {
    const growthCandidates = await supabaseService.getGrowthCandidates(categoryKey);
    const report = await claudeService.generateTop20GrowthReport(growthCandidates, category);

    const chunks = splitMessage(report);
    for (const chunk of chunks) {
      await ctx.replyWithMarkdown(chunk, { disable_web_page_preview: true });
    }

    await ctx.reply(
      'Действия:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🏆 Топ-10', `top10_${categoryKey}`),
          Markup.button.callback('📂 Подкатегории', `drill_${categoryKey}`),
        ],
        [Markup.button.callback('🔙 К категории', `category_${categoryKey}`)],
      ])
    );
  } catch (error) {
    console.error(`Error in showTop20(${categoryKey}):`, error);
    await ctx.reply('❌ Ошибка при анализе потенциала роста.');
  }
}

/**
 * ================================================
 * МЕТАДАННЫЕ
 * ================================================
 */

/**
 * /tables - Список таблиц
 */
export async function handleTables(ctx) {
  await ctx.reply('⏳ Загружаю список таблиц...');

  try {
    const tables = await metadataService.getTables();

    let message = '📋 *Таблицы базы данных:*\n\n';

    const baseTables = tables.filter((t) => t.table_type === 'BASE TABLE');
    const views = tables.filter((t) => t.table_type === 'VIEW');

    if (baseTables.length > 0) {
      message += '*Таблицы:*\n';
      for (const t of baseTables) {
        const rowInfo = t.row_count ? ` (${t.row_count.toLocaleString()} rows)` : '';
        message += `• \`${t.table_name}\`${rowInfo}\n`;
      }
      message += '\n';
    }

    if (views.length > 0) {
      message += '*Views:*\n';
      for (const v of views) {
        message += `• \`${v.table_name}\`\n`;
      }
    }

    message += '\n💡 Используйте `/schema <таблица>` для деталей';

    await ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error('Error in handleTables:', error);
    await ctx.reply('❌ Ошибка при загрузке списка таблиц.');
  }
}

/**
 * /schema <таблица> - Схема таблицы
 */
export async function handleSchema(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const tableName = args[0];

  if (!tableName) {
    return ctx.reply('❓ Укажите имя таблицы: `/schema dim_products`', { parse_mode: 'Markdown' });
  }

  await ctx.reply(`⏳ Загружаю схему таблицы \`${tableName}\`...`, { parse_mode: 'Markdown' });

  try {
    const schema = await metadataService.getFullTableSchema(tableName);

    let message = `📊 *Схема таблицы:* \`${tableName}\`\n\n`;

    // Статистики
    if (schema.stats) {
      message += `*Статистики:*\n`;
      message += `• Строк: ${schema.stats.row_count?.toLocaleString() || 'н/д'}\n`;
      message += `• Размер: ${schema.stats.total_size || 'н/д'}\n\n`;
    }

    // Колонки
    message += `*Колонки:*\n`;
    for (const col of schema.columns.slice(0, 15)) {
      const nullable = col.is_nullable ? '' : ' NOT NULL';
      const defaultVal = col.column_default ? ` = ${truncateTitle(col.column_default, 20)}` : '';
      message += `• \`${col.column_name}\` _${col.data_type}_${nullable}${defaultVal}\n`;
    }

    if (schema.columns.length > 15) {
      message += `_...и ещё ${schema.columns.length - 15} колонок_\n`;
    }

    // Первичные ключи
    if (schema.primaryKeys?.length > 0) {
      message += `\n*Primary Key:* ${schema.primaryKeys.map((pk) => pk.column_name).join(', ')}\n`;
    }

    // Внешние ключи
    if (schema.foreignKeys?.length > 0) {
      message += `\n*Foreign Keys:*\n`;
      for (const fk of schema.foreignKeys) {
        message += `• ${fk.source_column} → ${fk.target_table}.${fk.target_column}\n`;
      }
    }

    // Индексы
    if (schema.indexes?.length > 0) {
      message += `\n*Индексы:* ${schema.indexes.length}\n`;
    }

    await ctx.replyWithMarkdown(message);

    // Кнопки действий
    await ctx.reply(
      'Действия:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('📊 Статистики', `stats_${tableName}`),
          Markup.button.callback('📝 Примеры', `sample_${tableName}`),
        ],
        [Markup.button.callback('🔙 К таблицам', 'show_tables')],
      ])
    );
  } catch (error) {
    console.error(`Error in handleSchema(${tableName}):`, error);
    await ctx.reply(`❌ Ошибка при загрузке схемы таблицы \`${tableName}\`.`, { parse_mode: 'Markdown' });
  }
}

/**
 * /stats <таблица> - Статистики таблицы
 */
export async function handleStats(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const tableName = args[0];

  if (!tableName) {
    return ctx.reply('❓ Укажите имя таблицы: `/stats fact_sales_daily`', { parse_mode: 'Markdown' });
  }

  await ctx.reply(`⏳ Загружаю статистики таблицы \`${tableName}\`...`, { parse_mode: 'Markdown' });

  try {
    // Проверяем стоимость запроса
    const estimate = await metadataService.estimateQueryCost(tableName);

    if (estimate.warning) {
      await ctx.replyWithMarkdown(`⚠️ *Внимание:* ${estimate.warning}\n\n${estimate.recommendation}`);
    }

    const [tableStats, columnStats] = await Promise.all([
      metadataService.getTableStats(tableName),
      metadataService.getColumnStats(tableName),
    ]);

    let message = `📊 *Статистики таблицы:* \`${tableName}\`\n\n`;

    // Общие статистики
    const stats = tableStats?.[0];
    if (stats) {
      message += `*Общие:*\n`;
      message += `• Строк: ${stats.row_count?.toLocaleString() || 'н/д'}\n`;
      message += `• Размер данных: ${stats.table_size || 'н/д'}\n`;
      message += `• Размер индексов: ${stats.index_size || 'н/д'}\n`;
      message += `• Общий размер: ${stats.total_size || 'н/д'}\n\n`;
    }

    // Статистики колонок
    if (columnStats?.length > 0) {
      message += `*По колонкам:*\n`;
      for (const col of columnStats.slice(0, 10)) {
        message += `\n*${col.column_name}* (_${col.data_type}_):\n`;
        message += `  • Distinct: ${col.distinct_count?.toLocaleString() || 'н/д'}`;
        if (col.null_rate !== undefined) {
          message += ` | NULL: ${col.null_rate}%`;
        }
        message += '\n';
        if (col.min !== undefined && col.max !== undefined) {
          message += `  • Range: ${col.min} — ${col.max}\n`;
        }
        if (col.avg !== undefined) {
          message += `  • Avg: ${col.avg}`;
          if (col.stddev) message += ` (σ ${col.stddev})`;
          message += '\n';
        }
      }
    }

    await ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error(`Error in handleStats(${tableName}):`, error);
    await ctx.reply(`❌ Ошибка при загрузке статистик.`);
  }
}

/**
 * /sample <таблица> - Примеры строк
 */
export async function handleSample(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const tableName = args[0];
  const limit = parseInt(args[1]) || 5;

  if (!tableName) {
    return ctx.reply('❓ Укажите имя таблицы: `/sample dim_products 5`', { parse_mode: 'Markdown' });
  }

  await ctx.reply(`⏳ Загружаю примеры из \`${tableName}\`...`, { parse_mode: 'Markdown' });

  try {
    const result = await metadataService.getSampleRows(tableName, { limit });

    if (!result.rows?.length) {
      return ctx.reply('📭 Таблица пуста или недоступна.');
    }

    let message = `📝 *Примеры строк из* \`${tableName}\`:\n\n`;

    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      message += `*#${i + 1}*\n`;
      message += '```\n';
      message += JSON.stringify(row, null, 2).slice(0, 500);
      message += '\n```\n\n';
    }

    if (result.hasMore) {
      message += `_Показано ${result.count} из большего количества_`;
    }

    await ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error(`Error in handleSample(${tableName}):`, error);
    await ctx.reply(`❌ Ошибка при загрузке примеров.`);
  }
}

/**
 * ================================================
 * CALLBACK HANDLERS
 * ================================================
 */

/**
 * Обработчик callback запросов
 */
export async function handleCallback(ctx) {
  const callbackData = ctx.callbackQuery.data;

  // Отвечаем на callback чтобы убрать "часики"
  await ctx.answerCbQuery();

  // Парсим callback data
  const [action, ...params] = callbackData.split('_');

  switch (action) {
    case 'category':
      await handleCategoryReport(ctx, params[0]);
      break;

    case 'top10':
      await showTop10(ctx, params[0]);
      break;

    case 'top20':
      await showTop20(ctx, params[0]);
      break;

    case 'drill':
      await showDrillDown(ctx, params[0]);
      break;

    case 'refresh':
      if (params[0] === 'daily') {
        await handleDaily(ctx);
      }
      break;

    case 'back':
      if (params[0] === 'to' && params[1] === 'daily') {
        await handleDaily(ctx);
      }
      break;

    case 'stats':
      ctx.message = { text: `/stats ${params[0]}` };
      await handleStats(ctx);
      break;

    case 'sample':
      ctx.message = { text: `/sample ${params[0]}` };
      await handleSample(ctx);
      break;

    case 'show':
      if (params[0] === 'tables') {
        ctx.message = { text: '/tables' };
        await handleTables(ctx);
      }
      break;

    default:
      await ctx.reply('❓ Неизвестное действие');
  }
}

/**
 * ================================================
 * KEYBOARDS
 * ================================================
 */

function getMainKeyboard() {
  return Markup.keyboard([
    ['📊 Дайджест', '👤 Лицо', '💇 Волосы'],
    ['🧴 Тело', '💄 Макияж', '❓ Помощь'],
  ]).resize();
}

function getDrillKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('👤 Лицо', 'drill_face'),
      Markup.button.callback('💇 Волосы', 'drill_hair'),
    ],
    [
      Markup.button.callback('🧴 Тело', 'drill_body'),
      Markup.button.callback('💄 Макияж', 'drill_makeup'),
    ],
  ]);
}

/**
 * ================================================
 * УТИЛИТЫ
 * ================================================
 */

/**
 * Разбить длинное сообщение на части (лимит Telegram 4096 символов)
 */
function splitMessage(text, maxLength = 4000) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let current = '';

  const lines = text.split('\n');

  for (const line of lines) {
    if (current.length + line.length + 1 > maxLength) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

/**
 * Обработчик текстовых сообщений (кнопки клавиатуры)
 */
export async function handleText(ctx) {
  const text = ctx.message.text;

  switch (text) {
    case '📊 Дайджест':
      return handleDaily(ctx);
    case '👤 Лицо':
      return handleCategoryReport(ctx, 'face');
    case '💇 Волосы':
      return handleCategoryReport(ctx, 'hair');
    case '🧴 Тело':
      return handleCategoryReport(ctx, 'body');
    case '💄 Макияж':
      return handleCategoryReport(ctx, 'makeup');
    case '❓ Помощь':
      return handleHelp(ctx);
    default:
      // Если не распознали — ничего не делаем
      break;
  }
}

export default {
  handleStart,
  handleHelp,
  handleDaily,
  handleCategoryReport,
  handleDrill,
  handleTop10,
  handleTop20,
  handleTables,
  handleSchema,
  handleStats,
  handleSample,
  handleCallback,
  handleText,
};
