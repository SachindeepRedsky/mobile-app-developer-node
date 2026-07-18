module.exports = function (dataBaseType) {
	console.log("process.env.DB_NAME --> ", process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,  process.env.DB_HOST);
	
	var sequelize = new dataBaseType(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		dialect: 'mysql',
		//operatorsAliases: false,
		operatorsAliases : 0,
		logging: false,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			//idle: 100000,
			idle: 10000,
			//evict: 1000
		}
	});

	sequelize.authenticate().then(() => {
		console.log('Connection has been established successfully.');
	}).catch(err => {
		console.error('Unable to connect to the database:', err);
	});

	return sequelize;

}
