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
        friendId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'friend_id',
        },
        status: {
            type: Sequelize.ENUM,
            values: ['active', 'used', 'expired', 'assigned'],
            defaultValue: 'active',
        },
    }, {
        underscored: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['coupon_id'] },
            { fields: ['friend_id'] },
            { unique: true, fields: ['user_id', 'coupon_id', 'product_Id'] },
        ],
    });

    couponRecords.sync({ force: false });

    return couponRecords;
};
