const { User } = require('../models');
const { Op } = require('sequelize'); // Import de Op pour éviter l'erreur Sequelize
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');



// Clé secrète pour signer les JWT (à placer idéalement dans vos variables d'environnement .env)
const JWT_SECRET = process.env.JWT_SECRET || 'josias@123#é`(';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 1. Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['username', 'ASC']]
        });

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        next(error);
    }
};

// 2. Création d'un utilisateur
exports.createUser = async (req, res, next) => {
    try {
        // Extraction du rôle en plus des autres champs
        const { username, email, password, avatarUrl, role } = req.body;

        // Validation des champs requis
        if (!username || !email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Tous les champs (username, email, password) sont requis.'
            });
        }

        // Validation facultative de la valeur du rôle
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le rôle doit être "user" ou "admin".'
            });
        }

        // Validation du format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Format d\'email invalide.'
            });
        }

        // Validation de la longueur du mot de passe
        if (password.length < 6) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le mot de passe doit contenir au moins 6 caractères.'
            });
        }

        // Vérification de l'existence d'un utilisateur avec le même email ou username
        const userExists = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email.toLowerCase() },
                    { username: username }
                ]
            }
        });

        if (userExists) {
            if (userExists.email === email.toLowerCase()) {
                return res.status(409).json({
                    status: 'fail',
                    message: 'Cet email est déjà utilisé par un autre compte.'
                });
            }
            if (userExists.username === username) {
                return res.status(409).json({
                    status: 'fail',
                    message: 'Ce nom d\'utilisateur est déjà utilisé par un autre compte.'
                });
            }
        }

        // Hachage du mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Génération du jeton QR Code unique
        const qrToken = `USER_QR_${uuidv4()}`;

        // Création de l'utilisateur en base de données avec le rôle
        const newUser = await User.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            qrToken: qrToken,
            avatarUrl: avatarUrl || null,
            isOnline: false,
            role: role || 'user' // Si non spécifié, le rôle par défaut sera 'user'
        });

        // Masquer le mot de passe dans la réponse
        const userResponse = newUser.toJSON();
        delete userResponse.password;

        return res.status(201).json({
            status: 'success',
            message: 'Utilisateur créé avec succès',
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, email, avatarUrl, role } = req.body;

        // 1. Vérification de la validité de l'ID
        if (isNaN(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'ID d\'utilisateur invalide.'
            });
        }

        // 2. Existence de l'utilisateur dans la BDD
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucun utilisateur trouvé avec cet ID.'
            });
        }

        // 3. Vérification du rôle fourni
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le rôle doit être "user" ou "admin".'
            });
        }

        // 4. Vérification du format de l'email fourni
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Format d\'email invalide.'
                });
            }
        }

        // 5. Vérification de l'unicité de l'email et du nom d'utilisateur
        if (email || username) {
            const conditions = [];
            if (email) conditions.push({ email: email.toLowerCase().trim() });
            if (username) conditions.push({ username: username.trim() });

            const conflictUser = await User.findOne({
                where: {
                    id: { [Op.ne]: id }, // Exclut l'utilisateur qu'on modifie
                    [Op.or]: conditions
                }
            });

            if (conflictUser) {
                if (email && conflictUser.email === email.toLowerCase().trim()) {
                    return res.status(409).json({
                        status: 'fail',
                        message: 'Cet email est déjà utilisé par un autre compte.'
                    });
                }
                if (username && conflictUser.username === username.trim()) {
                    return res.status(409).json({
                        status: 'fail',
                        message: 'Ce nom d\'utilisateur est déjà utilisé par un autre compte.'
                    });
                }
            }
        }

        // 6. Application des modifications
        if (username) user.username = username.trim();
        if (email) user.email = email.toLowerCase().trim();
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl; // Permet de définir à null
        if (role) user.role = role;

        await user.save();

        // 7. Masquer le mot de passe dans la réponse
        const userResponse = user.toJSON();
        delete userResponse.password;

        return res.status(200).json({
            status: 'success',
            message: 'Utilisateur mis à jour avec succès',
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.deleteUser=async(req, res, next)=>{
    try{
        const { id } = req.params;
        
        if(isNaN(id)){
            return res.status(400).json({
                status:'fail',
                message:'ID d\'utilisateur invalide.'
            })
        }

        // Vérification de l'existence de l'utilisateur
        const user=await User.findByPk(id);
        if(!user){
            return res.status(404).json({
                status:'fail',
                message:'Aucun utilisateur trouvé avec cet ID.'
            })
        }

        // Empecher la suppression du dernier Admin (Sécurité)*
        if(user.role==='admin'){
            const adminCount=await User.count({ where: { role: 'admin' } });
            if(adminCount<=1){
                return res.status(400).json({
                    status:'fail',
                    message:'Vous ne pouvez pas supprimer le dernier administrateur.'
                })
            }
        }

        // suppression de l'utilisateur
        await user.destroy();

        return res.status(200).json({
            status:'success',
            message:'Utilisateur supprimé avec succès.'
        });
    }catch(error){
        next(error);
    }
}

exports.loginUser=async(req, res, next)=>{
    try{
        const {email, password}=req.body;

        if(!email || !password){
            return res.status(400).json({
                status:'fail',
                message:'Email et mot de passe sont requis.'
            })
        }

        // Verification du format de l'email
        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({
                status:'fail',
                message:'Format d\'email invalide.'
            })
        }

        // Recherche de l'utilisateur par son email
        const user=await User.findOne({ where: { email: email.toLowerCase() } });

        if(!user){
            return res.status(401).json({
                status:'fail',
                message:'Email ou mot de passe incorrect.'
            })
        }

        // Comparaison du mot de passe fourni avec le mot de passe haché en base
        const isPasswordValid=await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(404).json({
                status:'fail',
                message:'Email ou mot de passe incorrect.'
            })
        }

        // verification : mettre à jour le statut de l'utilisateur en ligne
        user.isOnline=true;
        await user.save();

        // Génération du token JWT
        const token=jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const userResponse=user.toJSON();
        delete userResponse.password;


        // Reponse
        return res.status(200).json({
            status:'success',
            message:'Connexion réussie.',
            data:{
                user:userResponse,
                token
            }
        })
    }catch(error){
        next(error);
    }
}