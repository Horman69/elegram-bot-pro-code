const { Markup } = require('telegraf');
const path = require('path');
// Проверьте, что путь к файлу courses.js правильный
const { courses } = require('../data/courses');
const { handleUserData } = require('../services/userDataService');

module.exports = {
    sendWelcomeMessage: async (ctx) => {
        const imagePath = path.join(__dirname, '../assets/photo_with.png');
        await ctx.replyWithPhoto({ source: imagePath });
        await ctx.reply('Выберите опцию:', 
            Markup.inlineKeyboard([
                [Markup.button.callback('Связаться с нами', 'contact_us')],
                ...courses.map((course, index) => [Markup.button.callback(course.title, `course_${index}`)])
            ])
        );
    },

    handleCallback: async (ctx) => {
        const callbackData = ctx.callbackQuery.data;

        if (callbackData === 'contact_us') {
            await ctx.answerCbQuery();
            await ctx.reply('Пожалуйста, напишите ваше имя.');
        } else if (callbackData.startsWith('course_')) {
            const courseIndex = parseInt(callbackData.split('_')[1], 10);
            const selectedCourse = courses[courseIndex];

            if (selectedCourse) {
                await ctx.answerCbQuery();
                await ctx.reply(`${selectedCourse.title}\n\n${selectedCourse.description}`);
            } else {
                await ctx.answerCbQuery('Курс не найден.');
            }
        }
    },

    handleText: async (ctx) => {
        await handleUserData(ctx);
    },

    handleContact: async (ctx) => {
        await handleUserData(ctx, true);
    }
};
