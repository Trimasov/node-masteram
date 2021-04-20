module.exports = async function (req, res, proceed) {
    if (req.body && req.body.userId)
    {

        let user = await User.findOne({id: req.body.userId});
        let d = new Date();
        if (parseInt(user.subscriptionTill) > d.getTime()){
            return proceed();
        }else{
            let response = {status: "not_paid"};
            if (req.options.action === "user/getmessages2"){
                response.messages = [];
            }
            if (req.options.action === "user/sendmessage2"){
                response.message = {};
            }
            if (req.options.action === "user/getcontactslist2"){
                response.contacts = [];
            }
            return res.json(response);
        }

    }
};
