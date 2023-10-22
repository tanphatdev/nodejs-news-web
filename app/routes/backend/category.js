const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
const util = require('util');
const slug = require('slug');

const validateItem = require(__path_validates + 'category');
const systemConfig = require(__path_configs + 'system');
const notify = require(__path_configs + 'notify');
const CategoryModel = require(__path_models + 'category');
const ArticlesModel = require(__path_models + 'articles')
const UtilsHelpers = require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex = '/' + systemConfig.prefixAdmin + '/category';
const pageTitleIndex = 'Category Management';
const pageTitleIndexAdd = pageTitleIndex + ' - Add';
const pageTitleIndexEdit = pageTitleIndex + ' - Edit';
const folderView = __path_views_admin + 'pages/category/';

// Form
router.get('/form(/:id)?', async (req, res, next) => {
	let id = ParamsHelpers.getParam(req.params, 'id', '')
	let item = { name: '', slug: '', ordering: 0, status: 'novalue', }
	let errors = null
	if (id) {
		item = await CategoryModel.getItem(id);
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors, isAdmin: req.user.isAdmin, });
	}
	else {
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors, isAdmin: req.user.isAdmin, });
	}
});

// Save
router.post('/save', validateItem, async (req, res, next) => {
	let item = {
		name: req.body.name,
		slug: slug(req.body.slug),
		ordering: parseInt(req.body.ordering),
		status: req.body.status,
	}

	const errors = validationResult(req);
	if (errors.isEmpty()) {
		if (req.body.id) {
			// Edit Item
			try {
				await CategoryModel.saveItem(req.body.id, item, req.user, { task: "edit" });
				await ArticlesModel.changeCategory(req.body.id, req.body.name);
				req.flash('success', notify.EDIT_SUCCESS, false);
				return res.redirect(linkIndex);
			} catch (err) {
				console.error(err);
				return res.status(500).send('Something went wrong, try again');
			}
		} else {
			// Add Item
			try {
				await CategoryModel.saveItem(null, item, req.user, { task: "add" });
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

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	try {
		let params = {};
		params.objWhere = {};
		params.currentStatus = ParamsHelpers.getParam(req.params, 'status', 'all');
		params.keyword = ParamsHelpers.getParam(req.query, 'keyword', '');
		params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'created.time');
		params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'desc');

		let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus, 'category');

		params.pagination = {
			totalItems: 0,
			totalItemsPerPage: 5,
			currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
			pageRanges: 3
		}

		if (params.currentStatus !== "all") params.objWhere.status = params.currentStatus;
		if (params.keyword !== "") params.objWhere.name = new RegExp(params.keyword, 'i');

		params.pagination.totalItems = await CategoryModel.countItem(params);
		let items = await CategoryModel.listItems(params);

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
		await CategoryModel.changeStatus(id, currentStatus, req.user, { task: "update-one" });
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
		let result = await CategoryModel.changeStatus(req.body.cid, currentStatus, req.user, { task: "update-multi" });
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
		await CategoryModel.changeOrdering(cids, orderings, req.user);
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
		await CategoryModel.deleteItem(id, { task: "delete-one" });
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
		let result = await CategoryModel.deleteItem(req.body.cid, { task: "delete-multi" });
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
