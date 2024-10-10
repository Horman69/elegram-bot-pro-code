const { Markup } = require('telegraf');
const mailer = require('../services/mailer');
const path = require('path'); // Импортируем модуль path для работы с путями

let userData = {};

// Определяем курсы
const courses = [
    {
        title: 'Курс по JavaScript',
        description: 'Изучите основы JavaScript и создайте свои первые приложения.',
    },
    {
        title: 'Курс по Python',
        description: 'Научитесь программировать на Python с нуля и освоите основные библиотеки.',
    },
    {
        title: 'Курс по разработке игр в Unity',
        description: 'Создайте свои собственные игры с помощью Unity и C#.',
    }
];

// Отправляем приветственное сообщение и кнопки
module.exports.sendWelcomeMessage = (ctx) => {
    // Путь к изображению
    const imagePath = path.join(__dirname, '../assets/photo_with_.png');
    
    // Отправляем изображение
    ctx.replyWithPhoto({ source: imagePath })
    .then(() => {
        // Отправляем инлайн-кнопки без описания
        ctx.reply('Выберите опцию:', 
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('Связаться с нами', 'contact_us'),
                    ...courses.map((course, index) => Markup.button.callback(course.title, `course_${index}`)) // Кнопки для курсов
                ]
            ])
        );
    });
};

// Обработка нажатия кнопки
module.exports.handleCallback = (ctx) => {
    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'contact_us') {
        ctx.reply('Пожалуйста, напишите ваше имя.');
    } else if (callbackData.startsWith('course_')) {
        const courseIndex = parseInt(callbackData.split('_')[1], 10);
        const selectedCourse = courses[courseIndex];

        // Проверяем, что курс существует
        if (selectedCourse) {
            ctx.reply(`${selectedCourse.title}\n\n${selectedCourse.description}`);
        } else {
            ctx.reply('Курс не найден.');
        }
    }
};

// Обработка текстового сообщения
module.exports.handleText = (ctx) => {
    const userMessage = ctx.message.text;

    // Сбор имени
    if (!userData.name) {
        userData.name = userMessage;
        userData.telegramId = ctx.message.from.id;
        userData.username = ctx.message.from.username;
        userData.firstName = ctx.message.from.first_name;
        userData.lastName = ctx.message.from.last_name;

        // Добавляем кнопку для отправки номера телефона
        ctx.reply('Теперь введите ваш номер телефона или отправьте его через кнопку ниже.', 
            Markup.keyboard([
                [{ text: "Отправить номер телефона", request_contact: true }]
            ]).oneTime().resize());
    } 
    // Обработка номера телефона
    else if (!userData.phone) {
        const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;

        if (phoneRegex.test(userMessage)) {
            userData.phone = userMessage;
            sendFinalResponse(ctx);
        } else {
            ctx.reply('Пожалуйста, введите корректный номер телефона.');
        }
    }
};

// Обрабатываем отправку контакта (через кнопку)
module.exports.handleContact = (ctx) => {
    if (ctx.message.contact) {
        userData.phone = ctx.message.contact.phone_number;
        sendFinalResponse(ctx);
    }
};

// Функция для финальной обработки
const sendFinalResponse = (ctx) => {
    ctx.reply('Спасибо за ваши данные! Теперь можете перейти в нашу группу.', {
        reply_markup: {
            inline_keyboard: [[{ text: 'Перейти в группу', url: process.env.TELEGRAM_GROUP_LINK }]],
        },
    });

    // Отправляем данные на почту
    mailer.sendMail(userData);

    // Сбрасываем данные
    userData = {};
};



// const mailer = require('../services/mailer');

// let userData = {};

// module.exports = (ctx) => {
//     ctx.reply('Привет! Я помогу вам оставить свои данные. Пожалуйста, напишите ваше имя.');
// };

// module.exports.handleText = (ctx) => {
//     const userMessage = ctx.message.text;

//     if (!userData.name) {
//         userData.name = userMessage;
//         ctx.reply('Теперь введите свой номер телефона.');
//     } else if (!userData.phone) {
//         // Проверка на корректность ввода номера телефона
//         const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/; // Регулярное выражение для проверки номера

//         if (phoneRegex.test(userMessage)) {
//             userData.phone = userMessage;

//             // Добавление информации о пользователе из Telegram
//             const userInfo = {
//                 id: ctx.message.from.id,
//                 first_name: ctx.message.from.first_name,
//                 last_name: ctx.message.from.last_name || '',
//                 username: ctx.message.from.username || '',
//                 language_code: ctx.message.from.language_code,
//                 phone: userData.phone,
//                 name: userData.name,
//             };

//             ctx.reply('Спасибо! Мы отправим ваши данные. Теперь можете перейти в нашу группу.', {
//                 reply_markup: {
//                     inline_keyboard: [[{ text: 'Перейти в группу', url: process.env.TELEGRAM_GROUP_LINK }]],
//                 },
//             });

//             // Отправка данных на почту
//             mailer.sendMail(userInfo); // Передаем объект с данными пользователя

//             // Сброс данных после отправки
//             userData = {};
//         } else {
//             ctx.reply('Пожалуйста, введите корректный номер телефона. Например: +1234567890 или 123-456-7890.');
//         }
//     }
// };
// const mailer = require('../services/mailer');

// let userData = {};

// module.exports = (ctx) => {
//     ctx.reply('Привет! Я помогу вам оставить свои данные. Пожалуйста, напишите ваше имя.');
// };

// module.exports.handleText = (ctx) => {
//     const userMessage = ctx.message.text;

//     if (!userData.name) {
//         userData.name = userMessage;
//         ctx.reply('Теперь введите свой номер телефона.');
//     } else if (!userData.phone) {
//         // Проверка на корректность ввода номера телефона
//         const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/; // Регулярное выражение для проверки номера

//         if (phoneRegex.test(userMessage)) {
//             userData.phone = userMessage;
//             ctx.reply('Спасибо! Мы отправим ваши данные. Теперь можете перейти в нашу группу.', {
//                 reply_markup: {
//                     inline_keyboard: [[{ text: 'Перейти в группу', url: process.env.TELEGRAM_GROUP_LINK }]],
//                 },
//             });

//             // Отправка данных на почту
//             mailer.sendMail(userData); // Передаем все данные пользователя

//             // Сброс данных после отправки
//             userData = {};
//         } else {
//             ctx.reply('Пожалуйста, введите корректный номер телефона. Например: +1234567890 или 123-456-7890.');
//         }
//     }
// };
