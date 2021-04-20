/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function(done) {

    const serviceAccount = require(`${sails.config.appPath}/gkey.json`);

    if (await User.count({id: 1}) < 1){
        let user = await User.create({
            name: "Вася",
            surname: "Барислав",
            isAdmin: true,
            email: "aaa@aaa.com",
            userToken: "123",
            topic: "Сочи",
            userKarma: 4,
            firebaseToken: "fkdu_Cu-arg:APA91bEF-YrHhyInG_xTGvgV_6iK3Vr5a5DLa-JMlCPH7DrQb5HWT08Ox2JCy1GCBtk3Jyo5-_40zaRdp6aJhmrJ6qMgZx1d5kdJ1qsyXMCC564OaoPtsQi4JCWcr0QcJaE7K1jWqDhl3VjqNrlaiX4PMtvbMtgZDQ"
        });
        console.log(user);
    }
    if (await User.count({id: 2}) < 1){
        let user = await User.create({
            name: "Коля",
            surname: "Мастер2",
            email: "bbb@bbbb.com",
            userToken: "123",
            topic: "Сочи",
            userKarma: 2,
            firebaseToken: "fkdu_Cu-arg:APA91bEF-YrHhyInG_xTGvgV_6iK3Vr5a5DLa-JMlCPH7DrQb5HWT08Ox2JCy1GCBtk3Jyo5-_40zaRdp6aJhmrJ6qMgZx1d5kdJ1qsyXMCC564OaoPtsQi4JCWcr0QcJaE7K1jWqDhl3VjqNrlaiX4PMtvbMtg",
        });
        console.log(user);
    }

    sails.config.globals.firebase.admin = require("firebase-admin");

    sails.config.globals.firebase.admin.initializeApp({
        credential: sails.config.globals.firebase.admin.credential.cert(serviceAccount),
        databaseURL: sails.config.globals.firebase.admin.databaseURL
    });

	// Cron settings
	const scheduler = require("node-schedule");
	
    scheduler.scheduleJob("*/1 * * * *", async () => {
        let d = new Date();
        let day = d.getDay();
        let time = `${d.getHours()}:${d.getMinutes() < 10 ? "0" + d.getMinutes(): d.getMinutes()}`;
        let banners = await Banner.find({active: true});
        banners.forEach((banner)=>{
            let hours = banner.hours.split(",");
            let days = banner.weekDay.split(",");
            hours.forEach(async (hour)=>{
                //console.log(banner.weekDay, `${day}`, days.includes(`${day}`));
                if (hour.trim() === time && (banner.weekDay.length === 0 || days.includes(`${day}`))){
                    //console.log(123);
                    let message = {
                        messageType: "banner",
                        topic: banner.topic,
                        text: banner.text,
                        image: {
                            "imageUrl": `/images/banners/${banner.image}`,
                            "imageThumbUrl": `/images/banners/${banner.image}`
                        },
                        title: banner.title
                    };
                    message.data = {
                        phoneNumber: banner.phoneNumber,
                        link: banner.link,
                        linkText: banner.linkText,
                    };

                    let messageCreated = await Message.create(message).fetch();
                }
            });
        });
	});
	
	// Отключаем рекомендованных мастеров если срок рекомендации истёк
	scheduler.scheduleJob("*/1 * * * *", async () => {
		await User.update({
			where: { 
				isRecommended: true, 
				recommendedEnd: {'<': Math.floor(Date.now() / 1000)}
			}
		}).set({ 
			isRecommended: false
		})
	});

	// Отключаем рекомендованных мастеров если срок рекомендации истёк
	scheduler.scheduleJob("*/1 * * * *", async () => {
		let today = new Date();
		let orderOutdated = 60 * 3600 * 1000;
		let query = 'UPDATE `order` SET orderStatus = "closed" WHERE (' + today.getTime() + ' - createdAt) > ' + orderOutdated;
		await sails.sendNativeQuery(query);
	});

	// ---

	let conf = await Config.findOne({id: 1});
    sails.config.globals.citylist = conf.citylist;

    return done();

};
