const { Telegraf, session } = require('telegraf');
const welcomeController = require('./controllers/welcomeController');
const { logger, logError } = require('./utils/logger');
const { incrementTotalUsers, logCommandUsage } = require('./services/statistics');
require('dotenv').config();
const teacherChatController = require('./controllers/teacherChatController');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Добавьте эти строки
bot.telegram.setMyCommands([
    { command: 'start', description: 'Начать заново' },
    { command: 'help', description: 'Получить помощь' },
    { command: 'courses', description: 'Список курсов' },
    { command: 'trial', description: 'Записаться на пробное занятие' },
    { command: 'teacherchat', description: 'Начать чат с преподавателем' },
    { command: 'endchat', description: 'Завершить чат с преподавателем' }
]);

// Инициализация сессии с настройками по умолчанию
bot.use(session());

bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
        incrementTotalUsers(); // Увеличиваем счетчик пользователей при первом взаимодействии
    }
    return next();
});

bot.command('start', (ctx) => {
    logCommandUsage('start');
    return welcomeController.sendWelcomeMessage(ctx);
});

bot.command('help', (ctx) => {
    logCommandUsage('help');
    return welcomeController.sendHelpMessage(ctx);
});

bot.command('courses', (ctx) => {
    logCommandUsage('courses');
    return welcomeController.sendCoursesList(ctx);
});

bot.command('trial', (ctx) => {
    logCommandUsage('trial');
    return welcomeController.startTrialLesson(ctx);
});

bot.command('teacherchat', (ctx) => {
    logCommandUsage('teacherchat');
    return teacherChatController.startTeacherChat(ctx);
});

bot.command('endchat', (ctx) => {
    logCommandUsage('endchat');
    return teacherChatController.endTeacherChat(ctx);
});

bot.action(/.*/, welcomeController.handleCallback);
bot.use((ctx, next) => {
    if (ctx.message && ctx.message.text) {
        return welcomeController.handleText(ctx);
    }
    if (ctx.message && ctx.message.contact) {
        return welcomeController.handleContact(ctx);
    }
    return next();
});

// Добавьте обработчик ошибок
bot.catch((error, ctx) => {
    console.error('Произошла ошибка:', error);
    ctx.reply('Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.');
});

let botInstance;

bot.launch().then(() => {
  logger.info('Бот запущен');
  botInstance = bot;
}).catch((err) => {
  logError(err, 'Ошибка при запуске бота');
});

process.once('SIGINT', () => {
  if (botInstance) {
    botInstance.stop('SIGINT');
  }
});
process.once('SIGTERM', () => {
  if (botInstance) {
    botInstance.stop('SIGTERM');
  }
});

// Обработчик контактов
bot.on('contact', welcomeController.handleContact);

// Добавьте новую команду для просмотра статистики (только для администратора)
bot.command('stats', (ctx) => {
    if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        const stats = require('./services/statistics').getStatistics();
        ctx.reply(`Статистика бота:\n
Всего пользователей: ${stats.totalUsers}
Использование команд: ${JSON.stringify(stats.commandUsage, null, 2)}
Просмотры курсов: ${JSON.stringify(stats.courseViews, null, 2)}`);
    } else {
        ctx.reply('У вас нет доступа к этой команде.');
    }
});

bot.on('text', (ctx) => {
    if (ctx.message.text.startsWith('/')) {
        // Если это команда, пропускаем
        return;
    }
    return teacherChatController.handleChatMessage(ctx);
});
