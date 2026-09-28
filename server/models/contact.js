'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Contact extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Contact.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Contact.belongsTo(models.User, { foreignKey: 'friendId', as: 'friend' });
    }
  }
  Contact.init({
    userId: { type: DataTypes.INTEGER, allowNull: false },
    friendId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'accepted', 'blocked'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'Contact',
  });
  return Contact;
};