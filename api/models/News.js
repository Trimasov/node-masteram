/**
 * News.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        message: {
            type: "string",
            columnType: "longtext"
        },

        active: {
            type: "boolean",
            defaultsTo: true
        },

        topic: {
            type: "string",
            defaultsTo: "any"
        }
    },

};

