const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');

const UsersModel = require(__path_models + 'users')
const validateAuth = require(__path_validates + 'auth')
const systemConfig = require(__path_configs + 'system');
const notify = require(__path_configs + 'notify');
const folderView = __path_views_admin + 'pages/auth/';
const layoutLogin = __path_views_admin + 'login';

const linkIndex = '/' + systemConfig.prefixAdmin + '/';
const linkLogin = '/' + systemConfig.prefixAdmin + '/auth/login/';

const verify = async (username, password, cb) => {
	try {
		let user = await UsersModel.logIn(username, password)

		if (user) {
			return cb(null, user);
		} else {
			return cb(null, false);
		}
	} catch (err) {
		return cb(err);
	}
}

passport.use(new LocalStrategy(verify));

passport.serializeUser((user, cb) => {
	process.nextTick(() => cb(null, user));
});

passport.deserializeUser((user, cb) => {
	process.nextTick(() => cb(null, user));
});

// POST LOGIN
router.post('/login', validateAuth, async (req, res, next) => {

	let item = { username: req.body.username };
	let error = notify.LOGIN_ERROR;

	passport.authenticate('local', (err, user) => {
		if (err) {
			console.log(err);
			return res.redirect(linkLogin);
		}
		if (!user) {
			return res.render(`${folderView}login`, { layout: layoutLogin, error, item });
		}
		req.logIn(user, (err) => {
			if (err) {
				console.log(err);
				return res.redirect(linkLogin);
			}
			return res.redirect(linkIndex);
		});
	})(req, res);
})

// GET LOGIN PAGE
router.get('/login', async (req, res, next) => {
	let item = { username: '' };
	let error = null;
	return res.render(`${folderView}login`, { layout: layoutLogin, error, item });
});

// GET LOGOUT
router.get('/logout', (req, res, next) => {
	req.logout((err) => {
		if (err) {
			console.log(err);
			return res.redirect(linkIndex);
		}
		res.redirect('/');
	});
});

module.exports = router;
