module.exports = {


    friendlyName: "Получение списка городов",


    description: "Отдаёт список городов",


    inputs: {
    },

    exits: {

    },

    fn: async function (inputs, exits) {
        let citiesList = await Config.findOne({id: 1});
        exits.success(citiesList.citylist);
    }


};

