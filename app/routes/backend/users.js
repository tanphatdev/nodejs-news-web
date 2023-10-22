const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
const util = require('util');

const { saveValidate } = require(__path_validates + 'users')
const systemConfig = require(__path_configs + 'system')
const notify = require(__path_configs + 'notify')
const UsersModel = require(__path_models + 'users')
const GroupsModel = require(__path_models + 'groups')
const UtilsHelpers = require(__path_helpers + 'utils')
const ParamsHelpers = require(__path_helpers + 'params')

const linkIndex = '/' + systemConfig.prefixAdmin + '/users'
const pageTitleIndex = 'Users Management'
const pageTitleIndexAdd = pageTitleIndex + ' - Add'
const pageTitleIndexEdit = pageTitleIndex + ' - Edit'
const folderView = __path_views_admin + 'pages/users/'

// Form
router.get('/form(/:id)?', async (req, res, next) => {
	let id = ParamsHelpers.getParam(req.params, 'id', '');
	let item = { fullname: '', username: '', password: '', phone: '', status: 'novalue', group: { id: '', name: '' }, };
	let errors = null;
	let groupsItems = [];
	groupsItems = await GroupsModel.listItemsInSelectBox();
	groupsItems.unshift({ _id: '', name: 'Choose Groups' });

	if (id) {
		item = await UsersModel.getItem(id);
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors, groupsItems, isAdmin: req.user.isAdmin, });
	}
	else {
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors, groupsItems, isAdmin: req.user.isAdmin, });
	}
});

// Save
router.post('/save', saveValidate, async (req, res, next) => {
	let item = {
		fullname: req.body.fullname,
		username: req.body.username,
		password: req.body.password,
		phone: req.body.phone,
		status: req.body.status,
		group: { id: req.body.group_id, name: req.body.group_name },
	}

	const errors = validationResult(req);
	if (errors.isEmpty()) {
		if (req.body.id) {
			// Edit Item
			try {
				await UsersModel.saveItem(req.body.id, item, { task: "edit" });
				req.flash('success', notify.EDIT_SUCCESS, false);
				return res.redirect(linkIndex)
			} catch (err) {
				console.error(err)
				return res.status(500).send('Something went wrong, try again')
			}
		} else {
			// Add Item
			try {
				await UsersModel.saveItem(null, item, { task: "add" });
				req.flash('success', notify.ADD_SUCCESS, false);
				return res.redirect(linkIndex);
			} catch (err) {
				console.error(err)
				return res.status(500).send('Something went wrong, try again')
			}
		}
	} else {
		let groupsItems = [];
		groupsItems = await GroupsModel.listItemsInSelectBox();
		groupsItems.unshift({ _id: '', name: 'Choose Groups' });
		if (req.body.id) {
			item.id = req.body.id;
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors: errors.array({ onlyFirstError: true }), groupsItems, isAdmin: req.user.isAdmin, });
		}
		else {
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors: errors.array({ onlyFirstError: true }), groupsItems, isAdmin: req.user.isAdmin, });
		}
	}
})

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	try {
		let params = {};
		params.objWhere = {};
		params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
		params.keyword = ParamsHelpers.getParam(req.query, 'keyword', '');
		params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'created');
		params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'desc');
		let groupID = ParamsHelpers.getParam(req.session, 'group_id', '');

		let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus, 'users');

		params.pagination = {
			totalItems: 0,
			totalItemsPerPage: 5,
			currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
			pageRanges: 3
		}

		if (params.currentStatus !== "all") params.objWhere.status = params.currentStatus;
		if (params.keyword !== "") params.objWhere.name = new RegExp(params.keyword, 'i');
		if (groupID != "allvalue" && groupID !== "") params.objWhere['group.id'] = groupID;

		params.pagination.totalItems = await UsersModel.countItem(params);

		let groupsItems = [];
		groupsItems = await GroupsModel.listItemsInSelectBox();
		groupsItems.unshift({ _id: 'allvalue', name: 'All Groups' });

		let items = await UsersModel.listItems(params);

		res.render(`${folderView}/list`, {
			pageTitle: pageTitleIndex,
			items,
			statusFilter,
			currentStatus: params.currentStatus,
			keyword: params.keyword,
			pagination: params.pagination,
			sortField: params.sortField,
			sortType: params.sortType,
			groupID,
			groupsItems,
			isAdmin: req.user.isAdmin,
		});
	} catch (err) {
		console.error(err)
		return res.status(500).send('Something went wrong, try again')
	}
});

// Change status
router.get('/change-status/:id/:status', async (req, res, next) => {
	let currentStatus = ParamsHelpers.getParam(req.params, 'status', '')
	let id = ParamsHelpers.getParam(req.params, 'id', '')

	try {
		await UsersModel.changeStatus(id, currentStatus, { task: "update-one" });
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
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
		let result = await UsersModel.changeStatus(req.body.cid, currentStatus, { task: "update-multi" });
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
		await UsersModel.deleteItem(id, { task: "delete-one" });
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
		let result = await UsersModel.deleteItem(req.body.cid, { task: "delete-multi" });
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

// Filter Group
router.get('/filter-group/:group_id', async (req, res, next) => {
	req.session.group_id = ParamsHelpers.getParam(req.params, 'group_id', '');
	return res.redirect(linkIndex);
});

module.exports = router;
