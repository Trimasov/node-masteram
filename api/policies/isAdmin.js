module.exports = async function (req, res, proceed) {
    if (req.session.user && req.session.user.role === "admin")
    {
        return proceed();
    }
    return res.forbidden();
};
