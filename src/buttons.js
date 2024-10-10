const { Markup } = require('telegraf');

// Функция для создания инлайн-кнопки "Связаться с нами"
const contactUsButton = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback('Связаться с нами', 'contact_us'),
    ]);
};

// Пример функции для создания другой инлайн-кнопки
const exampleInlineButton = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback('Пример кнопки', 'example_action'),
    ]);
};

module.exports = { contactUsButton, exampleInlineButton };
