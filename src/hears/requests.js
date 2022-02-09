const { Telegraf } = require("telegraf");
const {
    helpStrings,
    sessionData,
    isLoggedIn,
    isValid,
    isAdmin,
    markups,
    allModels,
    addTripSend,
    isSuperAdmin,
} = require("../../config");
const { trip, user, admin } = allModels;
/**
 *
 * @param {Telegraf} bot
 * @returns
 */
module.exports = async (bot) => {
    bot.hears(helpStrings.individual, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (await isValid(ctx, false)) {
            await ctx.reply("You've already registered");
            return;
        }
        if (await isAdmin(ctx, false)) {
            await ctx.reply("You're an admin, know your place your highness");
            return;
        }
        try {
            sessionData[ctx.chat.id] = {
                individual: {
                    username: `<a href="tg://user?id=${ctx.chat.id}">${ctx.chat.first_name}</a>`,
                    telegramUsername: ctx.chat.username,
                    name: "",
                    phoneNumber: "",
                },
            };
            await ctx.reply("please send name");
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.organization, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (await isValid(ctx, false)) {
            await ctx.reply("You've already registered");
            return;
        }
        if (await isAdmin(ctx, false)) {
            await ctx.reply("You're an admin, know your place your highness");
            return;
        }
        try {
            sessionData[ctx.chat.id] = {
                organization: {
                    username: `<a href="tg://user?id=${ctx.chat.id}">${ctx.chat.first_name}</a>`,
                    telegramUsername: ctx.chat.username,
                    organizationName: "",
                    logo: "",
                    phoneNumber: "",
                    bankName: "",
                    bankAccNumber: "",
                    bankAccHolder: "",
                    telegram: "",
                    instagram: "",
                    facebook: "",
                    otherAccounts: "",
                },
            };
            await ctx.reply("please send name");
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.addTrip, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (!(await isValid(ctx, true))) {
            return;
        }
        try {
            const username = await user.findFirst({
                where: {
                    username: {
                        contains: `id=${ctx.chat.id}`,
                    },
                },
                select: {
                    username: true,
                },
            });
            sessionData[ctx.chat.id] = {
                addTrip: {
                    username: username.username,
                    posterPictures: "",
                    description: "",
                },
            };
            await ctx.reply(
                "please send pictures, pass when u finish",
                markups.passMarkup
            );
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.sendAnything, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (!(await isValid(ctx, true))) {
            return;
        }
        try {
            const username = await user.findFirst({
                where: {
                    username: {
                        contains: `id=${ctx.chat.id}`,
                    },
                },
                select: {
                    username: true,
                },
            });
            sessionData[ctx.chat.id] = {
                sendAnything: {
                    username: username.username,
                },
            };
            await ctx.reply(
                "ok send anything! It'll reach us right away",
                markups.passMarkup
            );
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.myTrips, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (!(await isAdmin(ctx, false)) && !(await isValid(ctx, true))) {
            return;
        }
        // if (await isAdmin(ctx, false)) {
        //     await ctx.reply("You're an admin, know your place your highness");
        //     return;
        // }
        try {
            const data = await trip.findMany({
                where: {
                    OR: [
                        {
                            username: {
                                contains: `${ctx.chat.id}`,
                            },
                        },
                        { telegramId: ctx.chat.id },
                    ],
                },
            });
            if (data.length) {
                for (let i in data) {
                    console.log(i, data[i]);
                    await addTripSend(bot, ctx.chat.id, data[i], false);
                    await ctx.reply("---------------------");
                    console.log("success");
                }
            } else {
                ctx.reply("please add trips first");
            }
        } catch (e) {
            // console.log(e.on.payload.media);
            console.log(e);
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.addAdmin, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (!isSuperAdmin(ctx.chat.id)) {
            ctx.reply("you are not my creator");
            return;
        }
        try {
            sessionData[ctx.chat.id] = {
                addAdmin: {
                    changeId: "",
                },
            };
            await ctx.reply("please send user's username");
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.removeAdmin, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (!isSuperAdmin(ctx.chat.id)) {
            ctx.reply("you are not my creator");
            return;
        }
        try {
            const admins = await admin.findMany({});
            sessionData[ctx.chat.id] = {
                removeAdmin: admins,
            };
            await ctx.reply(
                `please type number of the person u wanna remove${admins.map(
                    (admin1, index) =>
                        `\n${index + 1}. <a href="tg://user?id=${
                            admin1.telegramId
                        }">${admin1.name}</a> ${
                            admin1.current ? "(current)" : ""
                        }`
                )}`,
                { parse_mode: "HTML" }
            );
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    bot.hears(helpStrings.changeCurrent, async (ctx) => {
        if (!(await isLoggedIn(ctx, true))) {
            return;
        }
        if (!isSuperAdmin(ctx.chat.id)) {
            ctx.reply("you are not my creator");
            return;
        }
        try {
            const admins = await admin.findMany({ where: { current: false } });
            const currentAdmin = await admin.findFirst({
                where: { current: true },
            });
            sessionData[ctx.chat.id] = {
                changeAdmin: admins,
            };
            await ctx.reply(
                `current admin is \n<a href="tg://user?id=${
                    currentAdmin.telegramId
                }">${
                    currentAdmin.name
                }</a>\nplease type number of the person u wanna make current${admins.map(
                    (admin1, index) =>
                        `\n${index + 1}. <a href="tg://user?id=${
                            admin1.telegramId
                        }">${admin1.name}</a> ${
                            admin1.current ? "(current)" : ""
                        }`
                )}`,
                { parse_mode: "HTML" }
            );
        } catch {
            await ctx.reply("something went wrong");
        }
    });
    // bot.hears(helpStrings.resetPassword, async (ctx) => {
    //     if (await isLoggedIn(ctx, false)) {
    //         return;
    //     }
    //     try {
    //         const targetAdmin = (await admin.findFirst({
    //             where: {
    //                 current: true,
    //             },
    //             select: {
    //                 telegramId: true,
    //             },
    //         })) || {
    //             telegramId: process.env.SUPER_ADMIN,
    //         };
    //         const meUser = await user.findFirst({
    //             where: {
    //                 username: {
    //                     contains: `id=${ctx.chat.id}`,
    //                 },
    //             },
    //             select: {
    //                 username: true,
    //             },
    //         });
    //         await ctx.reply(
    //             // targetAdmin.telegramId,
    //             `change ur password`,
    //             { ...markups.setPassword(ctx.chat.id), parse_mode: "HTML" }
    //         );
    //     } catch (e) {
    //         console.log(e);
    //         await ctx.reply("something went wrong");
    //     }
    // });
};
