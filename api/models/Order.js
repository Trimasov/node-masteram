/**
 * Order.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        phoneNumber: {
            type: "string",
            allowNull: true
        },

        jobType: {
            type: "string",
            allowNull: true
        },

        name: {
            type: "string",
            allowNull: true
        },

        price: {
            type: "string",
            allowNull: true
        },

        address: {
            type: "string",
            allowNull: true
        },

        description: {
            type: "string",
            allowNull: true
        },

        topic: {
            type: "string",
            allowNull: true
        },

        approved: {
            type: "boolean",
            defaultsTo: false
        },

        approvedBy: {
            model: "user"
        },

        creator: {
            model: "user"
        },

        addedBy: {
            model: "user"
        },

        termTill: {
            type: "number",
            columnType: "bigint(20)",
            allowNull: true
        },

        termFrom: {
            type: "number",
            columnType: "bigint(20)",
            allowNull: true
        },

        takenBy: {
            model: "user"
        },

        categoryId: {
            type: "number",
			columnType: "integer",
			defaultsTo: 0
        },

        //Ожидаемая наценка
        possibleProfit: {
            type: "string",
            allowNull: true
        },

        //Ожидаемый процент
        possiblePercent: {
            type: "string",
            allowNull: true
        },

        //По договору или просто
        contract: {
            type: "boolean",
            defaultsTo: false,
            allowNull: true
        },

        //Нал безнал
        cashless: {
            type: "boolean",
            defaultsTo: false,
            allowNull: true
        },

        comment: {
            type: "string",
            columnType: "text",
            allowNull: true
        },

        // waiting_approve - ждёт подтверждения (не используется)
        // approved
        // fresh - только созданный
        // booked - забронирован
        // picked - подтвержденно бронирование
        // closed - закрыт
        orderStatus: {
            type: "string",
            allowNull: true
        },

        paid: {
            type: "boolean",
            defaultsTo: false,
            allowNull: true
        }


    },

};

