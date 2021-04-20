/**
 * Partner.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {

        //Название компании
        name: {
            type: "string"
        },

        phoneNumber: {
            type: "string",
        },

        address: {
            type: "string",
        },

        topic: {
            type: "string",
        },

        email: {
            type: "string",
        },

        emailForCoupon: {
            type: "string",
        },

        image: {
            type: "string",
        },

        active: {
            type: "boolean"
        },

        couponOn: {
            type: "boolean"
        },

        couponStartDate: {
            type: "number"
        },

        couponTerm: {
            type: "number"
        },

        couponEndDate: {
            type: "number"
        },

        couponAmount: {
            type: "number",
            defaultsTo: -1 // -1 Бесконечное колличество купонов
        },

        lastGivenCoupon: {
            type: "string",
            allowNull: true
        },

        searchWords: {
            type: "string"
        },

        couponDescription: {
            type: "string"
        },

        memberCoupon: {
            type: "boolean"
        },

        couponDiscount: {
            type: "number"
        },

        couponMemberDiscount: {
            type: "number"
        },

        couponsPerUser: {
            type: "number",
            defaultsTo: -1 // -1 Бесконечное колличество купонов на человека
        },

        couponAbriviation: {
            type: "string",
            columnType: "varchar(3)",
        }

    },

};

