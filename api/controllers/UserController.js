/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const nodeDownload = require("download");
const fs = require("fs");
const fse = require("fs-extra");
//const gm = require("gm");

const publicUserFields = [
    "id",
    "email",
    "name",
    "surname",
    "topic",
    "phoneNumber",
    "pro",
	"userKarma",
	"isCustomer",
	"isRecommended",
	"recommended"
];

let genereateYandexLink = (data) => {
    const b = [];
    Object.keys(data.acs_params).map((n) => {
        b.push(`${n}=${data.acs_params[n]}`);
    });
    console.log(`${data.acs_uri}?${b.join("&")}`);

    return `${data.acs_uri}?${b.join("&")}`;
};

let versionIsAllowed = async (platform, version) => {
	const ver = (version.length > 0 ? 'v' + version : '')
	if(platform === 'android' && ((sails.config.globals.versions.blockUndefined && ver.length === 0) || (sails.config.globals.versions.blockUnallowed && !sails.config.globals.versions.allowed[ver]))){
		return false
	}else{
		return true
	}
}

let getRegion = async (city) => {
	const cfg = await Config.findOne({id: 1})
	cfg.citylist["Нарния"] = ["Столица Нарнии"]
	let regions = Object.keys(cfg.citylist)
	for (let region of regions){
		if(cfg.citylist[region].includes(city)){
			return region
		}
	}
	return ""
}

module.exports = {

    /**
     * @api {get} /ping ping
     * @apiName ping
     * @apiGroup User
     *
     * @apiSuccess {String} pong just pong
     */
    ping: (req, res) => {
        return res.send("pong");
    },


    /** Тесты */
    /************************************************** **/
    registerTest: async (req, res) => {
        let data = {};
        res.view(data);
    },

    createUserTest: async (req, res) => {
        let user = await User.create({name: "Bob"}).fetch();
        console.log(user);
        res.json({});
    },

    someTest: async (req, res) => {

        let n = await nodeDownload(
            "https://lh6.googleusercontent.com/-j0eBcz6hRVI/AAAAAAAAAAI/AAAAAAAAFUw/TKtnXEPwm80/s96-c/photo.jpg",
            sails.config.appPath + "/assets/images/avatars/",
            {filename: "avatar1.jpg"}
        );
        console.log(n);



        res.json({});
    },

    getUnworkingTokens: async (req, res) => {
        let users = await User.find({});
        let fcmMsg = {
            android: {
                ttl: 3600 * 1000, // 1 hour in milliseconds
                priority: "normal",
                data: {},
            },
            token: ""
        };

        let phones = [];
        users.forEach((user) => {
            fcmMsg.token = user.firebaseToken;
            fcmMsg.android.data = {
                testdata: ""
            };
            sails.config.globals.firebase.admin.messaging().send(fcmMsg).then((response) => {
                // Response is a message ID string.
                //console.log('Successfully sent message:', response);
            }).catch((error) => {
                console.log(user.phoneNumber);
                //phones.push(user.phone);
                //console.log('Error sending message:', error);
            });
        });
        return res.json();

    },
    /** Конец тоестов*/

    /****
    * Блок регистрации
    ****/
    auth: async (req, res) => {
        if (req.body && req.body.IdToken){
            const {OAuth2Client} = require("google-auth-library");
            const client = new OAuth2Client("596684235300-i72e186nsk70kfiu9avdjgjoqo0b4bd0.apps.googleusercontent.com");
			const platform = req.body.platform ? req.body.platform : "android";
			const version = req.body.version ? req.body.version : '';
            async function verify() {
                const ticket = await client.verifyIdToken({
                    idToken: req.body.IdToken,
                });
                const payload = ticket.getPayload();

                //Проверяем есть ли такой юзер, если есть возвращаем его
                let user = await User.findOne({email: payload["email"]});
                if (user){
					if (user.platform !== platform || user.version !== version){
                        User.update({id: user.id}, {platform: platform, version: version}).exec((err) => {
                            if (err){
                                console.log(err);
                            }
                        });
					}

					user.versionAllowed = await versionIsAllowed(platform, version)

					return user;
                }else{
                    let hardcodedSubscriptionTill = 0;
                    //Заполняем данные нового юзера данными гугла
                    let userData = {
                        email: payload["email"],
                        gAuthSub: payload["sub"],
                        name: payload["given_name"] ? payload["given_name"] : "",
                        surname: payload["family_name"] ? payload["family_name"]: "",
                        subscriptionType: "trial",
                        subscriptionTill: hardcodedSubscriptionTill,
						platform: platform,
						version: version,
                        notValidFireBaseToken: false
                    };

                    //Создаём нового юзера
                    let user = await User.create(userData).fetch();
                    if (user){
                        user.status = "new";

                        //Если есть картинка пробуем её скачать и записываем в аватарки
                        if (payload.picture && payload.picture.length){
                            let d = new Date();
                            let extension = payload.picture.split(".").slice(-1).pop();
                            let filename = `avatar${user.id}_${d.getMonth()}${d.getDate()}${d.getHours()}${d.getMinutes()}.${extension}`;
                            try {
                                await nodeDownload(
                                    payload.picture,
                                    sails.config.appPath + "/assets/images/avatars/",
                                    {filename: filename}
                                );
                                await fse.copy(`${sails.config.appPath}/assets/images/avatars/${filename}`, `${sails.config.appPath}/assets/images/avatars/thumb/${filename}`);
                            } catch (e){
                                console.log(e);
                            }
                            user.avatar = `/images/avatars/${filename}`;
                            await User.update({id: user.id}, {avatar: user.avatar});
						}

						user.versionAllowed = await versionIsAllowed(platform, version)

						return user;
					}else{
                        return {status: "db_error"};
					}
				}
            }
            verify().then((n)=>{
                return res.json(n);
            }).catch((e) => {
                console.log(e);
                return res.json({status: "gauth_error"});
            });

        }else{
            return res.json({status: "error"});
        }
    },

    refreshToken: (req, res) => {
        return res.json({status: "ok"});
    },

    uploadProfileImage: async (req, res) => {
        return res.json({status: "ok"});
    },

    uploadChatImage: async (req, res) => {
        return res.json({status: "ok"});
    },

    uploadSound: async (req, res) => {
        return res.json({status: "ok"});
    },

    updateProfile: async (req, res) => {
        let user = await User.findOne({id: parseInt(req.body.userId)});
        //Ставим статус про если заполнен номер телефона, емайл, професия, и 5 фоток, и опты работы больше нуля
        console.log(user.phoneNumber && user.phoneNumber !== "" && user.phoneNumber.length);
        console.log(user.name && user.name !== "" && user.name.length);
        console.log(user.surname && user.surname !== "" && user.surname.length);
        if (user.phoneNumber && user.phoneNumber !== "" && user.phoneNumber.length &&
            user.name && user.name !== "" && user.name.length &&
            user.surname && user.surname !== "" && user.surname.length &&
            user.jobExpirience && user.jobExpirience > 0 &&
            user.photos && user.photos.length > 4 &&
            user.jobTypes && user.jobTypes.split(",").length
        ){
            req.body.pro = true;
        }else{
            req.body.pro = false;
		}

		// Смотрим параметр заказчика
		if(req.body.toCustomer === "true"){
			req.body.isCustomer = true
		}else{
			delete req.body.isCustomer
		}

		// Смотрим реферала
		if (req.body.referralPhone && req.body.referralPhone !== ""){
			let referral = await User.find({phoneNumber: req.body.referralPhone});
			if(referral && referral.length === 1){
				// Зачисляем гвозди тому, кто рекомендовал
				await User.update({
					id: referral[0].id
				}, {
					nails: (referral[0].nails + sails.config.globals.nailsCost.referral)
				});
				await Paynails.create({userId: referral[0].id, amount: sails.config.globals.nailsCost.referral, serviceName: 'referral'}).fetch();

				// Зачисляем гвозди новому юзеру за то, что он воспользовался приглашением
				await User.update({
					id: user.id
				}, {
					nails: (referral[0].nails + sails.config.globals.nailsCost.referralNew)
				});
				await Paynails.create({userId: user.id, amount: sails.config.globals.nailsCost.referralNew, serviceName: 'referral'}).fetch();
			}
		}

        let newRecord = await User.update({id: parseInt(req.body.userId)}, req.body).fetch();

        if (newRecord && newRecord.length){
            return res.json({status: "ok", pro: newRecord[0].pro});
        }else{
            return res.json({status: "error"});
        }

    },

    uploadAvatar: async (req, res) => {
        let userId = req.body.userId;
        let dirname = sails.config.appPath + "/assets/images/avatars/";
        let extension = req.file("avatar")._files[0].stream.filename.split(".").slice(-1).pop();
        let d = new Date();
        let filename = `avatar${userId}_${d.getMonth()}${d.getDate()}${d.getHours()}${d.getMinutes()}.${extension}`;

        let n = await sails.helpers.fileUpload(req, filename, dirname, "avatar");
        if (n){
            return res.json({"status": n});
        }

        //Создаём самбнейл
        await sails.helpers.createThumb(`${dirname}${filename}`, `${dirname}thumb/${filename}`);

        //Обновляем информацию у пользователя
        await User.update({id: parseInt(req.body.userId)}, {avatar: `/images/avatars/thumb/${filename}`});

        return res.json({status: "ok", imageUrl: `/images/avatars/${filename}`, imageThumbUrl: `/images/avatars/thumb/${filename}`});
    },


    uploadToAlbum: async (req, res) => {
        let userId = req.body.userId;

        let dirname = `${sails.config.appPath}/assets/images/albums/${userId}/`;

        if (!fs.existsSync(dirname)){
            fs.mkdirSync(dirname);
            fs.mkdirSync(`${dirname}/thumb`);
        }

        let extension = req.file("photo")._files[0].stream.filename.split(".").slice(-1).pop();

        let user = await User.findOne({id: userId});

        let d = new Date();
        let filename = `${d.getTime()}_${userId}.${extension}`;

        if (user.photos && user.photos.length >= 5){
            return res.json({status: "count_error"}); //Больше 5 фоток
        }else{

            let n = await sails.helpers.fileUpload(req, filename, dirname, "photo");
            if (n){
                return res.json({"status": n});
            }

            await sails.helpers.createThumb(`${dirname}${filename}`, `${dirname}thumb/${filename}`);

            let photo = {
                imageUrl: `/images/albums/${userId}/${filename}`,
                imageThumbUrl: `/images/albums/${userId}/thumb/${filename}`
            };

            if (!user.photos){
                user.photos = [];
            }
            user.photos.push(photo);

            if (user.phoneNumber && user.phoneNumber !== "" && user.phoneNumber.length &&
                user.name && user.name !== "" && user.name.length &&
                user.surname && user.surname !== "" && user.surname.length &&
                user.jobExpirience && user.jobExpirience > 0 &&
                user.photos && user.photos.length > 4 &&
                user.jobTypes && user.jobTypes.split(",").length
            ){
                user.pro = true;
            }else{
                user.pro = false;
            }

            await User.update({id: parseInt(req.body.userId)}, {photos: user.photos, pro: user.pro});

            return res.json({status: "ok", photo: photo, photos: user.photos});
        }

    },

    removeFromAlbum: async (req, res) => {
        if (req.body.photo){
            let userId = req.body.userId;
            let user = await User.findOne({id: userId});
            let imageToDelete = req.body.photo;
            let dirname = `${sails.config.appPath}/assets/images/albums/${userId}/`;
            let photoIndex = user.photos.findIndex((ele) => {console.log(ele.imageUrl, imageToDelete);  return ele.imageUrl.trim() === imageToDelete.trim();});
            if (photoIndex !== -1){
                let imageName = user.photos[photoIndex].imageUrl.split("/").slice(-1).pop();
                if (fs.existsSync(`${dirname}thumb/${imageName}`)){
                    fs.unlinkSync(`${dirname}thumb/${imageName}`);
                }
                if (fs.existsSync(`${dirname}${imageName}`)){
                    fs.unlinkSync(`${dirname}${imageName}`);
                }
                user.photos.splice(photoIndex, 1);
                if (user.phoneNumber && user.phoneNumber !== "" && user.phoneNumber.length &&
                    user.name && user.name !== "" && user.name.length &&
                    user.surname && user.surname !== "" && user.surname.length &&
                    user.jobExpirience && user.jobExpirience > 0 &&
                    user.photos && user.photos.length > 4 &&
                    user.jobTypes && user.jobTypes.split(",").length
                ){
                    user.pro = true;
                }else{
                    user.pro = false;
                }
                await User.update({id: userId}, {photos: user.photos, pro: user.pro});
                return res.json({status: "ok", photos: user.photos});
            }else{
                return res.json({status: "imageNotFound_error"});
            }
        }else{
            return res.json({status: "photo_error"});
        }
        //User.update({})
    },


    removeAvatar: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let user = User.update({id: userId}, {avatar: ""}).fetch();
        if (user){
            return res.json({status: "ok"});
        }else{
            return res.json({status: "db_error"});
        }

    },

    setFCMToken: async (req, res) => {
        if (req.body.firebaseToken && req.body.userId){
            if ((await User.update({id: req.body.userId}, {firebaseToken: req.body.firebaseToken, notValidFireBaseToken: false}).fetch()).length){
                return res.json({status: "ok"});
            }else{
                return res.json({status: "error"});
            }

        }
    },

    blockUser: async (req, res) => {
        if (req.body.userToBlock && req.body.statusToSet && req.body.userWaitForUnblock){
            let d = new Date();
            let blockDate = parseInt(req.body.userWaitForUnblock) + d.getTime();
            let update = await User.update(
                {id: req.body.userToBlock},
                {userStatus: req.body.statusToSet, userWaitForUnblock: blockDate}
            );
            return res.json({status: "ok"});
        }
        return res.json({status: "error"});
    },

    blockContact: async (req, res) => {
        if (req.body.contactToBlock){
            console.log(req.body.contactToBlock);
            let userId = parseInt(req.body.userId);
            let user = await User.findOne({id: userId});
            let contactToBlock = req.body.contactToBlock;
            let blockedContacts = user.blockedContacts.length ?
                user.blockedContacts.split(",") : [];

            if (!blockedContacts.includes(contactToBlock)){
                blockedContacts.push(contactToBlock);
            }
            User.update({id: userId}, {blockedContacts: blockedContacts.join(",")}).exec((err, res)=>{
                if (err){
                    console.log(err);
                }
            });
            return res.json({status: "ok", blockedContacts: blockedContacts});
        }
        return res.json({status: "error"});
    },

    /* TODO: возможно оно не нужно, или переделать в личные чаты */
    subscribeChat: async (req, res) => {
        if (req.body.topicToSubscribe){
            let user = await User.update({id: req.body.userId}, {topic: req.body.topicToSubscribe});
            return res.json({status: "ok"});
        }
        return res.json({status: "error"});
    },

    sendMessage: async (req, res) => {
        if (req.body.text && req.body.messageType){
            let user = await User.findOne({id: req.body.userId});
            let privateChat = (req.body.topic.indexOf("_") !== -1);

            //Блокировка не касается личных сообщений
            if (!privateChat){
                //Проверям не заблокирован ли пользователь для общих собщений
                let d = new Date();
				let currentTime = d.getTime();
				let versionAllowed = await versionIsAllowed(user.platform, user.version)
                d.setTime(user.userWaitForUnblock);
                if (user.userWaitForUnblock > currentTime || !versionAllowed){
					if(!versionAllowed) d.setTime(currentTime + (86400 * 30 * 1000));
                    return res.json({
                        status: "error",
                        description: "user_blocked",
                        timeLeft: (versionAllowed ? (user.userWaitForUnblock - currentTime) : (d.getTime() - currentTime)),
                        blockTill: `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`
                    });
                }else{
                    //Снимаем блок если время вышло
                    await User.update({id: req.body.userId}, {userStatus: 1, userWaitForUnblock: 0});
                }
            }else{
                //частные чаты проверяем есть ли у собеседника в списке контактов отправляющий, если нету добавляем

                let ids = req.body.topic.split("_");
                ids.splice(ids.indexOf(req.body.userId + ""),1);
                let recipientId = ids[0];
                let recipient = await User.findOne({id: recipientId});

                if (recipient.contactsList.indexOf(parseInt(req.body.userId)) === -1){
                    recipient.contactsList.push(parseInt(req.body.userId));
                    await User.update({id: recipient.id}, {contactsList: recipient.contactsList});
                }
            }
            let messageData = req.body;
            messageData.user = messageData.userId;

            //Если сообщение содержит файл
            if (messageData.messageType === "sound" || messageData.messageType === "image"){
                let dirname = `${sails.config.appPath}/assets/images/chat_uploads/`;
                let extension = req.file("file")._files[0].stream.filename.split(".").slice(-1).pop();
                let d = new Date();
                let filename = `${d.getTime()}_${user.id}.${extension}`;
                let n = await sails.helpers.fileUpload(req, filename, dirname, "file");
                if (n){
                    return res.json({"status": n});
                }
                if (messageData.messageType === "image"){
                    await sails.helpers.createThumb(`${dirname}${filename}`, `${dirname}thumb/${filename}`);
                    messageData[messageData.messageType] = {
                        imageUrl: `/images/chat_uploads/${filename}`,
                        imageThumbUrl: `/images/chat_uploads/thumb/${filename}`
                    };
                }else{
                    messageData[messageData.messageType] = {
                        soundUrl: `/images/chat_uploads/${filename}`
                    };
                }
            }

            let message = await Message.create(messageData).fetch();

			message.isPaid = false;
            message.user = user;
            message = await sails.helpers.clearUser(message);
            if (message.answer){
                let messageAnswered = await Message.findOne({id: parseInt(messageData.answer)}).populate("user");
                message.answer = await sails.helpers.clearUser(messageAnswered);
                //Удаляем answer у вложенного ответа
                if (typeof message.answer.answer !== "undefined"){
                    delete message.answer.answer;
                }
            }
            return res.json(message);
        }else{
            return res.json({status: "error"});
        }
    },

    sendMessage2: async (req, res) => {
        if (req.body.text && req.body.messageType){
            let user = await User.findOne({id: req.body.userId});
            let privateChat = (req.body.topic.indexOf("_") !== -1);

            if (user.isAdmin){
                let args = req.body.text.split(" ");
                //Подтвердить сообщение из сайта для отсылки
                if (!isNaN(parseInt(args[0]))  && args[1] && args[1].length && args[1].toLowerCase() === "да"){
                    //Отсылаем заказ
                    let order = await Order.findOne({id: args[0]});
                    if (order && !order.approved){
                        let text = `Описание работ: ${order.description}${order.jobType.length && order.jobType !== "undefined" ? `, Специалист: ${sails.config.globals.proffesions[order.jobType]}, ` : ""}${order.price.length ? `, Цена: ${order.jobType}, ` : ""}Телефон: ${order.phoneNumber} `;
                        let message = {
                            messageType: "text",
                            //topic: order.topic,
                            topic: "Столица Нарнии",
                            text: text
                        };
                        if (order.jobType && order.jobType !== "undefined"){
                            message.jobType = order.jobType;
                        }

                        await Order.update({id: order.id}, {approved: true, approvedBy: user.id});

                        //Отсылаем само сообщение в чат
                        let messageCreated = await Message.create(message).fetch();
                    }

                }
            }

            //Блокировка не касается личных сообщений
            if (!privateChat){
                //Проверям не заблокирован ли пользователь для общих собщений
                let d = new Date();
				let currentTime = d.getTime();
				let versionAllowed = await versionIsAllowed(user.platform, user.version)
                d.setTime(user.userWaitForUnblock);
                if (user.userWaitForUnblock > currentTime || !versionAllowed){
					if(!versionAllowed) d.setTime(currentTime + (86400 * 30 * 1000));
                    return res.json({
                        status: "error",
                        description: "user_blocked",
						timeLeft: (versionAllowed ? (user.userWaitForUnblock - currentTime) : (d.getTime() - currentTime)),
                        blockTill: `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`
                    });
                }else{
                    //Снимаем блок если время вышло
                    await User.update({id: req.body.userId}, {userStatus: 1, userWaitForUnblock: 0});
                }
            }else{
                //частные чаты проверяем есть ли у собеседника в списке контактов отправляющий, если нету добавляем

                let ids = req.body.topic.split("_");
                ids.splice(ids.indexOf(req.body.userId + ""),1);
                let recipientId = ids[0];
                let recipient = await User.findOne({id: recipientId});

                if (recipient.contactsList.indexOf(parseInt(req.body.userId)) === -1){
                    recipient.contactsList.push(parseInt(req.body.userId));
                    await User.update({id: recipient.id}, {contactsList: recipient.contactsList});
                }
                if (user.contactsList.indexOf(parseInt(recipientId)) === -1){
                    user.contactsList.push(parseInt(recipientId));
                    await User.update({id: user.id}, {contactsList: user.contactsList});
                }
            }
            let messageData = req.body;
            messageData.user = messageData.userId;

            //Если сообщение содержит файл
            if (messageData.messageType === "sound" || messageData.messageType === "image"){
                let dirname = `${sails.config.appPath}/assets/images/chat_uploads/`;
                let extension = req.file("file")._files[0].stream.filename.split(".").slice(-1).pop();
                let d = new Date();
                let filename = `${d.getTime()}_${user.id}.${extension}`;
                let n = await sails.helpers.fileUpload(req, filename, dirname, "file");
                if (n){
                    return res.json({"status": n});
                }
                if (messageData.messageType === "image"){
                    await sails.helpers.createThumb(`${dirname}${filename}`, `${dirname}thumb/${filename}`);
                    messageData[messageData.messageType] = {
                        imageUrl: `/images/chat_uploads/${filename}`,
                        imageThumbUrl: `/images/chat_uploads/thumb/${filename}`
                    };
                }else{
                    messageData[messageData.messageType] = {
                        soundUrl: `/images/chat_uploads/${filename}`
                    };
                }
            }

			let message = await Message.create(messageData).fetch();
			
			message.isPaid = false;
            message.user = user;
            message = await sails.helpers.clearUser(message);
            if (message.answer){
                let messageAnswered = await Message.findOne({id: parseInt(messageData.answer)}).populate("user");
                message.answer = await sails.helpers.clearUser(messageAnswered);
                //Удаляем answer у вложенного ответа
                if (typeof message.answer.answer !== "undefined"){
                    delete message.answer.answer;
                }
            }
            return res.json({status: "ok", message: message});
        }else{
            return res.json({status: "error", message: {}});
        }
    },

    deleteMessage: async (req, res) => {
        if (req.body.messageId){
            let user = await User.findOne({id: parseInt(req.body.userId)});
            let conditions = {
                id: parseInt(req.body.messageId),
                deleted: 0
            };
            if (!user.isAdmin){
                conditions.user = parseInt(req.body.userId);
            }
            let message = await Message.findOne(conditions).populate("user");
            if (message){
                let messageAfterUpdate = await Message.update({id: req.body.messageId}, {deleted: true});
                delete message.user.userToken;
                delete message.user.topic;
                delete message.user.privateChats;
                delete message.user.blockedContacts;
                delete message.user.gAuthSub;
                delete message.user.firebaseToken;
                delete message.user.activeCoupons;
                message.deleted = true;
				message.answer = null;
				message.isPaid = false;
                // if (message.answer){
                //     let messageAnswer = await Message.findOne({id: parseInt(message.answer)}).populate("user");
                //     if (messageAnswer){
                //         message.answer = await sails.helpers.clearUser(JSON.parse(JSON.stringify(messageAnswer)));
                //         //Удаляем answer у вложенного ответа
                //         if (typeof message.answer.answer !== "undefined"){
                //             delete message.answer.answer;
                //         }
                //     }else{
                //         message.answer = null;
                //     }
                //
                // }
                //
                let users = await User.find({
                    where: {
                        topic: message.topic,
                        firebaseToken: { "!=" : ""}

                    },
                    select: ["firebaseToken"]
                });

                let fcmMsg = {
                    android: {
                        ttl: 3600 * 1000, // 1 hour in milliseconds
                        priority: "normal",
                        data: {},
                    },
                    token: ""
                };

                users.forEach((user) => {
                    fcmMsg.token = user.firebaseToken;
                    fcmMsg.data = {
                        //messageDeleted: "1",
                        messageData: JSON.stringify(message)
                    };
                    console.log(fcmMsg);
                    sails.config.globals.firebase.admin.messaging().send(fcmMsg).then((response) => {
                        // Response is a message ID string.
                        console.log('Successfully sent message:', response);
                    }).catch((error) => {
                        console.log('Error sending message:', error);
                    });
                });

                return res.json(message);
            }else{
                //Уже удаленно или такого в базе не найденно, или принадлежит другому пользователю
                return res.json({status: "message_error"});
            }
        }else{
            return res.json({status: "error"});
        }
    },

    sendAbuse: async (req, res) => {
        if (req.body.messageId && req.body.abuseType){
            let user = await User.findOne({id: req.body.userId});
			let message = await Message.findOne({id: parseInt(req.body.messageId), messageAbused: 0, deleted: false}).populate("user");
            let d = new Date();
            let currentTime = d.getTime();
            if (message && message.messageAbused === 0 && (currentTime - message.createdAt) < 2*60*60*1000){
                await Message.update(
                    {id: parseInt(req.body.messageId)},
                    {
                        abuseType: req.body.abuseType,
                        messageAbuseCount: [],
                        messageAbused: 1});
                message = await sails.helpers.clearUser(await Message.findOne({id: parseInt(req.body.messageId)}).populate("user"));
                message.answer = null;

                //Посылаем пуш уведомление
                let users = await User.find({
                    where: {
                        topic: message.topic,
                        firebaseToken: { "!=" : ""},
                        //id: {"!=": parseInt(req.body.userId)} //Уведомление всем кроме этого пользователя
                    },
                    select: ["firebaseToken"]
                });

                let fcmMsg = {
                    android: {
                        ttl: 3600 * 1000, // 1 hour in milliseconds
                        priority: "normal",
                        data: {},
                    },
                    token: ""
                };

                users.forEach(async (user) => {
					fcmMsg.token = user.firebaseToken;
					let messagePaid = await MessagePaid.findOne({messageId: message.id, userId: user.id});
					if (messagePaid){
						message.isPaid = true;
					}else{
						message.isPaid = false;
					}
                    fcmMsg.data = {
                        messageData: JSON.stringify(message)
                    };
                    sails.config.globals.firebase.admin.messaging().send(fcmMsg).then((response) => {
                        // Response is a message ID string.
                        console.log("Successfully sent message:", response);
                    }).catch((error) => {
                        console.log("Error sending message:", error);
                    });
                });

                return res.json({status: "ok"});
            }else{
                // Status 2 - уже пожаловались или нету такого сообщения(wtf) или вышло 2 часа
                return res.json({status: 2});
            }

        }
        return res.json({status: "error"});
    },

    sendAbuse2: async (req, res) => {
        if (req.body.messageId && req.body.abuseType){
            let user = await User.findOne({id: req.body.userId});
            let message = await Message.findOne({id: parseInt(req.body.messageId), messageAbused: 0, deleted: false}).populate("user");
            let d = new Date();
            let currentTime = d.getTime();
            if (message && message.messageAbused === 0 && (currentTime - message.createdAt) < 2*60*60*1000){
                await Message.update(
                    {id: parseInt(req.body.messageId)},
                    {
                        abuseType: req.body.abuseType,
                        messageAbuseCount: [],
                        messageAbused: 1});
                message = await sails.helpers.clearUser(await Message.findOne({id: parseInt(req.body.messageId)}).populate("user"));
                message.answer = null;

                //Посылаем пуш уведомление
                let users = await User.find({
                    where: {
                        topic: message.topic,
                        firebaseToken: { "!=" : ""},
                        //id: {"!=": parseInt(req.body.userId)} //Уведомление всем кроме этого пользователя
                    },
                    select: ["firebaseToken"]
                });

                let fcmMsg = {
                    android: {
                        ttl: 3600 * 1000, // 1 hour in milliseconds
                        priority: "normal",
                        data: {},
                    },
                    token: ""
                };

                users.forEach(async (user) => {
                    fcmMsg.token = user.firebaseToken;
					let messagePaid = await MessagePaid.findOne({messageId: message.id, userId: user.id});
					if (messagePaid){
						message.isPaid = true;
					}else{
						message.isPaid = false;
					}
                    fcmMsg.data = {
                        messageData: JSON.stringify(message)
                    };
                    sails.config.globals.firebase.admin.messaging().send(fcmMsg).then((response) => {
                        // Response is a message ID string.
                        console.log("Successfully sent message:", response);
                    }).catch((error) => {
                        console.log("Error sending message:", error);
                    });
                });

                return res.json({status: "ok"});
            }else{
                // Status 2 - уже пожаловались или нету такого сообщения(wtf) или вышло 2 часа
                return res.json({status: 2});
            }

        }
        return res.json({status: "error"});
    },

    approveAbuse: async (req, res) => {
        if (req.body.messageId){
            let message = await Message.findOne({id: parseInt(req.body.messageId), messageAbused: 1, deleted: 0}).populate("user");
            //let user = await User.findOne({id: req.body.userId});
            let userId = parseInt(req.body.userId);
            let d = new Date();
            let currentTime = d.getTime();
            let midnightDayStart = d.setHours(0, 0, 0, 0);
            let midnightDayEnd = d.setHours(23, 59, 59, 0);
            //TODO: вернуть 12
            let abuseTotalCountToDelete = 2;

            if (message && message.messageAbused === 1 &&
                message.messageAbuseDeclined && message.messageAbuseDeclined.indexOf(userId) === -1 && //Этот пользователь уже подтвердил абузу или отверг не даём ему повторить и выдаём статус 2
                message.messageAbuseCount && message.messageAbuseCount.indexOf(userId) === -1
            ){

                message.messageAbuseCount.push(userId); //Добавляем айди пользователя в список пожаловавшихся

                let userAbused = await User.findOne({id: message.user.id});
                //Понижаем карму, если набралось 12 абузов
                if (message.messageAbuseCount.length >= abuseTotalCountToDelete){
                    await User.update({id: userAbused.id}, {userKarma: userAbused.userKarma - 1});
                    //TODO: Если карма меньше -4 тогда блок полный
                }
                console.log(message.messageAbuseCount.length >= abuseTotalCountToDelete);
                await Message.update(
                    {
                        id: message.id
                    },
                    {
                        abuseType: req.body.abuseType,
                        messageAbuseCount: message.messageAbuseCount,
                        deleted: message.messageAbuseCount.length >= abuseTotalCountToDelete
                    }
                );

                message = await sails.helpers.clearUser(await Message.findOne({id: parseInt(req.body.messageId)}).populate("user"));

                //Если 3 раза пожаловались в течении суток на пользователя автоматичиски ставится молчанка на 24 часа
                let messagesAbusedPerDay = await Message.find({
                    where: {
                        user: userAbused.id,
                        messageAbused: 1,
                        // messageAbuseCount: { ">=": 15 },
                        createdAt: {">=": midnightDayStart, "<=": midnightDayEnd}
                    }
                });
                if (messagesAbusedPerDay.filter((n)=>{ return n.messageAbuseCount.length >= abuseTotalCountToDelete;}).length > 2){
                    //Ставится молчанка, так как за сегодня его сообщения были заблокированы 3 раза
                    await User.update({id: userAbused.id}, {userWaitForUnblock: currentTime + 2*60*60*1000});
                }
                //Посылаем пуш уведомление только когда полностью наберется абуза
                if (message.messageAbuseCount && message.messageAbuseCount.length >= abuseTotalCountToDelete){
                    let users = await User.find({
                        where: {
                            topic: message.topic,
                            firebaseToken: { "!=" : ""}

                        },
                        select: ["firebaseToken"]
                    });

                    let fcmMsg = {
                        android: {
                            ttl: 3600 * 1000, // 1 hour in milliseconds
                            priority: "normal",
                            data: {},
                        },
                        token: ""
                    };
                    delete message.abuseType;
                    users.forEach(async (user) => {
                        fcmMsg.token = user.firebaseToken;
						let messagePaid = await MessagePaid.findOne({messageId: message.id, userId: user.id});
						if (messagePaid){
							message.isPaid = true;
						}else{
							message.isPaid = false;
						}
						fcmMsg.data = {
                            messageData: JSON.stringify(message)
                        };
                        sails.config.globals.firebase.admin.messaging().send(fcmMsg).then((response) => {
                            // Response is a message ID string.
                            console.log(fcmMsg);
                            console.log("Successfully sent message:", response);
                        }).catch((error) => {
                            console.log("Error sending message:", error);
                        });
                    });
                }

                return res.json({status: "ok"});
            }else{
                // Status 2 - уже пожаловались или нету такого сообщения(wtf)
                return res.json({status: 2});
            }

        }else{
            return res.json({status: "error"});
        }
    },

    declineAbuse: async (req, res) => {
        if (req.body.messageId){
            let userId = parseInt(req.body.userId);
            let message = await Message.findOne({
                where: {
                    id: parseInt(req.body.messageId),
                    messageAbused: 1,
                    deleted: 0
                },
                select: ["id", "messageAbuseCount", "messageAbuseDeclined"]
            });
            if (message){
                if (message.messageAbuseCount.indexOf(userId) !== -1 ||
                    message.messageAbuseDeclined.indexOf(userId) !== -1){
                    res.json({status: "error"});
                }else{
                    message.messageAbuseDeclined.push(userId);
                    await Message.update({id: message.id}, {messageAbuseDeclined: message.messageAbuseDeclined});
                    res.json({status: "ok"});
                }
            }else{
                res.json({status: 2});
            }
        }else{
            res.json({status: "error"});
        }
    },

    contactAdd: async (req, res) => {
        if (req.body.contact){
            let user = await User.findOne({id: req.body.userId});
            if (user.contactsList.indexOf(parseInt(req.body.contact)) === -1){
                user.contactsList.push(parseInt(req.body.contact));
                await User.update({id: req.body.userId}, {contactsList: user.contactsList});
            }
            return res.json({status: "ok"});
        }else{
            return res.json({status: "error"});
        }
    },

    contactRemove: async (req, res) => {
        if (req.body.contact){
            let user = await User.findOne({id: req.body.userId});
            let contactIndex = user.contactsList.indexOf(parseInt(req.body.contact));
            console.log(contactIndex);
            if (contactIndex > -1){
                user.contactsList.splice(contactIndex, 1);
            }
            await User.update({id: req.body.userId}, {contactsList: user.contactsList});
            return res.json({status: "ok"});
        }else{
            return res.json({status: "error"});
        }
    },

    getContactsList: async (req, res) => {
        let user = await User.findOne({id: req.body.userId});
        if (user.contactsList.length){
            let result = [];
            for (let i = 0; i < user.contactsList.length; i++){
                let contact = await User.findOne({id: user.contactsList[i]});
                let topic = `${user.id < user.contactsList[i] ? user.id : user.contactsList[i]}_${user.id < user.contactsList[i] ? user.contactsList[i] : user.id}`;
                contact.lastMessage = await Message.find({
                    where: {
                        topic: topic
                    },
                    select: ["text", "messageType", "createdAt"],
                    limit: 1,
                    sort: "createdAt DESC"
                });
                contact.unreadCount = (user.unread[topic] ? user.unread[topic] : 0);
                contact.updatedAt = "asd";
                if (contact.lastMessage.length){
                    contact.updatedAt = contact.lastMessage.createdAt;
                }else{
                    contact.lastMessage = [{id: 0, messageType: "text", text: ""}];
                    contact.updatedAt = 1;
                }

                delete contact.userToken;
                delete contact.privateChats;
                delete contact.blockedContacts;
                delete contact.gAuthSub;
                delete contact.firebaseToken;
                result.push(contact);
            }
            return res.json(result);
        }else{
            return res.json([]);
        }
    },

    getContactsList2: async (req, res) => {
        let user = await User.findOne({id: req.body.userId});
        if (user.contactsList.length){
            let result = [];
            for (let i = 0; i < user.contactsList.length; i++){
                let contact = await User.findOne({id: user.contactsList[i]});
                let topic = `${user.id < user.contactsList[i] ? user.id : user.contactsList[i]}_${user.id < user.contactsList[i] ? user.contactsList[i] : user.id}`;
                contact.lastMessage = await Message.find({
                    where: {
                        topic: topic
                    },
                    select: ["text", "messageType", "createdAt"],
                    limit: 1,
                    sort: "createdAt DESC"
                });
                contact.unreadCount = (user.unread[topic] ? user.unread[topic] : 0);
                contact.lastMessage = (contact.lastMessage.length ? contact.lastMessage : [{id: 0, messageType: "text", text: ""}]);
                contact.updatedAt = (contact.lastMessage.length ? contact.lastMessage[0].createdAt : contact.updatedAt);
                delete contact.userToken;
                delete contact.privateChats;
                delete contact.blockedContacts;
                delete contact.gAuthSub;
                delete contact.firebaseToken;
                result.push(contact);
            }
            try{
                result.sort((l,r)=>{ if (l.lastMessage[0].createdAt < r.lastMessage[0].createdAt) { return -1; }else{ return 1;} });
            }catch(e){
                console.log(e);
            }
            return res.json({status:"ok", contacts:result});
        }else{
            return res.json({status:"ok", contacts:[]});
        }
    },

    setMessageRead: async (req, res)=>{
        let userId = parseInt(req.body.userId);
        if (req.body.topic){
            let topic = req.body.topic;
            let user = await User.findOne({id: userId});

            user.unread[topic] = 0;

            await User.update({id: userId}, {unread: user.unread});

            return res.json({status: "ok", user: user});
        }else{
            return res.json({status: "no message id supplied"});
        }
    },

    //!!! Old
    getMessages: async (req, res) => {
        let messages = false;
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});
        if (req.body.topic){
            let conditions = {
                limit: req.body.count ? req.body.count : 20,
                sort: "createdAt DESC"
            };

            conditions.where = req.body.from ? {
                topic: req.body.topic,
                id: {"<" : parseInt(req.body.from)},
                deleted: false
            } :  {
                topic: req.body.topic,
                deleted: false
            };

            if (req.body.filterUserJobs){
                let jobTypes = user.jobTypes.split(",");
                conditions.where.or = [];
                jobTypes.forEach((job)=>{
                    conditions.where.or.push({"jobType": job.trim()});
                });
            }

            messages = await Message.find(conditions).populate("user");

            if (messages && messages.length){
                for (let i =0; i < messages.length; i++){
                    await Message.update({id: messages[i].id}, {read: true});
                    if (!messages[i].user){
                        messages[i].user = {
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
                            "contactsList": []
                        };
                    }
                    if (messages[i] && messages[i].user){
                        messages[i] = await sails.helpers.clearUser(messages[i]);
                    }
                    if (messages[i].answer){
                        let messageAnswered = await Message.findOne({id: parseInt(messages[i].answer)}).populate("user");
                        messages[i].answer = await sails.helpers.clearUser(JSON.parse(JSON.stringify(messageAnswered)));
                        //Удаляем answer у вложенного ответа
                        if (typeof messages[i].answer.answer !== "undefined"){
                            delete messages[i].answer.answer;
                        }

                    }
                    //Затираем абуз тайп если запрашивающий есть в списке проголосовавших или отклонивших
                    if (messages[i].messageAbused && (messages[i].messageAbuseCount || messages[i].messageAbuseDeclined)){
                        if (messages[i].messageAbuseCount && messages[i].messageAbuseCount.indexOf(userId) !== -1 ||
                            messages[i].messageAbuseDeclined && messages[i].messageAbuseDeclined.indexOf(userId) !== -1){
                            delete messages[i].abuseType;
                        }
                    }

                }
            }else{
                messages = [];
            }
            return res.json(messages);
        }
        return res.json({status: "error"});
    },

    getMessages2: async (req, res) => {
        let messages = false;
        let topic = req.body.topic;

        if (topic){
            let userId = parseInt(req.body.userId);
            let user = await User.findOne({id: userId});
            let blockedContacts = user.blockedContacts.split(",");

            //Statistics
            if (!topic.includes("_")){
                let d = new Date();
                d.setHours(0,0,0,0);
                let todayStats = (await Stats.find({where: {statDate: d.getTime()}}))[0];

                if (!todayStats){
                    todayStats = {statDate: d.getTime(), data: {}, statType: "activity"};
                    await Stats.create(todayStats);
                }
                todayStats.data = (typeof todayStats.data === "string" ? JSON.parse(todayStats.data) : todayStats.data);

                if (!todayStats.data[topic]){
                    todayStats.data[topic] = [];
                }

                if (!todayStats.data[topic].includes(userId)){
                    todayStats.data[topic].push(userId);
                }
                await Stats.update({statDate: d.getTime()}, {data: todayStats.data});
            }

            user.unread[topic] = 0;
            User.update({id: userId}, {unread: user.unread}).exec((err, data) => {
                console.log(err, data);
            });

            let conditions = {
                limit: req.body.count ? req.body.count : 20,
                sort: "createdAt DESC"
            };

            conditions.where = req.body.from ? {
                topic: topic,
                id: {"<" : parseInt(req.body.from)},
                deleted: false,
                //user: { "!=" : blockedContacts }
            } :  {
                topic: topic,
                deleted: false,
                //user: { "!=" : blockedContacts }
            };

            if (req.body.filterUserJobs && user.jobTypes){
                let jobTypes = user.jobTypes.split(",");
                conditions.where.or = [];
                jobTypes.forEach((job)=>{
                    conditions.where.or.push({"jobType": job.trim()});
                });
            }

            messages = await Message.find(conditions).populate("user").populate("order");

            if (messages && messages.length){
                for (let i =0; i < messages.length; i++){
                    if (!messages[i].user){
                        messages[i].user = {
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
							"isRecommended": false,
							"isCustomer": false
                        };
                    }
                    if (messages[i] && messages[i].user){
                        messages[i] = await sails.helpers.clearUser(messages[i]);
                    }
                    if (messages[i].answer){
                        let messageAnswered = await Message.findOne({id: parseInt(messages[i].answer)}).populate("user");
                        if (messageAnswered){
							// Игнорируем ответ, если он был сделан для заказа, баг iOS
							if(messages[i].answer.messageType === 'order'){
								messages[i].answer = null;
							}else{
								messages[i].answer = await sails.helpers.clearUser(JSON.parse(JSON.stringify(messageAnswered)));
								//Удаляем answer у вложенного ответа
								if (typeof messages[i].answer.answer !== "undefined"){
									delete messages[i].answer.answer;
								}
							}
                        }else{
                            messages[i].answer = null;
                        }

					}
					// Сообщение было куплено
					let messagePaid = await MessagePaid.findOne({messageId: messages[i].id, userId: userId});
					if (messagePaid){
						messages[i].isPaid = true;
					}else{
						messages[i].isPaid = false;
					}
                    //Затираем абуз тайп если запрашивающий есть в списке проголосовавших или отклонивших
                    if (messages[i].messageAbused && (messages[i].messageAbuseCount || messages[i].messageAbuseDeclined)){
                        if (messages[i].messageAbuseCount && messages[i].messageAbuseCount.indexOf(userId) !== -1 ||
                            messages[i].messageAbuseDeclined && messages[i].messageAbuseDeclined.indexOf(userId) !== -1){
                            delete messages[i].abuseType;
                        }
                    }

                }
                messages = messages.filter((ele)=>{
                    return blockedContacts.includes(ele.user.id.toString()) ? false:true;                    //console.log(ele.user.id);
                });
            }else{
                messages = [];
			}
			const versionAllowed = await versionIsAllowed(user.platform, user.version)
			if(!versionAllowed){
				let d = new Date();
				let adminUser = await User.findOne({id: 8});
				let updateMessage = {
					createdAt: d.getTime(),
					updatedAt: d.getTime(),
					id: 0,
					text: 'ВНИМАНИЕ!\n\nВаша версия приложения устарела!\n\nНеобходимо зайти в Google Play Market и обновить приложение на новую версию.\n\nИли, напишите нам письмо. В настройках: "Написать администратору".\n\nС уважением,\nАдминистрация.',
					title: '',
					messageType: 'text',
					image: null,
					sound: null,
					answer: null,
					messageAbused: 0,
					messageAbuseCount: null,
					messageAbuseDeclined: [],
					abuseType: '',
					topic: topic,
					firebaseSent: true,
					privateMessage: false,
					privateMessageRecepient: 0,
					chatId: 0,
					deleted: false,
					read: true,
					jobType: null,
					data: {},
					user: adminUser,
					order: null,
					isPaid: false
				}
				messages.splice(0, 0, updateMessage)
			}
            return res.json({status: "ok", messages: messages});
        }
        return res.json({status: "error", messages: []});
    },

    /* Добавить заказ */
    addOrder: async (req, res) => {
        let orderData = Object.assign({}, req.body);
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});
        orderData.phoneNumber = req.body.phoneNumber ? req.body.phoneNumber : user.phoneNumber;
        orderData.approved = true;
        orderData.user = userId;
        orderData.topic = user.topic;
        orderData.name = `${user.name} ${user.surname}`;
        let order = await Order.create(orderData).fetch();

        let message = {
            messageType: "text",
            topic: "Столица Нарнии",
            //topic: order.topic,
            text: order.description
        };

        //Отсылаем само сообщение в чат
        Message.create(message).exec((err, data) => {
            console.log(err, data);
        });

        order = await sails.helpers.clearOrder(order);
        return res.json(order);
    },

    updateOrder: async (req, res) => {
        let orderId = parseInt(req.body.orderId);
        let userId = parseInt(req.body.userId);
        let orderBeforeUpdate = await Order.findOne({id: orderId});
        if (orderBeforeUpdate.user !== userId){
            return res.json({error: "Not owner"});
        }
        let d = new Date();

        //await Order.update({id: orderId}, req.body);
        //let order = await Order.findOne({id: orderId}).populate("user");
        let order = (await Order.update({id: orderId}, req.body).fetch())[0];

        //Оставляем только публичные поля
        //TODO: Перенести это в запрос
        //for (let prop in order.user) { if (!publicUserFields.includes(prop)) { delete order.user[prop]};}

        if (d.getTime() - parseInt(orderBeforeUpdate.updatedAt) > 360000){
            let message = {
                messageType: "text",
                topic: "Столица Нарнии",
                //topic: order.topic,
                text: order.description
            };

            //Отсылаем само сообщение в чат
            Message.create(message).exec((err, data) => {
                console.log(err, data);
            });
        }

        order = await sails.helpers.clearOrder(order);
        return res.json(order);
    },

    /*
    * @ req.body.userId
    * @ req.body.from
    * @ req.body.jobType
    * */
    getOrders: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let jobType = req.body.jobType;
        let filter = {};
        if (req.body.own){
            filter.user = userId;
        }else{
            filter.opened = true;
        }
        if (req.body.jobType){
            //jobType: req.body.jobType ? req.body.jobType : "any",
            filter.jobType = jobType;
        }
        if (req.body.from){
            filter.id = {"<" : parseInt(req.body.from)};
        }
        let orders = await Order.find({
            where: filter,
            limit: 20,
            sort: "updatedAt DESC"
        }).populate("user");
        for (let index in orders){
            let order = orders[index];
            order = await sails.helpers.clearOrder(order);
            for (let prop in order.user) {if (!publicUserFields.includes(prop)) { delete order.user[prop];}}
            orders[index] = order;

        }
        return res.json(orders);
    },

    getOrder: async (req, res) => {
        let orderId = parseInt(req.body.orderId);
        let order = await Order.findOne({id: orderId}).populate("user");

        for (let prop in order.user) { if (!publicUserFields.includes(prop)) { delete order.user[prop];}}

        order = await sails.helpers.clearOrder(order);
        return res.json(order);
    },

    closeOrder: async (req, res) => {
        let orderId = parseInt(req.body.orderId);
        let orderBeforeUpdate = await Order.findOne({id: orderId});
        if (orderBeforeUpdate.user !== userId){
            return res.json({error: "Not owner"});
        }
        await Order.update({id: orderId}, {open: false});
        let order = Order.findOne({id: orderId}).populate("user");
        order = await sails.helpers.clearOrder(order);
        return res.json(order);
    },

    getNews: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});
        let lastNews = await News.find({
            where: {
                topic: { in: [user.topic, "any"]},
                active: true
            },
            limit: 5,
            sort: "createdAt DESC"
        });

        res.json(lastNews);
    },

    payiTunes: async (req, res) => {
		if(req.body.id && req.body.userId && req.body.nails && req.body.receiptData){
			let userId = parseInt(req.body.userId)
			let nails = parseInt(req.body.nails)
			let user = await User.findOne({id: userId})
			if(user && nails > 0){
				const request = require("request")
				const requestData = {}
				requestData["receipt-data"] = req.body.receiptData
				request({
					method: 'POST',
					uri: "https://sandbox.itunes.apple.com/verifyReceipt",
					json: requestData
				}, async (err, resp, body) => {
					let result = {status: "error", description: "Transaction not found"}
					if(!err){
						let productId = nails.toString() + 'nails'
						if(body.receipt && Array.isArray(body.receipt.in_app) && body.receipt.in_app.length > 0){
							for(const inAppData of body.receipt.in_app){
								if(req.body.id === inAppData.transaction_id && productId === inAppData.product_id){
									// ---
									let newNails = (parseInt(user.nails) || 0) + parseInt(nails)
									await User.update({id: userId}, {nails: newNails})
									await Payment.create({
										userId: userId,
										amount: nails,
										tillDate: "",
										requestId: req.body.id,
										instanceId: productId,
										purpose: 'nails',
										paid: true
									})
									result.status = 'success'
									result.nails = newNails
									delete result.description
								}
							}
							res.json(result)
						}else{
							res.json(result)
						}
					}else{
						console.error('iTunes request error!\nRequest: ' + JSON.stringify(req.body) + '\nError:')
						console.error(err)
						res.json({status:"error", data: err});
					}
				})
			}else{
				res.json({status:"error", description: "Invalid request, user not found"})
			}
		}else{
			res.json({status:"error", description: "Invalid request"})
		}
	},

    payYandex: async (req, res) => {
        let yandexMoney = require("yandex-money-sdk");
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});
        let payPurpose = req.body.payPurpose;
        let order = false;
		let payAmount = 300;

		// Проверяем payPurpose
		if(!(payPurpose === "nails" || payPurpose === "order")){
			payPurpose = "nails";
		}

        //Если оплата заказа - логика
        if (payPurpose === "order" || req.body.orderId){
            let orderId = parseInt(req.body.orderId);
            order = await Order.findOne({id: orderId});
            if (order.orderStatus === "picked" && order.price !== ""){
                payAmount = parseInt(order.price)*0.1;
            }else{
                return res.send({status: "worng_price_or_status"});
            }
        }

        if (payPurpose === "nails"){
            payAmount = req.body.payAmount ? parseInt(req.body.payAmount) : 300;
        }

        //const payPurse = 410014427900122; //дре
        const payPurse = 410017128003041; //Сергей
        let instanceId = false;

        yandexMoney.ExternalPayment.getInstanceId(sails.config.globals.client_id,
            async (err, data) => {
                if(err) {
                    // process error
                    console.log(err);
                }
                instanceId = data.instance_id;
                let externalPayment = new yandexMoney.ExternalPayment(instanceId);
                let message_details = ``;
                if (payPurpose === "nails"){
                    message_details = `пополнение гвоздей для ${user.id}`;
                }else if (payPurpose === "order"){
                    message_details = `оплата заказа ${order.id} от ${user.id}`;
                }
                let message = `оплата masteramtut.ru: ${ message_details }`;
                let options = {
                    pattern_id: "p2p",
                    to: payPurse,
                    amount: payAmount,
                    message: message

                };

                externalPayment.request(options, async (err, data) => {
                    if(err) {
                        // process error
                        console.log(err);
                        return res.json({status: "error"});
                    }
                    let requestId = data.request_id;
                    let externalPaymentData = {
                        "request_id": requestId,
                        "ext_auth_success_uri": "http://masteramtut.ru/payment_success",
                        "ext_auth_fail_uri": "http://masteramtut.ru/payment_reffuse"
                    };
                    let newPayment = {
                        userId: user.id,
                        amount: payAmount,
                        tillDate: "",
                        requestId: requestId,
                        instanceId: instanceId,
                        purpose: payPurpose,
                    };
                    if (payPurpose === "order"){
                        newPayment.aimId = order.id;
                    }
                    if (payPurpose === "nails"){
                        newPayment.aimId = user.id;
                    }

                    let payment = await Payment.create(newPayment).fetch();

                    externalPayment.process(externalPaymentData, async (err, data) => {
                        if(err) {
                            console.log(err);
                            return res.json({status: "error"});
                        }
                        let url = genereateYandexLink(data);
                        return res.json({status: "ok", url: url, paymentId: payment.id});

                    });
                });
            });
    },

    payYandexDone: async (req, res) => {
        if (req.body.paymentId){
            let yandexMoney = require("yandex-money-sdk");
            let userId = parseInt(req.body.userId);
            let user = await User.findOne({id: userId});

            let payment = await Payment.findOne({id: parseInt(req.body.paymentId)});

            let order = false;
            if (payment.purpose === "order"){
                order = await Order.findOne({id: payment.aimId});
            }

            let externalPayment = new yandexMoney.ExternalPayment(payment.instanceId);
            console.log(payment, typeof payment);
            if (typeof payment === "undefined"){
                console.log("no such payment");
                return res.json({status: "error"});
            }
            let externalPaymentData = {
                "request_id": payment.requestId,
                "ext_auth_success_uri": "http://masteramtut.ru/payment_success",
                "ext_auth_fail_uri": "http://masteramtut.ru/payment_reffuse"
            };
            //Убеждаемся что оплата реально была осуществленна
            console.log("Checking if payment was real");
            console.log(payment.requestId);
            externalPayment.process(externalPaymentData, async (err, data) => {
                if(err) {
                    console.log(err);
                    return res.json({status: "error"});
                }
                if (data){
                    console.log("Payment status: ", data.status);
                    console.log(data);
                    if (data.status === "refused"){
                        console.log("Payment refused");
                        return res.json({status: "error", text: "payment refused"});
                    }else if (data.status === "success"){
                        // let currentDate = new Date();
                        // let dTill = new Date();
                        //оплата успешна сохраняем человека что он оплатил
                        //Если человек с оплаченным периудом, и этот периуд еще не закончился, добавляем ему эти 30 дней
                        // if (parseInt(user.subscriptionTill) > currentDate.getTime()){
                        //     dTill.setTime(user.subscriptionTill);
                        //     dTill.setDate(dTill.getDate() + 30);
                        // }else{
                        //     dTill.setDate(dTill.getDate() + 30);
                        // }
                        // user = await User.update({id: user.id}, {
                        //     subscriptionType: "paid",
                        //     subscriptionTill: dTill.getTime()
                        // }).fetch();no_such_permission
                        //Смотрим тип оплаты, если пополнение, пополняем гвозди
                        if (payment.purpose === "order"){
                            console.log("Marking order as paid ", payment.userId, order.id);
                            //Это оплата заказа
                            await Order.update({id: order.id}, {paid: true});
                            //Часть сумму отправляется на счёт гвоздей
                            await User.update({id: payment.userId}, {nails: (parseInt(user.nails) || 0) + parseInt(payment.amount / 2)})
                        }
                        if (payment.purpose === "nails"){
                            //Тут пополнение гвоздей
                            console.log("Write down new nails to user ", payment.userId);
                            await User.update({id: payment.userId}, {nails: (parseInt(user.nails) || 0) + parseInt(payment.amount)})
                        }

                        await Payment.update({id: payment.id}, {userId: user.id, paid: true});
                        return res.json({status: "ok"});
                    }
                }else{
                    return res.json({status: "error"});
                }
            });
        }else{
            return res.json({status: "error"});
        }
        // let processPaymentInterval = setInterval(()=>{

        //     });
        //
        // }, 5000);
    },

    payYandexSubscribe: async (req, res) => {
        let yandexMoney = require("yandex-money-sdk");
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});
        //let config = await Config.findOne({id: 1});
        const payAmount = 290;
        //const payPurse = 410014427900122; //дре
        const payPurse = 410017128003041; //Сергей
        let instanceId = false;

        let genereateYandexLink = (data) => {
            const b = [];
            Object.keys(data.acs_params).map((n) => {
                b.push(`${n}=${data.acs_params[n]}`);
            });
            console.log(`${data.acs_uri}?${b.join("&")}`);

            let url = `${data.acs_uri}?${b.join("&")}`;

            return url;
        };


        yandexMoney.ExternalPayment.getInstanceId(sails.config.globals.client_id,
            async (err, data) => {
                if(err) {
                    // process error
                    console.log(err);
                }
                // save it to DB
                console.log(data);
                instanceId = data.instance_id;
                //await Config.update({id: 1}, {yandexInstanceId: data.instance_id});
                let externalPayment = new yandexMoney.ExternalPayment(instanceId);
                let options = {
                    pattern_id: "p2p",
                    to: payPurse,
                    amount: payAmount,
                    message: "подписка на 30 дней на masteramtut.ru"

                };


                externalPayment.request(options, async (err, data) => {
                    if(err) {
                        // process error
                        console.log(err);
                        return res.json({status: "error"});
                    }
                    let requestId = data.request_id;
                    let externalPaymentData = {
                        "request_id": requestId,
                        "ext_auth_success_uri": "http://masteramtut.ru/payment_success",
                        "ext_auth_fail_uri": "http://masteramtut.ru/payment_reffuse"
                    };
                    let payment = await Payment.create({userId: user.id, amount: payAmount, tillDate: "", requestId: requestId, instanceId: instanceId}).fetch();
                    console.log(requestId);
                    externalPayment.process(externalPaymentData, async (err, data) => {
                        if(err) {
                            console.log(err);
                            return res.json({status: "error"});
                        }
                        let url = genereateYandexLink(data);
                        return res.json({status: "ok", url: url, paymentId: payment.id});

                    });
                });
            });
    },

    payYandexDoneSubscribe: async (req, res) => {
        if (req.body.paymentId){
            let yandexMoney = require("yandex-money-sdk");
            let userId = parseInt(req.body.userId);
            let user = await User.findOne({id: userId});
            let payment = await Payment.findOne({id: parseInt(req.body.paymentId)});
            let externalPayment = new yandexMoney.ExternalPayment(payment.instanceId);
            console.log(payment, typeof payment);
            if (typeof payment === "undefined"){
                console.log("no such payment");
                return res.json({status: "error"});
            }
            let externalPaymentData = {
                "request_id": payment.requestId,
                "ext_auth_success_uri": "http://masteramtut.ru/payment_success",
                "ext_auth_fail_uri": "http://masteramtut.ru/payment_reffuse"
            };
            //Убеждаемся что оплата реально была осуществленна
            console.log("Убеждаемся что оплата реально была осуществленна");
            console.log(payment.requestId);
            externalPayment.process(externalPaymentData, async (err, data) => {
                if(err) {
                    console.log(err);
                    return res.json({status: "error"});
                }
                if (data){
                    if (data.status === "refused"){
                        console.log("Payment refused");
                        return res.json({status: "error", text: ""});
                    }else if (data.status === "success"){
                        let currentDate = new Date();
                        let dTill = new Date();
                        //оплата успешна сохраняем человека что он оплатил
                        //Если человек с оплаченным периудом, и этот периуд еще не закончился, добавляем ему эти 30 дней
                        if (parseInt(user.subscriptionTill) > currentDate.getTime()){
                            dTill.setTime(user.subscriptionTill);
                            dTill.setDate(dTill.getDate() + 30);
                        }else{
                            dTill.setDate(dTill.getDate() + 30);
                        }
                        user = await User.update({id: user.id}, {
                            subscriptionType: "paid",
                            subscriptionTill: dTill.getTime()
                        }).fetch();
                        await Payment.update({id: payment.id}, {userId: user.id, tillDate: dTill.getTime()});
                        return res.json({status: "ok", user: user[0]});
                    }
                }else{
                    return res.json({status: "error"});
                }
            });
        }else{
            return res.json({status: "error"});
        }
        // let processPaymentInterval = setInterval(()=>{

        //     });
        //
        // }, 5000);
    },

    getProffesionsList:(req, res) => {
        res.json(sails.config.globals.proffesions);
    },

    getCitiesList: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});
        let list = await Config.findOne({id: 1});
        let result = [];

        for (let city in list.citylist){
            let cities = {city: city, areas: []};
            for (let i=0; i < list.citylist[city].length; i++){
                let peopleCount = await User.count({topic: list.citylist[city][i]});
                let area = {name: list.citylist[city][i], user_count: `(${peopleCount} ${[2,3,4].includes(peopleCount) ? "человека": "человек"})`};
                cities.areas.push(area);
            }
            result.push(cities);
        }
        if (user.tester){
            result.push({city: "Нарния", areas: [{name: "Столица Нарнии", user_count: "армия"}]});
        }
        res.json({cities: result});
    },

    getCitiesList2: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});
        let list = await Config.findOne({id: 1});
        let result = [];

        for (let city in list.citylist){
            let cities = {city: city, areas: []};
            for (let i=0; i < list.citylist[city].length; i++){
                let peopleCount = await User.count({topic: list.citylist[city][i]});
                let area = {name: list.citylist[city][i], user_count: `(${peopleCount} ${[2,3,4].includes(peopleCount) ? "человека": "человек"})`};
                cities.areas.push(area);
            }
            result.push(cities);
        }
        if (user.tester){
            result.push({city: "Нарния", areas: [{name: "Столица Нарнии", user_count: "армия"}]});
        }
        res.json({cities: result});
	},
	
    addKarma: async (req, res) => {
        let userId = parseInt(req.body.userId);
        if (req.body.targetUser){
            let user = await User.findOne({id: req.body.targetUser});
            if (!user.karmaGivenBy){
                user.karmaGivenBy = [];
            }
            console.log(user.karmaGivenBy);
            console.log(user.karmaGivenBy.indexOf(userId));
            console.log(user.userKarma);
            if (user.karmaGivenBy.indexOf(userId) === -1 && user.userKarma < 31){
                user.karmaGivenBy.push(userId);
                console.log(user.karmaGivenBy);
                //await User.update({id: user.id}, {});
                await User.update({id: req.body.targetUser}, {userKarma: user.userKarma + 1, karmaGivenBy: user.karmaGivenBy});
            }
            return res.json({status: "ok"});
        }else{
            return res.json({status: "error"});
        }
    },

    getUserData: async (req, res) => {
        if (req.body.requestUserId){
            let user = await User.findOne({id: req.body.requestUserId});
			const platform = req.body.platform ? req.body.platform : user.platform;
			const version = req.body.version ? req.body.version : user.version;
			//Для не своих запросов удалим токен из списка
            if (req.body.requestUserId !== req.body.userId){
                delete user.userToken;
                delete user.userRefreshToken;
                delete user.userTokenLifeTime;
                delete user.firebaseToken;
			}
			if (user.platform !== platform || user.version !== version){
				User.update({id: user.id}, {platform: platform, version: version}).exec((err)=>{
					if (err){
						console.log(err);
					}
				});
			}
			user.versionAllowed = await versionIsAllowed(platform, version)
            return res.json(user);
        }
        return res.json({status: "error"});
    },

    setRefferal: async (req, res) => {
        if (req.body.reff){
            let userId = parseInt(req.body.userId);
            await User.update({id: userId}, {reff: req.body.reff});
            return res.json({status: "ok"});
        }else{
            return res.json({status: "error"});
        }
    },

    requestCity: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let cityName = req.body.cityName;
        await User.update({id: userId}, {wishCity: cityName});
        return res.json({status: "ok"});
    },

    /**  Блок партнёров и купонов */
    getPartnersList: async (req, res) => {
        let search = req.body.search ? req.body.search : false;
        let userId = parseInt(req.body.userId);
        let from = req.body.from ? req.body.from : false;
        let user = await User.findOne({id: userId});
        let topic = req.body.topic ? req.body.topic : user.topic;
        let partnersWithActiveCoupons = [];
        let partnersList = [];
        let responsePartners = [];
        let count = 10; //10 количество партнёров уже загруженных


        let activeCoupons = (await User.findOne({where: {id: userId}, select: ["activeCoupons"]})).activeCoupons;
        let activeCouponsPartners = [];
        activeCoupons.forEach((coupon)=>{
            if (coupon.active && coupon.topic === topic){
                activeCouponsPartners.push(coupon.id);
            }
        });

        if (!from && !search){
            partnersWithActiveCoupons = await Partner.find({ where: {id: activeCouponsPartners, topic: topic}, sort: "couponAbriviation ASC" });
            //Сколько осталось показать
            count -= partnersWithActiveCoupons.length;
        }

        if (count > 0){
            let conditions = {
                limit: count,
                sort: "couponAbriviation ASC",
                where: {
                    topic: topic
                }
            };
            //Если задан поиск, то выданные купоны нас не интересуют
            if (!search && activeCouponsPartners.length){
                conditions.where.id = {"!=": activeCouponsPartners};
            }
            //Сколько пропустить
            if (from){
                conditions.skip = from;
            }
            if (search){
                //contains
                //searchWords
                conditions.where.searchWords = {"contains": search};
            }
            partnersList = await Partner.find(conditions);
        }

        let partners = partnersWithActiveCoupons.concat(partnersList);
        partners.forEach(partner => {
            partner.couponAvalible = true;
            partner.givenCoupon = {};
            if (
                partner.couponsPerUser !== -1 &&
                (activeCoupons.filter(coupon => {return coupon.id === partner.id;})).length >= partner.couponsPerUser
            ){
                partner.couponAvalible = false;
            }

            if (partner.couponAmount !== -1 && partner.couponAmount === 0){
                partner.couponAvalible = false;
            }

            activeCoupons.forEach(coupon => {
                if (coupon.id === partner.id && coupon.active){
                    partner.couponAvalible = false;
                    partner.givenCoupon = coupon;
                }
            });

            delete partner.couponAmount;
            delete partner.emailForCoupon;
            delete partner.memberCoupon;
            delete partner.couponMemberDiscount;
            delete partner.couponsPerUser;
            delete partner.couponAbriviation;
        });

        res.json({partners: partners, couponList: activeCoupons.filter(coupon=>coupon.active)});
        return false;
    },

    getCoupon: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let partnerId = parseInt(req.body.partnerId);
        let activeCoupons = (await User.findOne({ where: {id: userId}, select: ["activeCoupons"]})).activeCoupons;
        let partner = await Partner.findOne({id: partnerId});
        let d = new Date();
        let couponRecord = {};
        //В день максимум можно взять 3 раза купон
        if (activeCoupons.filter(coupon => {
            let couponDate = new Date(coupon.fromDate);
            let today = new Date();
            return couponDate.toISOString().substr(0, 10) === today.toISOString().substr(0,10);
        }).length > 2){
            return res.json({"error": "coupon_max_reached"});
        }

        //Максимум на человека 3 активных купона
        if (activeCoupons.filter(coupon => {return coupon.active;}).length > 2){
            return res.json({"error": "coupon_max_reached"});
        }

        if (activeCoupons.filter(coupon => {return coupon.id === partnerId && coupon.active;}).length){
            return res.json({"error": "coupon_acquired"});
        }

        if (partner.couponsPerUser !== -1){
            if (activeCoupons.filter(coupon => {return coupon.id === partnerId;}).length > partner.couponsPerUser){
                return res.json({"error": "more_then_possible"});
            }
        }

        if (partner.couponAmount !== -1){
            if (partner.couponAmount > 0){
                Partner.update({id: partnerId}, {couponAmount: --partner.couponAmount}).exec((err, res)=>{
                    if (err) {console.log(err);}
                });
            }else{
                return res.json({"error": "coupons_amount_empty"});
            }
        }

        //генерируем код купона
        couponRecord = {
            id: partnerId,
            fromDate: d.getTime(),
            tillDate: d.setDate(d.getDate() + parseInt(partner.couponTerm)),
            uid: `${partner.couponAbriviation}${(d.getTime() + "").substring(5,15)}${userId}`,
            active: true,
            topic: partner.topic
        };

        activeCoupons.push(couponRecord);
        let data = (await User.update({id: userId}, {activeCoupons: activeCoupons, lastGivenCoupon: couponRecord.uid}).fetch())[0].activeCoupons;

        //TODO: !!!Отправить почту что купон выдан

        res.json({activeCoupons: data});

    },

    closeCoupon: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let partnerId = parseInt(req.body.partnerId);
        let activeCoupons = (await User.findOne({ where: {id: userId}, select: ["activeCoupons"]})).activeCoupons;
        activeCoupons.forEach((coupon)=>{
            if (partnerId === coupon.id){
                coupon.active = false;
            }
        });
        User.update({id: userId}, {activeCoupons: activeCoupons}).exec((err, ress) => {
            if (err){console.log(err);}
        });
        res.json({activeCoupons: activeCoupons});
    },

    getCouponsList: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let activeCoupons = (await User.findOne({id: userId})).activeCoupons;
        res.json(activeCoupons);
    },

    unsubscribeEmail: async (req, res) => {
        if (req.body && req.body.userid){
            User.update({id: parseInt(req.body.userid)}, {noemail: true}).exec((err, ress)=>{
                if (err){
                    console.log(err);
                }
            });
            res.send("Вы отписались от рассылки");

        }else{
            res.send("<html><head></head><body><form name='usubscribe' method='POST'>" +
                `<input type='hidden' value='${req.query.id}' name='userid' id='userid'/>` +
                "<input type='submit' value='Отписаться от получения писем на masteramtut.ru' name='noemail'/>" +
                "</form></body>");

        }
    },

    masterslist: async (req, res) => {
        let search = req.body.search ? req.body.search : false;
        let userId = parseInt(req.body.userId);
        let from = req.body.from ? req.body.from : false;
        let count = 10;
        let jobTypes = req.body.jobTypes ? req.body.jobTypes.split(",") : false;
        let result = [];
        let user = await User.findOne({id: userId});
        let topic = user.topic;


        let conditions = {
            limit: count,
            select: [
                "name",
                "surname",
                "jobTypes",
                "photos",
                "phoneNumber",
                "topic",
                "avatar",
                "userKarma",
                "jobExpirience",
                "description",
				"pro",
				"isCustomer",
				"isRecommended",
				"isCustomer"
			],
            where: {
				topic: user.topic,
				isCustomer: false
            },
            sort: [{isRecommended: "DESC"}, {pro: "DESC"}, {userKarma: "DESC"}, {createdAt: "DESC"}]
        };
        conditions.where.or = [];
        //Сколько пропустить
        if (from){
            conditions.skip = from;
        }

        if (search){
            let nameCondition = {
                name: {
                    contains: search
                }
            };
            conditions.where.or.push(nameCondition);
            let surnameCondition = {
                surname: {
                    contains: search
                }
            };
            conditions.where.or.push(surnameCondition);
        }

        if (jobTypes){
            jobTypes.forEach((ele)=>{
                let jobTypeCondition = {
                    jobTypes: {contains: ele}
                };

                conditions.where.or.push(jobTypeCondition);
            });
        }

//        console.log(JSON.stringify(conditions));
        result = await User.find(conditions);


        return res.json({list: result});
    },

    ban: async (req, res) => {
        let userId = parseInt(req.body.userId);
        let banUserId = parseInt(req.body.banUserId);
        let user = await User.findOne({id: userId});
        if (user.isAdmin){
            let d = new Date();
            d.setDate(d.getDate() + 1);
            await User.update({id: banUserId}, {userWaitForUnblock: d.getTime()});
            return res.json({status: "ok"});
        }else{
            return res.json({status: "not_allowed"});
        }

	},
	
    toRecommended: async (req, res) => {
        if (req.body.userId){
			let user = await User.findOne({
				where: { id: req.body.userId },
				select: ["id", "nails", "jobTypes", "jobExpirience", "photos", "isRecommended"]
			})
			if(!user.isCustomer && user.jobTypes && user.jobTypes.length > 0 && user.jobExpirience && user.jobExpirience > 0 && user.photos && user.photos.length > 0){
				if(!user.isRecommended){
					if(user.nails >= sails.config.globals.nailsCost.recommendedMaster){
						await User.update({
							id: user.id
						}, {
							isRecommended: true, 
							recommendedEnd: (Math.floor(Date.now() / 1000) + sails.config.globals.nailsCost.recommendedMasterEnd), 
							nails: (user.nails - sails.config.globals.nailsCost.recommendedMaster)
						});
						await Paynails.create({userId: user.id, amount: sails.config.globals.nailsCost.recommendedMaster, serviceName: 'recommended'}).fetch();
						return res.json({status: "success"});
					}else{
						return res.json({status: "Недостаточно гвоздей"});
					}
				}else{
					return res.json({status: "Вы уже находитесь в списке рекомендованных"});
				}
			}else{
				if(user.isCustomer){
					return res.json({status: "Невозможно рекомендовать заказчика"});
				}else{
					return res.json({status: "Невозможно активировать услугу, необходимо заполнить профиль"});
				}
			}
        }
        return res.json({status: "error"});
    },

    recommendedList: async (req, res) => {
        let jobTypes = req.body.jobTypes ? req.body.jobTypes.split(",") : false;
        let result = [];
        let city = req.body.city.trim();

		let query = 'SELECT id, name, jobTypes, photos, phoneNumber, avatar, description FROM user WHERE isRecommended = 1 AND topic like $1';
		let queryParams = [city];

		let jobTypesCnt = 0
		if (jobTypes){
			jobTypes.forEach((jobType) => {
				let val = jobType.trim()
				if(val.length > 0){
					if(jobTypesCnt === 0) query += ' AND (';
					jobTypesCnt++
					if(jobTypesCnt > 1) query += ' OR ';
					queryParams.push('%' + val + '%');
					query += 'jobTypes like $' + (jobTypesCnt + 1);
				}
			});
			if(jobTypesCnt > 0) query += ')';
		}
		query += ' ORDER BY RAND() LIMIT 5'

		result = await sails.sendNativeQuery(query, queryParams);

		return res.json({list: result.rows});
    },

    subscribe: async (req, res) => {
        if (req.body.userId){
			let user = await User.findOne({
				where: { id: req.body.userId },
				select: ["id", "nails", "subscriptionTill"]
			})
			if(user.nails >= sails.config.globals.nailsCost.subscribe){
				let currentDate = new Date();
				let dTill = new Date();
				let resultDescription = 'Ваша подписка активирована на ' + sails.config.globals.nailsCost.subscribeEnd + ' дней';
				//оплата успешна сохраняем человека что он оплатил
				//Если человек с оплаченным периудом, и этот периуд еще не закончился, добавляем ему эти 30 дней
				if (parseInt(user.subscriptionTill) > currentDate.getTime()){
					dTill.setTime(user.subscriptionTill);
					dTill.setDate(dTill.getDate() + sails.config.globals.nailsCost.subscribeEnd);
					resultDescription = 'Ваша подписка продлена на ' + sails.config.globals.nailsCost.subscribeEnd + ' дней';
				}else{
					dTill.setDate(dTill.getDate() + sails.config.globals.nailsCost.subscribeEnd);
				}
				await User.update({id: user.id}, {
					subscriptionTill: dTill.getTime(),
					nails: (user.nails - sails.config.globals.nailsCost.subscribe)
				})
				await Paynails.create({userId: user.id, amount: sails.config.globals.nailsCost.subscribe, serviceName: 'subscribe'}).fetch();
				return res.json({status: "success", description: resultDescription});
			}else{
				return res.json({status: "Недостаточно гвоздей"});
			}
        }
        return res.json({status: "error"});
    },

    paidMessage: async (req, res) => {
        if (req.body.userId && parseInt(req.body.messageId) > 0){
			let user = await User.findOne({
				where: { id: req.body.userId },
				select: ["id", "nails"]
			})
			if(user.nails >= sails.config.globals.nailsCost.message){
				let messagePaid = await MessagePaid.findOne({messageId: req.body.messageId, userId: user.id});
				if(messagePaid){
					return res.json({status: "success"});
				}else{
					await User.update({id: user.id}, {
						nails: (user.nails - sails.config.globals.nailsCost.message)
					})
					await Paynails.create({userId: user.id, amount: sails.config.globals.nailsCost.message, serviceName: 'messagePhone'}).fetch();
					await MessagePaid.create({userId: user.id, messageId: req.body.messageId}).fetch();
				}
				return res.json({status: "success"});
			}else{
				return res.json({status: "Недостаточно гвоздей"});
			}
        }
        return res.json({status: "error"});
    },

    specializations: async (req, res) => {
		let data = await Specializations.find({ 
			select: ["id", "name"] 
		});
		return res.json({status: "success", data: data})
    },

    workPriceList: async (req, res) => {
        if (parseInt(req.body.specId) > 0 && req.body.topic){
			let region = await getRegion(req.body.topic)
			if(region.length > 0){
				let query = "select TW.name, WP.unitName, WP.price from typework as TW INNER JOIN workpricelist as WP ON WP.typeWorkId = TW.id AND WP.regionName = '" + region + "' WHERE  " +
					"TW.specId = " + req.body.specId;
				let priceList = await Message.getDatastore().sendNativeQuery(query);
				if (priceList.rows && priceList.rows.length > 0){
					return res.json({status: "success", data: priceList.rows});
				}else{
					return res.json({status: "empty"})
				}
			}else{
				return res.json({status: "error"})
			}
		}else{
			return res.json({status: "error"})
		}
	}
};
