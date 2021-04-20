const gm = require("gm");
const fs = require("fs");

module.exports = {


    friendlyName: "Создавалка иконок",


    description: "Создаёт иконки для указанныз файлов",


    inputs: {
        imagePath: {
            friendlyName: "Путь к картинке",
            description: "Путь к картинке",
            type: "string"
        },

        destination: {
            friendlyName: "Путь к самбнейлу",
            description: "Путь к самбнейлу",
            type: "string"

        }
    },

    exits: {

    },

    fn: async function (inputs, exits) {
        let image = gm(inputs.imagePath);

        if (fs.existsSync(inputs.destination)){
            fs.unlinkSync(inputs.destination);
        }


        image.resize("100", "100", "^>").gravity("Center").crop("100", "100").write(inputs.destination, (err, info)=>{
            if (err){
                console.log(err);
                return exits.error(err);
            }
            if (info){
                console.log(info);
            }
            return exits.success(info);

        });
    }


};

