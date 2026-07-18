module.exports = function(Sequelize, Schema) {
    const couponRecords = Schema.define('couponRecords', {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
        },
        productId: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'product_Id',
        },
        couponId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'coupon_id',
        },
        status: {
            type: Sequelize.ENUM,
            values: ['active', 'used', 'expired'],
            defaultValue: 'active',
        },
    }, {
        underscored: true,
    });

    couponRecords.sync({ force: false });

    return couponRecords;
};
