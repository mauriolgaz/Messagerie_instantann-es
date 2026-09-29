const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'josias_123_ultra_secret_key';

module.exports = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'Accès non autorisé. Aucun token fourni.'
            });
        }

        // Vérification avec la MÊME clé secrète
        const decoded = jwt.verify(token, JWT_SECRET);

        const currentUser = await User.findByPk(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'L\'utilisateur rattaché à ce token n\'existe plus.'
            });
        }

        req.user = currentUser;
        req.userId = currentUser.id; // ✅ Ajout de req.userId
        next();

    } catch (error) {
        // Intercepte les erreurs JWT spécifiques (signature invalide, token expiré...)
        return res.status(401).json({
            status: 'fail',
            message: 'Token invalide ou expiré.'
        });
    }
};