module.exports = function (Sequelize, Schema) {
    const GussetBrand = Schema.define('gussetBrand', {
        brandName: { type: Sequelize.STRING, allowNull: false },
        brandLogo: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
    }, { underscored: true, timestamps: true });
 
    GussetBrand.sync({ force: false });
    return GussetBrand;
};