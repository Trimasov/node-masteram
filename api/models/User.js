/**
 * User.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        /*
        * Емайл пользователя
        * */

        email: {
            type: "string",
            isEmail: true,
        // unique: true
        },

        /*
        * Имя пользоватея
        * */
        name: {
            type: "string",
        },

        /*
        * Фамилия пользоватея
        * */
        surname: {
            type: "string",
        },

        /*
        * Ник, возможно не будет использоватся
        * */
        nick: {
            type: "string",
        },

        /*
        * Своё текстовое поле, с неким описанием
        * */
        description: {
            type: "string",
        },

        topic: {
            type: "string",
        },

        avatar: {
            type: "string"
        },

        //
        /*
        * Список частных частов через запятую
        * */
        privateChats: {
            type: "string",
        },

        phoneNumber: {
            type: "string",
        },

        /*
        * Является ли пользователь админом
        * */
        isAdmin: {
            type: "boolean",
            defaultsTo: false
        },

        /* JSON: с фотографиями пользователя */
        photos: {
            type: "json"
        },

        /* JSON: время последней активности */
        lastActivity: {
            type: "number",
            allowNull: true
        },

        /* JSON: список специальностей */
        jobTypes: {
            type: "string",
            allowNull: true
        },

        /*
        * Список заблокированных контактов
        * */

        blockedContacts: {
            type: "string",
            allowNull: true,
            defaultsTo: ""
        },


        /*google id*/
        gAuthSub: {
            type: "string",
            allowNull: true
        },

        /*
        * Опыт работы в годах
        * */
        jobExpirience: {
            type: "number",
            allowNull: true
        },

        /*
        * Токен для firebase
        * */
        firebaseToken: {
            type: "string",
            allowNull: false,
            defaultsTo: ""
        },

        pro: {
            type: "boolean",
            defaultsTo: false
        },

        noemail: {
            type: "boolean",
            defaultsTo: false,
        },

        /*
        * trial - начальная
        * paid - оплатил
        * not_paid - не оплаченная
        * */
        subscriptionType: {
            type: "string",
            allowNull: true
        },

        platform: {
            type: "string",
            defaultsTo: "android",
        },
        version: {
            type: "string",
        },
        notValidFireBaseToken: {
            type: "boolean",
            defaultsTo: false
        },

        /**/
        subscriptionTill: {
            type: "string",
            allowNull: true
        },

        /*
        * Номер менеджера
        * */
        reff: {
            type: "string",
            allowNull: true,
        },

        tester: {
            type: "boolean",
            defaultsTo: false,
            allowNull: true
        },


        /*
        * Статус пользователя
        *
        * 1 - Всё отлично
        * 2 - Под санкциями, не может писать в общие чаты например
        * 3 - Заблокирован
        *
        * */
        userStatus: {
            type: "number",
            columnType: "integer",
            defaultsTo: 1,
        },

        userWaitForUnblock: {
            type: "number",
            columnType: "bigint(20)",
        },

        /*
        * Система контроля пользователей
        * карма максимум 25
        * при карме -5 автоматом ставится блок
        * при потери кармы за раз более 10 возможно будут ставится санкции
        * */
        userKarma: {
            type: "number",
            columnType: "integer",
            defaultsTo: 0
        },

        karmaGivenBy: {
            type: "json",
            defaultsTo: []
        },

        contactsList: {
            type: "json",
            defaultsTo: []
        },

        // ordersList: {
        //     type: "json",
        //     defaultsTo: {}
        // },

        wishCity: {
            type: "string",
            allowNull: true
        },

        /*
        * Токен который сгенерирован для пользователя при логине
        * */
        userToken: {
            type: "string",
        },

        nails: {
            type: "number",
            columnType: "integer",
            defaultsTo: 0
        },

        /*
        * Рефреш токен
        *  */
        // userRefreshToken: {
        //     type: "string",
        // },

        /*
        * Время жизни обычного токена, до какой даты проще говоря, после этой даты, пользователю следует запросить
        * свежий токен
        * */
        // userTokenLifeTime: {
        //     type: "string",
        // },

        unread: {
            type: "json",
            defaultsTo: {}
        },

        activeCoupons: {
            type: "json",
            defaultsTo: []
        },

        /*
        * Является заказчиков
        * */
		isCustomer: {
			type: "boolean",
			defaultsTo: false,
			allowNull: false
		},

        /*
        * Мастер рекомендован
        * */
		isRecommended: {
            type: "boolean",
            defaultsTo: false,
            allowNull: false
		},

        /*
        * Мастер рекомендован до (timestamp)
        * */
		recommendedEnd: {
			type: "number",
			columnType: "bigint(20)",
			defaultsTo: 0
		}
    },

    beforeCreate: function (valuesToSet, proceed) {
        require("crypto").randomBytes(48, (ex, buf) => {
            valuesToSet.userToken = buf.toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
            return proceed();
        });
        // sails.helpers.passwords.hashPassword(valuesToSet.password).exec((err, hashedPassword)=>{
        //     if (err) { return proceed(err); }
        //     valuesToSet.password = hashedPassword;
        //     return proceed();
        // });//_∏_
    },

    beforeUpdate: async function (valuesToSet, proceed) {
        // Hash password
        //await User.findOne({})

        // sails.helpers.passwords.hashPassword(valuesToSet.password).exec((err, hashedPassword)=>{
        //     if (err) { return proceed(err); }
        //     valuesToSet.password = hashedPassword;
        //
        // });//_∏_
        return proceed();
    }

};


/*
*             isIn: [
            ]

*
* */
