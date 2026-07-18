// module.exports = function (Sequelize, Schema, Campaign, Brand) {
//     const campaignBrandHistory = Schema.define('campaignBrandHistory', {
//     }, {
//         underscored: true,
//     });
//     campaignBrandHistory.belongsTo(Campaign, { as: 'campaignDetails', foreignKey: 'campaign_id', });
//     campaignBrandHistory.belongsTo(Brand, { as: 'brandDetails', foreignKey: 'brand_id', });

//     // Sync the model with the database
//     campaignBrandHistory.sync( {force: false});

//     return campaignBrandHistory;
// };
module.exports = function (Sequelize, Schema, Campaign, Brand) {
    const CampaignBrandHistory = Schema.define('campaignBrandHistory', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        status: {
            type: Sequelize.ENUM,
            values: ['active', 'inactive'],
            defaultValue: 'active',
        },
    }, {
        underscored: true,
        timestamps: true, // Adds createdAt and updatedAt
        paranoid: true,   // Adds deletedAt for soft deletes
        indexes: [
            {
                fields: ['campaign_id', 'brand_id'], // Optimizes query performance
            },
        ],
    });

    CampaignBrandHistory.belongsTo(Campaign, { as: 'campaignDetails', foreignKey: 'campaign_id' });
    CampaignBrandHistory.belongsTo(Brand, { as: 'brandDetails', foreignKey: 'brand_id' });

    // Sync the model with the database
    CampaignBrandHistory.sync({ force: false });

    return CampaignBrandHistory;
};
