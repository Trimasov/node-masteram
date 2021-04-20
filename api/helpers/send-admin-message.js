module.exports = {


    friendlyName: "SendAdminMessage",


    description: "Sends message to admins",


    inputs: {
        messageData: {
            type: "ref",
            required: true
        }

    },
    exits: {

    },

    fn: async function (inputs, exits) {
        let reciver = await User.find({
            where: {
                isAdmin: true,
            },
            select: ["id", "contactsList"]
        });
        for (let user in reciver){
            let topic = `1_${reciver[user].id}`;
            if (reciver[user].contactsList.indexOf(1) === -1){
                reciver[user].contactsList.push(1);
                await User.update({id: reciver[user].id}, {contactsList: reciver[user].contactsList});
            }
            let message = {
                messageType: inputs.messageData.messageType,
                topic: topic,
                text: inputs.messageData.text
            };
            //console.log("creating message");
            if (inputs.messageData.order){
                message.order = inputs.messageData.order;
            }
            await Message.create(message);
        }
        return exits.success();

    }
};

