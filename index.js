const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const { json } = require("express");
const axios = require("axios");
const { google } = require('googleapis');
const dataModel = require("./models/data-model")

const app = express();

app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));


app.use((request, response, next) => {
    next();
});

const PORT = "3001";
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req, res) => {
    res.send("hello world");
});

app.use('/auth', authRoutes);

const commandHandler = async (req, res) => {
    const { user, message, form_data } = req.body;
    const user_id = user.id;

    const fetchToken = dataModel.getAccessToken(user_id).then((data) => {
        return data;
    });
    
    const setToken = async () => {
        const token = await fetchToken;
        
        const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

        const response = await axios.get(url, {
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            },
            params: {
                timeMin: (new Date()).toISOString(),
                maxResults: 5,
                singleEvents: true,
                timeMin: (new Date()).toISOString(),
                orderBy: 'startTime', 
            }
        });
        
        const r = await response;
        
        const events = r.data.items;
        const list = events.map(event => {
            const start = event.start.dateTime.substr(11, 5).trim();
            const end = event.end.dateTime.substr(11, 5).trim();
            const summary = event.summary.trim();
            const eventString = `\n- ` + start +` - `+ end + ` : ` + summary;
            
           return eventString
        })
        message.text = ''; // remove user input
        
        message.mml = `<mml>
                        <text>
                        Here are your events today: 
                        </text>
                        <md>
                        ${list}
                        </md>
                        </mml>`
    // message.text = `Here are today's events: ${list}`
    return res.status(200).json({ ...req.body, message });
}
setToken();
}

app.post('/', commandHandler);


app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
})


