module.exports = async function (req, res, proceed) {
    let d = new Date();
    console.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`, req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.body, req.originalUrl);
    return proceed();
};
