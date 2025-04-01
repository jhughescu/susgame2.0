//const express = require('express');
const securePassword = require('secure-random-password');
const randomColour = require(`randomcolor`);
const Session = require('../models/session');
const tools = require('./tools');
const { getEventEmitter } = require('./../controllers/eventController');
const eventEmitter = getEventEmitter();

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
const generateColour = () => {
    const c = randomColour();
    return c;
};


async function getSessionWithID(id) {
//    console.log(`getSessionWithID: ${id}, id is null? ${id === null}, id is null string? ${id === 'null'}`);
    if (id === null || id === 'null' || id === undefined) {
        console.log(`getSessionWithID called with id null or undefined, cannot continue`);
    } else {
         try {
            const session = await Session.findOne({
                uniqueID: id
            }).select('-password -_id -__v');
            if (!session) {
                // If session is not found, return an error
                throw new Error(`getSessionWithID: Session not found (${id})`);
            }
            return session;
        } catch (err) {
            console.log(err);
        }
    }
};
async function getSessionWithAddress(id) {
    //    console.log(`getSessionWithAddress: ${id}`);
    try {
        const session = await Session.findOne({
            address: id
        }).select('-password -_id -__v');
        if (!session) {
            // If session is not found, return an error
            throw new Error(`getSessionWithAddress: Session not found (${id})`);
        }
        return session;
    } catch (err) {
        console.log(err);
    }
};
async function getSessionPassword(id) {
    //    console.log('getfull');
    try {
        const session = await Session.findOne({
            uniqueID: id
        }).select('password');
        if (!session) {
            // If session is not found, return an error
            /*
            const allS = await Session.find({type: 1});
            if (allS) {
                console.log(allS)
            } else {
                console.log('no chips')
            }
            */
            throw new Error('Session not found');
        }
        //        console.log('returning')
        //        console.log(session)
        return session;
    } catch (err) {
        console.log(`getSessionPassword error:`);
        console.log(err);
    }
};
async function getSessions(req, res) {
    try {
        let filter = select + ' -password';
        const existingSessions = await Session.find().select(filter);
        res.json(existingSessions);
    } catch (error) {
//        console.error('Error generating unique session ID:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};
async function getSessionsSock(cb) {
    // socket io version of the getSessions method; requires a callback for the return values
    if (cb) {
        let filter = select + ' -password';
        const existingSessions = await Session.find().select(filter);
        cb(existingSessions);
    } else {
        console.log(`getSessionsSock requires a callback function`)
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
};
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
//            console.log('password provided; if it matches, return the full session', req.body.password, req.body.password === process.env.ADMIN_PASSWORD)
            //            console.log(req.body.password);
            noPass = req.body.password !== process.env.ADMIN_PASSWORD;
        }
        const boSelector = `-_id -__v${noPass ? ' -password' : ''}`;
//        console.log(noPass, boSelector);
        const session = await Session.findOne({
            uniqueID: sessionId
        }).select(boSelector);

        if (!session) {
            // If session is not found, return an error
            throw new Error('Session not found');
        }
        session.localIP = false;
        if (Boolean(process.env.isDev)) {
            const ip = tools.getIPv4Address();
            if (Boolean(ip)) {
                session.localIP = ip;
            }
        }
//        console.log(session)
//         Send the session back to the client as a response
        res.json(session);
    } catch (error) {
        console.error('Error retrieving session:', error.message);
        res.status(500).json({
            error: error.message
        });
    }
};
async function updateSession(uniqueID, updateOb) {
//    console.log(`updateSession ${uniqueID}`);
//    console.log(updateOb);
    try {
        const updatedSession = await Session.findOneAndUpdate({
                uniqueID
            },
            updateOb, {
                new: true
            }
        ).select(select + ' -password');
//        console.log('updatedSession', updatedSession);
        eventEmitter.emit('sessionUpdated', updatedSession);
        return updatedSession;
    } catch (error) {
        console.log('Error updating document:');
//        console.error('Error updating document:', error);
        throw error;
    }
};
async function newSession(req, res) {
    try {
        const dateID = getDateCode();
        //        console.log(`createSession ${dateID}`);
        // Query the database to find documents with the given dateID
        const existingSessions = await Session.find({
            dateID
        });
        // Determine the session ID for the new session
        const uniqueID = dateID + padNum(getTopNumber(existingSessions) + 1, 3);
        // auto-generate password
        const password = generatePassword(6);
        const address = generateAddress(req);
        const type = req.body.valType;
        const state = 'pending';
        const progress = 0;
        const round = 0;
        const slide = 0;
        const idColour = generateColour();
        const newSession = new Session({
            dateID,
            uniqueID,
            password,
            address,
            type,
            state,
            progress,
            round,
            slide,
            idColour
        });

        // Save the new session document to the database
        await newSession.save();

        // Send the generated session ID back to the client as a response
        res.json({
            uniqueID
        });
        return newSession;
    } catch (error) {
        console.error('Error generating unique session ID:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};
async function resetSession(id, cb) {
    // dev only method, return warning if not dev
    console.log('sessionController resetSession');
//    if (process.env.ISDEV) {
        const session = await updateSession(id, {
            state: 'pending',
            players: [],
            teams: [],
            scores: [],
            values: [],
            round: 0,
            slide: 0
        });
//        console.log(`NEW SESSION`);
//        console.log(session);
        if (session) {
            if (cb) {
                cb(session);
            }
        }
        return session;
//    } else {
//        cb('Not allowed');
//    }
};
async function deleteSessionV1(ob, cb) {
    // admin password has already been provided, no further auth required
    const id = ob.sID;
    let msg = '';
    Session.deleteOne({
            uniqueID: id
        })
        .then(result => {
            msg = `successful deletion of session ${id}`;
            console.log(msg);
            return {
                msg: msg
            };
        })
        .catch(err => {
            msg = `error deleting session ${id}`;
            console.error(msg);
            return {
                msg: msg
            };
        })
};
async function deleteSession(ob) {
    let msg = '';
    try {
        const result = await Session.deleteOne({uniqueID: ob.sID });
        msg = `session ${ob.sID} has been deleted`;
        console.log(msg);
        return {msg: msg, success: true};
    } catch (err) {
        msg = `session ${ob.sID} not deleted`;
        console.error(msg, err);
        return {msg: msg, success: false};
    }
};

module.exports = {
    getSession,
    updateSession,
    newSession,
    getSessions,
    getSessionsSock,
    getSession,
    getSessionWithID,
    getSessionPassword,
    getSessionWithAddress,
    resetSession,
    deleteSession
};
