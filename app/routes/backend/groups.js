const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
const util = require('util');

const validateGroup = require(__path_validates + 'groups');
const systemConfig = require(__path_configs + 'system');
const notify = require(__path_configs + 'notify');
const GroupsModel = require(__path_models + 'groups');
const UsersModel = require(__path_models + 'users');
const UtilsHelpers = require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex = '/' + systemConfig.prefixAdmin + '/groups';
const pageTitleIndex = 'Groups Management';
const pageTitleIndexAdd = pageTitleIndex + ' - Add';
const pageTitleIndexEdit = pageTitleIndex + ' - Edit';
const folderView = __path_views_admin + 'pages/groups/'

// Form
router.get('/form(/:id)?', async (req, res, next) => {
	let id = ParamsHelpers.getParam(req.params, 'id', '')
	let item = { name: '', status: 'novalue' }
	let errors = null
	if (id) {
		item = await GroupsModel.getItem(id);
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors, isAdmin: req.user.isAdmin, });
	}
	else {
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors, isAdmin: req.user.isAdmin, });
	}
});

// Save
router.post('/save', validateGroup, async (req, res, next) => {
	let item = {
		name: req.body.name,
		status: req.body.status,
		group_acp: req.body.group_acp,
	}

	const errors = validationResult(req);
	if (errors.isEmpty()) {
		if (req.body.id) {
			// Edit Item
			try {
				await GroupsModel.saveItem(req.body.id, item, { task: "edit" });
				await UsersModel.changeGroup(req.body.id, req.body.name);
				req.flash('success', notify.EDIT_SUCCESS, false);
				return res.redirect(linkIndex);
			} catch (err) {
				console.error(err);
				return res.status(500).send('Something went wrong, try again');
			}
		} else {
			// Add Item
			try {
				await GroupsModel.saveItem(null, item, { task: "add" });
				req.flash('success', notify.ADD_SUCCESS, false);
				return res.redirect(linkIndex);
			} catch (err) {
				console.error(err);
				return res.status(500).send('Something went wrong, try again');
			}
		}
	} else {
		if (req.body.id)
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors: errors.array({ onlyFirstError: true }), isAdmin: req.user.isAdmin, });
		else
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors: errors.array({ onlyFirstError: true }), isAdmin: req.user.isAdmin, });
	}
})

// List groups
router.get('(/status/:status)?', async (req, res, next) => {
	try {
		let params = {};
		params.objWhere = {};
		params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
		params.keyword = ParamsHelpers.getParam(req.query, 'keyword', '');
		params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'created');
		params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'desc');

		let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus, 'groups');

		params.pagination = {
			totalItems: 0,
			totalItemsPerPage: 5,
			currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
			pageRanges: 3
		}

		if (params.currentStatus !== "all") params.objWhere.status = params.currentStatus;
		if (params.keyword !== "") params.objWhere.name = new RegExp(params.keyword, 'i');

		params.pagination.totalItems = await GroupsModel.countItem(params);
		let items = await GroupsModel.listItems(params);

		res.render(`${folderView}/list`, {
			pageTitle: pageTitleIndex,
			items,
			statusFilter,
			currentStatus: params.currentStatus,
			keyword: params.keyword,
			pagination: params.pagination,
			sortField: params.sortField,
			sortType: params.sortType,
			isAdmin: req.user.isAdmin,
		});
	} catch (err) {
		console.error(err)
		return res.status(500).send('Something went wrong, try again')
	}
});

// Change status
router.get('/change-status/:id/:status', async (req, res, next) => {
	let currentStatus = ParamsHelpers.getParam(req.params, 'status', '');
	let id = ParamsHelpers.getParam(req.params, 'id', '');

	try {
		await GroupsModel.changeStatus(id, currentStatus, { task: "update-one" });
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		return res.redirect(linkIndex)
	} catch (err) {
		console.error(err)
		return res.status(500).send('Something went wrong, try again')
	}
})

// Change Group ACP
router.get('/change-group-acp/:id/:group_acp', async (req, res, next) => {
	let currentGroupACP = ParamsHelpers.getParam(req.params, 'group_acp', 'yes')
	let id = ParamsHelpers.getParam(req.params, 'id', '')

	try {
		await GroupsModel.changeGroupACP(id, currentGroupACP);
		req.flash('success', notify.CHANGE_GROUP_ACP_SUCCESS, false);
		return res.redirect(linkIndex)
	} catch (err) {
		console.error(err)
		return res.status(500).send('Something went wrong, try again')
	}
})

// Change status - Multi
router.post('/change-status/:status', async (req, res, next) => {
	let currentStatus = ParamsHelpers.getParam(req.params, 'status', '');

	try {
		let result = await GroupsModel.changeStatus(req.body.cid, currentStatus, { task: "update-multi" });
		req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, result.matchedCount), false);
		return res.redirect(linkIndex);
	} catch (err) {
		console.error(err);
		return res.status(500).send('Something went wrong, try again');
	}
});

// Delete
router.get('/delete/:id', async (req, res, next) => {
	let id = ParamsHelpers.getParam(req.params, 'id', '');

	try {
		await GroupsModel.deleteItem(id, { task: "delete-one" });
		req.flash('success', notify.DELETE_SUCCESS, false);
		return res.redirect(linkIndex);
	} catch (err) {
		console.error(err);
		return res.status(500).send('Something went wrong, try again');
	}
});

// Delete - Multi
router.post('/delete', async (req, res, next) => {
	try {
		let result = await GroupsModel.deleteItem(req.body.cid, { task: "delete-multi" });
		req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, result.deletedCount), false);
		return res.redirect(linkIndex);
	} catch (err) {
		console.error(err);
		return res.status(500).send('Something went wrong, try again');
	}
});

// Sort
router.get('/sort/:sort_field/:sort_type', async (req, res, next) => {
	req.session.sort_field = ParamsHelpers.getParam(req.params, 'sort_field', 'ordering')
	req.session.sort_type = ParamsHelpers.getParam(req.params, 'sort_type', 'asc')

	return res.redirect(linkIndex);
});

module.exports = router;
