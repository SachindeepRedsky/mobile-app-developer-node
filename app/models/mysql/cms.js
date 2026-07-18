module.exports = function (Sequelize, Schema) {
    const cms = Schema.define('cms', {
        title: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING(10000),
            allowNull: false,
        },
        type: {
            type: Sequelize.STRING,
            allowNull: false,
        },

    }, {
        underscored: true,
    });

    cms.sync({ force: false });

    return cms;
};