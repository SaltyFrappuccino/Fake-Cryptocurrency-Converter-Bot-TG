const { User } = require("../db");

module.exports = async (ctx, next) => {
  try {
    var username = ctx.from.username || ctx.from.id,
      user = await User.findOrCreate({
        where: {
          id: ctx.from.id,
        },
        defaults: {
          id: ctx.from.id,
          username,
        },
      });

    user = user[0];

    if (user.username !== username)
      await user.update({
        username,
      });

    ctx.state.user = user;

    return next();
  } catch (err) {
    console.log(err);
    return ctx.reply("Ошибка").catch((e) => e);
  }
};
