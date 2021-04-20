/**
 * Banner.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */


module.exports = {

    attributes: {

        /* Текст сообщения */
        text: {
            type: "string",
            columnType: "text"
        },

        topic: {
            type: "string"
        },

        image: {
            type: "string",
            defaultsTo: ""
        },

        title: {
            type: "string"
        },

        active: {
            type: "boolean",
            defaultsTo: false
        },

        hours: {
            type: "json"
        },

        sentTimes: {
            type: "number",
            columnType: "integer",
            defaultsTo: 0
        },

        phoneNumber: {
            type: "string",
            allowNull: true
        },

        //Ссылка банера
        link: {
            type: "string",
            allowNull: true
        },

        //Текст ссылки банера
        linkText: {
            type: "string",
            allowNull: true
        },

        //По каким дня недели показывать баннер
        weekDay: {
            type: "string",
            allowNull: true
        }


    },

};

