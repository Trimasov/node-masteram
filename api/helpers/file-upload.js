module.exports = {


    friendlyName: "File upload",


    description: "Uploads file",


    inputs: {
        req: {
            type: "ref",
            description: "The current incoming request (req).",
            required: true
        },

        filename: {
            type: "string"
        },

        dirname: {
            type: "string"
        },

        formFileName: {
            type: "string"
        },
    },


    exits: {

    },


    fn: async function (inputs, exits) {
        inputs.req.file(inputs.formFileName).upload({
            saveAs: inputs.filename,
            dirname: inputs.dirname,
            maxBytes: 100000000
        }, (err, uploadedFile) =>{
            if (err){
                console.log(err);
                return exits.success("image_error");
                //res.json({"status": "image_error"});
            }
            if (uploadedFile.length === 0){
                return exits.success("image_error");
                //return res.json({"status": "image_error"});
            }
            return exits.success(false);
        });
    }
};

