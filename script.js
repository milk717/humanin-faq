require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.API_KEY;

async function fetchAndConvert() {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: '시트1',
    });

    const rows = response.data.values;
    if (!rows.length) {
        console.log('No data found.');
        return;
    }

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });

    const groupedData = data.reduce((acc, row) => {
        const screen = row['해당 화면'];
        if (!acc[screen]) acc[screen] = [];
        acc[screen].push(row);
        return acc;
    }, {});

    fs.mkdirSync('faq', { recursive: true });
    for (const [screen, records] of Object.entries(groupedData)) {
        fs.writeFileSync(
            path.join('faq', `${screen.split('_').at(0)}.json`),
            JSON.stringify(records, null, 2),
            'utf8'
        );
    }

    console.log('JSON files created successfully');
}

fetchAndConvert().catch(console.error);
