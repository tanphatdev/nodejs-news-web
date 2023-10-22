require('dotenv').config()
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const flash = require('express-flash-notification');
let passport = require('passport');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const moment = require('moment');

const { ENV, DATABASE_NAME, MONGODB_USER, MONGODB_PASSWORD } = process.env;

// Define Path
const pathConfig = require('./path');
global.__base = __dirname + '/';
global.__path_app = __base + pathConfig.folder_app + '/';
global.__path_configs = __path_app + pathConfig.folder_configs + '/';
global.__path_helpers = __path_app + pathConfig.folder_helpers + '/';
global.__path_routes = __path_app + pathConfig.folder_routes + '/';
global.__path_schemas = __path_app + pathConfig.folder_schemas + '/';
global.__path_models = __path_app + pathConfig.folder_models + '/';
global.__path_validates = __path_app + pathConfig.folder_validates + '/';
global.__path_views = __path_app + pathConfig.folder_views + '/';
global.__path_views_admin = __path_views + pathConfig.folder_module_admin + '/';
global.__path_views_blog = __path_views + pathConfig.folder_module_blog + '/';
global.__path_public = __base + pathConfig.folder_public + '/';
global.__path_uploads = __path_public + pathConfig.folder_uploads + '/';

const systemConfig = require(__path_configs + 'system');
const databaseConfig = require(__path_configs + 'database');

(async () => {
	try {
		await mongoose.connect(`mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@cluster0.2qxefwn.mongodb.net/${DATABASE_NAME}`);
		console.log('Connection has been established successfully.')
	} catch (err) {
		console.error('Unable to connect to the database:', err);
	}
})()

var app = express();
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	store: MongoStore.create({
		client: mongoose.connection.getClient(),
	}),
	cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.authenticate('session'));
app.use(flash(app, {
	viewName: __path_views_admin + 'elements/notify',
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', __path_views_admin + 'backend');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.locals.systemConfig = systemConfig;
app.locals.moment = moment;

app.use(`/${systemConfig.prefixAdmin}`, require(__path_routes + 'backend/index'));
app.use(`/${systemConfig.prefixBlog}`, require(__path_routes + 'frontend/index'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	if (ENV == 'dev') {
		res.render(__path_views_admin + 'pages/error', { layout: __path_views_admin + 'error' });
	}
	else {
		res.render(
			__path_views_blog + 'pages/error',
			{ layout: __path_views_blog + 'frontend', top_post: false, itemsCategory: [], itemsRandom: [], }
		);
	}
});

module.exports = app;
