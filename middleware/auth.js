const jwt = require('jsonwebtoken');
// const config = require('config');

module.exports = function (req, res, next) {
    //get jwt token from header
    const token = req.header('x-auth-token');

    //check if no token
    if(!token){
        return res.status(401).json({ msg: 'Not authorised'})
    }

    try {
        const decoded = jwt.verify(token, 'jwtsecret');

        req.user = decoded.user;
        next();
    } catch (err) {
        console.log(err.message);
        res.status(401).json({ msg: 'Token is not valid'})
    }
}