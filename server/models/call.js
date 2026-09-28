'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Call extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Call.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
      Call.belongsTo(models.User, { foreignKey: 'callerId', as: 'caller' });
      Call.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver' });
    }
  }
  Call.init({
    roomId: DataTypes.INTEGER,
    callerId: { type: DataTypes.INTEGER, allowNull: false },
    receiverId: DataTypes.INTEGER,
    type: { type: DataTypes.ENUM('audio', 'video'), defaultValue: 'audio' },
    status: { type: DataTypes.ENUM('missed', 'answered', 'rejected', 'ended'), defaultValue: 'missed' },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    endedAt: DataTypes.DATE,
    duration: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Call',
  });
  return Call;
};