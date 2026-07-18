// let Coupon = require('./coupon')
module.exports = function (Sequelize, Schema, Campaign, Coupon) {
    // console.log("---->>",Coupon);
    const brand = Schema.define('brandMaster', {
        brandName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM,
            values: ['active', 'inactive'],  // 'active' or 'inactive' status
            defaultValue: 'active',
        },
        brandLogo: {
            type: Sequelize.STRING(255),
            allowNull: true,
        },
    }, {
        underscored: true,
    });
    brand.belongsTo(Campaign, { as: 'campaignDetails', foreignKey: 'campaign_id', });
    // Sync the model with the database
    brand.sync({ force: false });

    return brand;
};
