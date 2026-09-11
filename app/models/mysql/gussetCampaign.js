module.exports = function (Sequelize, Schema, GussetBrand) {
    const GussetCampaign = Schema.define('gussetCampaign', {
        gussetBrandId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'gusset_brand_id',
        },
        campaignName: { type: Sequelize.STRING, allowNull: false },
        destinationUrl: { type: Sequelize.TEXT, allowNull: false },
        creativeUrl: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
    }, { underscored: true, timestamps: true });
 
    GussetCampaign.belongsTo(GussetBrand, { as: 'brandDetails', foreignKey: 'gusset_brand_id' });
    GussetBrand.hasMany(GussetCampaign, { as: 'campaigns', foreignKey: 'gusset_brand_id' });
    GussetCampaign.sync({ force: false });
    return GussetCampaign;
};