/**
 * Message.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        user: {
            model: "user"
            // type: "number",
            // columnType: "integer",
        },

        /* Текст сообщения */
        text: {
            type: "string",
            columnType: "text"
        },

        title: {
            type: "string",
            columnType: "text"
        },

        /* Тип сообщения */
        messageType: {
            type: "string"
        },

        image: {
            type: "json"
        },

        sound: {
            type: "json"
        },

        /* Ид персонажа которому отвечает пользователь */
        answer: {
            type: "number",
            allowNull: true,
            columnType: "integer"
        },

        /* Статус сообщения пожаловались на него или нет*/
        messageAbused: {
            type: "number",
            columnType: "integer"
        },

        messageAbuseCount: {
            type: "json"
        },

        messageAbuseDeclined: {
            type: "json",
            defaultsTo: []
        },

        abuseType: {
            type: "string"
        },

        /* Отсылка туда где подписаны пользователи */
        topic: {
            type: "string"
        },

        firebaseSent: {
            type: "boolean",
            defaultsTo: false
        },

        privateMessage: {
            type: "boolean",
            defaultsTo: false
        },

        privateMessageRecepient: {
            type: "number",
            columnType: "integer"
        },

        chatId: {
            type: "number",
            columnType: "integer"
        },

        deleted: {
            type: "boolean",
            defaultsTo: false
        },

        read: {
            type: "boolean",
            defaultsTo: false
        },

        jobType: {
            type: "string",
            allowNull: true
        },

        data: {
            type: "json",
            defaultsTo: {}
        },
        order: {
            model: "order"
        }
    },

    afterCreate: async (newlyCreatedRecord, proceed) => {
        // See documentation on defining a message payload.
        let fcmMsg = {
            android: {
                ttl: 3600 * 1000, // 1 hour in milliseconds
                priority: 'normal',
                data: {},
            },
            token: ""
		};
		newlyCreatedRecord.isPaid = false;
        console.log(newlyCreatedRecord);
        let privateChat = newlyCreatedRecord.topic.indexOf("_") !== -1;
        if (newlyCreatedRecord.user){
            let user = await User.findOne({id: newlyCreatedRecord.user});

            newlyCreatedRecord.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                description: user.description,
                surname: user.surname,
                topic: user.topic,
                avatar: user.avatar,
                phoneNumber: user.phoneNumber,
                jobTypes: user.jobTypes,
                jobExpirience: user.jobExpirience,
                pro: user.pro,
                userStatus: user.userStatus,
                userWaitForUnblock: user.userWaitForUnblock,
				userKarma: user.userKarma,
				isCustomer: user.isCustomer
            };
        }else{
            newlyCreatedRecord.user = {
                "id": 0,
                "name": "",
                "surname": "",
                "nick": "",
                "description": "",
                "avatar": "",
                "phoneNumber": "",
                "isAdmin": false,
                "photos": null,
                "lastActivity": null,
                "jobTypes": "",
                "jobExpirience": 0,
                "pro": false,
                "userStatus": 1,
                "userWaitForUnblock": 0,
                "userKarma": 1,
                "karmaGivenBy": null,
				"contactsList": [],
				"isCustomer": false
            };
        }

        if (newlyCreatedRecord.answer){
            let messageAnswered = await Message.findOne({id: parseInt(newlyCreatedRecord.answer)}).populate("user");
            if (messageAnswered){
                newlyCreatedRecord.answer = messageAnswered;
                if (newlyCreatedRecord.answer.answer){
                    delete newlyCreatedRecord.answer.answer;
                }
                delete newlyCreatedRecord.answer.user.userToken;
                delete newlyCreatedRecord.answer.user.privateChats;
                delete newlyCreatedRecord.answer.user.blockedContacts;
                delete newlyCreatedRecord.answer.user.gAuthSub;
                delete newlyCreatedRecord.answer.user.firebaseToken;
                delete newlyCreatedRecord.answer.user.contactsList;
                delete newlyCreatedRecord.answer.user.activeCoupons;
            }else{
                newlyCreatedRecord.answer = null;
            }
        }

        if (!newlyCreatedRecord.firebaseSent){
            if (privateChat){
                //Личные сообщения
                let ids = newlyCreatedRecord.topic.split("_");

                for (let i = 0; i < ids.length; i++){
                    let recepient = await User.findOne({
                        where: {id: parseInt(ids[i])},
                        select: ["firebaseToken", "unread"]
                    });

                    if (recepient.id !== newlyCreatedRecord.user.id){
                        if (recepient.unread[newlyCreatedRecord.topic]){
                            recepient.unread[newlyCreatedRecord.topic] += 1;
                        }else{
                            recepient.unread[newlyCreatedRecord.topic] = 1;
                        }
                        await User.update({id: recepient.id}, {unread: recepient.unread});
                    }

                    fcmMsg.token = recepient.firebaseToken;
                    //newlyCreatedRecord.unread = recepient.unread;
                    let msg = Object.assign({}, newlyCreatedRecord);
                    msg.unread = recepient.unread;
                    fcmMsg.data = {
                        messageData: JSON.stringify(msg)
                    };
                    sails.config.globals.firebase.admin.messaging().send(fcmMsg).then((response) => {
                        // Response is a message ID string.
                        //console.log("Successfully sent message:", response);
                    }).catch((error) => {
                        //TODO: помечать инвалидные токены фаербейса
                        //console.log("Error sending message:", error);
                    });
                }

            }else{
                //Общий чат
                let users = await User.find({
                    where: {
                        topic: newlyCreatedRecord.topic,
                        firebaseToken: { "!=" : ""},
                        // notValidFireBaseToken: false

                    }
                });
                users.forEach(async (user) => {
                    if (user.id !== newlyCreatedRecord.user.id){
                        if (user.unread[newlyCreatedRecord.topic]){
                            user.unread[newlyCreatedRecord.topic] += 1;
                        }else{
                            user.unread[newlyCreatedRecord.topic] = 1;
                        }
                        await User.update({id: user.id}, {unread: user.unread});
                    }
                    if (user.blockedContacts.split(",").includes(newlyCreatedRecord.user)){
                        return false;
                    }
                    //newlyCreatedRecord.unread = user.unread;
                    fcmMsg.token = user.firebaseToken;
                    let msg = Object.assign({}, newlyCreatedRecord);
					msg.unread = user.unread;
                    fcmMsg.data = {
                        messageData: JSON.stringify(msg)
                    };

                    fcmMsg.android.data = {
                        messageData: JSON.stringify(newlyCreatedRecord)
                    };


                    sails.config.globals.firebase.admin.messaging().send(fcmMsg).then((response) => {
                        // Response is a message ID string.
                    }).catch((error) => {
                        //console.log(`Не доходят сообщения до юзера ${user.id}`);
                        if (error.errorInfo.code && error.errorInfo.code === "messaging/registration-token-not-registered"){
                            //console.log(`not valid token for user ${user.id}`);
                            User.update({id: user.id}, {notValidFireBaseToken: true}).exec((err, res)=>{
                                if (err){
                                    console.log(err);
                                }
                            });
                        }else if(error.errorInfo.code && error.errorInfo.code === "messaging/invalid-argument"){
                            console.log("messaging/invalid-argument", fcmMsg);
                        }
                    });

                    //Отдельное сообщение для пушей в иосе
                    if (user.platform === "ios" && user.id !== newlyCreatedRecord.user.id){
                        console.log("sending ios message");
                        let iosFcmMsg = {
                            "notification":{
                                "body" : newlyCreatedRecord.text,
                                "title" : `Новое сообщение в чате ${newlyCreatedRecord.topic}`,
                            },
                            token: user.firebaseToken
                        };
                        sails.config.globals.firebase.admin.messaging().send(iosFcmMsg).then((response) => {
                            // Response is a message ID string.
                        }).catch((error) => {
                            if (error.errorInfo.code && error.errorInfo.code === "messaging/registration-token-not-registered"){
                                //console.log(`not valid token for user ${user.id}`);
                                User.update({id: user.id}, {notValidFireBaseToken: true}).exec((err, res)=>{
                                    if (err){
                                        console.log(err);
                                    }
                                });
                            }else if(error.errorInfo.code && error.errorInfo.code === "messaging/invalid-argument"){
                                console.log("messaging/invalid-argument", fcmMsg);
                            }
                        });

                    }
                });
            }

            await Message.update({id: newlyCreatedRecord.id}, {"firebaseSent": 1});
        }
        return proceed();
    }

};

