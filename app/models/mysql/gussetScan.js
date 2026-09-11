module.exports = function (Sequelize, Schema, GussetAd) {
    const GussetScan = Schema.define(
        "gussetScan",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
 
            clickId: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
 
            qrToken: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
 
            gussetAdId: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
 
            eventType: {
                type: Sequelize.ENUM("gusset_scan", "gusset_view"),
                allowNull: false,
                defaultValue: "gusset_scan",
            },
 
            ipAddress: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
 
            userAgent: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
 
            referer: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
 
            scannedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        },
        {
            underscored: true,
            timestamps: true,
        }
    );
 
    GussetScan.belongsTo(GussetAd, {
        as: "adDetails",
        foreignKey: "gusset_ad_id",
        targetKey: "adId",
    });
 
    GussetScan.sync({ force: false });
 
    return GussetScan;
};