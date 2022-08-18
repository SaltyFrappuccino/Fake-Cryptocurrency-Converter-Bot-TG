const { Markup, Telegraf} = require("telegraf");
const WizardScene = require("telegraf/scenes/wizard");
const start = require("../commands/start");
const currencies = require("../currencies.json");
const convertMoney = require("../helpers/convertMoney");
const getExchangeRate = require("../helpers/getExchangeRate");
const { User } = require("../db");

require("dotenv").config({
    path: require("path").join(__dirname, "../.env"),
});

const { DB_NAME, DB_USER, DB_PASS, DB_HOST } = process.env;

const bot = new Telegraf(process.env.BOT_TOKEN);
const telegram = new Telegraf(process.env.BOT_TOKEN)

// const Sequelize = require("sequelize");
//
// const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
//     dialect: "sqlite",
//     host: DB_HOST,
//     define: {
//         timestamps: true
//     }
// });

// const User = require(`../models/user`)(sequelize)

const scene = new WizardScene(
    "ref",
    async (ctx) => {
        try {

            await ctx.scene.reply(
                `Введите реферальный код`,
                {
                    parse_mode: "HTML",
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.callbackButton("Отмена", "cancel")],
                    ]),
                }
            );

            ctx.scene.state.data = {};

            return ctx.wizard.next();
        } catch (err) {
            ctx.reply("Ошибка").catch((e) => e);
            return ctx.scene.leave();
        }
    },

    async (ctx) => {
        var ref = ctx.message?.text;

        console.log(ctx.from.id)

        const user = await User.update(
                {
                    joinFromUsername: ref,
                },

                {
                    where: {
                        id: ctx.message.chat.id,
                        joinFromUsername: null
                    },
                },
            )
        return ctx.scene.leave();
    })

scene.leave(start);

module.exports = scene;