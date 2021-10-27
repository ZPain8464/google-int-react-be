const bcrypt = require('bcrypt');
const {StreamChat} = require('stream-chat');
const crypto = require('crypto');
require('dotenv').config();


// Google Cal integration
const {google} = require('googleapis');

require('dotenv').config();

const scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUrl = process.env.GOOGLE_REDIRECT_URL;

const oAuth2Client = new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    googleRedirectUrl
);

// set auth as a global default
google.options({
    auth: oAuth2Client
});

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_SECRET;
const app_id = process.env.STREAM_ID;


const signup = async (req, res) => {
    try {

        const {fullName, username, password, email} = req.body;

        const userId = crypto.randomBytes(16).toString('hex');

        const serverClient = StreamChat(api_key, api_secret);

        const hashedPassword = await bcrypt.hash(password, 10);

        const token = serverClient.createUserToken(userId);

        res.status(200).json({token, fullName, username, userId, hashedPassword, email});
    } catch (error) {
        console.log(`Error creating user ${error}`);

        res.status(500).json({message: error})
    }
}


// Create webhook 

const setupCommands = async (serverClient) => {
    try {
        const ngrokUrl = `https://8ec7-50-243-132-201.ngrok.io`;
        const cmds = await serverClient.listCommands();

        if (!cmds.commands.find(({name}) => name === 'gcal')) {
            await serverClient.createCommand({
                name: "gcal",
                description: "Fetch your meetings for the day",
                args: "",
            });
        }

        const type = await serverClient.getChannelType('messaging');
        if (!type.commands.find(({name}) => name === 'gcal')) {
            await serverClient.updateChannelType('messaging', {commands: ['all', 'gcal']});
        }

        // custom_action_handler_url has to be a publicly accessibly url
        await serverClient.updateAppSettings({custom_action_handler_url: ngrokUrl});

    } catch (err) {
        console.log(`Error setting up commands ${setupCommands}`);
    }
}

const login = async (req, res) => {
    try {
        const googleToken = req.body.token;

        const userId = "3ca286c2a3c33f2b6672da7a190160f8"
        const serverClient = StreamChat.getInstance(api_key, api_secret, app_id);
        const token = serverClient.createToken(userId);
        await setupCommands(serverClient);

        const ticket = oAuth2Client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const {name, email, picture} = (await ticket).getPayload()

        const url = oAuth2Client.generateAuthUrl({

            access_type: 'offline',

            scope: scopes
        });

        res.status(200).json({token, userId, name, email, picture, url})
    } catch (error) {
        console.log(error);

        res.status(500).json({message: error})
    }
}

const googleauth = async (req, res) => {
    try {
        const {code} = req.body;
        const r = await oAuth2Client.getToken(code);

        oAuth2Client.setCredentials(r.tokens);
        const token = r.tokens.access_token;

        res.json({token: token})
    } catch (error) {
        console.log(error);
    }
}

module.exports = {login, signup, googleauth}