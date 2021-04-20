/**
 * AdminController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const nodemailer = require("nodemailer");

module.exports = {
    login: async (req, res) => {
        if (req.body && req.body.name && req.body.password){
            let name = req.body.name;
            let password = req.body.password;

            let admUser = await AdminUser.findOne({name: name, password: password});
            if (admUser){
                req.session.user = admUser;
                return res.redirect("/admin/main");
            }
        }
        return res.view({layout: "emptylayout"});
    },

    logout: async (req, res) =>{
        req.session.user = false;
        res.redirect("/admin/login");
    },

    main: async(req, res) => {
        let stats = 123;

        return res.view({
            stats: stats,
            title: "Главная",
            description: "основная статистика",
            layout: "layoutadmin"
        });
    },

    citylist: async(req, res) => {
        if (req.xhr){
            await Config.update({id: 1}, {citylist: req.body.res});
            sails.config.globals.citylist = req.body.res;
            return res.json({status: "ok"});

        }else{
            let config = await Config.findOne({id: 1});
            return res.view({
                config: config,
                title: "Города",
                description: "Редактирование городов",
                layout: "layoutadmin"
            });
        }
    },

    newslist: async (req, res)=>{
        let news= await News.find();
        return res.view({
            news: news,
            title: "Новости",
            description: "Новости приложения и проекта",
            layout: "layoutadmin"
        });
    },

    partnerslist: async (req, res)=> {
        let partners = await Partner.find();
        return res.view({
            partners: partners,
            title: "Новости",
            description: "Новости приложения и проекта",
            layout: "layoutadmin"
        });
    },

    partner_add: async (req, res)=> {
        let new_partner = (req.query.partner === "new");
        let partner = false;
        let error = false;
        let config = await Config.findOne({id: 1});
        if (req.body){
            let partner = req.body;
            if (!partner.active){
                partner.active = false;
            }

            if (new_partner){
                await Partner.create(partner);
            }else{
                await Partner.update({id: parseInt(req.query.partner)}, partner);
            }

            return res.redirect("/admin/partnerslist");
        }

        if (!new_partner){
            partner = await Partner.findOne({id: req.query.partner});
        }

        return res.view({
            partner: partner,
            config: config,
            title: new_partner ? "Добавление партнера" : "Редактирование партнера",
            description: "Добавление партнера",
            layout: "layoutadmin"
        });
    },

    news_add: async(req, res) =>{

        let new_news = (req.query.news === "new");
        let news = false;
        let error = false;
        let config = await Config.findOne({id: 1});
        if (req.body){
            let news = req.body;
            if (!news.active){
                news.active = false;
            }

            if (new_news){
                await News.create(news);
            }else{
                await News.update({id: parseInt(req.query.news)}, news);
            }

            return res.redirect("/admin/newslist");
        }

        if (!new_news){
            news = await News.findOne({id: req.query.news});
        }
        return res.view({
            news: news,
            config: config,
            title: new_news ? "Добавление новости" : "Редактирование новости",
            description: "Добавление новости",
            layout: "layoutadmin"
        });
    },

    chatView: async (req, res) => {

    },

    banners: async (req, res) => {
        let banners = await Banner.find({});
        res.view({
            banners : banners,
            title: "Баннеры",
            description: "Список баннеров",
            layout: "layoutadmin"
        });
    },

    banner_add: async (req, res) => {
        let new_banner = (req.query.banner === "new");
        let banner = false;
        let error = false;
        let config = await Config.findOne({id: 1});
        if (req.body){
            //console.log(req.body);
            let dirname = `${sails.config.appPath}/assets/images/banners/`;
            let banner = req.body;
            if (!banner.active){
                banner.active = false;
            }
            delete banner.image;
            if (req._fileparser.upstreams.length){
                let extension = req.file("image")._files[0].stream.filename.split(".").slice(-1).pop();
                let d = new Date();
                let filename = `${d.getTime()}_banner.${extension}`;
                let n = await sails.helpers.fileUpload(req, filename, dirname, "image");
                if (n){
                    return res.redirect("/admin/main");
                }else{
                    banner.image = filename;
                }
            }

            if (new_banner){
                await Banner.create(banner);
            }else{
                await Banner.update({id: parseInt(req.query.banner)}, banner);
            }

            return res.redirect("/admin/banners");
        }

        if (!new_banner){
            banner = await Banner.findOne({id: req.query.banner});
        }
        res.view({
            banner: banner,
            config: config,
            title: new_banner ? "Добавление баннера" : "Редактирование баннера",
            description: "Список баннеров",
            layout: "layoutadmin"
        });
    },

    userlist: async (req, res)=>{
        let users = await User.find({sort: "createdAt ASC"});
        res.view({
            users: users,
            title: "Список пользователей",
            description: "Список пользователей",
            layout: "layoutadmin"
        });
    },

    adddays: async (req, res)=>{
        if (req.xhr){
            if (req.body.days && req.body.days.length && parseInt(req.body.days) > 0 &&
                req.body.userId && req.body.userId.length &&
                req.session.user.role === "admin"){
                //{user: req.session.user.name, days: days, }
                let userId = req.body.userId;
                let days = req.body.days;
                let user = await User.findOne({id: userId});
                let curentSub = new Date(parseInt(user.subscriptionTill));
                let logData = {
                    days: days,
                    adminUser: req.session.user.name,
                    currentTime: user.subscriptionTill,
                    targetUser: userId
                };
                let now = new Date();
                if (now.getTime() > curentSub.getTime()){
                    curentSub.setTime(now.getTime());
                }

                curentSub.setDate(curentSub.getDate() + parseInt(days));
                logData.newTime = curentSub.getTime();
                await User.update({id: userId}, {subscriptionTill: curentSub.getTime()});
                Log.create({logType: "time_add", logData}).exec((err, ress)=>{
                    if (err){
                        console.log(err);
                    }
                });
                res.json({status: "ok", time: curentSub.getTime()});
            }
        }else{
            res.json({status: "error"});
        }
    },

    chat: async (req, res)=> {
        if (req.xhr){
            if (req.body.action === "messages"){
                let messages = await Message.find({
                    where: req.body.from ? {
                        topic: req.body.topic,
                        id: {"<" : parseInt(req.body.from)},
                        deleted: false
                    } :  {
                        topic: req.body.topic,
                        deleted: false
                    },
                    //skip: req.body.skip,
                    limit: req.body.count ? req.body.count : 50,
                    sort: "createdAt DESC"

                }).populate("user");
                res.json({messages: messages});
            }
        }else{
            let config = await Config.findOne({id: 1});
            res.view({
                config: config,
                title: "Чат",
                description: "Контроль чата",
                layout: "layoutadmin"
            });
        }

    },

    stats: async (req, res)=>{
        if (req.query.chart){
            if (req.query.chart === "user"){
                let d = new Date();
                d.setDate(d.getDate() - 30);
                let fromDate = d.getTime();
                let users = await User.find({
                    where: {
                        createdAt: {">": fromDate}
                    },
                    select: ["createdAt", "topic", "id"]
                });
                let labels = [];
                let chartDataByCity = {};
                users.forEach((user)=>{
                    let d = new Date();
                    d.setTime(user.createdAt);
                    let date = `${d.getDate()}-${d.getMonth() + 1}`;
                    console.log(date, labels.indexOf(date));
                    if (labels.indexOf(date) === -1){
                        labels.push(date);
                    }

                    if (chartDataByCity[user.topic]){
                        if (chartDataByCity[user.topic][date]){
                            chartDataByCity[user.topic][date].push(user.id);
                        }else{
                            chartDataByCity[user.topic][date] = [user.id];
                        }
                    }else{
                        chartDataByCity[user.topic] = [];
                        chartDataByCity[user.topic][date] = [user.id];
                    }
                });





                res.view("admin/charts/userschart", {
                    labels: labels,
                    chartDataByCity: chartDataByCity,
                    layout: "admin/chartslayout"
                });
            }else if (req.query.chart === "specs"){
                let labels = sails.config.globals.proffesions;
                let chartDataByCity = {};
                let users = await User.find({
                    select: ["id", "jobTypes", "topic"]
                });

                users.forEach((user)=>{
                    if (user.jobTypes){
                        let jobTypes = user.jobTypes.split(",");
                        if (!chartDataByCity[user.topic]){
                            chartDataByCity[user.topic] = {};
                        }
                        jobTypes.forEach((job) => {
                            if (chartDataByCity[user.topic][job]){
                                chartDataByCity[user.topic][job] += 1;
                            }else{
                                chartDataByCity[user.topic][job] = 1;
                            }
                        });
                    }

                });

                res.view("admin/charts/specschart", {
                    labels: labels,
                    chartDataByCity: chartDataByCity,
                    layout: "admin/chartslayout"
                });

            } else if(req.query.chart === "new_users"){
                let chartDataByCity = {};
                let monthes = [];
                let users = await User.find({
                    select: ["createdAt", "topic"]
                });
                for (let i = 0; i < users.length; i++){
                    if (!chartDataByCity[users[i]["topic"]]){
                        chartDataByCity[users[i]["topic"]] = {};
                    }
                    let d = new Date();
                    d.setTime(users[i]["createdAt"]);
                    let month = `${d.getMonth()+1}.${d.getFullYear()}`;
                    if (!monthes.includes(month)){
                        monthes.push(month);
                    }
                    if (!chartDataByCity[users[i]["topic"]][month]){
                        chartDataByCity[users[i]["topic"]][month] = 1;
                    }else{
                        chartDataByCity[users[i]["topic"]][month] += 1;
                    }
                }

                res.view("admin/charts/newuserstable", {
                    monthes: monthes,
                    chartDataByCity: chartDataByCity,
                    title: "Пользователи по месяцам",
                    description: "Таблица всех пользователей по месяцам и городам",
                    layout: "layoutadmin"
                });


            } else if(req.query.chart === "orders_per_week"){
                let labels = [];
                let chartDataByCity = {};
                let prevMonday = false;
                let nextMonday = false;
                let proffesions = sails.config.globals.proffesions;
                proffesions['null'] = "Без указания професии";

                for (let area in sails.config.globals.citylist){
                    for (let j = 0; j < sails.config.globals.citylist[area].length; j++){
                        let city = sails.config.globals.citylist[area][j];
                        //sails.config.globals.citylist[area].forEach(async (city)=>{
                        chartDataByCity[city] = {};
                        //С последнего понедельника
                        let dayArray = [0, 7, 14, 21, 28];
                        for (let i = 0; i < dayArray.length-1; i++){
                            let days = dayArray[i];
                            let d = new Date();
                            d.setHours(0,0,0,0);
                            d.setDate(d.getDate() - (d.getDay() + 6) % 7);
                            d.setDate(d.getDate() - days);
                            let prevMonday = d.getTime();
                            let dateFormat = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
                            d.setDate(d.getDate() + 7);
                            let nextMonday = d.getTime();
                            dateFormat = `${dateFormat} - ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`

                            chartDataByCity[city][dateFormat] = {};

                            let query = "select `jobType` from message WHERE  " +
                                "`message`.`text` REGEXP '(7|8)?[\s\-]?\\\\)?[489][0-9]{2}\\\\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}' " +
                                ` AND createdAt > ${prevMonday} AND createdAt < ${nextMonday} AND topic = "${city}"`;
                            let messages = await Message.getDatastore().sendNativeQuery(query);
                            if (messages.rows && messages.rows.length){
                                chartDataByCity[city][dateFormat]["Всего заказов"] = messages.rows.length;
                                messages.rows.forEach((row)=>{
                                    if (chartDataByCity[city][dateFormat][proffesions[row["jobType"]]]){
                                        chartDataByCity[city][dateFormat][proffesions[row["jobType"]]] += 1;
                                    }else{
                                        chartDataByCity[city][dateFormat][proffesions[row["jobType"]]] = 1;
                                    }
                                });
                            }
                        }
                    }
                }

                res.view("admin/charts/orders_per_week", {
                    labels: labels,
                    chartDataByCity: chartDataByCity,
                    layout: "admin/chartslayout"
                });
            } else if(req.query.chart === "orders_last_month"){
                let labels = [];
                let chartDataByCity = {};
                let proffesions = sails.config.globals.proffesions;
                proffesions['null'] = "Без указания професии";

                for (let area in sails.config.globals.citylist){
                    for (let j = 0; j < sails.config.globals.citylist[area].length; j++){
                        let city = sails.config.globals.citylist[area][j];
                        chartDataByCity[city] = {};
                        //С начала месяца
                        let dateFormat = "lastMonth";
                        let date = new Date();
                        date.setHours(0,0,0,0);
                        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                        let today = new Date();
                        chartDataByCity[city][dateFormat] = {};

                        let query = "select `jobType` from message WHERE  " +
                            "`message`.`text` REGEXP '(7|8)?[\s\-]?\\\\)?[489][0-9]{2}\\\\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}' " +
                            ` AND createdAt > ${firstDay.getTime()} AND topic = "${city}"`;
                        console.log(query);
                        let messages = await Message.getDatastore().sendNativeQuery(query);
                        if (messages.rows && messages.rows.length){
                            chartDataByCity[city][dateFormat]["Всего заказов"] = messages.rows.length;
                            messages.rows.forEach((row)=>{
                                if (chartDataByCity[city][dateFormat][proffesions[row["jobType"]]]){
                                    chartDataByCity[city][dateFormat][proffesions[row["jobType"]]] += 1;
                                }else{
                                    chartDataByCity[city][dateFormat][proffesions[row["jobType"]]] = 1;
                                }
                            });
                        }
                    }
                }

            } else if (req.query.chart === "users_per_day_in_topics") {
                let chartData = {};
                let stats = await Stats.find({statType: "activity"});
                stats.forEach((day)=>{
                    let d = new Date();
                    d.setTime(day.statDate);
                    let date =  `${d.getDate()}.${d.getMonth()}.${d.getYear()}`;
                    chartData[date] = {};
                    for (let topic in day.data){
                        chartData[date][topic] = day.data[topic].length;
                    }

                });
                res.json(chartData);
			}
			// История пополнения гвоздей
            else if (req.query.chart === "paid_users"){
                let chartData = {};
                let payments = await Payment.find({
                    where: {
                        tillDate: { ">": 0 }
                    },
                    select: ["userId", "createdAt", "tillDate", "amount"]
                }).sort("createdAt DESC");
                for (let i = 0; i < payments.length; i++){
                    let payOrder = payments[i];
                    let userId = payOrder["userId"];
                    if (!chartData[userId]){
                        chartData[userId] = {};
                        chartData[userId] = await User.findOne({
                            where: {
                                id: userId
                            },
                            select: ["id", "name", "surname", "phoneNumber", "createdAt", "jobTypes"]
                        });
                        chartData[userId]["payments"] = [];
                    }
                    chartData[userId]["payments"].push(payOrder);
                }
                res.view("admin/paid_users", {
                    chartData: chartData,
                    title: "История пополнения гвоздей",
                    description: "Таблица истории пополнения гвоздей",
                    layout: "layoutadmin"
                });
			}
			// Рекомендованные пользователи
            else if (req.query.chart === "recommended_users"){
                let users = await User.find({
                    where: {
                        isRecommended: true
                    },
                    select: ["id", "name", "surname", "phoneNumber", "createdAt", "jobTypes", "recommendedEnd"]
				}).sort("createdAt DESC");
                res.view("admin/recommended_users", {
                    chartData: users,
                    title: "Рекомендованные мастера",
                    description: "Таблица рекомендованных мастеров",
                    layout: "layoutadmin"
                });
			}
			// История активация услуг
            else if (req.query.chart === "paid_nails"){
                let chartData = []
                let payments = await Paynails.find({
                    select: ["id", "userId", "createdAt", "amount", "serviceName"]
				}).sort("createdAt DESC");
				let usersData = {}
                for (let i = 0; i < payments.length; i++){
                    let payOrder = payments[i]
					let userId = payOrder["userId"]
					if(!usersData[userId]){
						usersData[userId] = await User.findOne({
                            where: {
                                id: userId
                            },
                            select: ["id", "name", "surname", "phoneNumber", "createdAt", "jobTypes"]
                        })
					}
					let payData = payments[i]
					payData.user = usersData[userId]
					chartData.push(payData)
/*
                    if (!chartData[userId]){
                        chartData[userId] = {};
                        chartData[userId] = await User.findOne({
                            where: {
                                id: userId
                            },
                            select: ["id", "name", "surname", "phoneNumber", "createdAt", "jobTypes"]
                        });
                        chartData[userId]["payments"] = [];
					}
*/
//                    chartData[userId]["payments"].push(payOrder);
                }
                res.view("admin/paid_nails", {
                    chartData: chartData,
                    title: "История активации услуг",
                    description: "Таблица истории активации услуг",
                    layout: "layoutadmin"
				});
			}


            // Заблокированные пользователи
            else if (req.query.chart === "blocks_user"){
              const usersData = await User.find({
                where: {
                  userWaitForUnblock: {'>': 0}
                },
              })
              res.view("admin/blocks_user", {
                usersData: usersData,
                title: "Заблокированные пользователи",
                description: "Таблица заблокированных пользователей",
                layout: "layoutadmin"
              });
            }

            // Поиск Админ сообщений по дате
            else if (req.query.chart === "admin_message"){
              const { id_admin, date_from, date_to } = req.query;
              let usersData = null;
              if(id_admin && date_from && date_to){
                const from = (new Date(date_from)).getTime();
                const to = (new Date(date_to)).getTime();

                let query =  ` SELECT  COUNT(*) as count
                FROM message as m
                WHERE m.topic REGEXP '[[:alpha:]]'
                AND m.user = ${id_admin}
                AND m.createdAt >= ${from}
                AND m.createdAt <= ${to}
                AND m.text REGEXP N'[0-9]{5,}'`;
                const count_result = await Message.getDatastore().sendNativeQuery(query);
                usersData = count_result.rows[0].count;
              }

              res.view("admin/admin_message", {
                usersData: usersData,
                id_admin : id_admin,
                date_from: date_from,
                date_to: date_to,
                title: "Поиск Админ-сообщений по дате",
                description: "Подсчет количества отправленных сообщений",
                layout: "layoutadmin"
              });
            }


			// Статистика услуг
            else if (req.query.chart === "nails_stat"){
				let chartData = []
				// subscribe
				let data = await sails.sendNativeQuery('SELECT serviceName, SUM(amount) as cnt_amount, COUNT(*) as cnt FROM `paynails` WHERE serviceName = "subscribe"')
				if(data.rows.length > 0 && data.rows[0].serviceName !== null) chartData.push(data.rows[0])
				// order
				data = await sails.sendNativeQuery('SELECT serviceName, SUM(amount) as cnt_amount, COUNT(*) as cnt FROM `paynails` WHERE serviceName = "order"')
				if(data.rows.length > 0 && data.rows[0].serviceName !== null) chartData.push(data.rows[0])
				// recommended
				data = await sails.sendNativeQuery('SELECT serviceName, SUM(amount) as cnt_amount, COUNT(*) as cnt FROM `paynails` WHERE serviceName = "recommended"')
				if(data.rows.length > 0 && data.rows[0].serviceName !== null) chartData.push(data.rows[0])
				// messagePhone
				data = await sails.sendNativeQuery('SELECT serviceName, SUM(amount) as cnt_amount, COUNT(*) as cnt FROM `paynails` WHERE serviceName = "messagePhone"')
				if(data.rows.length > 0 && data.rows[0].serviceName !== null) chartData.push(data.rows[0])
				// referral
				data = await sails.sendNativeQuery('SELECT serviceName, SUM(amount) as cnt_amount, COUNT(*) as cnt FROM `paynails` WHERE serviceName = "referral"')
				if(data.rows.length > 0 && data.rows[0].serviceName !== null) chartData.push(data.rows[0])
				// ---
				res.view("admin/nails_stat", {
                    chartData: chartData,
                    title: "Статистика активации услуг",
                    description: "Таблица статистики активации услуг",
                    layout: "layoutadmin"
                });
			}
			// -----
			else if (req.query.chart === "other"){
                let result = 0;
                let d = new Date();
                d.setHours(0);
                d.setMinutes(0);
                let timeTill = d.getTime();
                d.setDate(1);
                let timeFrom = d.getTime();
                let users = await User.find({
                    where: {
                        "updatedAt": {
                            "<=": timeTill,
                            ">=": timeFrom
                        },
                        createdAt: {
                            "<=": timeFrom
                        }
                    },
                    select: ["id", "name", "jobTypes"]
                });
                //result = users.length;

                res.json(users);
            }
        }else{
            res.view({
                title: "Статистика",
                description: "Статистичиские данные проекта",
                layout: "layoutadmin"
            });
        }
    },

    sendEmail: async (req, res) => {
        if (req.body){
            console.log(req.body);
        }
        if (req.body && req.body.emailText){

            let smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "masteramtut@gmail.com",
                    pass: "Masteram2018"
                }
            });

            let mailOptions = {
                from: "Masteram",
                to: "masteramtut@gmail.com",
                subject: req.body.emailTitle,
                text: ""
            };

            //let users = await User.find({select: "email", where: { noemail: false, isAdmin: true }});
            let users = await User.find({select: "email", where: { noemail: false }});
            //console.log(users);
            let i = 0;
            let timerId = setInterval(()=>{
                if (users.length === i){
                    clearInterval(timerId);
                    return false;
                }
                //console.log(i);
                let user = users[i];
                mailOptions.to = user.email;
                mailOptions.text = `${req.body.emailText} \n \n \n Для того что бы больше не получать письма пройдите по ссылке http://masteramtut.ru/user/unsubscribeEmail?id=${user.id}`;
                console.log(user);
                smtpTransport.sendMail(mailOptions, function(error, response){
                    if(error){
                        console.log(error);
                    }
                    //console.log(response);
                });

                i++;

            }, 11000);


            res.send("Рассылка начата <a href='/admin/main'>На главную</a>");
        }else{
            let config = await Config.findOne({id: 1});
            res.view({
                config: config,
                title: "Отправка рассылки",
                description: "Отправка рассылки",
                layout: "layoutadmin"
            });
        }
    }

};

