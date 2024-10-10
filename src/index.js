const { Telegraf } = require('telegraf');
const welcomeController = require('./controllers/welcomeController');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', welcomeController.sendWelcomeMessage);
bot.action(/.*/, welcomeController.handleCallback);
bot.on('text', welcomeController.handleText);
bot.on('contact', welcomeController.handleContact);

bot.launch().then(() => {
  console.log('Бот запущен');
}).catch((err) => {
  console.error('Ошибка при запуске бота:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));