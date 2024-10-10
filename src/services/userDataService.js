const { Markup } = require('telegraf');
const mailer = require('./mailer');

let userData = {};

module.exports = {
  handleUserData: async (ctx, isContact = false) => {
    if (isContact && ctx.message.contact) {
      userData.phone = ctx.message.contact.phone_number;
      await sendFinalResponse(ctx);
    } else if (!userData.name) {
      userData.name = ctx.message.text;
      userData.telegramId = ctx.message.from.id;
      userData.username = ctx.message.from.username;
      userData.firstName = ctx.message.from.first_name;
      userData.lastName = ctx.message.from.last_name;

      await ctx.reply('Теперь введите ваш номер телефона или отправьте его через кнопку ниже.', 
        Markup.keyboard([
          [Markup.button.contactRequest('Отправить номер телефона')]
        ]).oneTime().resize()
      );
    } else if (!userData.phone) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;

      if (phoneRegex.test(ctx.message.text)) {
        userData.phone = ctx.message.text;
        await sendFinalResponse(ctx);
      } else {
        await ctx.reply('Пожалуйста, введите корректный номер телефона.');
      }
    }
  }
};

async function sendFinalResponse(ctx) {
  await ctx.reply('Спасибо за ваши данные! Теперь можете перейти в нашу группу.', 
    Markup.inlineKeyboard([
      [Markup.button.url('Перейти в группу', process.env.TELEGRAM_GROUP_LINK)]
    ])
  );

  await mailer.sendMail(userData);

  userData = {};
}