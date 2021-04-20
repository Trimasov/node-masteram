/**
 * TypeWork.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

		/* ID специализации */
		specId: {
            type: "number",
            columnType: "integer"
        },

        /* Наименовние работы */
		name: {
            type: "string"
        },

    },

};

