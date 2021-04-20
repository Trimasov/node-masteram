module.exports = {


    friendlyName: "Firebase sender",


    description: "",


    inputs: {
        messageData: {
            type: "ref",
            required: true
        }
    },


    exits: {

    },


    fn: async function (inputs, exits) {

    // All done.
        return exits.success();

    }


};

