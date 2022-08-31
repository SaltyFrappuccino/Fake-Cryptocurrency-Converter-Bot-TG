require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const start = require("./commands/start");
const { User } = require("./db");
const convertMoney = require("./helpers/convertMoney");
const getExchangeRate = require("./helpers/getExchangeRate");
const auth = require("./middlewares/auth");
const { Sequelize } = require("./models");
const scenes = require("./scenes");
const session = require("./session");


require("dotenv").config({
    path: require("path").join(__dirname, "../.env"),
});

const { DB_NAME, DB_USER, DB_PASS, DB_HOST } = process.env;

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegraf(process.env.BOT_TOKEN)

bot.use(session.middleware());
bot.use(auth);
bot.use(scenes.middleware());

bot.start(start);
bot.action("start", start);

// const Sequelize2 = require("sequelize");
//
// const sequelize = new Sequelize2(DB_NAME, DB_USER, DB_PASS, {
//     dialect: "sqlite",
//     host: DB_HOST,
//     define: {
//         timestamps: true
//     }
// });

// const User2 = require(`./models/user`)(sequelize)

bot.hears(/^\/us (.+)$/, async (ctx) => {
  try {
    const user = await User.findOne({
            where: {
                [Sequelize.or]: [
                    {
                        id: ctx.match[1],
                    },
                    {
                        username: ctx.match[1].replace("@", ""),
                    },
                ],
            },
        });

    if (!user) return ctx.reply("пользователь не найден").catch((e) => e);

    return ctx
      .reply(`Пользователь пришел от ${user.joinFromUsername}`)
      .catch((e) => e);
  } catch (err) {
    return ctx.reply("Ошибка").catch((e) => e);
  }
});

bot.hears("/start", async (ctx) => {
    try {
        const user = await User.findOne({
            where: {
                [Sequelize.or]: [
                    {
                        id: ctx.match[1],
                    },
                    {
                        username: ctx.match[1].replace("@", ""),
                    },
                ],
            },
        });
        User.update(
            {
                username: ctx.message.from.username.replace("@", ""),
            },
            {
                where: {
                    username: true
                }
            }
        )
    }
    catch (e) {
        console.log(e)
    }
})

bot.action("ref", (ctx) =>
    ctx.scene.enter("ref", {
        code: ctx.match[1],
    })
);

bot.action("buy", (ctx) =>

    ctx.replyOrEdit("Выберите валюту, которую Вы хотите купить:", {
        reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("Bitcoin", "buy_btc")],
            [Markup.callbackButton("USDT", "buy_usdt")],
            [Markup.callbackButton("Назад", "start")],
        ]),
    })
        .catch((e) => e)

  // ctx.answerCbQuery("❌ Временно не работает", true).catch((e) => e)
);

bot.hears('chatid', ctx => {
    console.log(ctx.chat.id)
})


bot.action("sell", (ctx) =>
  ctx
    .replyOrEdit("☑️ Выберите валюту которую Вы хотите продать:", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.callbackButton("Bitcoin", "sell_btc")],
        [Markup.callbackButton("USDT", "sell_usdt")],
        [Markup.callbackButton("Назад", "start")],
      ]),
    })
    .catch((e) => e)
);

bot.action(/^buy_(usdt|btc)$/, (ctx) =>
    ctx.scene.enter("buy", {
        code: ctx.match[1],
    })
);

bot.action(/^i_payed2_(.+)$/, async (ctx) => {
    const sellData = ctx.session[ctx.match[1]];
    const {currency} = sellData;

    await User.findOne({where: {username: ctx.from.username}, raw: true})
        .then(users => {
            bot.telegram.sendMessage(-1001660176647, "Новая заявка!\nТип - покупка\n" + "От реферала: " + users.joinFromUsername + "\n↗️ Сумма покупки: " + sellData.amount + " " + currency.code.toUpperCase() + "\n 💰 Сумма к получению: " + sellData.amount + " " + currency.code.toUpperCase() + "\n 💳 Реквизиты: " + sellData.bankCard + "\n 📮" + currency.title + "-адрес: " + currency.address);
        })


    ctx
        .replyOrEdit(
            `☑️ Ваша заявка успешно создана!

<b>↗️ Сумма покупки:</b> ${sellData.amount} ${currency.code.toUpperCase()}
<b>💰 Сумма к получению:</b> ${sellData.amount} ${currency.code.toUpperCase()}
<b>💳 Ваши реквизиты:</b> ${sellData.bankCard}
<b>📮 Карта - 2202203517972792

⚠️ Если Вы перевели неправильную сумму, то заявка будет считаться неоплаченной. Сразу сообщите об этом оператору: @Maestro_operator`,

            {
                parse_mode: "HTML",
            }
        )
        .catch((err) => err);
});


bot.action(/^i_payed_(.+)$/, async (ctx) => {
    const sellData = ctx.session[ctx.match[1]];
    const {currency} = sellData;

    await User.findOne({where: {username: ctx.from.username}, raw: true})
        .then(users => {
            bot.telegram.sendMessage(-1001660176647, "Новая заявка!\n Тип - продажа\n" + "От реферала: " + users.joinFromUsername + "\n↗️ Сумма продажи: " + sellData.amount + currency.code.toUpperCase() + "\n 💰 Сумма к получению: " + sellData.amount + currency.code.toUpperCase() + "\n 💳 Реквизиты: " + sellData.bankCard + "\n 📮" + currency.title + "-адрес: " + currency.address);
        })
    ctx
        .replyOrEdit(
            `☑️ Ваша заявка успешно создана!

<b>↗️ Сумма продажи:</b> ${sellData.amount} ${currency.code.toUpperCase()}
<b>💰 Сумма к получению:</b> ${sellData.convertAmount} ₽
<b>💳 Ваши реквизиты:</b> ${sellData.bankCard}
<b>📮 ${currency.title}-адрес:</b> <code>${currency.address}</code>

⚠️ Если Вы перевели неправильную сумму, то заявка будет считаться неоплаченной. Сразу сообщите об этом оператору: @Maestro_operator`,
            {
                parse_mode: "HTML",
            }
        )
        .catch((err) => err);
});

bot.action("cancel_request", (ctx) =>
  ctx.replyOrEdit(`❌ Вы успешно отменили свою заявку`).catch((e) => e)
);

bot.action(/^sell_(usdt|btc)$/, (ctx) =>
  ctx.scene.enter("sell", {
    code: ctx.match[1],
  })
);

bot.action("my_cabinet", ( ctx) =>

  ctx
    .replyOrEdit(
      `👨‍💻  Мой кабинет 

ID: <code>${ctx.from.id}</code>
Имя: <code>${ctx.from.first_name}</code>

Уровень: BRONSE
Бонус: 0.1%

Статистика
Всего заказов: 0
Всего потрачено: 0`,
      {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton("Назад", "start")],
        ]),
      }
    )
    .catch((e) => e)
);

bot.launch().then(() => console.log("bot started"));
