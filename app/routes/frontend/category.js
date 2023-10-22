var express = require('express');
var router = express.Router();

const ArticlesModel = require(__path_models + 'articles')
const CategoryModel = require(__path_models + 'category')
const ParamsHelpers = require(__path_helpers + 'params')

const folderView = __path_views_blog + 'pages/category/';
const layoutBlog = __path_views_blog + 'frontend';

router.get('/:slug', async (req, res, next) => {
	let slug = ParamsHelpers.getParam(req.params, 'slug', '');
	let itemsCategory = [];
	let itemsInCategory = [];
	let itemsRandom = [];

	itemsCategory = await CategoryModel.listItemFrontend(null, { task: 'items-in-menu' });
	category = await CategoryModel.getItemBySlug(slug);
	itemsInCategory = await ArticlesModel.listItemFrontend({ slug }, { task: 'items-in-category' });
	itemsRandom = await ArticlesModel.listItemFrontend(null, { task: 'items-random' });

	res.render(folderView + 'index', {
		layout: layoutBlog,
		top_post: false,
		category,
		itemsCategory,
		itemsInCategory,
		itemsRandom,
		isLogIn: req.isAuthenticated(),
	});
});

module.exports = router;
