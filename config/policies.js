/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {

    /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions, unless overridden.       *
  * (`true` allows public access)                                            *
  *                                                                          *
  ***************************************************************************/

    // '*': true,
    UserController: {
        "*": ["tokenValid"], //, "hasUnpaidContract"
        getMessages2: ["tokenValid"],
        sendMessage2: ["tokenValid"],
        sendAbuse2: ["tokenValid"],
        getContactsList2: ["tokenValid"],
        ping: true,
        auth: true,
        blockUser: "isAdmin",
        registerTest: true,
        createUserTest: true,
        someTest: true,
        unsubscribeEmail: true,
//        toRecommended: true,
//        subscribe: true,
//		paidMessage: true,
        recommendedList: true
    },

    OrderController: {
        "*": ["tokenValid"], //, "hasUnpaidContract"
		approveOrder: ["tokenValid"],
		registerOrder: true
    },

    AdminController: {
        "*": "loggedIn",
        login: true
    }

};
