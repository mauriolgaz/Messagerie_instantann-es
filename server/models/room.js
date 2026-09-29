'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Room.hasMany(models.RoomMember, { foreignKey: 'roomId', as: 'RoomMembers' });
      Room.hasMany(models.Message, { foreignKey: 'roomId', as: 'messages' });
      Room.belongsToMany(models.User, { through: models.RoomMember, foreignKey: 'roomId', as: 'members' });
      Room.hasMany(models.Call, { foreignKey: 'roomId', as: 'calls' });
    }
  }
  Room.init({
    name: DataTypes.STRING,
    isGroup: { type: DataTypes.BOOLEAN, defaultValue: false },
    qrCodeToken: { type: DataTypes.STRING, unique: true }
  }, {
    sequelize,
    modelName: 'Room',
  });
  return Room;
};