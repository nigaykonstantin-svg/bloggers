/**
 * Telegram Sales Bot
 * Аналитика продаж маркетплейса
 *
 * Категории: Лицо, Волосы, Тело, Макияж
 */

import 'dotenv/config';
import { Telegraf } from 'telegraf';
import cron from 'node-cron';

import commands from './handlers/commands.js';
import { CATEGORY_KEYS } from './services/supabase.js';

// Проверка обязательных переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не установлен в .env');
  console.log('📝 Создайте файл .env на основе .env.example');
  process.exit(1);
}

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Список разрешённых пользователей (опционально)
const ALLOWED_USERS = process.env.ALLOWED_USER_IDS
  ? process.env.ALLOWED_USER_IDS.split(',').map((id) => parseInt(id.trim()))
  : null;

/**
 * Middleware: Проверка доступа
 */
bot.use(async (ctx, next) => {
  // Если список пользователей задан — проверяем
  if (ALLOWED_USERS && ALLOWED_USERS.length > 0) {
    const userId = ctx.from?.id;
    if (!ALLOWED_USERS.includes(userId)) {
      console.log(`⛔ Доступ запрещён для user_id: ${userId}`);
      return ctx.reply('⛔ Доступ запрещён. Обратитесь к администратору.');
    }
  }
  return next();
});

/**
 * Middleware: Логирование
 */
bot.use(async (ctx, next) => {
  const start = Date.now();
  const userId = ctx.from?.id;
  const username = ctx.from?.username || ctx.from?.first_name;
  const text = ctx.message?.text || ctx.callbackQuery?.data || 'action';

  console.log(`📥 [${new Date().toISOString()}] ${username} (${userId}): ${text}`);

  await next();

  const duration = Date.now() - start;
  console.log(`📤 [${new Date().toISOString()}] Ответ за ${duration}ms`);
});

/**
 * Middleware: Обработка ошибок
 */
bot.catch((err, ctx) => {
  console.error(`❌ Ошибка для ${ctx.updateType}:`, err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

// ================================================
// КОМАНДЫ
// ================================================

// Основные
bot.start(commands.handleStart);
bot.help(commands.handleHelp);
bot.command('daily', commands.handleDaily);

// Категории
bot.command('face', (ctx) => commands.handleCategoryReport(ctx, 'face'));
bot.command('hair', (ctx) => commands.handleCategoryReport(ctx, 'hair'));
bot.command('body', (ctx) => commands.handleCategoryReport(ctx, 'body'));
bot.command('makeup', (ctx) => commands.handleCategoryReport(ctx, 'makeup'));

// Детализация
bot.command('drill', commands.handleDrill);
bot.command('top10', commands.handleTop10);
bot.command('top20', commands.handleTop20);

// Метаданные
bot.command('tables', commands.handleTables);
bot.command('schema', commands.handleSchema);
bot.command('stats', commands.handleStats);
bot.command('sample', commands.handleSample);

// Callback queries (инлайн кнопки)
bot.on('callback_query', commands.handleCallback);

// Текстовые сообщения (кнопки клавиатуры)
bot.on('text', commands.handleText);

// ================================================
// ЕЖЕДНЕВНАЯ РАССЫЛКА (CRON)
// ================================================

const DAILY_CRON = process.env.DAILY_CRON || '0 9 * * 1-5'; // По умолчанию: 9:00 пн-пт
const DAILY_CHAT_IDS = process.env.DAILY_CHAT_IDS
  ? process.env.DAILY_CHAT_IDS.split(',').map((id) => parseInt(id.trim()))
  : [];

if (DAILY_CHAT_IDS.length > 0) {
  cron.schedule(DAILY_CRON, async () => {
    console.log(`📅 [${new Date().toISOString()}] Запуск ежедневной рассылки...`);

    for (const chatId of DAILY_CHAT_IDS) {
      try {
        // Создаём фейковый контекст для отправки
        const fakeCtx = {
          reply: (text, extra) => bot.telegram.sendMessage(chatId, text, extra),
          replyWithMarkdown: (text, extra) =>
            bot.telegram.sendMessage(chatId, text, { ...extra, parse_mode: 'Markdown' }),
        };

        await commands.handleDaily(fakeCtx);
        console.log(`✅ Дайджест отправлен в чат ${chatId}`);
      } catch (error) {
        console.error(`❌ Ошибка отправки в чат ${chatId}:`, error);
      }
    }
  });

  console.log(`📅 Ежедневная рассылка настроена: ${DAILY_CRON}`);
  console.log(`   Чаты: ${DAILY_CHAT_IDS.join(', ')}`);
}

// ================================================
// ЗАПУСК БОТА
// ================================================

async function startBot() {
  console.log('🚀 Запуск Telegram Sales Bot...');
  console.log('');
  console.log('📊 Категории: Лицо, Волосы, Тело, Макияж');
  console.log('');

  // Проверяем конфигурацию
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('⚠️  Supabase не настроен — используются mock данные');
  } else {
    console.log('✅ Supabase подключен');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  Claude API не настроен — базовые отчёты');
  } else {
    console.log('✅ Claude API подключен');
  }

  if (ALLOWED_USERS) {
    console.log(`🔐 Доступ ограничен: ${ALLOWED_USERS.length} пользователей`);
  } else {
    console.log('🔓 Доступ открыт для всех');
  }

  console.log('');

  // Запуск в режиме polling (для разработки)
  // Для production используйте webhooks
  if (process.env.WEBHOOK_URL) {
    // Webhook mode
    const webhookUrl = process.env.WEBHOOK_URL;
    const port = parseInt(process.env.PORT) || 3000;

    await bot.telegram.setWebhook(webhookUrl);
    bot.startWebhook('/', null, port);

    console.log(`🌐 Webhook запущен на порту ${port}`);
    console.log(`   URL: ${webhookUrl}`);
  } else {
    // Polling mode
    await bot.launch();
    console.log('🤖 Бот запущен в режиме polling');
  }

  console.log('');
  console.log('💡 Команды:');
  console.log('   /daily  — Ежедневный дайджест');
  console.log('   /face   — Отчёт по категории Лицо');
  console.log('   /hair   — Отчёт по категории Волосы');
  console.log('   /body   — Отчёт по категории Тело');
  console.log('   /makeup — Отчёт по категории Макияж');
  console.log('   /help   — Все команды');
  console.log('');
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n👋 Остановка бота (SIGINT)...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n👋 Остановка бота (SIGTERM)...');
  bot.stop('SIGTERM');
});

// Запуск
startBot().catch((err) => {
  console.error('❌ Ошибка запуска бота:', err);
  process.exit(1);
});

export default bot;
