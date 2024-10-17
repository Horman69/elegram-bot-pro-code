const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs').promises;
const { courses } = require('../data/courses');
const { sendMail } = require('../services/mailer');
const { logger } = require('../utils/logger');
const { logCourseView } = require('../services/statistics');
const teacherChatController = require('./teacherChatController');

/**
 * Проверяет валидность номера телефона.
 * @param {string} phoneNumber - Номер телефона для проверки.
 * @returns {string|boolean} - Очищенный номер телефона или false, если номер невалидный.
 */
function isValidPhoneNumber(phoneNumber) {
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    return /^\+?\d{10,15}$/.test(cleanedNumber) ? cleanedNumber : false;
}

async function sendWelcomeMessage(ctx) {
    const logoPath = path.join(__dirname, '../assets/pro_code_logo.png');
    
    try {
        await fs.access(logoPath);
        await ctx.replyWithPhoto(
            { source: logoPath },
            {
                caption: 'Добро пожаловать в Pro Code! Чем я могу вам помочь?',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🎓 Узнать о наших курсах', callback_data: 'show_courses' }],
                        [{ text: '🆓 Записаться на пробное занятие', callback_data: 'free_lesson' }],
                        [{ text: '❓ Часто задаваемые вопросы', callback_data: 'faq' }],
                        [{ text: '👨‍🏫 Чат с преподавателем', callback_data: 'teacher_chat' }]
                    ]
                }
            }
        );
    } catch (error) {
        logger.warn('Логотип не найден, отправляем меню без изображения');
        await ctx.reply(
            'Выберите действие:',
            Markup.inlineKeyboard([
                [Markup.button.callback('🎓 Узнать о наших курсах', 'show_courses')],
                [Markup.button.callback('🆓 Записаться на пробное занятие', 'free_lesson')],
                [Markup.button.callback('❓ Часто задаваемые вопросы', 'faq')]
            ])
        );
    }
}

async function handleCallback(ctx) {
    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'show_courses') {
        await showCourses(ctx);
    } else if (callbackData === 'free_lesson') {
        await showFreeLessonOptions(ctx);
    } else if (callbackData.startsWith('free_lesson_')) {
        const courseIndex = parseInt(callbackData.split('_')[2], 10);
        if (!isNaN(courseIndex) && courseIndex >= 0 && courseIndex < courses.length) {
            await handleFreeLessonRequest(ctx, courseIndex);
        } else {
            await ctx.reply('Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.');
            await sendWelcomeMessage(ctx);
        }
    } else if (callbackData.startsWith('course_')) {
        await handleCourseSelection(ctx, callbackData);
    } else if (callbackData === 'main_menu') {
        await sendWelcomeMessage(ctx);
    } else if (callbackData === 'faq') {
        await handleFAQ(ctx);
    } else if (callbackData === 'teacher_chat') {
        await ctx.answerCbQuery();
        return teacherChatController.startTeacherChat(ctx);
    }
    await ctx.answerCbQuery();
}

/**
 * Обрабатывает текстовые сообщения от пользователя.
 * @param {import('telegraf').Context} ctx - Контекст Telegraf.
 */
async function handleText(ctx) {
    if (ctx.session.awaitingName) {
        ctx.session.userName = ctx.message.text;
        ctx.session.awaitingName = false;
        ctx.session.awaitingPhone = true;
        await ctx.reply(
            `Приятно познакомиться, ${ctx.session.userName}! 👋\n\nТеперь, пожалуйста, поделитесь своим номером телефона, чтобы мы могли связаться с вами и обсудить детали пробного занятия. Вы можете ввести номер вручную или нажать кнопку "Отправить контакт" ниже.`,
            Markup.keyboard([
                [Markup.button.contactRequest('📱 Отправить контакт')]
            ]).resize()
        );
    } else if (ctx.session.awaitingPhone) {
        await handlePhoneInput(ctx);
    } else {
        await ctx.reply('Извините, я не понимаю эту команду. Пожалуйста, используйте меню для навигации.');
    }
}

/**
 * Обрабатывает контакт, отправленный пользователем.
 * @param {import('telegraf').Context} ctx - Контекст Telegraf.
 */
async function handleContact(ctx) {
    const contact = ctx.message.contact;
    if (ctx.session.awaitingName) {
        ctx.session.userName = contact.first_name;
        ctx.session.awaitingName = false;
        ctx.session.awaitingPhone = true;
        await handlePhoneNumber(ctx, contact.phone_number);
    } else if (ctx.session.awaitingPhone) {
        await handlePhoneNumber(ctx, contact.phone_number);
    } else {
        await ctx.reply('Извините, произошла ошибка. Пожалуйста, начните процесс записи заново.');
    }
}

async function sendHelpMessage(ctx) {
    await ctx.reply(
        'Привет! Вот список доступных команд:\n' +
        '/start - Начать взаимодействие с ботом\n' +
        '/help - Показать это сообщение помощи\n' +
        '/courses - Посмотреть список наших курсов\n' +
        '/trial - Записаться на пробное занятие\n\n' +
        'Также вы можете использовать кнопки в меню для навигации.'
    );
}

async function sendCoursesList(ctx) {
    await showCourses(ctx);
}

async function startTrialLesson(ctx) {
    await ctx.reply('Отлично! Давайте запишем вас на пробное занятие.');
    await showFreeLessonOptions(ctx);
}

async function handleFAQ(ctx) {
    const faqText = `
Часто задаваемые вопросы:

1. Для какого возраста подходят ваши курсы?
   Наши курсы подходят для детей от 5 до 16 лет.

2. Какова продолжительность курсов?
   Все наши курсы длятся 40 часов.

3. Как проходят занятия?
   Занятия проходят 2 раза в неделю по 2 часа.

4. Нужен ли ребенку собственный компьютер?
   Да, для занятий потребуется компьютер или ноутбук с доступом в интернет.

5. Как записаться на пробное занятие?
   Вы можете записаться на пробное занятие, нажав соответствующую кнопку в главном меню.

Если у вас остались вопросы, не стесняйтесь обращаться к нашим менеджерам!
    `;

    await ctx.reply(faqText, Markup.inlineKeyboard([
        [Markup.button.callback('« Назад в главное меню', 'main_menu')]
    ]));
}

async function showCourses(ctx) {
    const courseButtons = courses.map((course, index) => 
        [Markup.button.callback(`${course.emoji} ${course.title}`, `course_${index}`)]
    );

    courseButtons.push([Markup.button.callback('« Назад в главное меню', 'main_menu')]);

    const logoPath = path.join(__dirname, '../assets/pro_code_logo.png');
    
    try {
        await fs.access(logoPath);
        await ctx.replyWithPhoto(
            { source: logoPath },
            {
                caption: 'Выберите интересующий вас курс:',
                reply_markup: {
                    inline_keyboard: courseButtons
                }
            }
        );
    } catch (error) {
        logger.warn('Логотип не найден, отправляем список курсов без изображения');
        await ctx.reply(
            'Выберите интересующий вас курс:',
            Markup.inlineKeyboard(courseButtons)
        );
    }
}

async function showFreeLessonOptions(ctx) {
    const courseButtons = courses.map((course, index) => 
        [Markup.button.callback(`${course.emoji} ${course.title}`, `free_lesson_${index}`)]
    );

    // Добавляем кнопку "Назад в главное меню"
    courseButtons.push([Markup.button.callback('« Назад в главное меню', 'main_menu')]);

    await ctx.reply('Выберите курс для пробного занятия:', 
        Markup.inlineKeyboard(courseButtons)
    );
}

async function handleFreeLessonSelection(ctx, callbackData) {
    const courseTitle = callbackData.replace('free_lesson_', '');
    await ctx.reply(
        `Супер выбор! Курс "${courseTitle}" - отличное начало для твоего пути в IT. Давай познакомимся поближе. Как тебя зовут?`
    );
    ctx.session.awaitingName = true;
    ctx.session.selectedCourse = courseTitle;
}

async function handleCourseSelection(ctx, callbackData) {
    const courseIndex = parseInt(callbackData.split('_')[1], 10);
    const selectedCourse = courses[courseIndex];
    
    if (!selectedCourse) {
        await ctx.reply('Извините, произошла ошибка при выборе курса. Пожалуйста, попробуйте еще раз.');
        return await sendWelcomeMessage(ctx);
    }

    const detailsText = selectedCourse.details.join('\n');
    
    const message = `
${selectedCourse.emoji} *${selectedCourse.title}*
${selectedCourse.description}

*Чему научится ребенок:*
${detailsText}

📅 *Длительность:* ${selectedCourse.duration}
🕒 *Расписание:* ${selectedCourse.schedule}
🎚 *Уровень:* ${selectedCourse.level}
🛠 *Проекты:* ${selectedCourse.projects}
🧠 *Навыки:* ${selectedCourse.skills}

Готовы начать увлекательное путешествие в мир ${selectedCourse.title}?
    `;

    const keyboard = [
        [Markup.button.callback('🆓 Записаться на пробное занятие', `free_lesson_${courseIndex}`)],
        [Markup.button.callback('« Назад к курсам', 'show_courses')]
    ];

    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
}

async function sendTextMessage(ctx, message, courseIndex) {
    await ctx.replyWithMarkdown(message,
        Markup.inlineKeyboard([
            [Markup.button.callback('🆓 Записаться на пробное занятие', `free_lesson_${courseIndex}`)],
            [Markup.button.callback('« Назад к курсам', 'show_courses')],
            [Markup.button.callback('« Назад в главное меню', 'main_menu')]
        ])
    );
}

async function handleNameInput(ctx) {
    ctx.session.userName = ctx.message.text;
    ctx.session.awaitingName = false;
    ctx.session.awaitingPhone = true;
    await ctx.reply(
        `Приятно познакомиться, ${ctx.session.userName}! 👋\n\nТеперь, пожалуйста, поделитесь своим номером телефона, чтобы мы могли связаться с вами и обсудить детали пробного занятия. Вы можете ввести номер вручную или нажать кнопку "Отправить номер телефона" ниже.`,
        Markup.keyboard([
            [Markup.button.contactRequest('📱 Отправить номер телефона')]
        ]).resize()
    );
}

async function handlePhoneInput(ctx) {
    const phoneNumber = ctx.message.contact ? ctx.message.contact.phone_number : isValidPhoneNumber(ctx.message.text);
    if (phoneNumber) {
        await handlePhoneNumber(ctx, phoneNumber);
    } else {
        await ctx.reply(
            'Извините, но введенный номер телефона некорректен. Пожалуйста, введите номер в международном формате, например: +79001234567, или воспользуйтесь кнопкой "Отправить номер телефона".'
        );
    }
}

async function handlePhoneNumber(ctx, phoneNumber) {
    const userName = ctx.session.userName;
    const selectedCourse = ctx.session.selectedCourse;

    await ctx.reply(
        `🎉 Замечательно, ${userName}! Ваша заявка успешно принята.\n\n📚 Курс: "${selectedCourse}"\n📞 Номер телефона: ${phoneNumber}\n\nНаш менеджер свяжется с вами в ближайшее время, чтобы:\n• Ответить на все ваши вопросы\n• Подобрать удобное время для пробного занятия\n• Рассказать подробнее о курсе и нашими методами обучения\n\nМы с нетерпением ждем встречи с вами в Pro Code! Приготовьтесь к увлекательному путешествию в мир программирования! 🚀`,
        Markup.removeKeyboard()
    );

    sendMail({ name: userName, phone: phoneNumber, course: selectedCourse });

    // Очистка сессии
    ctx.session.awaitingName = false;
    ctx.session.awaitingPhone = false;
    ctx.session.userName = null;
    ctx.session.selectedCourse = null;

    // Возвращаем пользователя в главное меню
    await sendWelcomeMessage(ctx);
}

async function handleFreeLessonRequest(ctx, courseIndex = null) {
    await ctx.answerCbQuery();
    
    let courseName = "не выбран";
    if (courseIndex !== null && courses[courseIndex]) {
        const selectedCourse = courses[courseIndex];
        courseName = selectedCourse.title;
    }
    
    ctx.session.selectedCourse = courseName;
    ctx.session.awaitingName = true;

    await ctx.reply(
        `Отлично! Вы хотите записаться на пробное занятие${courseName !== "не выбран" ? ` по курсу "${courseName}"` : ''}. 😊\n\nДавайте познакомимся! Как вас зовут?`,
        Markup.keyboard([
            [Markup.button.contactRequest('📱 Отправить контакт')]
        ]).resize()
    );
}

async function cancelRegistration(ctx) {
    ctx.session.awaitingName = false;
    ctx.session.awaitingPhone = false;
    ctx.session.userName = null;
    ctx.session.selectedCourse = null;

    await ctx.reply('Запись на пробное занятие отменена. Если у вас появятся вопросы, мы всегда готовы помочь!', Markup.removeKeyboard());
    await sendWelcomeMessage(ctx);
}

function sendCourseDetails(ctx, courseIndex) {
    const course = courses[courseIndex];
    logCourseView(course.title); // Логируем просмотр курса
    // ... остальной код функции ...
}

module.exports = {
    sendWelcomeMessage,
    handleCallback,
    handleText,
    handleContact,
    sendHelpMessage,
    sendCoursesList,
    startTrialLesson,
    handleFAQ,
    handleFreeLessonRequest  // Добавьте эту строку
};

console.log("Я живой!")
