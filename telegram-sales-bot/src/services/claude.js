/**
 * Сервис для работы с Claude API
 * Генерация аналитических отчётов
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `Ты — аналитик маркетплейса косметики. Пиши кратко, по делу, управленческим языком на русском.

Правила:
- НЕ придумывай числа. Используй ТОЛЬКО входные данные.
- Используй эмодзи для визуального выделения: ✅ ⚠️ 📈 📉 🎯 💰 🔥 ⭐
- Числа округляй до 1 знака (%, млн/тыс)
- Выручку показывай в тысячах (120.5K ₽) или миллионах (1.2M ₽)
- Без длинных вступлений — сразу к делу
- Формат для Telegram (поддержка Markdown)`;

/**
 * Генерация ежедневного дайджеста
 */
export async function generateDailyDigest(data) {
  // Если нет Claude API — используем красивый fallback
  if (!anthropic) {
    return generateDailyDigestFallback(data);
  }

  const { today, mtd, topProducts } = data;

  // Получаем дату из данных (последняя доступная дата в базе)
  const reportDate = mtd?.[0]?.report_date || today?.[0]?.report_date;

  // Форматируем дату для заголовка
  const formatDate = (dateStr) => {
    if (!dateStr) return 'нет данных';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formattedDate = formatDate(reportDate);
  const monthStart = reportDate ? `01.${reportDate.split('-')[1]}` : '01.12';
  const monthEnd = reportDate ? `${reportDate.split('-')[2]}.${reportDate.split('-')[1]}` : formattedDate;

  // Заголовок формируем В КОДЕ, не даём Claude его менять
  const header = `📊 *Дайджест продаж ${formattedDate}*\nMTD: ${monthStart} - ${monthEnd}\n\n---\n\n`;

  const prompt = `Продолжи Telegram-сообщение с дайджестом продаж. Заголовок УЖЕ ЕСТЬ, НЕ ДОБАВЛЯЙ заголовок с датой!

<data>
${JSON.stringify({ today, mtd, topProducts }, null, 2)}
</data>

<formatting>
Структура (БЕЗ заголовка, он уже добавлен):
По каждой категории (Лицо, Волосы, Тело, Макияж):
- Сегодня: План/Факт (выполнение %, отклонение)
- MTD: План/Факт (выполнение %, MoM %)
- 🔥 Топ-3 товара
- ✅ Что классно (1 пункт)
- ⚠️ На что обратить внимание (1 пункт)

В конце: "🎯 Действия" (3-5 пунктов)

Используй эмодзи: 👤 Лицо, 💇 Волосы, 🧴 Тело, 💄 Макияж
</formatting>`;

  const claudeResponse = await callClaude(prompt);
  return header + claudeResponse;
}

/**
 * Генерация отчёта по категории
 */
export async function generateCategoryReport(categoryData, categoryInfo) {
  // Если нет Claude API — используем красивый fallback
  if (!anthropic) {
    return generateCategoryReportFallback(categoryData, categoryInfo);
  }

  const { categoryMtd, growthCandidates, priceStability, profitTop } = categoryData;

  // Группируем кандидаты на рост по категориям
  const quickWins = growthCandidates.filter(p => p.growth_category === 'quick_win');
  const needsBoost = growthCandidates.filter(p => p.growth_category === 'needs_boost');
  const risky = growthCandidates.filter(p => p.growth_category === 'risky');

  const prompt = `Сформируй детальное Telegram-сообщение для категории "${categoryInfo.name}" с рекомендациями.

<data>
План/Факт MTD:
${JSON.stringify(categoryMtd, null, 2)}

Топ-20 кандидатов на рост:
- "Быстрые победы" (низкий DRR, растут): ${JSON.stringify(quickWins.slice(0, 7), null, 2)}
- "Нужно разогнать" (хорошая маржа, слабый рост): ${JSON.stringify(needsBoost.slice(0, 7), null, 2)}
- "Рискованные" (высокий DRR, падают): ${JSON.stringify(risky.slice(0, 5), null, 2)}

Товары со стабильной ценой:
${JSON.stringify(priceStability, null, 2)}

Топ по прибыльности:
${JSON.stringify(profitTop, null, 2)}
</data>

<formatting>
Структура:
1. Заголовок: ${categoryInfo.emoji} ${categoryInfo.name} — фокус: рост и действия
2. Краткий план/факт (MTD + MoM)
3. Топ-20 "рост-потенциал":
   - 🔥 Быстрые победы (низкий DRR, растет) — список с Revenue и MoM%
   - 🚀 Нужно разогнать (хорошая маржа, слабый трафик)
   - ⚠️ Рискованные (высокий DRR, падает)
4. 🎯 Задания (конкретные):
   - Проверить наличие/остатки
   - Проверить цену/скидку
   - Перераспределить бюджет
   - Проверить карточки
5. 💰 Где прибыль максимальна (топ-5)
6. 📊 Цена наиболее равномерная (топ-5 стабильных)
</formatting>`;

  return await callClaude(prompt);
}

/**
 * Генерация отчёта топ-10 товаров
 */
export async function generateTop10Report(products, categoryInfo, momData) {
  // Если нет Claude API — используем красивый fallback
  if (!anthropic) {
    return generateTop10Fallback(products, categoryInfo);
  }

  const prompt = `Сформируй Telegram-сообщение с топ-10 товаров категории "${categoryInfo.name}".

<data>
Топ-10 товаров по выручке MTD:
${JSON.stringify(products, null, 2)}

Сравнение с прошлым месяцем (MoM):
${JSON.stringify(momData, null, 2)}
</data>

<formatting>
Структура:
1. Заголовок: ${categoryInfo.emoji} Топ-10 ${categoryInfo.name} по выручке
2. Таблица товаров:
   - # | SKU | Название (короткое)
   - Revenue MTD | Units
   - MoM % | DRR %
3. 📈 Кто тянет категорию вверх (2-3 товара с лучшим ростом)
4. 📉 Кто просел и требует внимания (2-3 товара с падением)
5. 💡 Краткие рекомендации (2-3 пункта)
</formatting>`;

  return await callClaude(prompt);
}

/**
 * Генерация анализа топ-20 с потенциалом роста
 */
export async function generateTop20GrowthReport(growthCandidates, categoryInfo) {
  // Если нет Claude API — используем красивый fallback
  if (!anthropic) {
    return generateTop20GrowthFallback(growthCandidates, categoryInfo);
  }

  const quickWins = growthCandidates.filter(p => p.growth_category === 'quick_win');
  const needsBoost = growthCandidates.filter(p => p.growth_category === 'needs_boost');
  const risky = growthCandidates.filter(p => p.growth_category === 'risky');
  const stable = growthCandidates.filter(p => p.growth_category === 'stable');

  const prompt = `Сформируй Telegram-сообщение с анализом топ-20 товаров с потенциалом роста для категории "${categoryInfo.name}".

<data>
🔥 Быстрые победы (${quickWins.length} шт):
${JSON.stringify(quickWins, null, 2)}

🚀 Нужно разогнать (${needsBoost.length} шт):
${JSON.stringify(needsBoost, null, 2)}

⚠️ Рискованные (${risky.length} шт):
${JSON.stringify(risky, null, 2)}

📊 Стабильные (${stable.length} шт):
${JSON.stringify(stable.slice(0, 5), null, 2)}
</data>

<formatting>
Структура:
1. Заголовок: ${categoryInfo.emoji} ${categoryInfo.name} — Топ-20 потенциал роста
2. Общая статистика: X быстрых побед, Y нужно разогнать, Z рискованных
3. 🔥 Быстрые победы — детальный список:
   - SKU: название
   - Revenue MTD | MoM% | DRR% | Маржа%
   - Growth Score
4. 🚀 Нужно разогнать — что делать с каждым
5. ⚠️ Рискованные — где сократить расходы
6. 🎯 План действий:
   - Конкретные шаги для топ-3 быстрых побед
   - Что проверить для "нужно разогнать"
   - Как снизить риски
</formatting>`;

  return await callClaude(prompt);
}

/**
 * Генерация отчёта по подкатегориям
 */
export async function generateDrillDownReport(subcategories, categoryInfo) {
  // Если нет Claude API — используем красивый fallback
  if (!anthropic) {
    return generateDrillDownFallback(subcategories, categoryInfo);
  }

  const prompt = `Сформируй Telegram-сообщение с разбивкой по подкатегориям для "${categoryInfo.name}".

<data>
Подкатегории MTD:
${JSON.stringify(subcategories, null, 2)}
</data>

<formatting>
Структура:
1. Заголовок: ${categoryInfo.emoji} ${categoryInfo.name} — подкатегории
2. Таблица подкатегорий:
   - Название
   - Revenue MTD | Выполнение плана %
   - MoM %
3. ✅ Лидеры (перевыполняют план)
4. ⚠️ Отстающие (недовыполняют план)
5. 💡 Рекомендации (1-2 пункта)
</formatting>`;

  return await callClaude(prompt);
}

/**
 * Вызов Claude API
 */
async function callClaude(userPrompt) {
  // Если API ключ не настроен — возвращаем fallback
  if (!anthropic) {
    console.warn('⚠️ Claude API not configured. Using fallback response.');
    return generateFallbackResponse(userPrompt);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    return generateFallbackResponse(userPrompt);
  }
}

/**
 * Форматирование числа в K/M формат
 */
function formatMoney(num) {
  if (!num || num === 0) return '0 ₽';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M ₽`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K ₽`;
  return `${num.toFixed(0)} ₽`;
}

/**
 * Форматирование даты
 */
function formatDateRu(date) {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Fallback ответ когда Claude недоступен — с реальными данными
 */
function generateFallbackResponse(prompt, data) {
  return `⚠️ Claude API не настроен.\n\nДобавьте ANTHROPIC_API_KEY в файл .env для генерации отчётов.`;
}

/**
 * Генерация дайджеста без Claude — с реальными данными
 */
export function generateDailyDigestFallback(data) {
  const { today, mtd, topProducts } = data;
  // Берём дату из данных, а не текущую дату
  const dataDate = mtd?.[0]?.report_date || today?.[0]?.report_date || new Date().toISOString().split('T')[0];
  const date = formatDateRu(dataDate);

  let report = `📊 *Дайджест на ${date}*\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  let totalRevenue = 0;
  let totalOrders = 0;

  const categoryEmojis = {
    face: '👤',
    hair: '💇',
    body: '🧴',
    makeup: '💄'
  };

  const categoryNames = {
    face: 'ЛИЦО',
    hair: 'ВОЛОСЫ',
    body: 'ТЕЛО',
    makeup: 'МАКИЯЖ'
  };

  for (const cat of mtd) {
    const emoji = categoryEmojis[cat.category_key] || '📦';
    const name = categoryNames[cat.category_key] || cat.category_name;
    const revenue = cat.fact_revenue_mtd || cat.revenue || 0;
    const orders = cat.fact_units_mtd || cat.orders_mtd || cat.orders || 0;
    const drr = cat.drr_pct || 0;
    const skuCount = cat.products_count || 0;

    totalRevenue += revenue;
    totalOrders += orders;

    report += `${emoji} *${name}*\n`;
    report += `├ Выручка: ${formatMoney(revenue)}\n`;
    report += `├ Заказы: ${orders.toLocaleString('ru-RU')} шт\n`;
    report += `├ DRR: ${drr.toFixed(1)}%\n`;
    report += `└ SKU: ${skuCount}\n\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━\n`;
  report += `📈 *Итого MTD:* ${formatMoney(totalRevenue)}\n`;
  report += `📦 *Заказов:* ${totalOrders.toLocaleString('ru-RU')} шт`;

  return report;
}

/**
 * Генерация отчёта по категории без Claude
 */
export function generateCategoryReportFallback(categoryData, categoryInfo) {
  const { categoryMtd } = categoryData;

  let report = `${categoryInfo.emoji} *${categoryInfo.name.toUpperCase()}*\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (categoryMtd) {
    const revenue = categoryMtd.fact_revenue_mtd || categoryMtd.revenue || 0;
    const orders = categoryMtd.fact_units_mtd || categoryMtd.orders || 0;
    const drr = categoryMtd.drr_pct || 0;
    const ctr = categoryMtd.ctr_pct || 0;
    const cr = categoryMtd.cr_pct || 0;

    report += `*Показатели MTD:*\n`;
    report += `├ Выручка: ${formatMoney(revenue)}\n`;
    report += `├ Заказы: ${orders.toLocaleString('ru-RU')} шт\n`;
    report += `├ DRR: ${drr.toFixed(1)}%\n`;
    report += `├ CTR: ${ctr.toFixed(2)}%\n`;
    report += `└ CR: ${cr.toFixed(2)}%\n`;
  } else {
    report += `_Данные не найдены_\n`;
  }

  return report;
}

/**
 * Генерация топ-10 без Claude
 */
export function generateTop10Fallback(products, categoryInfo) {
  let report = `🏆 *Топ-10 ${categoryInfo.name}*\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (!products || products.length === 0) {
    return report + `_Нет данных_`;
  }

  products.slice(0, 10).forEach((p, i) => {
    const name = p.title ? p.title.slice(0, 25) : `SKU ${p.sku}`;
    report += `*${i + 1}.* ${name}\n`;
    report += `   ${formatMoney(p.revenue_mtd)} | ${p.units_mtd || 0} шт | DRR ${(p.drr_pct || 0).toFixed(1)}%\n\n`;
  });

  return report;
}

/**
 * Генерация топ-20 роста без Claude
 */
export function generateTop20GrowthFallback(candidates, categoryInfo) {
  let report = `📈 *Топ-20 потенциал роста — ${categoryInfo.name}*\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (!candidates || candidates.length === 0) {
    return report + `_Нет данных_`;
  }

  const quickWins = candidates.filter(p => p.growth_category === 'quick_win');
  const needsBoost = candidates.filter(p => p.growth_category === 'needs_boost');

  if (quickWins.length > 0) {
    report += `🔥 *Быстрые победы:*\n`;
    quickWins.slice(0, 5).forEach(p => {
      const name = p.title ? p.title.slice(0, 20) : `SKU ${p.sku}`;
      report += `• ${name} — ${formatMoney(p.revenue_mtd)}\n`;
    });
    report += `\n`;
  }

  if (needsBoost.length > 0) {
    report += `🚀 *Нужно разогнать:*\n`;
    needsBoost.slice(0, 5).forEach(p => {
      const name = p.title ? p.title.slice(0, 20) : `SKU ${p.sku}`;
      report += `• ${name} — ${formatMoney(p.revenue_mtd)}\n`;
    });
  }

  return report;
}

/**
 * Генерация подкатегорий без Claude
 */
export function generateDrillDownFallback(subcategories, categoryInfo) {
  let report = `📂 *${categoryInfo.name} — подкатегории*\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (!subcategories || subcategories.length === 0) {
    return report + `_Нет данных_`;
  }

  subcategories.slice(0, 10).forEach((sub, i) => {
    report += `*${i + 1}.* ${sub.subcategory}\n`;
    report += `   ${formatMoney(sub.fact_revenue_mtd)} | ${sub.fact_units_mtd || 0} шт\n\n`;
  });

  return report;
}

export default {
  generateDailyDigest,
  generateCategoryReport,
  generateTop10Report,
  generateTop20GrowthReport,
  generateDrillDownReport,
};
