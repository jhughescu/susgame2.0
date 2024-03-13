const jwt = require('jsonwebtoken');
const sessionController = require('./../controllers/sessionController');
// systemtimeout is the duration of inactivity before the system admin loses contact
const systemtimeout = 20 * 60 * 1000;
// v low value means timeout will never be expired on entry
let systemNow = -1 * 1000 * 60 * 60 * 24 * 365 * 100;

const adminAuth = (req, res, next) => {
    const {
        password
    } = req.body;
//    console.log(req.body)
//    console.log(password, process.env.ADMIN_PASSWORD)
//    console.log(password, process.env.STORAGE_ID)
    if (password === process.env.ADMIN_PASSWORD) {
        resetAdmin();
        next();
    } else {
//        res.status(401).sendFile(path.join(__dirname, 'public', 'unauthorised.html'));
        res.redirect('/admin/systemfail');
    }
};
const generateToken = (user) => {
    return jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '24h' }); // Change the expiration time as needed
};
const verifyTokenExpiration = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        // Token not provided, redirect to '/loggedout' route
        return res.redirect('/facilitatorloggedout');
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            // Token verification failed, redirect to '/loggedout' route
            return res.redirect('/facilitatorloggedout');
        }

        // Check if token has expired
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTimestamp) {
            // Token has expired, redirect to '/loggedout' route
            return res.redirect('/facilitatorloggedout');
        }

        // Token is valid, proceed to next middleware
        next();
    });
}
async function facAuth(req, res, next) {
    try {
        const session = req.body.session;
        const password = req.body.password;
        const storedSession = await sessionController.getSessionPassword(session);
        if (storedSession.password === password) {
            req.session = storedSession;
            next();
        } else {
            console.log('login fail');
            res.redirect('/loginfail');
        }
    } catch (error) {
        console.log('method fail');
        res.redirect('/loginfail');
    }

};
const checkSessionTimeoutAndRedirect = (req, res, next) => {
    const now = Date.now();
//    console.log(`check for timeout, elapsed: ${(now - systemNow)/1000}`);
    if (now - systemNow > systemtimeout) {
        res.redirect('/admin/loggedout');
    } else {
        // Session is still active, proceed to the next middleware or route handler
        resetAdmin();
        next();
    }
};
const resetAdmin = () => {
    systemNow = Date.now();
};

module.exports = { adminAuth, resetAdmin, checkSessionTimeoutAndRedirect, facAuth, generateToken, verifyTokenExpiration };
