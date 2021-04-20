module.exports = async function (req, res, proceed) {
    let d = new Date();
    let user = await User.findOne({id: parseInt(req.body.userId)});
    let ordersToPay = await Order.findOne({takenBy: user.id, orderStatus: "picked"});

    if (ordersToPay && ordersToPay.termTill < d.getTime()){

    }
    //return res.forbidden();
    return res.json({status: "token_error"});

};
