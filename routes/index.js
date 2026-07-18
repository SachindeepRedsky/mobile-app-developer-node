module.exports = function (app, model, controllers) {
	require('./admin.js')(app, model, controllers.admin);
	require('./frontend.js')(app, model, controllers.frontend);
}	