const nodemailer = require('nodemailer');
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
const sendMail = (userData) => {
    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: 'Новый пользователь',
        text: JSON.stringify(userData, null, 2), // Преобразуем объект в JSON
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Ошибка отправки email:', error);
        } else {
            console.log('Email отправлен:', info.response);
        }
    });
};

module.exports = { sendMail };

// const nodemailer = require('nodemailer');
// require('dotenv').config();

// // Настройка Nodemailer для отправки почты
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.ADMIN_EMAIL,
//         pass: process.env.EMAIL_PASSWORD,
//     },
// });

// const sendMail = (userData) => {
//     const mailOptions = {
//         from: process.env.ADMIN_EMAIL,
//         to: process.env.ADMIN_EMAIL,
//         subject: 'Новый пользователь',
//         text: `Имя: ${userData.name}\nТелефон: ${userData.phone}`,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.log(error);
//         } else {
//             console.log('Email sent: ' + info.response);
//         }
//     });
// };

// module.exports = { sendMail };
