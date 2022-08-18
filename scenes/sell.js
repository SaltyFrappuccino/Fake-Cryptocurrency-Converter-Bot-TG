const { Markup } = require("telegraf");
const WizardScene = require("telegraf/scenes/wizard");
const start = require("../commands/start");
const currencies = require("../currencies.json");
const convertMoney = require("../helpers/convertMoney");
const getExchangeRate = require("../helpers/getExchangeRate");
const {parse} = require("dotenv");
const scene = new WizardScene(
  "sell",
  async (ctx) => {
    try {
      var currency = currencies.find((v) => v.code == ctx.scene.state.code);

      var props = {
        minAmount: 30,
        maxAmount: 1000,
      };

      var mincrypto = await convertMoney(props.minAmount, currency.code.toUpperCase(), "USD")
      var usdrate = await getExchangeRate(currency.code.toUpperCase(), "RUB")
      usdrate = await 1/usdrate

      usdrate = usdrate * 8


      mincrypto = mincrypto + usdrate


      var maxcrypto = await convertMoney(props.maxAmount, currency.code.toUpperCase(), "USD")
      usdrate = await getExchangeRate(currency.code.toUpperCase(), "RUB")
      usdrate = await 1/usdrate

      usdrate = usdrate * 8

      maxcrypto = maxcrypto + usdrate


      props.minAmountInCrypto = (
          await mincrypto
      ).toFixed(currency.decimal);
      props.maxAmountInCrypto = (
        await maxcrypto
      ).toFixed(currency.decimal);

      props.minAmount = (((await getExchangeRate(currency.code.toUpperCase(), "RUB") + 8) * parseFloat(props.minAmountInCrypto)).toFixed(2))
      props.maxAmount = (((await getExchangeRate(currency.code.toUpperCase(), "RUB") + 8) * parseFloat(props.maxAmountInCrypto)).toFixed(2))

      await ctx.scene.reply(
        `На какую сумму Вы хотите продать <b>${currency.title}</b>?

(Напишите сумму от ${props.minAmountInCrypto} до ${
          props.maxAmountInCrypto
        } <b>${currency.code.toUpperCase()}</b> или от ${props.minAmount} до ${
          props.maxAmount
        } <b>₽</b>)

<b>Если хотите продать сумму больше, свяжитесь с нами:</b>
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
      ctx.reply(err).catch((e) => e);
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      var currency = currencies.find((v) => v.code == ctx.scene.state.code);
      var amount = parseFloat(ctx.message?.text);
      if (isNaN(amount)) return ctx.wizard.prevStep();

      var props = {
        minAmount: 30,
        maxAmount: 1000,
      };

      var mincrypto = await convertMoney(props.minAmount, currency.code.toUpperCase(), "USD")
      var usdrate = await getExchangeRate(currency.code.toUpperCase(), "RUB")
      usdrate = await 1/usdrate

      usdrate = usdrate * 8


      mincrypto = mincrypto + usdrate


      var maxcrypto = await convertMoney(props.maxAmount, currency.code.toUpperCase(), "USD")
      usdrate = await getExchangeRate(currency.code.toUpperCase(), "RUB")
      usdrate = await 1/usdrate

      usdrate = usdrate * 8

      maxcrypto = maxcrypto + usdrate


      props.minAmountInCrypto = (
          await mincrypto
      ).toFixed(currency.decimal);
      props.maxAmountInCrypto = (
          await maxcrypto
      ).toFixed(currency.decimal);

      props.minAmount = (((await getExchangeRate(currency.code.toUpperCase(), "RUB") + 8) * parseFloat(props.minAmountInCrypto)).toFixed(2))
      props.maxAmount = (((await getExchangeRate(currency.code.toUpperCase(), "RUB") + 8) * parseFloat(props.maxAmountInCrypto)).toFixed(2))


      if (amount < props.minAmountInCrypto) {
        await ctx
          .reply(
            `Минимальная сумма для продажи - ${
              props.minAmountInCrypto
            } ${currency.code.toUpperCase()}`
          )
          .catch((e) => e);
        return ctx.wizard.prevStep();
      }
      if (amount > props.maxAmountInCrypto) {
        await ctx
          .reply(
            `Максимальная сумма для продажи - ${
              props.maxAmountInCrypto
            } ${currency.code.toUpperCase()}`
          )
          .catch((e) => e);
        return ctx.wizard.prevStep();
      }

      var exchangeRate = await getExchangeRate(currency.code.toUpperCase(), "RUB") + 8,
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
      var currency = currencies.find((v) => v.code == ctx.scene.state.code);

      var { amount, convertAmount } = ctx.scene.state.data;
      convertAmount = parseFloat(convertAmount);

      await ctx.scene.reply(
        `ℹ️ За продажу <code>${amount}</code> ${currency.code.toUpperCase()}, Вы получите <b>${convertAmount} ₽</b>

☑️ Вы согласны продолжить?`,
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("✅ Продолжить", "next")],
            [Markup.callbackButton("Отмена", "cancel")],
          ]),
        }
      );

      return ctx.wizard.next();
    } catch (err) {
      ctx.reply(err).catch((e) => e);
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      if (ctx.callbackQuery?.data != "next") return ctx.wizard.prevStep();

      return ctx.wizard.nextStep();
    } catch (err) {
      ctx.reply("Ошибка").catch((e) => e);
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      var currency = currencies.find((v) => v.code == ctx.scene.state.code);

      var { amount, convertAmount } = ctx.scene.state.data;
      await ctx.scene.reply(
        `<b>Продажа ${
          currency.title
        }:</b> ${amount} ${currency.code.toUpperCase()}

<b>💵 Сумма к получению:</b> ${convertAmount} ₽

<b>💳 Введите номер банковской карты:</b>`,
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
      if (String(ctx.message?.text).replace(/\D/giu, "").length < 1)
        return ctx.wizard.prevStep();

      ctx.scene.state.data.bankCard = ctx.message.text.replace(
        /[^\d\s]+/giu,
        ""
      );

      return ctx.wizard.nextStep();
    } catch (err) {
      ctx.reply("Ошибка").catch((e) => e);
      return ctx.scene.leave();
    }
  },

  async (ctx) => {
    try {
      var currency = currencies.find((v) => v.code == ctx.scene.state.code);

      var { amount, convertAmount, bankCard } = ctx.scene.state.data;
      await ctx.scene.reply(
        `☑️ Проверьте правильность введенных Вами данных:

<b>↗️ Сумма продажи:</b> <code>${amount}</code> ${currency.code.toUpperCase()}

<b>💳 Реквизиты:</b> ${bankCard}
<b>💵 Вы получите после продажи:</b> ${convertAmount} ₽

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
      if (ctx.callbackQuery?.data != "next") return ctx.wizard.prevStep();

      return ctx.wizard.nextStep();
    } catch (err) {
      ctx.reply("Ошибка").catch((e) => e);
      return ctx.scene.leave();
    }
  },

  async (ctx) => {
    try {
      var currency = currencies.find((v) => v.code == ctx.scene.state.code);

      var { amount, convertAmount, bankCard } = ctx.scene.state.data;
      var id = Math.random() + new Date().valueOf();
      ctx.session[id] = ctx.scene.state.data;
      ctx.session[id].currency = currency;
      await ctx.scene.reply(
        `☑️ Заявка ${currency.code.toUpperCase()}

<b>Отправьте:</b> <code>${amount}</code> ${currency.code.toUpperCase()}

<b>На данный ${currency.title}-адрес:</b>

<code>${currency.address}</code>

<b>💳 Реквизиты:</b> ${bankCard}
<b>💵 Вы получите после продажи:</b> ${convertAmount} ₽

ℹ️ После успешной отправки <b>${amount} ${currency.code.toUpperCase()}</b> на указанный ${
          currency.title
        }-адрес выше, нажмите <b>«✅Я перевел(а)»</b> или же Вы можете отменить данную заявку нажав на кнопку <b>«❌Отменить продажу»</b>`,
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            [Markup.callbackButton("✅ Я перевел(а)", `i_payed_${id}`)],
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
