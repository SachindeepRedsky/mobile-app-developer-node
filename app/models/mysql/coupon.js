module.exports = function (Sequelize, Schema, User, Brand) {
    const coupon = Schema.define('coupon', {
        couponCode: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        userName: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ""
        },
        title:{
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ""
        },
        description:{
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: ""
        },
        status: {
            type: Sequelize.ENUM,
            values: ['used', 'unused'],
            defaultValue: 'unused',
        },
        expiryDate: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        startingDate: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        isExpired: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        assignStatus: {
            type: Sequelize.ENUM,
            values: ['assigned', 'unassigned'],
            defaultValue: 'unassigned',
        },
        qrCode: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: ""
        },
        userId:{
            type: Sequelize.INTEGER,
            allowNull: false,
        }
    }, {
        underscored: true,
    });
    coupon.belongsTo(User, { as: 'userDetails', foreignKey: 'user_id', });
    coupon.belongsTo(Brand, { as: 'brandDetails', foreignKey: 'brand_id', });

    // Sync the model with the database
    coupon.sync({ force: false});

    return coupon;
};
