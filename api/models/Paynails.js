/**
 * Paynails.js
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

        /* Наименовние услуги */
        serviceName: {
            type: "string"
        },

    },

};

