// systemtimeout is the duration of inactivity before the system admin loses contact
const systemtimeout = 20 * 60 * 1000;
// v low value means timeout will never be expired on entry
let systemNow = -1 * 1000 * 60 * 60 * 24 * 365 * 100;
const adminAuth = (req, res, next) => {
    const {
        password
    } = req.body;
//    console.log(password, process.env.ADMIN_PASSWORD)
    if (password === process.env.ADMIN_PASSWORD) {
        resetAdmin();
        console.log('on we go');
        next();
    } else {
        res.status(401).sendFile(path.join(__dirname, 'public', 'unauthorised.html'));
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
module.exports = { adminAuth, resetAdmin, checkSessionTimeoutAndRedirect };
