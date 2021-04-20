module.exports = {


    friendlyName: "",


    description: "",


    inputs: {
        order: {
            type: "ref",
            required: true
        },

    },


    exits: {

    },


    fn: async function (inputs, exits) {
        //Fields to clear from order model
        let fields = ["price", "approved", "approvedBy"];
        for (let fieldIndex in fields){
            let field = fields[fieldIndex];
            try {
                delete inputs.order[field];
            } catch (e){
                console.log(e);
            }
        }
        return exits.success(inputs.order);

    }


};

