import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTables() {
  console.log('🔍 Проверяю подключение к Supabase...\n');

  // Список таблиц
  const tables = ['6mWB17jun_15dec', 'daily_sku_metrics', 'products', 'n25'];

  for (const table of tables) {
    console.log(`\n📊 Таблица: ${table}`);
    console.log('─'.repeat(50));

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(2);

      if (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`✅ Строк получено: ${data.length}`);
        console.log('Колонки:', Object.keys(data[0]).join(', '));
        console.log('\nПример данных:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('⚠️ Таблица пуста');
      }
    } catch (err) {
      console.log(`❌ Ошибка: ${err.message}`);
    }
  }
}

checkTables();
