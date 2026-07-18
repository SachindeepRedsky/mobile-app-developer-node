// module.exports = function(Sequelize, Schema) {
//     const campaign = Schema.define('campaignMaster', {
//         campaignId: {
//             type: Sequelize.STRING,
//             allowNull: false,
//         },
//         campaignName: {
//             type: Sequelize.STRING,
//             allowNull: false,
//         },
//         bags: {
//             type: Sequelize.INTEGER,
//             allowNull: false,
//         },
//         status: {
//             type: Sequelize.ENUM,
//             values: ['published', 'unpublished'],  
//             defaultValue: 'unpublished',
//         },
//     }, {
//         underscored: true,
//     });

//     // Sync the model with the database
//     campaign.sync({ force: false});

//     return campaign;
// };
module.exports = function (Sequelize, Schema) {
    const Campaign = Schema.define('campaignMaster', {
        campaignId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true, // Ensures no duplicate campaign IDs
        },
        campaignName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        bags: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        coupons: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        status: {
            type: Sequelize.ENUM,
            values: ['published', 'unpublished'],
            defaultValue: 'unpublished',
            allowNull: false, // Ensures status is always set
        },
        description: {
            type: Sequelize.TEXT, // Optional: Detailed campaign information
            allowNull: true,
        },
        expiryDate: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        startingDate: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    }, {
        underscored: true,
        timestamps: true, // Adds createdAt and updatedAt fields
        paranoid: true, // Adds deletedAt field for soft deletes
    });

    // Sync the model with the database
    Campaign.sync({ force: false });

    return Campaign;
};
