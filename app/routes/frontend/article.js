var express = require('express');
var router = express.Router();

const ArticlesModel = require(__path_models + 'articles')
const CategoryModel = require(__path_models + 'category')
const ParamsHelpers = require(__path_helpers + 'params')

const folderView = __path_views_blog + 'pages/article/';
const layoutBlog = __path_views_blog + 'frontend';

router.get('/:slug', async (req, res, next) => {
	let slug = ParamsHelpers.getParam(req.params, 'slug', '');
	let itemArticle = null;
	let itemsCategory = [];
	let itemsRandom = [];
	let itemsOthers = [];

	itemsCategory = await CategoryModel.listItemFrontend(null, { task: 'items-in-menu' });
	itemsRandom = await ArticlesModel.listItemFrontend(null, { task: 'items-random' });

	itemArticle = await ArticlesModel.getItemFrontendBySlug(slug);
	if (itemArticle)
		itemsOthers = await ArticlesModel.listItemFrontend({ articleId: itemArticle.id, categoryId: itemArticle.category.id }, { task: 'items-others' });

	res.render(folderView + 'index', {
		layout: layoutBlog,
		top_post: false,
		itemsCategory,
		itemsRandom,
		itemArticle,
		itemsOthers,
		isLogIn: req.isAuthenticated(),
	});
});

module.exports = router;
