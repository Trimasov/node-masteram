module.exports = async function (req, res, proceed) {
    if (req.session.user && req.session.user.role === "manager")
    {
        return proceed();
    }
    return res.forbidden();
};
