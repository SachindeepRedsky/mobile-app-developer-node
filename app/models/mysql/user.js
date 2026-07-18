module.exports = function (Sequelize, Schema) {
  const UserSignup = Schema.define(
    "userMaster",
    {
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        // unique: true,
      },
      countryCode: {
        type: Sequelize.STRING,
        allowNull: true,
        //unique: true,
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: true,
        // unique: true,
      },
      loginType: {
        type: Sequelize.ENUM,
        values: ["manual", "twilio", "google", "facebook", "apple"],
        // defaultValue:
      },
      role: {
        type: Sequelize.ENUM,
        values: ["user"],
        // defaultValue:
      },
      otp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isDeleted: {
        type: Sequelize.ENUM,
        values: ["0", "1"], // 0 for not deleted, 1 for deleted
        defaultValue: "0",
      },
      jwtLoginToken: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      social_unique_login_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      isLogin: {
        type: Sequelize.ENUM,
        values: ["0", "1"], // 0 for not logged in, 1 for logged in
        defaultValue: "0",
      },
      profilePic: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM,
        values: ["active", "inactive"],
        defaultValue: "active",
      },
    },
    {
      underscored: true,
    }
  );

  UserSignup.sync({ force: false });

  return UserSignup;
};
