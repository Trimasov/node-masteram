/**
 * OrderController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const axios = require("axios");
const nodemailer = require("nodemailer");

module.exports = {

    registerorder: async (req, res)=>{
        //let order = await Order.create({...req.body, ...{orderStatus: "waiting_approve"}}).fetch();
		//let text = `Отправить в: ${order.topic}, id: ${order.id}, Описание работ: ${order.description}${order.jobType.length && order.jobType !== "undefined" ? `, Специалист: ${sails.config.globals.proffesions[order.jobType]}, ` : ""}${order.price.length ? `, Цена: ${order.jobType}, ` : ""}Телефон: ${order.phoneNumber} `;
		let text = `${req.body && req.body.name ? req.body.name : "Пользователь с сайта" } просит перезвонить на номер ${req.body && req.body.phoneNumber ? req.body.phoneNumber : ""} и заказать работы${req.body && req.body.description ? ': ' + req.body.description : ""}`;
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
            await Message.create(message);
        }

        /*send mail*/
        let smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: "masteramtut@gmail.com",
                pass: "Masteram2018"
            }
        });
        let mailOptions = {
            from: "masteramtut@gmail.com",
            to: "sashus101@gmail.com",
            subject: "Заказ с лэндинга",
            text: text
        };

        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }
        });


        res.json({status: "ok"});
    },

    createOrder: async (req, res)=> {
        // -- не нужно
        //При создании заказа, ставится ему статус wait_approve
        let userId = parseInt(req.body.userId);
        let user = await User.findOne({id: userId});

		if(user && (user.isAdmin || user.isCustomer)){
	        let orderData = {
    	        addedBy: user.id,
        	    phoneNumber: req.body.phoneNumber || user.phoneNumber,
            	address: req.body.address,
	            topic: req.body.topic || user.topic,
    	        description: req.body.description || "",
        	    contract: req.body.contract || false,
            	cashless: req.body.cashless || false,
	            jobType: req.body.jobType || "any",
				name: req.body.name ? req.body.name : "",
				categoryId: parseInt(req.body.categoryId)
	        };

    	    orderData.approved = user.isAdmin;
        	orderData.approvedBy = user.id;
            orderData.orderStatus = (user.isAdmin ? "approved" : "waiting_approve");

			let order = await Order.create(orderData).fetch();
			order.categoryName = req.body.categoryName

	        //Посылаем сообщение всем админам
    	    await sails.helpers.sendAdminMessage({
        	    messageType: "order",
            	text: `Создан новый заказ, ждёт потверждения, ${order.id}: ${order.description}, адрес: ${req.body.address}, заказ: ${order.categoryName}`,
	            order: order.id
    	    });
        	//Если создано админом сразу посылается в топик
	        if (user.isAdmin){
    	        await Message.create({
        	        messageType: "order",
            	    topic: order.topic,
                	text: `Новый заказ, ${order.description}, адрес: ${req.body.address}, заказ: ${order.categoryName}`,
	                order: order.id
    	        });
	        }
			res.json(order);
		}else{
			res.json({status: "error"});
		}
    },

    closeOrder: async (req, res)=> {
        let order = await Order.findOne({id :req.body.orderId});
        let user = await User.findOne({id :req.body.userId});
        if (order && user && (user.isAdmin || user.id === order.addedBy)){
			order = await Order.update({id: order.id}, {orderStatus: "closed"}).fetch();
            return res.json(order[0]);
        }else{
            return res.json({status: "error_access"});
        }
    },

    getOrder: async (req, res) => {
        try{
            let user = await User.findOne({id: req.body.userId});
            let order = await Order.findOne({
                select: ["phoneNumber", "jobType", "name", "price", "address", "description",
                    "topic", "termTill", "termFrom", "contract", "cashless", "orderStatus",
                    "addedBy", "takenBy", "createdAt", "updatedAt", "categoryId",],
                where: {id : req.body.orderId}
            });
//            let userToAmount = await UserOrder.count({orderStatus: "booked", orderId: order.id});
//            let userOrdered = await UserOrder.find({userId :user.id, orderId: order.id});

//            if (userToAmount < 3 && !userOrdered.length){
//                order.orderStatus = "approved";
//            }

            if ((user.isAdmin || user.id === order.addedBy) ||
                ["approved", "booked"].includes(order.orderStatus)
            ){
                let usetToOrder = await UserOrder.count({
                    orderId: order.id,
                    userId: order.id,
                    orderStatus: ["booked", "picked"]
                });
                if (usetToOrder < 1){
                    order.phoneNumber = "";
                }
                res.send(order);
            }else{
                return res.json({status: "no_such_order"});
            }
            //res.send(order);

        }catch(e){
            console.log("GET ORDER ERRROR: ");
            console.log(e);
            return res.json({status: "no_such_order"});
        }
    },

    getOrders: async (req, res) => {
        let user = await User.findOne({id: req.body.userId});
        let jobTypes = req.body.jobTypes ? req.body.jobTypes.split(",").map((ele)=>{return ele.trim()}) : false;
        let conditions = {
            limit: req.body.limit ? parseInt(req.body.limit) : 20,
            select: [
                "phoneNumber",
                "jobType",
                "name",
                "price",
                "address",
                "description",
                "topic",
                "termTill",
                "termFrom",
                "contract",
                "cashless",
                "orderStatus",
		        "addedBy",
                "takenBy",
                "createdAt",
				"updatedAt",
				"categoryId",
            ],
            where: {
                topic: user.topic
            },
            sort: "createdAt DESC"
        };

        if (user.isAdmin){

        }else{
            if (req.body.own){

            }else{
                conditions.where.orderStatus = {"!=": ["waiting_approve"]};
            }
        }

        if (req.body.own){
            conditions.where.addedBy = user.id;
        }
        if (req.body.from){
            conditions.skip = req.body.from;
        }
        if (req.body.topic){
            conditions.where.topic = req.body.topic;
        }
        if (jobTypes){
            conditions.where.or = [];
            jobTypes.forEach((ele)=>{
                let jobTypeCondition = {
                    jobType: {contains: ele}
                };

                conditions.where.or.push(jobTypeCondition);
            });
        }
        if (req.body.filter && ["booked", "picked", "closed"].includes(req.body.filter)){
            if (!user.isAdmin){
                if (req.body.filter === "booked" || req.body.filter === "picked"){
                    conditions.where.takenBy = user.id;
                }else if (req.body.filter === "closed"){
                    conditions.where.addedBy = user.id;
                }
                conditions.where.orderStatus = req.body.filter;
            }else{
                conditions.where.orderStatus = req.body.filter;
            }
        }
        let orders = await Order.find(conditions);
        return res.json({orders: orders});
    },

    getPendingOrder: async (req, res) => {
        let user = await User.findOne({id :req.body.userId});
        let d = new Date();
        let orderToPay = await Order.find({takenBy: user.id, orderStatus: "picked", termTill: {"<": d.getTime()}, paid: false});
        if (orderToPay.length){
            return res.json({order: orderToPay[0]});
        }else{
            return res.json({status: "ok"});
        }
    },

    releaseOrder: async (req, res) => {
        let order = await Order.findOne({id :req.body.orderId});
        let user = await User.findOne({id :req.body.userId});
        if (user.isAdmin || (order.takenBy && order.takenBy === user.id)){
            order = (await Order.update({id: order.id}, {orderStatus: "approved"}).fetch())[0];
            //Посылаем сообщение всем админам
            await sails.helpers.sendAdminMessage({
                messageType: "order",
                text: `Заказ освободился, ${order.description}`,
                order: order.id
            });

            return res.json(order[0]);
        }else{
            return res.json({status: "no_such_permission"});
        }
    },

    pickOrder: async (req, res) => {
/*
        let order = await Order.findOne({id :req.body.orderId});
        let user = await User.findOne({id :req.body.userId});
        let userOrder = await UserOrder.find({
            userId: user.id,
            orderId: order.id,
            orderStatus: "booked"
        });

        if (userOrder.length &&
            (req.body.termTill || req.body.termsTill) &&
            (req.body.termFrom || req.body.termsFrom) &&
            req.body.price
        ){
            order = (await Order.update({id: order.id}, {
                orderStatus: "picked",
                termTill: parseInt(req.body.termTill || req.body.termsTill),
                termFrom: parseInt(req.body.termFrom || req.body.termsFrom),
                price: req.body.price,
                takenBy: user.id
            }).fetch())[0];
            await UserOrder.update({
                userId: user.id,
                orderId: order.id,
            }, {
                orderStatus: "picked"
            });
            //Оповещаем о взятии заказа в работу
            //Посылаем сообщение всем админам
            await sails.helpers.sendAdminMessage({
                messageType: "order",
                text: `Заказ взят в работу пользователем ${user.name} ${user.surname}, номер телефона пользователя ${user.phoneNumber}, установленна цена ${order.price} - дата окончания ${(new Date(parseInt(order.timeTill)))}`,
                order: order.id
            });

            return res.json(order);
        }else{
            return res.json({status: "no_such_permission"});
		}
*/
		return res.json({status: "Данная функция недоступна"});
	},

	// Бронирование заказа
    bookOrder: async (req, res) => {
		let today = new Date();
        let order = await Order.findOne({id :req.body.orderId});
        let user = await User.findOne({id :req.body.userId});
        let userToAmount = await UserOrder.count({orderStatus: "booked", orderId: order.id});
		let userOrdered = await UserOrder.find({userId :user.id, orderId: order.id});
		let orderOutdated = ((today.getTime() - order.createdAt) > (60 * 3600 * 1000));
        //Если заказ не устарел (60 часов), если не владелец, и количество забронированных меньше 3-х позволяем забронировать
		if (!orderOutdated &&
			!userOrdered.length &&
        	user.nails >= sails.config.globals.nailsCost.bookOrder &&
            order.addedBy !== user.id &&
            ["booked", "approved"].includes(order.orderStatus) &&
            userToAmount < 3
        ){
            order = (await Order.update(
                {id: order.id},
                {orderStatus: "booked"}
            ).fetch())[0];
            await User.update({id: user.id}, {nails: user.nails - sails.config.globals.nailsCost.bookOrder});
            await UserOrder.create({
                userId: user.id,
                orderId: order.id,
				orderStatus: "booked"});
			await Paynails.create({userId: user.id, amount: sails.config.globals.nailsCost.bookOrder, serviceName: 'order'}).fetch();
            //Send booking sms
            let text=encodeURIComponent(`Ответил мастер ${user.name} ${user.phoneNumber.replace(/\s|\-|\(|\)/gi, "")}`); //http://masteramtut.ru/m/${user.id}
            //let url = `https://smsc.ru/sys/send.php?login=masteramtut&psw=Masteram2018&phones=+${order.phoneNumber.replace(/\s|\+|\-|\(|\)/gi,"")}&mes=${text}`;
            //http://t89186553497:182617@gate.prostor-sms.ru/send/?phone=%2B".$phone."&text=".$kod_sms
            //!!!
            let url = `http://t89186553497:182617@gate.prostor-sms.ru/send/?phone=%2B${order.phoneNumber.replace(/\s|\+|\-|\(|\)/gi,"")}&text=${text}`;
            axios.get(url).then(data=>{
                console.log(`sms was sent`);
                console.log(data);
            }).catch((e)=>{
                console.log(e);
            });
            //Оповещаем о взятии заказа в работу
            //Посылаем сообщение всем админам
            await sails.helpers.sendAdminMessage({
                messageType: "order",
                text: `Заказ ${order.id}:${order.description.substring(0, 50)}  забронирован мастером ${user.name} ${user.phoneNumber}`,
                order: order.id
            });
            return res.json(order);
        }else{
            if (userOrdered.length){
                if (order.orderStatus === "picked"
                    || (order.orderStatus === "picked" && order.takenBy === user.id)
                    || (order.orderStatus === "booked" && userOrdered.length)
                ){
                    return res.json(order);
                }else{
                    return res.json({status: "Заказ в работе у другого мастера"});
                }
            }
            if (user.nails < sails.config.globals.nailsCost.bookOrder){
                return res.json({status: "Недостаточно гвоздей"});
            }
// Check for pro is outdated
/*
			if (!user.pro){
                return res.json({status: "У вас нету статуса PRO"});
			}
*/
			if (orderOutdated){
				return res.json({status: "Невозможно забронировать, заказ размещён более 60 часов назад"});
			}
			if (userToAmount > 2){
                return res.json({status: "Забронировать невозможно"});
            }
            if (order.addedBy !== user.id){
                return res.json({status: "Это ваш заказ, забронировать невозможно"});
            }
            return res.json({status: "Забронировать невозможно"});
        }

    },

    approveOrder: async (req, res) => {
        let order = await Order.findOne({id :req.body.orderId});
        let user = await User.findOne({id :req.body.userId});
        if (user && user.isAdmin && order.orderStatus === "waiting_approve"){
            order = (await Order.update({id: order.id}, {orderStatus: "approved"}).fetch())[0];
            //Оповещаем о создании заказа
            let message = {
                messageType: "order",
                topic: order.topic,
                text: `Создан новый заказ, ${order.description}`,
                order: order.id
            };
            await Message.create(message);

			return res.json({status: "success", orderStatus: "approved"});
        }else{
            return res.json({status: "cant_approve"});
        }
    }

};
