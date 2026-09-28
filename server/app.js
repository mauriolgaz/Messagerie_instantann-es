const express = require('express');
const app = express();
const userRoutes = require('./Route/userRoute');

// Middleware pour parser les données JSON entrantes
app.use(express.json());

// Route principale
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Serveur bien lancé'
    });
});

app.use('/users', userRoutes);

// -------------------------------------------------------------
// Middleware pour la gestion de l'Erreur 404 (Route non trouvée)
// S'exécute uniquement si aucune route précédente n'a répondu
// -------------------------------------------------------------
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        statusCode: 404,
        message: `Impossible de trouver l'URL ${req.originalUrl} sur ce serveur.`
    });
});

// -------------------------------------------------------------
// Middleware d'interception des erreurs globales (500)
// Doit TOUJOURS être en tout dernier
// -------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: err.message || 'Erreur interne du serveur'
    });
});

module.exports = app;