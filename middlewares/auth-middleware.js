const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(' ');

    if (tokenType !== 'Bearer') {
        res.status(401).send({
            errorMessage: 'Use after logging in',
        });
        return;
    }

    try {
        const { userId } = jwt.verify(tokenValue, 'my-secret-key');

        User.findByPk(userId).then((user) => {
            res.locals.user = user;
            next();
        });
    } catch (error) {
        res.status(401).send({
            errorMessage: 'Use after logging in',
        });
        return;
    }
};