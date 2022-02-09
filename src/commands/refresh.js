const { Telegraf } = require("telegraf");
const { refresh } = require("../../config");
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = (bot) => {
    bot.command("refresh", async (ctx, next) => {
        refresh(ctx, next);
    });
};
