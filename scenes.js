const { Stage } = require("telegraf");

const scenes = new Stage([
    require("./scenes/sell"),
    require("./scenes/buy"),
    require("./scenes/ref")
]);

scenes.action("cancel", ctx => ctx.scene.leave());

module.exports = scenes;