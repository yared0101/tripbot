const { Telegraf } = require("telegraf");
const {
    allModels,
    helpStrings,
    markups,
    isValid,
    beautifulySend,
    isAdmin,
    isLoggedIn,
    addTripSend,
} = require("../../config");
const { trip, individualProfile, organizationProfile, admin } = allModels;
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = async (bot) => {
    bot.command("start", async (ctx) => {
        const id = parseInt(ctx.message.text.split(" ")[1]);
        if (id) {
            try {
                const isToucherAdmin = await admin.findUnique({
                    where: {
                        telegramId: ctx.chat.id,
                    },
                    select: {
                        telegramId: true,
                    },
                });
                if (isToucherAdmin) {
                    const data = await trip.findUnique({
                        where: { id },
                        select: {
                            clickedCount: true,
                        },
                    });
                    await ctx.reply(
                        `this post has been clicked ${data.clickedCount} times`
                    );
                    return;
                }
                const data = await trip.update({
                    where: { id },
                    data: {
                        clickedCount: {
                            increment: 1,
                        },
                    },
                });
                console.log(data);
                let organizer = await organizationProfile.findUnique({
                    where: {
                        username: data.username,
                    },
                });
                if (!organizer) {
                    organizer = await individualProfile.findUnique({
                        where: {
                            username: data.username,
                        },
                    });
                }
                const realOrganizer = {
                    name: organizer.name || organizer.organizationName,
                    contactNumber: organizer.phoneNumber || "none",
                    username: data.username,
                };
                if (!data) {
                    ctx.reply("sorry, but the trip is no longer available");
                }
                await addTripSend(bot, ctx.chat.id, data, false);
                ctx.reply(
                    `<strong>The organizer info</strong>\n\nname - ${realOrganizer.name}\nPhone Number - ${realOrganizer.contactNumber}\ntelegram contact @ ${realOrganizer.username}`,
                    {
                        parse_mode: "HTML",
                    }
                );
            } catch (e) {
                console.log(e);
                await ctx.reply("something went wrong");
            }
        } else {
            try {
                if (
                    (await isLoggedIn(ctx, false)) &&
                    (await isAdmin(ctx, false))
                ) {
                    await bot.telegram.sendMessage(
                        ctx.chat.id,
                        "Welcome",
                        markups.adminMarkup
                    );
                } else if (
                    (await isLoggedIn(ctx, false)) &&
                    (await isValid(ctx, false))
                ) {
                    await bot.telegram.sendMessage(
                        ctx.chat.id,
                        "Welcome",
                        markups.validMarkup
                    );
                } else if (await isLoggedIn(ctx, false)) {
                    await bot.telegram.sendMessage(
                        ctx.chat.id,
                        "Welcome",
                        markups.loggedInMarkup
                    );
                } else {
                    await bot.telegram.sendMessage(
                        ctx.chat.id,
                        "Welcome",
                        markups.freshMarkup
                    );
                }
            } catch (e) {
                console.log(e);
                await ctx.reply("something went wrong");
            }
        }
    });
};
