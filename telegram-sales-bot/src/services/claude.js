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
  const { today, mtd, topProducts } = data;

  const prompt = `Сформируй Telegram-сообщение с ежедневным дайджестом продаж.

<data>
Данные на сегодня (${today[0]?.report_date || 'текущая дата'}):
${JSON.stringify(today, null, 2)}

Данные MTD (с начала месяца):
${JSON.stringify(mtd, null, 2)}

Топ-3 товара по каждой категории:
${JSON.stringify(topProducts, null, 2)}
</data>

<formatting>
Структура сообщения:
1. Заголовок с датой и периодом MTD
2. По каждой категории (Лицо, Волосы, Тело, Макияж):
   - Сегодня: План/Факт (выполнение %, отклонение)
   - MTD: План/Факт (выполнение %, MoM %)
   - Топ-3 товара (краткий список)
   - ✅ Что идет классно (1-2 пункта)
   - ⚠️ На что обратить внимание (1-2 пункта)
3. "🎯 Действия на сегодня" (3-5 пунктов суммарно)

Используй эмодзи категорий: 👤 Лицо, 💇 Волосы, 🧴 Тело, 💄 Макияж
</formatting>`;

  return await callClaude(prompt);
}

/**
 * Генерация отчёта по категории
 */
export async function generateCategoryReport(categoryData, categoryInfo) {
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
 * Fallback ответ когда Claude недоступен
 */
function generateFallbackResponse(prompt) {
  // Простой парсинг данных из промпта для генерации базового ответа
  if (prompt.includes('ежедневным дайджестом')) {
    return `📊 *Ежедневный дайджест продаж*\n\n_Claude API не настроен. Отображаем сырые данные._\n\nДля полноценных отчётов настройте ANTHROPIC_API_KEY в .env`;
  }

  if (prompt.includes('детальное Telegram-сообщение')) {
    return `📋 *Отчёт по категории*\n\n_Claude API не настроен._\n\nДанные доступны, но для форматированных отчётов нужен API ключ.`;
  }

  if (prompt.includes('топ-10')) {
    return `🏆 *Топ-10 товаров*\n\n_Claude API не настроен._\n\nНастройте ANTHROPIC_API_KEY для детального анализа.`;
  }

  if (prompt.includes('потенциалом роста')) {
    return `📈 *Анализ потенциала роста*\n\n_Claude API не настроен._\n\nДля AI-анализа настройте ANTHROPIC_API_KEY.`;
  }

  if (prompt.includes('подкатегориям')) {
    return `📂 *Подкатегории*\n\n_Claude API не настроен._\n\nНастройте ANTHROPIC_API_KEY для форматированных отчётов.`;
  }

  return `⚠️ Claude API не настроен.\n\nДобавьте ANTHROPIC_API_KEY в файл .env для генерации отчётов.`;
}

export default {
  generateDailyDigest,
  generateCategoryReport,
  generateTop10Report,
  generateTop20GrowthReport,
  generateDrillDownReport,
};
