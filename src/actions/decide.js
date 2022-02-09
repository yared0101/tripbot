const { Telegraf } = require("telegraf");
const { allModels, findId, addTripSend, markups } = require("../../config");
const { trip } = allModels;
/**
 *
 * @param {Telegraf} bot
 */
module.exports = (bot, sessionData) => {
    bot.action([/.*approve.*/, /.*superApprove.*/], async (ctx) => {
        try {
            const id = Number(ctx.match[0].split(" ")[1]);
            const isWithBookNow = ctx.match[0].split(" ")[0] === "superApprove";
            const myTrip = await trip.findFirst({
                where: { id, postedId: null },
            });
            if (!myTrip) {
                await ctx.reply(
                    "sorry, this trip is already deleted or posted"
                );
                await bot.telegram.deleteMessage(
                    ctx.chat.id,
                    ctx.update.callback_query.message.message_id
                );
                return;
            }
            try {
                await bot.telegram.sendMessage(
                    findId(myTrip.username || myTrip.telegramId),
                    "your request has been approved"
                );
            } catch (e) {
                await ctx.reply(
                    "the user has blocked the bot(not posting the trip)"
                );
                ctx.answerCbQuery();
                return;
            }
            await addTripSend(bot, process.env.CHANNEL_ID, myTrip, false);
            if (isWithBookNow) {
                await bot.telegram.sendMessage(
                    process.env.CHANNEL_ID,
                    "👆👆👆👆",
                    markups.bookNow(id)
                );
            }
            await trip.update({
                where: { id },
                data: {
                    postedId: "something",
                },
            });
            await bot.telegram.deleteMessage(
                ctx.chat.id,
                ctx.update.callback_query.message.message_id
            );
        } catch (e) {
            console.log(e);
            await ctx.reply("something went wrong");
        } finally {
            ctx.answerCbQuery();
        }
    });
    bot.action(/.*decline.*/, async (ctx) => {
        //TODO user blocked me should be here I guess
        try {
            const id = Number(ctx.match[0].split(" ")[1]);
            try {
                const data = await trip.delete({
                    where: { id },
                });
                if (!data) {
                    throw "something";
                }
                if (data.postedId) {
                    await ctx.reply("trip has already been posted");
                    return;
                }
                await bot.telegram.sendMessage(
                    findId(data.username),
                    "your request has been declined"
                );
            } catch {
                await ctx.reply("trip has already been deleted");
            } finally {
                await bot.telegram.deleteMessage(
                    ctx.chat.id,
                    ctx.update.callback_query.message.message_id
                );
            }
        } catch {
            await ctx.reply("something went wrong");
        } finally {
            ctx.answerCbQuery();
        }
    });
    bot.action(/.*editDescription.*/, async (ctx) => {
        //TODO user blocked me should be here I guess
        try {
            const id = Number(ctx.match[0].split(" ")[1]);
            try {
                const data = await trip.findUnique({
                    where: { id },
                });
                if (!data) {
                    throw "something";
                }
                if (data.postedId) {
                    await ctx.reply("trip has already been posted");
                    return;
                }
                await ctx.reply(
                    `please send new Description(press text to copy) \n\n<code>${data.description}</code>`,
                    { parse_mode: "HTML" }
                );
            } catch (e) {
                console.log(e);
                await ctx.reply("trip has already been deleted");
            }
            sessionData[ctx.chat.id] = {
                editDescription: {
                    id,
                    newDescription: "",
                },
            };
        } catch {
            await ctx.reply("something went wrong");
        } finally {
            ctx.answerCbQuery();
        }
    });
    bot.action(/.*setPassword.*/, async (ctx) => {
        //TODO user blocked me should be here I guess
        try {
            const id = Number(ctx.match[0].split(" ")[1]);
            try {
                await ctx.reply(`please send new Password`);
                sessionData[ctx.chat.id] = {
                    setPassword: {
                        id,
                        password: "",
                    },
                };
                await bot.telegram.deleteMessage(
                    ctx.chat.id,
                    ctx.update.callback_query.message.message_id
                );
            } catch (e) {
                console.log(e);
                await ctx.reply("something went wrong");
            }
        } catch {
            await ctx.reply("something went wrong");
        } finally {
            ctx.answerCbQuery();
        }
    });
};
