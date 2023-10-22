const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
const util = require('util');

const { validateItem } = require(__path_validates + 'items');
const systemConfig = require(__path_configs + 'system');
const notify = require(__path_configs + 'notify');
const ItemsModel = require(__path_models + 'items');
const UtilsHelpers = require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex = '/' + systemConfig.prefixAdmin + '/items';
const pageTitleIndex = 'Items Management';
const pageTitleIndexAdd = pageTitleIndex + ' - Add';
const pageTitleIndexEdit = pageTitleIndex + ' - Edit';
const folderView = __path_views_admin + 'pages/items/';

// Form
router.get('/form(/:id)?', async (req, res, next) => {
	let id = ParamsHelpers.getParam(req.params, 'id', '')
	let item = { name: '', ordering: 0, status: 'novalue', content: '' }
	let errors = null
	if (id) {
		item = await ItemsModel.getItem(id);
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors });
	}
	else {
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors });
	}
});

// Save
router.post('/save', validateItem, async (req, res, next) => {
	let item = {
		name: req.body.name,
		ordering: parseInt(req.body.ordering),
		status: req.body.status,
		content: req.body.content,
	}

	const errors = validationResult(req);
	if (errors.isEmpty()) {
		if (req.body.id) {
			// Edit Item
			try {
				await ItemsModel.saveItem(req.body.id, item, { task: "edit" });
				req.flash('success', notify.EDIT_SUCCESS, false);
				return res.redirect(linkIndex);
			} catch (err) {
				console.error(err);
				return res.status(500).send('Something went wrong, try again');
			}
		} else {
			// Add Item
			try {
				await ItemsModel.saveItem(null, item, { task: "add" });
				req.flash('success', notify.ADD_SUCCESS, false);
				return res.redirect(linkIndex);
			} catch (err) {
				console.error(err);
				return res.status(500).send('Something went wrong, try again');
			}
		}
	} else {
		if (req.body.id)
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors: errors.array({ onlyFirstError: true }) });
		else
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors: errors.array({ onlyFirstError: true }) });
	}
})

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	try {
		let params = {};
		params.objWhere = {};
		params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
		params.keyword = ParamsHelpers.getParam(req.query, 'keyword', '');
		params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'name');
		params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'asc');

		let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus, 'items');

		params.pagination = {
			totalItems: 0,
			totalItemsPerPage: 5,
			currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
			pageRanges: 3
		}

		if (params.currentStatus !== "all") params.objWhere.status = params.currentStatus;
		if (params.keyword !== "") params.objWhere.name = new RegExp(params.keyword, 'i');

		params.pagination.totalItems = await ItemsModel.countItem(params);
		let items = await ItemsModel.listItems(params);

		res.render(`${folderView}/list`, {
			pageTitle: pageTitleIndex,
			items,
			statusFilter,
			currentStatus: params.currentStatus,
			keyword: params.keyword,
			pagination: params.pagination,
			sortField: params.sortField,
			sortType: params.sortType,
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
		await ItemsModel.changeStatus(id, currentStatus, { task: "update-one" });
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
		let result = await ItemsModel.changeStatus(req.body.cid, currentStatus, { task: "update-multi" });
		req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, result.matchedCount), false);
		return res.redirect(linkIndex);
	} catch (err) {
		console.error(err);
		return res.status(500).send('Something went wrong, try again');
	}
});

// Ordering - Multi
router.post('/change-ordering', async (req, res, next) => {
	let cids = req.body.cid;
	let orderings = req.body.ordering;

	try {
		await ItemsModel.changeOrdering(cids, orderings);
		req.flash('success', notify.CHANGE_OREDRING_SUCCESS, false);
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
		await ItemsModel.deleteItem(id, { task: "delete-one" });
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
		let result = await ItemsModel.deleteItem(req.body.cid, { task: "delete-multi" });
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
