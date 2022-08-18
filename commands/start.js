const { Markup } = require("telegraf");

module.exports = async (ctx) => {
  try {
    if (!ctx.state.user.joinFromUsername && ctx.startPayload)
      await ctx.state.user.update({
        joinFromUsername: ctx.startPayload,
      });
    ctx
      .replyOrEdit(
        `<b>🤖 Maestro - обменный пункт

🔄 Покупка / Продажа Crypto
👨‍💻 Безопасные сделки 
💰 Любые объёмы 
📈 Выгодный курс</b> 

🚀 Быстро, удобно, выгодно.`,
        {
          parse_mode: "html",
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.callbackButton("↙️ Купить", "buy"),
              Markup.callbackButton("↗️ Продать", "sell"),
            ],

            [
                Markup.callbackButton("🗄 Мой кабинет", "my_cabinet"),
                Markup.callbackButton("Ввести реф.код", "ref"),
            ],

            [
              Markup.urlButton("🆘 Оператор", "https://t.me/maestro_operator"),
              Markup.urlButton("📢 Канал", "https://t.me/crypto_break_news")
            ],
            [Markup.urlButton("📝 Отзывы", "https://t.me/crypto_break_news")],
          ]),
        }
      )
      .catch((e) => e);
  } catch (err) {}
};
