module.exports = function (Sequelize, Schema, GussetCampaign) {
    const GussetAd = Schema.define('gussetAd', {
        gussetCampaignId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'gusset_campaign_id',
        },
        adId: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        qrToken: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        destinationUrl: { type: Sequelize.TEXT, allowNull: false },
    }, { underscored: true, timestamps: true });
 
    GussetAd.belongsTo(GussetCampaign, { as: 'campaignDetails', foreignKey: 'gusset_campaign_id' });
    GussetCampaign.hasMany(GussetAd, { as: 'ads', foreignKey: 'gusset_campaign_id' });
    GussetAd.sync({ force: false });
    return GussetAd;
};