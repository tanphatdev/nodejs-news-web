var express = require('express');
var router = express.Router();

const ArticlesModel = require(__path_models + 'articles')
const CategoryModel = require(__path_models + 'category')

const folderView = __path_views_blog + 'pages/home/';
const layoutBlog = __path_views_blog + 'frontend';

router.get('/', async (req, res, next) => {
	let itemsSpecial = [];
	let itemsNews = [];
	let itemsCategory = [];
	let itemsRandom = [];

	itemsSpecial = await ArticlesModel.listItemFrontend(null, { task: 'items-special' });
	itemsNews = await ArticlesModel.listItemFrontend(null, { task: 'items-news' });
	itemsCategory = await CategoryModel.listItemFrontend(null, { task: 'items-in-menu' });
	itemsRandom = await ArticlesModel.listItemFrontend(null, { task: 'items-random' });

	let isShowTopPost = false;
	if (itemsSpecial.length >= 3) isShowTopPost = true;

	res.render(folderView + 'index', {
		layout: layoutBlog,
		top_post: isShowTopPost,
		itemsSpecial,
		itemsNews,
		itemsCategory,
		itemsRandom,
		isLogIn: req.isAuthenticated(),
	});
});

module.exports = router;
