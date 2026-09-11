module.exports = function (Sequelize, Schema) {
    const couponShares = Schema.define('couponShares', {
        couponId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'coupon_id',
        },
        productId: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'product_id',
        },
        sharerUserId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'sharer_user_id',
        },
        shareToken: {
            type: Sequelize.STRING(128),
            allowNull: false,
            unique: true,
            field: 'share_token',
        },
        shareUrl: {
            type: Sequelize.STRING(512),
            allowNull: false,
            field: 'share_url',
        },
    }, {
        tableName: 'coupon_shares',
        underscored: true,
        indexes: [
            { unique: true, fields: ['share_token'] },
            { fields: ['coupon_id'] },
            { fields: ['sharer_user_id'] },
            { fields: ['product_id'] },
        ],
    });

    couponShares.sync({ force: false });

    return couponShares;
};
