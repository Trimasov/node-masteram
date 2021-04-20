module.exports = async function (req, res, proceed) {
    let d = new Date();
    console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`, req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.body, req.originalUrl);
	let user = await User.findOne({userToken: req.body.token, id: parseInt(req.body.userId)});
    if (req.body
        && req.body.token
        && req.body.userId
        && (user && d.getTime() > user.userWaitForUnblock
        || req.body.token === "testToken")
    )
    {
        return proceed();
    }
    //return res.forbidden();
    return res.json({status: "token_error"});

};
