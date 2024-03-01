const Session = require('../models/session');

const getTopNumber = (s) => {
    let tn = 0;
    if (s.length > 0) {
        s = s.filter((n) => {
            return n.toString().includes(getDateCode());
        });
        s.sort();
        tn = s.pop().uniqueID.toString();
        tn = parseInt(tn.substr(tn.length - 3));
    }
    return tn;
};
const getDateCode = () => {
    let d = new Date();
    return `${d.getFullYear()}${padNum((d.getMonth() + 1), 2)}${padNum(d.getDate(), 2)}`;
};
const padNum = (n, r) => {
    let rn = r === undefined ? 2 : r;
    if (n.toString().length < rn) {
        for (var i = 1; i < rn; i++) {
            n = '0' + n;
        }
    }
    return n;
};

async function getSessions(req, res) {
    try {
        const existingSessions = await Session.find();
        res.json(existingSessions);
    } catch (error) {
        console.error('Error generating unique session ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getSession(req, res) {
    try {
        let sessionId = null;
        if (req.query && req.query.sessionID) {
            // Extract sessionID from query string if present
            sessionId = req.query.sessionID;
        } else if (req.body && req.body.sessionID) {
            // Extract sessionID from request body if present
            sessionId = req.body.sessionID;
        } else {
            // If sessionID is not present in query string or request body, return an error
            throw new Error('SessionID not provided');
        }
        console.log('getSession method');
        console.log('Session ID:', sessionId);
        const session = await Session.findOne({ uniqueID: sessionId });
        if (!session) {
            // If session is not found, return an error
            throw new Error('Session not found');
        }
        // Send the session back to the client as a response
        res.json(session);
    } catch (error) {
        console.error('Error retrieving session:', error.message);
        res.status(500).json({ error: error.message });
    }
}
async function updateSession(uniqueID, updateOb) {
    try {
        const updatedSession = await Session.findOneAndUpdate(
            { uniqueID },
            updateOb,
            { new: true }
        );
        console.log('Updated document:', updatedSession);
        return updatedSession;
    } catch (error) {
        console.error('Error updating document:', error);
        throw error;
    }
}
async function newSession(req, res) {
    try {
        const dateID = getDateCode();
//        console.log(`createSession ${dateID}`);
        // Query the database to find documents with the given dateID
        const existingSessions = await Session.find({ dateID });
//        console.log(existingSessions)
        // Determine the session ID for the new session
        const uniqueID = dateID + padNum(getTopNumber(existingSessions) + 1, 3);
//        console.log(`sessionID: ${uniqueID}`);
        // Create a new session document
        const newSession = new Session({ dateID, uniqueID });

        // Save the new session document to the database
        await newSession.save();

        // Send the generated session ID back to the client as a response
        res.json({ uniqueID });
    } catch (error) {
        console.error('Error generating unique session ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { getSession, updateSession, newSession, getSessions , getSession };
