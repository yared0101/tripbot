const { PrismaClient } = require("@prisma/client");
const allModels = new PrismaClient();

const helpStrings = {
    helpMessage: `HELP!!!!!!!!!!!!`,
    botLink: "testorganizersbot",
    newAccount: "Add Account",
    addPost: "Add Post",
    login: "Login",
    individual: "I'm an Individual",
    organization: "We're an Organization",
    addTrip: "Add Trip",
    myTrips: "My Trips",
    changePassword: "Change Password",
    editDescription: "Edit Description",
    addAdmin: "Add Admin",
    removeAdmin: "Remove Admin",
    changeCurrent: "Change Current Admin",
    sendAnything: "something to say?",
    resetPassword: "Forgot Password?",
    refresh: "Refresh",
};
const markups = {
    superAdminMarkup: {
        reply_markup: {
            keyboard: [
                [{ text: helpStrings.addTrip }, { text: helpStrings.myTrips }],
                [
                    { text: helpStrings.addAdmin },
                    { text: helpStrings.removeAdmin },
                ],
                [{ text: helpStrings.changeCurrent }],
                [{ text: helpStrings.refresh }],
            ],
            resize_keyboard: true,
        },
    },
    adminMarkup: {
        reply_markup: {
            keyboard: [
                [{ text: helpStrings.addTrip }, { text: helpStrings.myTrips }],
                [{ text: helpStrings.refresh }],
            ],
            resize_keyboard: true,
        },
    },
    validMarkup: {
        reply_markup: {
            keyboard: [
                [{ text: helpStrings.addTrip }, { text: helpStrings.myTrips }],
                [{ text: helpStrings.sendAnything }],
                [{ text: helpStrings.refresh }],
            ],
            resize_keyboard: true,
        },
    },
    freshMarkup: {
        reply_markup: {
            keyboard: [
                [{ text: helpStrings.newAccount }, { text: helpStrings.login }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    loggedInMarkup: {
        reply_markup: {
            keyboard: [
                [
                    { text: helpStrings.organization },
                    { text: helpStrings.individual },
                ],
                [{ text: helpStrings.refresh }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    passMarkup: {
        reply_markup: {
            keyboard: [[{ text: "pass" }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    sharePhone: {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: "📲 Send phone number",
                        request_contact: true,
                    },
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    passPhoneMarkup: {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: "📲 Send phone number",
                        request_contact: true,
                    },
                ],
                [{ text: "pass" }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    editDescriptionMarkup: {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: helpStrings.editDescription,
                    },
                ],
                [{ text: "pass" }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    setPassword: (id) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "set new password",
                            callback_data: `setPassword ${id}`,
                        },
                    ],
                ],
            },
        };
    },
    resetPasswordMarkup: {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: helpStrings.resetPassword,
                    },
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    },
    tripApproveMarkup: (id) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "approve with book now button",
                            callback_data: `superApprove ${id}`,
                        },
                    ],
                    [
                        {
                            text: "approve",
                            callback_data: `approve ${id}`,
                        },
                        {
                            text: "decline",
                            callback_data: `decline ${id}`,
                        },
                    ],
                    [
                        {
                            text: "Edit Description",
                            callback_data: `editDescription ${id}`,
                        },
                    ],
                ],
            },
        };
    },
    bookNow: (id) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Book Now!",
                            url: `${process.env.BOT_ID}?start=${id}`,
                        },
                    ],
                ],
            },
        };
    },
};

let sessionData = { login: {} };
const isAdmin = async (ctx, useCtx = true) => {
    const loginNumber = sessionData.login[ctx.chat.id]?.loggedIn;
    if (loginNumber === 4) {
        return loginNumber;
    } else {
        if (useCtx) {
            await ctx.reply("Say What?");
        }
        return false;
    }
};
const isSuperAdmin = (id) => id == process.env.SUPER_ADMIN;
const isValid = async (ctx, useCtx = true) => {
    const loginNumber = sessionData.login[ctx.chat.id]?.loggedIn;
    if (loginNumber > 2) {
        return loginNumber;
    } else {
        if (useCtx) {
            await ctx.reply(
                "You haven't filled what u are!\nChoose please ",
                markups.loggedInMarkup
            );
        }
        return false;
    }
};
const isLoggedIn = async (ctx, useCtx = true) => {
    const loggedIn = Boolean(sessionData.login[ctx.chat.id]?.loggedIn);
    if (useCtx && !loggedIn) {
        await ctx.reply("Please login first", markups.freshMarkup);
        return false;
    }

    return loggedIn;
};
const isRegistered = async (ctx, useCtx = true) => {
    const adminUser = await allModels.admin.findFirst({
        where: {
            username: {
                contains: `id=${ctx.chat.id}`,
            },
        },
        select: { username: true },
    });
    const stdUser = await allModels.user.findFirst({
        where: {
            username: {
                contains: `id=${ctx.chat.id}`,
            },
        },
        select: { username: true },
    });
    if (stdUser || adminUser) {
        if (useCtx) {
            await ctx.reply(
                "you are already registered login please",
                markups.freshMarkup
            );
        }
        if (adminUser) {
            return 2;
        }
        return 1;
    } else {
        return 0;
    }
};
const findId = (username) => {
    try {
        return username
            .match(/id=.*"/)
            .shift()
            .split("id=")
            .pop()
            .split(`"`)
            .shift();
    } catch {
        return username;
    }
};
const findName = (username) => {
    try {
        return username
            .match(/>.*</)
            .shift()
            .split(">")
            .pop()
            .split("<")
            .shift();
    } catch {
        return username;
    }
};
const addTripSend = async (bot, id, data, includeMarkup = true) => {
    let sent = data.posterPictures.split(" ");
    sent.pop();
    const len = sent.length;
    console.log(
        "------------\n",
        data,
        "------------\n",
        sent.map((element, index) => {
            return {
                type: "photo",
                media: element,
                caption: index === len - 1 ? data.description : undefined,
            };
        }),
        "\n------------"
    );
    const returned = await bot.telegram.sendMediaGroup(
        id,
        [
            sent.map((element, index) => {
                return {
                    type: "photo",
                    media: element,
                    caption: index === len - 1 ? data.description : undefined,
                };
            }),
        ][0]
    );
    includeMarkup &&
        (await bot.telegram.sendMessage(
            id,
            "approve this post?",
            markups.tripApproveMarkup(data.id)
        ));
    return returned;
};
/**
 *
 * @param {any} ctx
 * @param {Function} next
 */
const refresh = (ctx, next) => {
    delete sessionData.login[ctx.chat.id];
    next();
};
module.exports = {
    helpStrings,
    allModels,
    isAdmin,
    isLoggedIn,
    isValid,
    sessionData,
    markups,
    isRegistered,
    addTripSend,
    findId,
    findName,
    isSuperAdmin,
    refresh,
};
