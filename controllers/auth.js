const {StreamChat} = require('stream-chat');
const crypto = require('crypto');
const dataModel = require("../models/data-model");
require('dotenv').config();

// Google Cal integration
const {google} = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];

// Set Google and Stream environment variables 
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUrl = process.env.GOOGLE_REDIRECT_URL;

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_SECRET;
const app_id = process.env.STREAM_ID;

// Instantiate Google OAuth 2.0 client
const oAuth2Client = new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    googleRedirectUrl
);

// set auth as a global default
google.options({
    auth: oAuth2Client
});

// Create webhook 

const setupCommands = async (serverClient) => {
    try {
        const ngrokUrl = `https://d04323b712e3.ngrok.io/auth/handlewebhook`;
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
        // Google Auth
        const googleToken = req.body.token;

        const ticket = oAuth2Client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const {name, email} = (await ticket).getPayload() 
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes 
        });

        // Stream Auth
        const serverClient = StreamChat.getInstance(api_key, api_secret, app_id);
        await setupCommands(serverClient);

        // SQL Queries -- Find user if exists; otherwise, insert new user
        const userFound = await dataModel.findUser(email);
        if(!userFound) {
            const user_id = crypto.randomBytes(16).toString('hex');

            dataModel.insertUsers(name, email, user_id).then((newUser) => {
                console.log(newUser)
            });

            const token = serverClient.createToken(user_id);
            return res.status(200).json({token, user_id, name, email, url})
        }

        // Pass in user_id and generate Stream token
        const user_id = userFound.user_id;
        const token = serverClient.createToken(user_id);

        res.status(200).json({token, user_id, name, email, url})
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error})
    }
}


const googleauth = async (req, res) => {
    try {
        const { email } = req.body;
        const {code} = req.body;

        const tokenRes = await dataModel.getRefreshToken(email);
        if(!tokenRes.refresh_token) {
            const r = await oAuth2Client.getToken(code);
            oAuth2Client.on('tokens', async (tokens) => {
                // On first authorization, store refresh_token
            if (tokens.refresh_token) {
                const refresh_token = tokens.refresh_token;
                dataModel.updateRefreshToken(refresh_token, email)
            }
            });

            oAuth2Client.setCredentials(r.tokens);

            return res.status(200).json({message: "User authorized"})
        }
        res.status(200).json({message: "User authorized"});
    } catch (error) {
        console.log(error);
    } 
}

const handlewebhook = async (req, res) => {
    const { user, message, form_data } = req.body;
    const user_id = user.id;

    const rToken = await dataModel.getRefreshTokenWithId(user_id).then((data) => {
        return data
    });

    oAuth2Client.setCredentials({refresh_token: rToken.refresh_token});
    const calendar = google.calendar({version: 'v3', oAuth2Client});
    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 5,
        singleEvents: true,
        timeMin: (new Date()).toISOString(),
        orderBy: 'startTime', 
    });

        const r = await response;
        const events = r.data.items;
        const list = events.map(event => {

            const hStart = event.start.dateTime.substr(11, 2);
            const hEnd = event.end.dateTime.substr(11, 2);

            const mStart = event.start.dateTime.substr(14, 2);
            const mEnd = event.end.dateTime.substr(14, 2);

            const hStartNum = parseInt(hStart);
            const hEndNum = parseInt(hEnd);

            const hoursStart = ((hStartNum + 11) % 12 + 1);
            const hoursEnd = ((hEndNum + 11) % 12 + 1);
            
            hoursStart.toString();
            hoursEnd.toString();
            
            const startString = hoursStart + ":" + mStart + " ";
            const endString = hoursEnd + ":" + mEnd + " ";

            const summary = event.summary.trim();
            const eventString = `\n- ` + startString +` - `+ endString + ` : ` + summary;
           return eventString
        });
        message.text = ''; // remove user input
        message.mml = `<mml><md>Here are your events: 
                        ${list}
                        </md></mml>`

    return res.status(200).json({ ...req.body, message });

}

module.exports = { login, googleauth, handlewebhook }