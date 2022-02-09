require("dotenv").config();
const { Telegraf } = require("telegraf");
// const { Composer } = require("micro-bot");
// const telegram = new Telegram();
const bot = new Telegraf(process.env.BOT_TOKEN);
// const bot = new Composer();
// bot.init = async (mBot) => {
//     bot.telegram = mBot.telegram;
// };
const {
    allModels,
    sessionData,
    helpStrings,
    markups,
    isAdmin,
    isValid,
    isLoggedIn,
    addTripSend,
    isSuperAdmin,
    findId,
    findName,
    refresh,
} = require("./config");
const { admin, user, individualProfile, organizationProfile, trip } = allModels;

//refresh commands come first so that people can login!
bot.hears(helpStrings.refresh, (ctx, next) => {
    refresh(ctx, next);
});
const refreshCommand = require("./src/commands/refresh");
refreshCommand(bot);
bot.use(async (ctx, next) => {
    await loginCalled(ctx);
    if (ctx?.message?.text === "Refresh" || ctx?.message?.text === "/refresh")
        return;
    next();
});

//commands
const startCommand = require("./src/commands/start");
startCommand(bot);
const helpCommand = require("./src/commands/help");
helpCommand(bot);

//hears

const requests = require("./src/hears/requests");
requests(bot);

//actions
const decision = require("./src/actions/decide");
decision(bot, sessionData);

bot.use((ctx, next) => {
    if (ctx.update.channel_post) {
    } else {
        next();
    }
});
bot.use(async (ctx) => {
    if (ctx.message && ctx.message.text) {
        try {
            if (sessionData[ctx.chat.id]?.addTrip) {
                await addTripCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.individual) {
                await individualCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.organization) {
                await organizationCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.editDescription) {
                await editDescriptionCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.removeAdmin) {
                await removeAdminCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.changeAdmin) {
                await changeCurrentCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.sendAnything) {
                await sendAnythingCalled(ctx);
            } else if (sessionData[ctx.chat.id]?.addAdmin) {
                if (
                    ctx.message?.entities &&
                    ctx.message?.entities[0]?.type === "mention"
                ) {
                    await addAdminCalled(ctx);
                } else {
                    console.log(ctx.message);
                    await ctx.reply("please use this format @*******");
                }
            } else {
                await ctx.reply(
                    "please use one of the commands or /help to get all commands",
                    isSuperAdmin(ctx.chat.id)
                        ? markups.superAdminMarkup
                        : (await isAdmin(ctx, false))
                        ? markups.adminMarkup
                        : (await isValid(ctx, false))
                        ? markups.validMarkup
                        : markups.loggedInMarkup
                );
            }
        } catch (e) {
            console.log(e);
            await ctx.reply("something went wrong");
        }
    } else {
        if (sessionData[ctx.chat.id]?.sendAnything) {
            sendAnythingCalled(ctx);
        } else if (ctx?.update?.message?.contact) {
            if (sessionData[ctx.chat.id]?.individual) {
                await individualCalled(ctx);
                return;
            } else if (sessionData[ctx.chat.id]?.organization) {
                await organizationCalled(ctx);
                return;
            }
        } else if (ctx?.message?.photo) {
            if (sessionData[ctx.chat.id]?.organization) {
                await organizationCalled(ctx);
                return;
            } else if (sessionData[ctx.chat.id]?.addTrip) {
                await addTripCalled(ctx);
                return;
            }
            console.log(ctx.message.photo.length, ctx.message.photo);
        }
        await ctx.reply(
            "please use one of the commands or /help to get all commands",
            isSuperAdmin(ctx.chat.id)
                ? markups.superAdminMarkup
                : (await isAdmin(ctx, false))
                ? markups.adminMarkup
                : (await isValid(ctx, false))
                ? markups.validMarkup
                : markups.loggedInMarkup
        );
    }
});
const newAccountCalled = async (ctx) => {
    try {
        await user.create({
            data: {
                username: `<a href="tg://user?id=${ctx.chat.id}">${ctx.chat.first_name}</a>`,
                password: "password",
            },
        });
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const loginCalled = async (ctx) => {
    try {
        if (await isLoggedIn(ctx, false)) {
            return;
        }
        const adminPassword = await admin.findFirst({
            where: {
                telegramId: ctx.chat.id,
            },
            select: {
                password: true,
                name: true,
            },
        });
        const userIsAdmin = Boolean(adminPassword);
        const userPassword = await user.findFirst({
            where: {
                username: {
                    contains: `id=${ctx.chat.id}`,
                },
            },
            select: {
                username: true,
                password: true,
                organizationProfile: true,
                individualProfile: true,
            },
        });
        if (!userPassword && !adminPassword) {
            await newAccountCalled(ctx);
            await loginCalled(ctx);
            return;
        }
        const loggedIn = true;
        let userIsValid = 0;
        if (userPassword) {
            if (userPassword.organizationProfile) {
                userIsValid = 3;
            } else if (userPassword.individualProfile) {
                userIsValid = 2;
            }
        }
        /**
         * logged in = 0 not logged in
         * logged in = 1
         * logged in = 2 individual
         * logged in = 3 org
         * logged in = 4 admin
         * make this 😫😫
         */
        if (loggedIn) {
            sessionData.login[ctx.chat.id] = {
                loggedIn: userIsAdmin ? 4 : userIsValid ? userIsValid : 1,
            };
            console.log(sessionData.login[ctx.chat.id].loggedIn);
            await ctx.reply(
                `Hello 🤖 ${
                    adminPassword
                        ? adminPassword.name
                        : findName(userPassword.username)
                }`,
                isSuperAdmin(ctx.chat.id)
                    ? markups.superAdminMarkup
                    : (await isAdmin(ctx, false))
                    ? markups.adminMarkup
                    : (await isValid(ctx, false))
                    ? markups.validMarkup
                    : markups.loggedInMarkup
            );
        } else {
            await ctx.reply("wrong password, try again");
        }
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const individualCalled = async (ctx) => {
    try {
        if (!sessionData[ctx.chat.id].individual.name) {
            sessionData[ctx.chat.id].individual.name = ctx.message.text;
            await ctx.reply("Send phone number", markups.sharePhone);
        } else {
            if (ctx?.update?.message?.contact?.phone_number) {
                sessionData[ctx.chat.id].individual.phoneNumber =
                    ctx?.update?.message?.contact.phone_number;
            } else {
                ctx.reply("please use the button", markups.sharePhone);
                return;
            }
            await individualProfile.create({
                data: {
                    ...sessionData[ctx.chat.id].individual,
                },
            });
            sessionData.login[ctx.chat.id] = {
                loggedIn: 2,
            };
            delete sessionData[ctx.chat.id].individual;
            await ctx.reply(
                "you are now an individual organizer!",
                markups.validMarkup
            );
        }
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const organizationCalled = async (ctx) => {
    try {
        if (!sessionData[ctx.chat.id].organization.organizationName) {
            const count = await organizationProfile.count({
                where: { organizationName: ctx.message.text },
            });
            if (count) {
                await ctx.reply(
                    "an organization with this name already exists, name:"
                );
                return;
            }
            sessionData[ctx.chat.id].organization.organizationName =
                ctx.message.text;
            await ctx.reply("Send logo", markups.passMarkup);
        } else if (!sessionData[ctx.chat.id].organization.logo) {
            let photo = ctx?.message?.photo?.pop()?.file_id;
            if (photo || ctx.message.text == "pass") {
                if (photo) {
                    sessionData[ctx.chat.id].organization.logo = photo;
                } else {
                    sessionData[ctx.chat.id].organization.logo =
                        ctx.message.text;
                }
            } else {
                await ctx.reply("please send photo");
                return;
            }
            await ctx.reply("Send phone number", markups.passPhoneMarkup);
        } else if (!sessionData[ctx.chat.id].organization.phoneNumber) {
            if (ctx.message.text == "pass") {
                sessionData[ctx.chat.id].organization.phoneNumber = "pass";
            } else if (ctx?.update?.message?.contact?.phone_number) {
                sessionData[ctx.chat.id].organization.phoneNumber =
                    ctx?.update?.message?.contact.phone_number;
            } else {
                ctx.reply("please use the button", markups.passPhoneMarkup);
                return;
            }
            await ctx.reply("Send bank name", markups.passMarkup);
        } else if (!sessionData[ctx.chat.id].organization.bankName) {
            sessionData[ctx.chat.id].organization.bankName = ctx.message.text;
            await ctx.reply("Send bank account number", markups.passMarkup);
        } else if (!sessionData[ctx.chat.id].organization.bankAccNumber) {
            sessionData[ctx.chat.id].organization.bankAccNumber =
                ctx.message.text;
            await ctx.reply(
                "Send bank account holder(full name)",
                markups.passMarkup
            );
        } else if (!sessionData[ctx.chat.id].organization.bankAccHolder) {
            sessionData[ctx.chat.id].organization.bankAccHolder =
                ctx.message.text;
            await ctx.reply("Send telegram username", markups.passMarkup);
        } else if (!sessionData[ctx.chat.id].organization.telegram) {
            sessionData[ctx.chat.id].organization.telegram = ctx.message.text;
            await ctx.reply("Send instagram username", markups.passMarkup);
        } else if (!sessionData[ctx.chat.id].organization.instagram) {
            sessionData[ctx.chat.id].organization.instagram = ctx.message.text;
            await ctx.reply("Send facebook link", markups.passMarkup);
        } else if (!sessionData[ctx.chat.id].organization.facebook) {
            sessionData[ctx.chat.id].organization.facebook = ctx.message.text;
            await ctx.reply(
                "Send remark, or other accounts",
                markups.passMarkup
            );
        } else {
            sessionData[ctx.chat.id].organization.otherAccounts =
                ctx.message.text;
            let toBeInput = {};
            for (let i in sessionData[ctx.chat.id].organization) {
                if (
                    sessionData[ctx.chat.id].organization[i] != "pass" ||
                    i == "organizationName"
                ) {
                    toBeInput[i] = sessionData[ctx.chat.id].organization[i];
                }
            }
            console.log(toBeInput);
            await organizationProfile.create({
                data: {
                    ...toBeInput,
                },
            });
            sessionData.login[ctx.chat.id] = {
                loggedIn: 3,
            };
            delete sessionData[ctx.chat.id].organization;
            await ctx.reply(
                "you are now registered as an organization 🏢🏢!",
                markups.validMarkup
            );
        }
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const addTripCalled = async (ctx) => {
    try {
        let photo = ctx?.message?.photo?.pop()?.file_id;
        if (
            sessionData[ctx.chat.id].addTrip.posterPictures.split(" ").pop() !=
            "pass"
        ) {
            if (photo || ctx.message.text == "pass") {
                if (photo) {
                    sessionData[ctx.chat.id].addTrip.posterPictures +=
                        photo + " ";
                    await ctx.reply(
                        `${
                            sessionData[
                                ctx.chat.id
                            ].addTrip.posterPictures.split(" ").length - 1
                        } images so far...`
                    );
                } else {
                    if (!sessionData[ctx.chat.id].addTrip.posterPictures) {
                        await ctx.reply("please send atleast 1 picture");
                        return;
                    }
                    sessionData[ctx.chat.id].addTrip.posterPictures +=
                        ctx.message.text;
                    await ctx.reply("Send description", markups.passMarkup);
                }
            } else {
                await ctx.reply(
                    "please send pictures, pass when u finish",
                    markups.passMarkup
                );
                return;
            }
        } else {
            sessionData[ctx.chat.id].addTrip.description = ctx.message.text;
            let toBeInput = {};
            for (let i in sessionData[ctx.chat.id].addTrip) {
                if (
                    sessionData[ctx.chat.id].addTrip[i] != "pass" ||
                    i == "organizationName"
                ) {
                    toBeInput[i] = sessionData[ctx.chat.id].addTrip[i];
                }
            }
            console.log(toBeInput);
            if (await isAdmin(ctx, false)) {
                delete toBeInput.username;
                toBeInput.telegramId = ctx.chat.id;
            }
            const myTrip = await trip.create({
                data: {
                    ...toBeInput,
                },
            });
            const targetAdmin = (await isAdmin(ctx, false))
                ? { telegramId: ctx.chat.id }
                : (await admin.findFirst({
                      where: {
                          current: true,
                      },
                      select: {
                          telegramId: true,
                      },
                  })) || {
                      telegramId: process.env.SUPER_ADMIN,
                  };
            if (targetAdmin) {
                try {
                    await addTripSend(
                        bot,
                        targetAdmin.telegramId,
                        myTrip,
                        true
                    );
                    await addTripSend(bot, ctx.chat.id, myTrip, false);
                } catch {}
            }
            delete sessionData[ctx.chat.id].addTrip;
            await ctx.reply(
                "Finished adding! await verification",
                isSuperAdmin(ctx.chat.id)
                    ? markups.superAdminMarkup
                    : (await isAdmin(ctx, false))
                    ? markups.adminMarkup
                    : markups.validMarkup
            );
        }
    } catch (e) {}
};
const addAdminCalled = async (ctx) => {
    try {
        let username = ctx.message.text.split("");
        username.shift();
        username = username.join("");
        console.log(username);
        const userPassword = await user.findFirst({
            where: {
                OR: [
                    {
                        individualProfile: {
                            telegramUsername: {
                                equals: username,
                                mode: "insensitive",
                            },
                        },
                    },
                    {
                        organizationProfile: {
                            telegramUsername: {
                                equals: username,
                                mode: "insensitive",
                            },
                        },
                    },
                ],
            },
            include: {
                organizationProfile: true,
                individualProfile: true,
            },
        });
        if (!userPassword) {
            console.log({
                where: {
                    username: { equals: username, mode: "insensitive" },
                },
                select: {
                    password: true,
                },
            });
            const adminPassword = await admin.findFirst({
                where: {
                    username: { equals: username, mode: "insensitive" },
                },
                select: {
                    password: true,
                },
            });
            if (adminPassword) {
                await ctx.reply(
                    "the user is already an admin",
                    markups.superAdminMarkup
                );
                return;
            }
            await ctx.reply(
                "the user isn't registered yet",
                markups.superAdminMarkup
            );
            return;
        }
        let userIsValid = 0;
        if (userPassword) {
            if (userPassword.organizationProfile) {
                userIsValid = 3;
            } else if (userPassword.individualProfile) {
                userIsValid = 2;
            }
        }
        if (!userIsValid) {
            await ctx.reply(
                "the user isn't registered as an org or individual yet",
                markups.superAdminMarkup
            );
            return;
        }

        const changeId = Number(findId(userPassword.username));

        const toBeAdmin = userPassword;

        const adminPassword = await admin.findFirst({
            where: {
                telegramId: changeId,
            },
            select: {
                password: true,
            },
        });
        if (adminPassword) {
            await ctx.reply(
                "the user is already an admin",
                markups.superAdminMarkup
            );
            return;
        }
        await admin.create({
            data: {
                telegramId: changeId,
                username,
                name: findName(toBeAdmin.username),
                current: false,
                super: false,
                password: userPassword.password,
            },
        });
        delete sessionData[ctx.chat.id].addAdmin;
        await ctx.reply("The user is now an admin!", markups.superAdminMarkup);
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const removeAdminCalled = async (ctx) => {
    try {
        const admins = sessionData[ctx.chat.id].removeAdmin;

        const text = Math.floor(Number(ctx.message.text));
        if (isNaN(text)) {
            await ctx.reply("please send a number");
            return;
        }
        if (text < 0 || text > admins.length) {
            await ctx.reply(
                `please send a number between 1 and ${admins.length}`
            );
            return;
        }

        const removedAdmin = admins[text - 1];
        if (removedAdmin.current) {
            await ctx.reply("please change current admin first");
            return;
        }
        await admin.delete({
            where: { telegramId: removedAdmin.telegramId },
        });
        try {
            await bot.telegram.sendMessage(
                removedAdmin.telegramId,
                "you aren't an admin anymore"
            );
        } catch {}
        delete sessionData[ctx.chat.id].removeAdmin;
        await ctx.reply("The user is now  regular!", markups.superAdminMarkup);
    } catch (e) {}
};
const changeCurrentCalled = async (ctx) => {
    try {
        const admins = sessionData[ctx.chat.id].changeAdmin;

        const text = Math.floor(Number(ctx.message.text));
        if (isNaN(text)) {
            await ctx.reply("please send a number");
            return;
        }
        if (text < 0 || text > admins.length) {
            await ctx.reply(
                `please send a number between 1 and ${admins.length}`
            );
            return;
        }

        const changedAdmin = admins[text - 1];
        if (changedAdmin.current) {
            await ctx.reply("please change current admin first");
            return;
        }
        await admin.updateMany({ data: { current: false } });
        await admin.update({
            where: { telegramId: changedAdmin.telegramId },
            data: { current: true },
        });
        try {
            await bot.telegram.sendMessage(
                changedAdmin.telegramId,
                "you are now the current admin"
            );
        } catch {}
        delete sessionData[ctx.chat.id].changeAdmin;
        await ctx.reply("current admin now changed", markups.superAdminMarkup);
    } catch (e) {}
};
const editDescriptionCalled = async (ctx) => {
    try {
        sessionData[ctx.chat.id].editDescription.newDescription =
            ctx.message.text;
        const myTrip = await trip.update({
            where: { id: sessionData[ctx.chat.id].editDescription.id },
            data: {
                description:
                    sessionData[ctx.chat.id].editDescription.newDescription,
            },
        });

        const targetAdmin = (await admin.findFirst({
            where: {
                current: true,
            },
            select: {
                telegramId: true,
            },
        })) || {
            telegramId: process.env.SUPER_ADMIN,
        };
        if (targetAdmin) {
            try {
                await addTripSend(bot, ctx.chat.id, myTrip, true);
            } catch {}
        }

        delete sessionData[ctx.chat.id].editDescription;
    } catch (e) {
        console.log(e);
        await ctx.reply("something went wrong");
    }
};
const sendAnythingCalled = async (ctx) => {
    try {
        if (ctx.message.text === "pass") {
            await ctx.reply("ok! cancelled!", markups.validMarkup);
            delete sessionData[ctx.chat.id].sendAnything;
            return;
        }
        const targetAdmin = (await admin.findFirst({
            where: {
                current: true,
            },
            select: {
                telegramId: true,
            },
        })) || {
            telegramId: process.env.SUPER_ADMIN,
        };
        await bot.telegram.forwardMessage(
            targetAdmin.telegramId,
            ctx.chat.id,
            ctx.message.message_id
        );
        await bot.telegram.sendMessage(
            targetAdmin.telegramId,
            `👆👆this message was sent from ${
                sessionData[ctx.chat.id].sendAnything.username
            }`,
            { parse_mode: "HTML" }
        );
        delete sessionData[ctx.chat.id].sendAnything;
        await ctx.reply(
            "be sure your message has reached us!",
            markups.validMarkup
        );
    } catch (e) {}
};
// module.exports = bot;
bot.launch();
console.log("started");
