// module.exports = function (Sequelize, Schema, Campaign, Brand, Coupon) {
//     const bags = Schema.define('bagsMaster', {
//         productId: {
//             type: Sequelize.STRING,
//             allowNull: false,
//         },
//     }, {
//         underscored: true,
//     });
//     bags.belongsTo(Campaign, { as: 'campaignDetails', foreignKey: 'campaign_id', });
//     bags.belongsTo(Brand, { as: 'brandDetails', foreignKey: 'brand_id', });
//     bags.belongsTo(Coupon, { as: 'coupenDetails', foreignKey: 'coupon_id', })

//     bags.sync({ force: false });

//     return bags;
// };
module.exports = function (Sequelize, Schema, Campaign, Brand, Coupon) {
    const Bags = Schema.define('bagsMaster', {
        productId: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        bagName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        expiryDate: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        startingDate: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        status: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        isExpired: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {
        underscored: true,
        timestamps: true,
    });

    // Associations
    Bags.belongsTo(Campaign, {
        as: 'campaignDetails',
        foreignKey: 'campaign_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    Bags.belongsTo(Brand, {
        as: 'brandDetails',
        foreignKey: 'brand_id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    });

    Bags.belongsTo(Coupon, {
        as: 'couponDetails',
        foreignKey: 'coupon_id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    });

    // Sync without force to avoid dropping tables
    Bags.sync({ force: false });

    return Bags;
};
