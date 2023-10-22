const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
const util = require('util');
const slug = require('slug');

const validateArticles = require(__path_validates + 'articles')
const createValidateUpload = require(__path_validates + 'upload')
const systemConfig = require(__path_configs + 'system')
const notify = require(__path_configs + 'notify')
const ArticlesModel = require(__path_models + 'articles')
const CategoryModel = require(__path_models + 'category')
const UtilsHelpers = require(__path_helpers + 'utils')
const FileHelpers = require(__path_helpers + 'file');
const ParamsHelpers = require(__path_helpers + 'params')

const linkIndex = '/' + systemConfig.prefixAdmin + '/articles'
const pageTitleIndex = 'Articles Management'
const pageTitleIndexAdd = pageTitleIndex + ' - Add'
const pageTitleIndexEdit = pageTitleIndex + ' - Edit'
const folderView = __path_views_admin + 'pages/articles/'
const uploadFolder = 'public/uploads/articles/'
const uploadThumb = FileHelpers.upload('thumb', 'articles', 10, 1, 'jpeg|jpg|png')
const validateUpload = createValidateUpload(uploadThumb, 'thumb', 'Thumb')

// Form
router.get('/form(/:id)?', async (req, res, next) => {
	let id = ParamsHelpers.getParam(req.params, 'id', '');
	let item = { name: '', slug: '', status: 'novalue', special: 'novalue', category: { id: '', name: '' }, content: '' };
	let errors = null;
	let categoryItems = [];
	categoryItems = await CategoryModel.listItemsInSelectBox();
	categoryItems.unshift({ _id: '', name: 'Choose Groups' });

	if (id) {
		item = await ArticlesModel.getItem(id);
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors, categoryItems, isAdmin: req.user.isAdmin, });
	}
	else {
		res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors, categoryItems, isAdmin: req.user.isAdmin, });
	}
});

// Save
router.post('/save', validateUpload, validateArticles, async (req, res, next) => {
	let item = {
		name: req.body.name,
		slug: slug(req.body.slug),
		status: req.body.status,
		special: req.body.special,
		category: { id: req.body.category_id, name: req.body.category_name },
		content: req.body.content,
	}

	const errors = validationResult(req);
	if (errors.isEmpty() && !req.multerErrors.length) {
		if (req.body.id) {
			// Edit Item
			try {
				if (req.file) item.thumb = req.file.filename;
				await ArticlesModel.saveItem(req.body.id, item, req.user, { task: "edit" });
				req.flash('success', notify.EDIT_SUCCESS, false);
				return res.redirect(linkIndex)
			} catch (err) {
				console.error(err)
				return res.status(500).send('Something went wrong, try again')
			}
		} else {
			// Add Item
			try {
				if (req.file) item.thumb = req.file.filename;
				await ArticlesModel.saveItem(null, item, req.user, { task: "add" });
				req.flash('success', notify.ADD_SUCCESS, false);
				return res.redirect(linkIndex);
			} catch (err) {
				console.error(err)
				return res.status(500).send('Something went wrong, try again')
			}
		}
	} else {
		let categoryItems = [];
		categoryItems = await CategoryModel.listItemsInSelectBox();
		categoryItems.unshift({ _id: '', name: 'Choose Groups' });
		let listErrors = [...errors.array({ onlyFirstError: true }), ...req.multerErrors];
		if (req.body.id) {
			item.id = req.body.id;
			if (req.file) FileHelpers.remove(uploadFolder, req.file.filename);
			let { thumb } = await ArticlesModel.getItem(item.id);
			item.thumb = thumb;
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexEdit, item, errors: listErrors, categoryItems, isAdmin: req.user.isAdmin, });
		}
		else {
			if (req.file) FileHelpers.remove(uploadFolder, req.file.filename);
			res.render(`${folderView}/form`, { pageTitle: pageTitleIndexAdd, item, errors: listErrors, categoryItems, isAdmin: req.user.isAdmin, });
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
		params.sortField = ParamsHelpers.getParam(req.session, 'sort_field', 'created.time');
		params.sortType = ParamsHelpers.getParam(req.session, 'sort_type', 'desc');
		let categoryID = ParamsHelpers.getParam(req.session, 'category_id', '');

		let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus, 'articles');

		params.pagination = {
			totalItems: 0,
			totalItemsPerPage: 5,
			currentPage: parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
			pageRanges: 3
		}

		if (params.currentStatus !== "all") params.objWhere.status = params.currentStatus;
		if (params.keyword !== "") params.objWhere.name = new RegExp(params.keyword, 'i');
		if (categoryID != "allvalue" && categoryID !== "") params.objWhere['category.id'] = categoryID;

		params.pagination.totalItems = await ArticlesModel.countItem(params);

		let categoryItems = [];
		categoryItems = await CategoryModel.listItemsInSelectBox();
		categoryItems.unshift({ _id: 'allvalue', name: 'All Category' });

		let items = await ArticlesModel.listItems(params);

		res.render(`${folderView}/list`, {
			pageTitle: pageTitleIndex,
			items,
			statusFilter,
			currentStatus: params.currentStatus,
			keyword: params.keyword,
			pagination: params.pagination,
			sortField: params.sortField,
			sortType: params.sortType,
			categoryID,
			categoryItems,
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
		await ArticlesModel.changeStatus(id, currentStatus, req.user, { task: "update-one" });
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		return res.redirect(linkIndex)
	} catch (err) {
		console.error(err)
		return res.status(500).send('Something went wrong, try again')
	}
})

// Change special
router.get('/change-special/:id/:special', async (req, res, next) => {
	let currentSpecial = ParamsHelpers.getParam(req.params, 'special', '')
	let id = ParamsHelpers.getParam(req.params, 'id', '')

	try {
		await ArticlesModel.changeSpecial(id, currentSpecial, req.user, { task: "update-one" });
		req.flash('success', notify.CHANGE_SPECIAL_SUCCESS, false);
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
		let result = await ArticlesModel.changeStatus(req.body.cid, currentStatus, req.user, { task: "update-multi" });
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
		await ArticlesModel.deleteItem(id, { task: "delete-one" });
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
		let result = await ArticlesModel.deleteItem(req.body.cid, { task: "delete-multi" });
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

// Filter Category
router.get('/filter-category/:category_id', async (req, res, next) => {
	req.session.category_id = ParamsHelpers.getParam(req.params, 'category_id', '');
	return res.redirect(linkIndex);
});

module.exports = router;
