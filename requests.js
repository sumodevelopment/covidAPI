const axios = require("axios");
const cheerio = require("cheerio");
const db = require("quick.db");
const { getFlagUrl } = require('./flags');

const getAllRequest = async function () {
    let response;
    try {
        response = await axios.get("https://www.worldometers.info/coronavirus/");
        if (response.status !== 200) {
            console.log("ERROR");
        }
    } catch (err) {
        return null;
    }

    // to store parsed data
    const result = {};

    // get HTML and parse death rates
    const html = cheerio.load(response.data);
    html(".maincounter-number").filter((i, el) => {
        let count = el.children[0].next.children[0].data || "0";
        count = parseInt(count.replace(/,/g, "") || "0", 10);
        // first one is
        if (i === 0) {
            result.cases = count;
        } else if (i === 1) {
            result.deaths = count;
        } else {
            result.recovered = count;
        }
    });

    html('.number-table-main').filter((i, el) => {

        let val = el.children[0].data || 0;
        val = parseInt(val.replace(/,/g, "") || "0", 10);

        switch (i) {
            case 0:
                result.currentlyInfected = {
                    count: val
                };
                break;
            case 1:
                result.closedCases = {
                    count: val
                };
            default:
                break;
        }
    });

    html('.number-table').filter((i, el) => {
        let val = el.children[0].data || 0;
        val = parseInt(val.replace(/,/g, "") || "0", 10);

        switch (i) {
            case 0:
                result.currentlyInfected.mildInfection = val;
                break;
            case 1:
                result.currentlyInfected.serious = val;
            case 2:
                result.closedCases.recovered = val;
                break;
            case 3:
                result.closedCases.deaths = val;
                break;
            default:
                break;
        }
    });

    db.set("all", result);
}

module.exports.getAllRequest = getAllRequest;

const getCountriesRequest = async function () {
    let response;
    try {
        response = await axios.get("https://www.worldometers.info/coronavirus/");
        if (response.status !== 200) {
            console.log("Error", response.status);
        }
    } catch (err) {
        return null;
    }

    // to store parsed data
    const result = [];

    // get HTML and parse death rates
    const html = cheerio.load(response.data);
    const countriesTable = html("table#main_table_countries");
    const countriesTableCells = countriesTable
        .children("tbody")
        .children("tr")
        .children("td");

    // NOTE: this will change when table format change in website
    const totalColumns = 9;
    const countryColIndex = 0;
    const casesColIndex = 1;
    const todayCasesColIndex = 2;
    const deathsColIndex = 3;
    const todayDeathsColIndex = 4;
    const curedColIndex = 5;
    const activeColIndex = 6;
    const criticalColIndex = 7;

    // minus totalColumns to skip last row, which is total
    for (let i = 0; i < countriesTableCells.length - totalColumns; i += 1) {
        const cell = countriesTableCells[i];

        // get country
        if (i % totalColumns === countryColIndex) {
            let country =
                cell.children[0].data ||
                cell.children[0].children[0].data ||
                // country name with link has another level
                cell.children[0].children[0].children[0].data ||
                cell.children[0].children[0].children[0].children[0].data ||
                "";
            country = country.trim();
            if (country.length === 0) {
                // parse with hyperlink
                country = cell.children[0].next.children[0].data || "";
            }
            result.push({ country: country.trim() || "" });

            result[result.length - 1].flag = getFlagUrl(country.trim() || "");
        }
        // get cases
        if (i % totalColumns === casesColIndex) {
            let cases = cell.children[0].data || "";
            result[result.length - 1].cases = parseInt(
                cases.trim().replace(/,/g, "") || "0",
                10
            );
        }
        // get today cases
        if (i % totalColumns === todayCasesColIndex) {
            let cases = cell.children[0].data || "";
            result[result.length - 1].todayCases = parseInt(
                cases.trim().replace(/,/g, "") || "0",
                10
            );
        }
        // get deaths
        if (i % totalColumns === deathsColIndex) {
            let deaths = cell.children[0].data || "";
            result[result.length - 1].deaths = parseInt(
                deaths.trim().replace(/,/g, "") || "0",
                10
            );
        }
        // get today deaths
        if (i % totalColumns === todayDeathsColIndex) {
            let deaths = cell.children[0].data || "";
            result[result.length - 1].todayDeaths = parseInt(
                deaths.trim().replace(/,/g, "") || "0",
                10
            );
        }
        // get cured
        if (i % totalColumns === curedColIndex) {
            let cured = cell.children[0].data || 0;
            result[result.length - 1].recovered = parseInt(
                cured.trim().replace(/,/g, "") || 0,
                10
            );
        }
        // get active
        if (i % totalColumns === activeColIndex) {
            let cured = cell.children[0].data || 0;
            result[result.length - 1].active = parseInt(
                cured.trim().replace(/,/g, "") || 0,
                10
            );
        }
        // get critical
        if (i % totalColumns === criticalColIndex) {
            let critical = cell.children[0].data || "";
            result[result.length - 1].critical = parseInt(
                critical.trim().replace(/,/g, "") || "0",
                10
            );
        }
    }

    result.sort(function (a, b) {
        if (a.country.charCodeAt(0) < b.country.charCodeAt(0)) {
            return -1;
        }
        if (a.country.charCodeAt(0) > b.country.charCodeAt(0)) {
            return 1;
        }

        return 0;
    });

    db.set("countries", result);
}

module.exports.getCountriesRequest = getCountriesRequest;