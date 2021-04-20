/**
 * Global Variable Configuration
 * (sails.config.globals)
 *
 * Configure which global variables which will be exposed
 * automatically by Sails.
 *
 * For more information on any of these options, check out:
 * https://sailsjs.com/config/globals
 */

module.exports.globals = {

    /****************************************************************************
    *                                                                           *
    * Whether to expose the locally-installed Lodash as a global variable       *
    * (`_`), making  it accessible throughout your app.                         *
    * (See the link above for help.)                                            *
    *                                                                           *
    ****************************************************************************/

    _: require("@sailshq/lodash"),

    /****************************************************************************
    *                                                                           *
    * Whether to expose the locally-installed `async` as a global variable      *
    * (`async`), making it accessible throughout your app.                      *
    * (See the link above for help.)                                            *
    *                                                                           *
    ****************************************************************************/

    async: require("async"),

    /****************************************************************************
    *                                                                           *
    * Whether to expose each of your app's models as global variables.          *
    * (See the link at the top of this file for more information.)              *
    *                                                                           *
    ****************************************************************************/

    models: true,

    /****************************************************************************
    *                                                                           *
    * Whether to expose the Sails app instance as a global variable (`sails`),  *
    * making it accessible throughout your app.                                 *
    *                                                                           *
    ****************************************************************************/

    sails: true,
    firebase: {
        admin: false,
        databaseURL: "https://masteramtest.firebaseio.com"
    },

    //client_id: "B1D109DA80F228435583765199A8E2F29AA77B48BE61455EAE3865FD66DD4373", //мой
    client_id: "FC3E68BB09658D1C23DDFB61543BE68AC8127883056DF03D372969F4C4574F83", //Серёгин

    order_status: {
        fresh: "новый",
        taken: "забронирован",
        confirmed: "подтвержденно бронирование",
        closed: "закрыт"
    },

    proffesions: {
        "betonshhik": "Бетонщик",
        "burilshhik": "Бурильщик",
        "perevozchik": "Перевозчик",
        "dizajner": "Дизайнер",
        "kamenshhik": "Каменщик",
        "svarshhik": "Сварщик",
        "krovelshhik": "Кровельщик",
        "otdelochnik": "Отделочник",
        "inzhener": "Инженер",
        "prorab": "Прораб",
        "raznorabochij": "Разнорабочий",
        "alpinist": "Альпинист",
        "santehnik": "Сантехник",
        "plitochnik": "Плиточник",
        "elektrik": "Электрик",
        "kondicionershhik": "Кондиционерщик",
        "gazovshhik": "Газовщик",
        "fasadchik": "Фасадчик",
        "plotnik": "Плотник",
        "okonshhik": "Оконщик",
        "drugoe": "Другое",
        "universal": "Универсал"
	},

	nailsCost: require("./nailsCost"),
	versions: require("./versions")
};
