module.exports = {


    friendlyName: "",


    description: "",


    inputs: {
        message: {
            type: "ref",
            required: true
        },

    },


    exits: {

    },


    fn: async function (inputs, exits) {
        if (inputs.message.user){
            delete inputs.message.user.userToken;
            delete inputs.message.user.privateChats;
            delete inputs.message.user.blockedContacts;
            delete inputs.message.user.gAuthSub;
            delete inputs.message.user.firebaseToken;
            delete inputs.message.user.unread;
            delete inputs.message.user.activeCoupons;
        }
        // All done.
        return exits.success(inputs.message);

    }


};

