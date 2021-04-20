/**
 * UserOrder.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        userId: {
            model: "user"
        },
        orderId: {
            model: "order"
        },
        orderStatus: {
            type: "string",
            allowNull: true
        },
    },

};

