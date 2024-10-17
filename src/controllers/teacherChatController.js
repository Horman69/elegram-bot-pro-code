const { Markup } = require('telegraf');
const { logger } = require('../utils/logger');
const { sendMail } = require('../services/mailer');

let activeChats = new Map();

function startTeacherChat(ctx) {
    console.log('Вызвана функция startTeacherChat');
    const userId = ctx.from.id;
    console.log('ID пользователя:', userId);
    
    if (activeChats.has(userId)) {
        console.log('У пользователя уже есть активный чат');
        return ctx.reply('У вас уже есть активный чат с преподавателем. Чтобы завершить его, используйте команду /endchat');
    }

    activeChats.set(userId, { messages: [] });
    console.log('Создан новый чат для пользователя:', userId);
    console.log('Активные чаты после создания:', activeChats);
    
    ctx.reply('Чат с преподавателем начат. Задайте свой вопрос, и преподаватель ответит вам в ближайшее время. Чтобы завершить чат, используйте команду /endchat', 
        Markup.keyboard([
            ['/endchat']
        ]).resize()
    );
    
    // Добавьте лог для отладки
    console.log(`Начат чат с преподавателем для пользователя ${userId}`);
}

function endTeacherChat(ctx) {
    const userId = ctx.from.id;
    if (!activeChats.has(userId)) {
        return ctx.reply('У вас нет активного чата с преподавателем.');
    }

    const chatHistory = activeChats.get(userId).messages;
    activeChats.delete(userId);

    // Отправляем историю чата на почту администратора
    sendChatHistoryToAdmin(ctx.from, chatHistory);

    ctx.reply('Чат с преподавателем завершен. Спасибо за ваши вопросы!', Markup.removeKeyboard());
}

function handleChatMessage(ctx) {
    console.log('Вызвана функция handleChatMessage');
    const userId = ctx.from.id;
    console.log('ID пользователя:', userId);
    console.log('Активные чаты:', activeChats);
    
    if (!activeChats.has(userId)) {
        console.log('Активный чат не найден для пользователя:', userId);
        return ctx.reply('У вас нет активного чата с преподавателем. Чтобы начать чат, используйте команду /teacherchat');
    }

    const chat = activeChats.get(userId);
    chat.messages.push({
        from: 'user',
        text: ctx.message.text,
        time: new Date().toISOString()
    });

    console.log('Сообщение добавлено в чат:', chat.messages);
    ctx.reply('Ваше сообщение получено. Преподаватель ответит вам в ближайшее время.');
    
    // Добавьте лог для отладки
    console.log(`Получено сообщение в чате с преподавателем от пользователя ${userId}: ${ctx.message.text}`);
    
    // Отправка уведомления администратору (опционально)
    sendChatMessageNotification(ctx.from, ctx.message.text);
}

function sendChatHistoryToAdmin(user, chatHistory) {
    const htmlContent = `
        <h2>История чата с преподавателем</h2>
        <p><strong>Пользователь:</strong> ${user.first_name} ${user.last_name || ''} (ID: ${user.id})</p>
        <ul>
            ${chatHistory.map(msg => `<li><strong>${msg.from}:</strong> ${msg.text} (${new Date(msg.time).toLocaleString()})</li>`).join('')}
        </ul>
    `;

    sendMail({
        subject: 'Новый чат с преподавателем',
        html: htmlContent
    });
}

function sendChatMessageNotification(user, message) {
    const htmlContent = `
        <h2>Новое сообщение в чате с преподавателем</h2>
        <p><strong>Пользователь:</strong> ${user.first_name} ${user.last_name || ''} (ID: ${user.id})</p>
        <p><strong>Сообщение:</strong> ${message}</p>
        <p><strong>Время:</strong> ${new Date().toLocaleString()}</p>
    `;

    sendMail({
        subject: 'Новое сообщение в чате с преподавателем',
        html: htmlContent
    });
}

module.exports = {
    startTeacherChat,
    endTeacherChat,
    handleChatMessage
};
