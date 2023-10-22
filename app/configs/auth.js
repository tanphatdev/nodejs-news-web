const systemConfig = require(__path_configs + 'system');

const linkNoPermission = '/' + systemConfig.prefixAdmin + '/no-permission';
const linkLogin = '/' + systemConfig.prefixAdmin + '/auth/login';

module.exports = (params) => {
    if (params && params.onlyAdmin) {
        return (req, res, next) => {
            if (req.isAuthenticated()) {
                if (req.user.isAdmin) {
                    next()
                } else {
                    return res.redirect(linkNoPermission);
                }
            } else {
                return res.redirect(linkLogin);
            }
        };
    } else {
        return (req, res, next) => {
            if (req.isAuthenticated()) {
                next();
            } else {
                return res.redirect(linkLogin);
            }
        };
    }
}