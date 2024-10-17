const nodemailer = require('nodemailer');
const { logger, logError } = require('../utils/logger');
require('dotenv').config();

// Настройка Nodemailer для отправки почты
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Отправка данных пользователя на почту
const sendMail = (data) => {
    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: data.subject || 'Новая заявка на пробное занятие',
        html: data.html || `
            <h2>Новая заявка на пробное занятие</h2>
            <p><strong>Имя:</strong> ${data.name}</p>
            <p><strong>Телефон:</strong> ${data.phone}</p>
            <p><strong>Курс:</strong> ${data.course}</p>
            <p><strong>Дата заявки:</strong> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logError(error, 'Ошибка отправки email');
        } else {
            logger.info(`Email отправлен: ${info.response}`);
        }
    });
};

module.exports = { sendMail };
