'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Message.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
      Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    }
  }
  Message.init({
    roomId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    content: DataTypes.TEXT,
    type: { 
      type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'system'),
      defaultValue: 'text'
    },
    mediaUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
};