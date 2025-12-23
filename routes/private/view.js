const db = require('../../connectors/db');
const { getSessionToken , getUser } = require('../../utils/session');
const axios = require('axios');
require('dotenv').config();
const PORT = process.env.PORT || 3001;

function handlePrivateFrontEndView(app) {
    console.log("✅ handlePrivateFrontEndView LOADED");

    // Dashboard (auto route based on role)
    app.get('/dashboard' , async (req , res) => {

        // safety check
        if (!req.user) {
            return res.redirect('/');
        }

        const user = req.user;

        // truckOwner
        if(user.role == "truckOwner"){
            return res.render('ownerDashboard' , { name: user.name });
        }

        // customer
        return res.render('customerHomepage' , { name: req.user.name });
    });

    // =========================
    // ✅ OWNER ROUTES (ADDED ONLY)
    // =========================

    // direct route for owner dashboard
    app.get('/ownerDashboard', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "truckOwner") return res.redirect('/dashboard');

        return res.render('ownerDashboard', { name: req.user.name });
    });

    // Menu Items page route (lowercase)
    app.get('/menuitems', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "truckOwner") return res.redirect('/dashboard');

        return res.render('menuitems', { name: req.user.name });
    });

    // ✅ ADDED: Menu Items route alias (camelCase) -> same view
    app.get('/menuItems', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "truckOwner") return res.redirect('/dashboard');

        return res.render('menuitems', { name: req.user.name });
    });

    // Add Menu Item page route (keep as is)
    app.get('/addMenuItem', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "truckOwner") return res.redirect('/dashboard');

        return res.render('addMenuItem', { name: req.user.name });
    });

    // ✅ ADDED: Add Menu Item route alias (lowercase) -> same view
    app.get('/addmenuitem', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "truckOwner") return res.redirect('/dashboard');

        return res.render('addMenuItem', { name: req.user.name });
    });

    // ✅ FIXED: Truck Orders page route (render lowercase view)
    app.get('/truckOrders', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "truckOwner") return res.redirect('/dashboard');

        // IMPORTANT: view file must be views/truckorders.hjs
        return res.render('truckorders', { name: req.user.name });
    });

    // ✅ ADDED: Truck Orders route alias (lowercase) -> same view
    app.get('/truckorders', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "truckOwner") return res.redirect('/dashboard');

        return res.render('truckorders', { name: req.user.name });
    });

    // ✅ ADDED: Logout route (if you don't already have it somewhere else)
    app.get('/logout', (req, res) => {
        // if you use session token in cookies, clear it
        res.clearCookie('sessionToken');
        return res.redirect('/');
    });

    // trucks page
    app.get('/trucks', (req, res) => {
        if (!req.user) return res.redirect('/');
        return res.render('trucks', { name: req.user.name });
    });

    // truck menu page
    app.get('/truckMenu/:truckId', (req, res) => {
        if (!req.user) return res.redirect('/');

        return res.render('truckMenu', {
            name: req.user.name,
            truckId: req.params.truckId
        });
    });

    // cart page
    app.get('/cart', (req, res) => {
        if (!req.user) return res.redirect('/');
        return res.render('cart', { name: req.user.name });
    });

    // ✅✅✅ ADDED: myOrders page (CUSTOMER)
    app.get('/myOrders', (req, res) => {
        if (!req.user) return res.redirect('/');
        if (req.user.role !== "customer") return res.redirect('/dashboard');

        return res.render('myOrders', { name: req.user.name });
    });

    // testing route
    app.get('/testingAxios' , async (req , res) => {
        try {
            const result = await axios.get(`http://localhost:${PORT}/test`);
            return res.status(200).send(result.data);
        } catch (error) {
            console.log("error message", error.message);
            return res.status(400).send(error.message);
        }
    });
}

module.exports = { handlePrivateFrontEndView };
