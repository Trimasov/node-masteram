/**
 * Log.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        logType: {
            type: "string",
        },

        text: {
            type: "string",
            columnType: "text"
        },

        logData: {
            type: "json"
        }
    },


};

