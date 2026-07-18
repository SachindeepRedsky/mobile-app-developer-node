module.exports = function(Sequelize, Schema) {
    const adminSignup = Schema.define('admin', {
        name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        },
        password:{
            type: Sequelize.STRING,
            allowNull: false,
        },
        is_deleted: {
            type: Sequelize.ENUM,
            values: ['0', '1'],  // 0 for not deleted, 1 for deleted
            defaultValue: '0',
        },
        profile_picture: {
            type: Sequelize.STRING(255),
            allowNull: true,
        },
    }, {
        underscored: true,
    });

    adminSignup.sync({ force: false });

    return adminSignup;
};
