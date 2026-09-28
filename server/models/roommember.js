'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RoomMember.belongsTo(models.User, { foreignKey: 'userId' });
      RoomMember.belongsTo(models.Room, { foreignKey: 'roomId' });
    }
  }
  RoomMember.init({
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' }
  }, {
    sequelize,
    modelName: 'RoomMember',
  });
  return RoomMember;
};