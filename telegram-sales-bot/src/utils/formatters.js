/**
 * Утилиты для форматирования данных
 */

/**
 * Форматирование числа как валюты (рубли)
 */
export function formatCurrency(value, compact = true) {
  if (value === null || value === undefined) return 'н/д';

  const num = Number(value);
  if (isNaN(num)) return 'н/д';

  if (compact) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M ₽`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K ₽`;
    }
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Форматирование процентов
 */
export function formatPercent(value, showSign = false) {
  if (value === null || value === undefined) return 'н/д';

  const num = Number(value);
  if (isNaN(num)) return 'н/д';

  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

/**
 * Форматирование числа с разделителями
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return 'н/д';

  const num = Number(value);
  if (isNaN(num)) return 'н/д';

  return new Intl.NumberFormat('ru-RU').format(num);
}

/**
 * Получить индикатор тренда (эмодзи)
 */
export function getTrendIndicator(value, thresholds = { good: 0, warning: -5 }) {
  if (value === null || value === undefined) return '➖';

  const num = Number(value);
  if (isNaN(num)) return '➖';

  if (num >= thresholds.good) return '📈';
  if (num >= thresholds.warning) return '➖';
  return '📉';
}

/**
 * Получить индикатор выполнения плана
 */
export function getCompletionIndicator(percent) {
  if (percent === null || percent === undefined) return '⚪';

  const num = Number(percent);
  if (isNaN(num)) return '⚪';

  if (num >= 100) return '✅';
  if (num >= 90) return '🟡';
  if (num >= 75) return '🟠';
  return '🔴';
}

/**
 * Форматирование даты
 */
export function formatDate(date) {
  if (!date) return 'н/д';

  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Форматирование короткой даты
 */
export function formatShortDate(date) {
  if (!date) return 'н/д';

  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Получить текущий период MTD
 */
export function getMTDPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    start: formatShortDate(start),
    end: formatShortDate(now),
    days: now.getDate(),
  };
}

/**
 * Форматирование строки отклонения
 */
export function formatDeviation(value) {
  if (value === null || value === undefined) return '';

  const num = Number(value);
  if (isNaN(num)) return '';

  const sign = num >= 0 ? '+' : '';
  return `${sign}${formatCurrency(num)}`;
}

/**
 * Укорачивание названия товара
 */
export function truncateTitle(title, maxLength = 30) {
  if (!title) return '';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

/**
 * Форматирование строки плана/факта
 */
export function formatPlanFact(plan, fact, showPercent = true) {
  const planStr = formatCurrency(plan);
  const factStr = formatCurrency(fact);

  if (!showPercent) {
    return `${factStr} / ${planStr}`;
  }

  const percent = plan > 0 ? (fact / plan * 100).toFixed(1) : 0;
  const indicator = getCompletionIndicator(percent);

  return `${indicator} ${factStr} / ${planStr} (${percent}%)`;
}

/**
 * Форматирование DRR
 */
export function formatDRR(drr) {
  if (drr === null || drr === undefined) return 'н/д';

  const num = Number(drr);
  if (isNaN(num)) return 'н/д';

  let indicator = '✅';
  if (num > 20) indicator = '🔴';
  else if (num > 15) indicator = '🟠';
  else if (num > 10) indicator = '🟡';

  return `${indicator} ${num.toFixed(1)}%`;
}

/**
 * Генерация прогресс-бара
 */
export function progressBar(percent, length = 10) {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;

  return '▓'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
}

/**
 * Экранирование Markdown для Telegram
 */
export function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Форматирование таблицы для Telegram (моноширинный текст)
 */
export function formatTable(headers, rows) {
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map(r => String(r[i] || '').length));
    return Math.max(h.length, maxRowWidth);
  });

  const formatRow = (cells) => {
    return cells.map((cell, i) => String(cell || '').padEnd(colWidths[i])).join(' │ ');
  };

  const headerLine = formatRow(headers);
  const separator = colWidths.map(w => '─'.repeat(w)).join('─┼─');
  const dataLines = rows.map(formatRow);

  return ['```', headerLine, separator, ...dataLines, '```'].join('\n');
}

export default {
  formatCurrency,
  formatPercent,
  formatNumber,
  getTrendIndicator,
  getCompletionIndicator,
  formatDate,
  formatShortDate,
  getMTDPeriod,
  formatDeviation,
  truncateTitle,
  formatPlanFact,
  formatDRR,
  progressBar,
  escapeMarkdown,
  formatTable,
};
