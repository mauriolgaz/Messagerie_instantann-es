'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Un utilisateur a plusieurs messages
      User.hasMany(models.Message, { foreignKey: 'senderId', as: 'messages' });

      // Un utilisateur appartient à plusieurs salons via RoomMembers
      User.belongsToMany(models.Room, { through: models.RoomMember, foreignKey: 'userId', as: 'rooms' });

      // Un utilisateur a plusieurs appels initiés ou reçus
      User.hasMany(models.Call, { foreignKey: 'callerId', as: 'outgoingCalls' });
      User.hasMany(models.Call, { foreignKey: 'receiverId', as: 'incomingCalls' });

      // Relations de contacts / amis
      User.belongsToMany(models.User, { 
        through: models.Contact, 
        as: 'friends', 
        foreignKey: 'userId', 
        otherKey: 'friendId' 
      });
    }
  }
  User.init({
   username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    qrToken: { type: DataTypes.STRING, allowNull: false, unique: true },
    avatarUrl: DataTypes.STRING,
    isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },
    role:{
      type:DataTypes.ENUM('user','admin'),
      defaultValue:'user',
      allowNull:false
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};