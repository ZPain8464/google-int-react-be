const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();

app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));


app.use((request, response, next) => {
    console.log("Incoming url " + request.originalUrl)
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

const commandHandler = (req, res) => {
    const { user, message, form_data } = req.body;

    console.log(JSON.stringify(message));
    message.text = "Hello there, we can update this with GCal data";
    return res.status(200).json({ ...req.body, message });
}

app.post('/', commandHandler);


app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
})


