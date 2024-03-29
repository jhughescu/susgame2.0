//const express = require('express');
const securePassword = require('secure-random-password');
const Session = require('../models/session');

let select = '-_id -__v';

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
    return `${parseInt(d.getFullYear().toString().substr(2))}${padNum((d.getMonth() + 1), 2)}${padNum(d.getDate(), 2)}`;
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
const generatePassword = (l) => {
    const password = securePassword.randomPassword({
        length: l, // specify the length of the password
        characters: [
            securePassword.lower,
            securePassword.upper,
            securePassword.digits,
        ], // specify the characters to include in the password
    });
    return password;
};

const generateAddress = (req) => {
    // This method used to create a unique address for each session.
    const id = securePassword.randomPassword({
        length: 4, // specify the length of the password
        characters: [
            securePassword.lower,
            securePassword.digits,
        ], // specify the characters to include in the password
    });
    const root = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const suffix = `/game-${id}`;
    return suffix;
};


async function getSessionWithID(id) {
//    console.log(`getSessionWithID: ${id}`);
    try {
        const session = await Session.findOne({ uniqueID: id }).select('-password -_id -__v');
        if (!session) {
            // If session is not found, return an error
            throw new Error(`getSessionWithID: Session not found (${id})`);
        }
        return session;
    } catch (err) {
        console.log(err);
    }
}
async function getSessionWithAddress(id) {
//    console.log(`getSessionWithAddress: ${id}`);
    try {
        const session = await Session.findOne({ address: id }).select('-password -_id -__v');
        if (!session) {
            // If session is not found, return an error
            throw new Error(`getSessionWithAddress: Session not found (${id})`);
        }
        return session;
    } catch (err) {
        console.log(err);
    }
}
async function getSessionPassword(id) {
//    console.log('getfull');
    try {
        const session = await Session.findOne({ uniqueID: id }).select('password');
        if (!session) {
            // If session is not found, return an error
            throw new Error('Session not found');
        }
//        console.log('returning')
//        console.log(session)
        return session;
    } catch (err) {
        console.log(`getSessionPassword error:`);
        console.log(err);
    }
}
async function getSessions(req, res) {
    try {
        let filter = select + ' -password';
//        let filter = select;
        const existingSessions = await Session.find().select(filter);
        res.json(existingSessions);
    } catch (error) {
        console.error('Error generating unique session ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function sessionExists(prop, val) {
    // return true if a session exists with a val matching prop
    try {
        const query = {};
        query[prop] = val;
        const session = await Session.find(query);
//        console.log(session.length > 0);
        return session.length > 0;
    } catch (error) {
        console.log(error);
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
//        console.log('getSession method');
//        console.log('Session ID:', sessionId);
        let noPass = true;
        if (req.body.password) {
//            console.log('password provided; if it matches, return the full session')
//            console.log(req.body.password);
            noPass = !req.body.password === process.env.ADMIN_PASSWORD;
        }
        const boSelector = `-_id -__v${noPass ? ' -password' : ''}`;
//        console.log(boSelector);
        const session = await Session.findOne({ uniqueID: sessionId }).select(boSelector);

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
//    console.log(`updateSession: ${uniqueID}`);
//    console.log(updateOb);
    try {
        const updatedSession = await Session.findOneAndUpdate(
            { uniqueID },
            updateOb,
            { new: true }
        ).select(select + ' -password');
//        console.log('Updated document:', updatedSession);
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
        // auto-generate password
        const password = generatePassword(6);
        const address = generateAddress(req);
        // Create a new session document
        const type = req.body.valType;
        const state = 'pending';
        const progress = 0;
//        console.log(type);
//        console.log(`type: ${type}`);
        const newSession = new Session({ dateID, uniqueID, password, address, type , state, progress});

        // Save the new session document to the database
        await newSession.save();

        // Send the generated session ID back to the client as a response
        res.json({ uniqueID });
        return newSession;
    } catch (error) {
        console.error('Error generating unique session ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function resetSession(id, cb) {
    // dev only method, return warning if not dev
    if (process.env.ISDEV) {
        const session = await updateSession(id, {state: 'pending'});
        if (session) {
            cb(session);
        }
    } else {
        cb('Not allowed');
    }
}

module.exports = { getSession, updateSession, newSession, getSessions , getSession , getSessionWithID , getSessionPassword , getSessionWithAddress, resetSession};
