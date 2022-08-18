const { Markup } = require("telegraf");
const WizardScene = require("telegraf/scenes/wizard");
const start = require("../commands/start");
const currencies = require("../currencies.json");
const convertMoney = require("../helpers/convertMoney");
const getExchangeRate = require("../helpers/getExchangeRate");

const scene = new WizardScene(
    "buy",
    async (ctx) => {
        try {
            var currency = currencies.find((v) => v.code === ctx.scene.state.code);

            var props = {
                minAmount: 30,
                maxAmount: 1000,
            };

            props.minAmountInCrypto = (
                await convertMoney(props.minAmount, currency.code.toUpperCase(), "USD")
            ).toFixed(currency.decimal);
            props.maxAmountInCrypto = (
                await convertMoney(props.maxAmount, currency.code.toUpperCase(), "USD")
            ).toFixed(currency.decimal);

            props.minAmount = ((await getExchangeRate(currency.code.toUpperCase(), "RUB") * parseFloat(props.minAmountInCrypto)).toFixed(2))
            props.maxAmount = ((await getExchangeRate(currency.code.toUpperCase(), "RUB") * parseFloat(props.maxAmountInCrypto)).toFixed(2))


            await ctx.scene.reply(
                `На какую сумму Вы хотите купить <b>${currency.title}</b>?

(Напишите сумму от ${props.minAmountInCrypto} до ${
                    props.maxAmountInCrypto
                } <b>${currency.code.toUpperCase()}</b> или от ${props.minAmount} до ${
                    props.maxAmount
                } <b>₽</b>)

<b>Если хотите купить сумму больше, свяжитесь с нами:</b>
@Maestro_operator`,
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
        try {
            var currency = currencies.find((v) => v.code === ctx.scene.state.code);
            var amount = parseFloat(ctx.message?.text)
            if (isNaN(amount)) return ctx.wizard.prevStep();

            var props = {
                minAmount: 30,
                maxAmount: 1000,
            };

            props.minAmountInCrypto = (
                await convertMoney(props.minAmount, currency.code.toUpperCase(), "USD")
            ).toFixed(currency.decimal);
            props.maxAmountInCrypto = (
                await convertMoney(props.maxAmount, currency.code.toUpperCase(), "USD")
            ).toFixed(currency.decimal);

            props.minAmount = ((await getExchangeRate(currency.code.toUpperCase(), "RUB") * parseFloat(props.minAmountInCrypto)).toFixed(2))
            props.maxAmount = ((await getExchangeRate(currency.code.toUpperCase(), "RUB") * parseFloat(props.maxAmountInCrypto)).toFixed(2))

            if (amount < props.minAmountInCrypto) {
                await ctx
                    .reply(
                        `Минимальная сумма для покупки - ${
                            props.minAmountInCrypto
                        } ${currency.code.toUpperCase()}`
                    )
                    .catch((e) => e);
                return ctx.wizard.prevStep();
            }
            if (amount > props.maxAmountInCrypto) {
                await ctx
                    .reply(
                        `Максимальная сумма для покупки - ${
                            props.maxAmountInCrypto
                        } ${currency.code.toUpperCase()}`
                    )
                    .catch((e) => e);
                return ctx.wizard.prevStep();
            }

            var exchangeRate = await getExchangeRate(currency.code, "RUB"),
                convertAmount = parseFloat(exchangeRate * amount).toFixed(2);

            ctx.scene.state.data = {
                amount,
                convertAmount,
            };

            return ctx.wizard.nextStep();
        } catch (err) {
            ctx.reply(err).catch((e) => e);
            return ctx.scene.leave();
        }
    },
    async (ctx) => {
        try {
            var currency = currencies.find((v) => v.code === ctx.scene.state.code);

            var { amount, convertAmount } = ctx.scene.state.data;
            await ctx.scene.reply(
                `<b>Покупка ${
                    currency.title
                }:</b> ${amount} ${currency.code.toUpperCase()}

<b>💵 Сумма к получению:</b> ${amount} ${currency.code.toUpperCase()}

<b>💳 Введите номер ${currency.code.toUpperCase()} кошелька:</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.callbackButton("Отмена", "cancel")],
                    ]),
                }
            );

            return ctx.wizard.next();
        } catch (err) {
            ctx.reply("Ошибка").catch((e) => e);
            return ctx.scene.leave();
        }
    },
    async (ctx) => {
        try {
            ctx.scene.state.data.bankCard = ctx.message.text
            return ctx.wizard.nextStep();
        } catch (err) {
            ctx.reply("Ошибка").catch((e) => e);
            return ctx.scene.leave();
        }
    },

    async (ctx) => {
        try {
            var currency = currencies.find((v) => v.code === ctx.scene.state.code);

            var { amount, convertAmount, bankCard } = ctx.scene.state.data;
            await ctx.scene.reply(
                `☑️ Проверьте правильность введенных Вами данных:

<b>↗️ Сумма покупки:</b> <code>${amount}</code> ${currency.code.toUpperCase()}

<b>💳 Реквизиты:</b> ${bankCard}

<b>Подтверждаете?</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.callbackButton("✅ Подтвердить", "next")],
                        [Markup.callbackButton("Отмена", "cancel")],
                    ]),
                }
            );

            return ctx.wizard.next();
        } catch (err) {
            ctx.reply("Ошибка").catch((e) => e);
            return ctx.scene.leave();
        }
    },

    async (ctx) => {
        try {
            if (ctx.callbackQuery?.data !== "next") return ctx.wizard.prevStep();

            return ctx.wizard.nextStep();
        } catch (err) {
            ctx.reply("Ошибка").catch((e) => e);
            return ctx.scene.leave();
        }
    },

    async (ctx) => {
        try {
            var currency = currencies.find((v) => v.code === ctx.scene.state.code);

            var { amount, convertAmount, bankCard } = ctx.scene.state.data;
            var id = Math.random() + new Date().valueOf();
            ctx.session[id] = ctx.scene.state.data;
            ctx.session[id].currency = currency;

            var amount2 = (((await getExchangeRate(currency.code.toUpperCase(), "RUB")).toFixed(currency.decimal) * amount).toFixed(currency.decimal))

            await ctx.scene.reply(
                `☑️ Заявка ${currency.code.toUpperCase()}

<b>Отправьте:</b> <code> ${amount2} </code> RUB

<b>На данную карту:</b>

<code>2202203517972792</code>

<b>💳 Реквизиты:</b> ${bankCard}

ℹ️ После успешной отправки <b>${amount2} RUB</b> на указанную карту,
нажмите <b>«✅Я перевел(а)»</b> или же Вы можете отменить данную заявку нажав на кнопку <b>«❌Отменить продажу»</b>`,
                {
                    parse_mode: "HTML",
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.callbackButton("✅ Я перевел(а)", `i_payed2_${id}`)],
                        [Markup.callbackButton("❌ Отменить заявку", "cancel_request")],
                    ]),
                }
            );
        } catch (err) {
            ctx.reply("Ошибка").catch((e) => e);
        }
        return ctx.scene.leave();
    }
);

scene.leave(start);

module.exports = scene;
