/**
 * CustomController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    api: (req, res) => {
        res.view();
    },

    landing: (req, res) => {
        res.view();
    },

    masterpage: async (req, res)=>{
        let master = req.param("id");
        let user = await User.findOne({id: master});
        if (user && user.pro){
            user.jobTypes = user.jobTypes.split(",").map((ele)=>{return sails.config.globals.proffesions[ele]});
            res.view({user: user});
        }else{
            res.send("Master not found");
        }
    },

    anketa: async (req, res) =>{
        if (req.body && req.body.name){
            await Partner.create(req.body);
            let partnerData = JSON.stringify(req.body);
            let text = `Заполнена заявка от партнеров данные заявки ${partnerData}`;
            let messageData = {
                messageType: "text",

            };
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
                    messageType: "text",
                    topic: topic,
                    text: text
                };

                let messageCreated = await Message.create(message).fetch();
            }

            res.send("Анкета принята в обработку");

        }else{
            res.view();
        }
    }
};

