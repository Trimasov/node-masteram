/**
 * Stats.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        statDate: {
            type: "number"
        },

        statType: {
            type: "string"
        },

        data: {
            type: "json"
        }
    },

};

