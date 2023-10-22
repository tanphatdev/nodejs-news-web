var express = require('express');
var router = express.Router();
const { validationResult } = require('express-validator');


const { changeProfileValidate, changePasswordValidate } = require(__path_validates + 'users');
const notify = require(__path_configs + 'notify');
const systemConfig = require(__path_configs + 'system');
const UsersModel = require(__path_models + 'users');

const layoutError = __path_views_admin + 'error';
const folderView = __path_views_admin + 'pages/site/';
const linkIndex = '/' + systemConfig.prefixAdmin;

router.get('/no-permission', function (req, res, next) {
	return res.render(folderView + 'no-permission', { layout: layoutError });
});

router.get('/profile', async (req, res, next) => {
	try {
		item = await UsersModel.getItem(req.user.id);
		let errors = null;
		return res.render(folderView + 'profile', { pageTitle: 'User Profile', item, errors, isAdmin: req.user.isAdmin, });
	} catch (err) {
		console.error(err);
		return res.status(500).send('Something went wrong, try again');
	}
});

router.post('/profile', changeProfileValidate, async (req, res, next) => {
	let item = {
		fullname: req.body.fullname,
		phone: req.body.phone,
	}

	const errors = validationResult(req);
	try {
		if (errors.isEmpty()) {
			await UsersModel.changeProfile(req.user.id, item);
			req.flash('success', notify.CHANGE_PROFILE_SUCCESS, false);
			return res.redirect(linkIndex + '/profile')
		} else {
			let item = await UsersModel.getItem(req.user.id);
			res.render(folderView + 'profile', { pageTitle: 'User Profile', item, errors: errors.array({ onlyFirstError: true }), isAdmin: req.user.isAdmin, });
		}
	} catch (err) {
		console.error(err);
		return res.status(500).send('Something went wrong, try again');
	}
});

router.get('/change-password', async (req, res, next) => {
	let errors = null;
	return res.render(folderView + 'change-password', { pageTitle: 'Change Password', errors, isAdmin: req.user.isAdmin, });
});

router.post('/change-password', changePasswordValidate, async (req, res, next) => {

	const errors = validationResult(req);
	try {
		if (errors.isEmpty()) {
			await UsersModel.changePassword(req.user.id, req.body.new_password);
			req.flash('success', notify.CHANGE_PASSWORD_SUCCESS, false);
			return res.redirect(linkIndex + '/profile')
		} else {
			return res.render(
				folderView + 'change-password',
				{ pageTitle: 'Change Password', errors: errors.array({ onlyFirstError: true }), isAdmin: req.user.isAdmin, },
			);
		}
	} catch (err) {
		console.error(err);
		return res.status(500).send('Something went wrong, try again');
	}
});

router.get('/', function (req, res, next) {
	return res.render(folderView + 'home', { pageTitle: 'Welcome to Admin Page', isAdmin: req.user.isAdmin, });
});

module.exports = router;
