module.exports = function (Sequelize, Schema) {
    var module = {};

    module.User = require('./user')(Sequelize, Schema);
    module.Admin = require('./admin')(Sequelize, Schema);
    module.Cms = require('./cms')(Sequelize, Schema);
    module.Campaign = require('./campaign')(Sequelize, Schema);
    module.Brand = require('./brand')(Sequelize, Schema, module.Campaign);
    module.Coupon = require('./coupon')(Sequelize, Schema, module.User, module.Brand);
    module.CampaignBrandHistory = require('./campaignBrandHistory')(Sequelize, Schema, module.Campaign, module.Brand);
    module.Bags = require('./bags')(Sequelize, Schema, module.Campaign, module.Brand, module.Coupon);
    module.CouponRecords = require('./couponRecords')(Sequelize, Schema, module.Coupon);

    module.Brand.hasMany(module.Coupon, { foreignKey: 'brand_id' });

    return module;
}