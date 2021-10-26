const bcrypt = require('bcrypt');
const { StreamChat } = require('stream-chat');
const crypto = require('crypto');
require('dotenv').config();


// Google Cal integration
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');
const {OAuth2Client} = require('google-auth-library');

require('dotenv').config();

const scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];
const TOKEN_PATH = 'token.json';

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

    const { fullName, username, password, email } = req.body;

    const userId = crypto.randomBytes(16).toString('hex');

    const serverClient = connect(api_key, api_secret, app_id);

    const hashedPassword = await bcrypt.hash(password, 10); 

    const token = serverClient.createUserToken(userId);

    res.status(200).json({ token, fullName, username, userId, hashedPassword, email });
    } catch (error) {
        console.log(error);

        res.status(500).json({message: error})
    }
}

// Create webhook 

const setupCommands = async (serverClient) => {
  try {
    const ngrokUrl = `http://8692424b0bf4.ngrok.io`;

    await serverClient.updateAppSettings({
      custom_action_handler_url: `${ngrokUrl}/auth/gcal`,
    }).then(() => {console.log("Calling update settings")}).catch(error => console.log(`Error updating ${error}`));

    await serverClient.createCommand({
      name: "gcal",
      description: "Fetch your meetings for the day",
      args: "[]",
    });

    await serverClient.createChannelType({
      name: "zach",
      commands: ["gcal"],
    });
    let message = "happy coding!"
    
    await serverClient.sendMessage(message)
  } catch(err) {
    console.log(err);
  }
}

const login = async (req, res) => {
    try {
      // const { name, email, googleId } = req.body.data
    const googleToken = req.body.token; 
    
    // const userId = crypto.randomBytes(16).toString('hex');
    const userId = "3ca286c2a3c33f2b6672da7a190160f8"
    const serverClient = StreamChat.getInstance(api_key, api_secret, app_id);
    const token = serverClient.createToken(userId);
    await setupCommands(serverClient);

      const ticket = oAuth2Client.verifyIdToken({
          idToken: googleToken,
          audience: GOOGLE_CLIENT_ID
      });
      
      const { name, email, picture } = (await ticket).getPayload()

      const url = oAuth2Client.generateAuthUrl({
       
        access_type: 'offline',
      
        scope: scopes
      });

        res.status(200).json({token, userId, name, email, picture, url})
    } catch(error) {
        console.log(error);

        res.status(500).json({ message: error })
    }
    // try {
    //     const { username, password } = req.body;
        
    //     const serverClient = connect(api_key, api_secret, app_id);

    //     const client = StreamChat.getInstance(api_key, api_secret);

    //     const { users } = await client.queryUsers({ name: username });
        
    //     //Check if user exists in DB

    //     if(!users.length) return res.status(400).json({message: "User not found"});

    //     // if user does exist, decyrpt password to see if it matches user's input
        
    //     const success = await bcrypt.compare(password, users[0].hashedPassword);

    //     const token = serverClient.createUserToken(users[0].id);

    //     if(success) {
    //         res.status(200).json({ token, fullName: users[0].fullName, username, userId: users[0].id });
    //     } else {
    //         res.status(500).json({ message: "Incorrect password" })
    //     }

    // } catch(error) {
    //     console.log(error)

    //     res.status(500).json({message: error})
    // }
}

const googleauth = async (req, res) => {
  try {
    const {code} = req.body;
    const r = await oAuth2Client.getToken(code); 

    oAuth2Client.setCredentials(r.tokens);
    console.log('r.tokens:', r.tokens)
    const token = r.tokens.access_token;
    console.log(token)

    res.json({token: token})
  } catch(error) {
    console.log(error);
  }
}

const gCalHandler = (req, res) => {
  let message = req.body.message;

console.log(JSON.stringify(message));

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({status: 200 }));
};

module.exports = { login, signup, googleauth, gCalHandler }