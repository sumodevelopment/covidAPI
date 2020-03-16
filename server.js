// Imports
const express = require("express");
const db = require("quick.db");
const cors = require('cors');
// constants
const { PORT = 3000 } = process.env;
// Instances
const app = express();

app.use(cors());

// Functions
const { getAllRequest, getCountriesRequest } = require('./requests');

getAllRequest();
getCountriesRequest();

setInterval(() => {
    getAllRequest();
}, 600000);

setInterval(() => {
    getCountriesRequest();
}, 600000);

app.get('/update', (req, res) => {
    getAllRequest();
    getCountriesRequest();
    res.send('Updated from sources...');
});

app.get("/all", async function (req, res) {
    let all = await db.fetch("all");
    res.send(all);
});

app.get("/countries", async function (req, res) {
    let countries = await db.fetch("countries");
    res.send(countries);
});


const listener = app.listen(PORT, function () {
    console.log("Your app is listening on port " + listener.address().port);
});