/**
 * Payment.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        userId: {
            type: "number",
            columnType: "integer"
        },

        amount: {
            type: "number",
            columnType: "integer"
        },

        tillDate: {
            type: "string"
        },

        paid: {
            type: "boolean",
            defaultsTo: false
        },

        /* Айди яндекса на платёжку */
        requestId: {
            type: "string"
        },

        instanceId: {
            type: "string"
        },

        //purpose of payment
        purpose: {
            type: "string"
        },

        //Id of aimed object that was paid
        aimId: {
            type: "number",
            columnType: "integer"
        },


    },

};

