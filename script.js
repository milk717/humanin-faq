require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.API_KEY;

const fetchAndConvert = async () => {
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
    const data = rows.slice(1).map(row =>
        headers.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
        }, {})
    );

    const groupedData = data.reduce((acc, row) => {
        const screen = row['해당 화면'];
        acc[screen] = acc[screen] || [];
        acc[screen].push({
            question: row.question,
            answer: row.answer
        });
        return acc;
    }, {});

    fs.mkdirSync('faq', { recursive: true });
    Object.entries(groupedData).forEach(([screen, records]) => {
        fs.writeFileSync(
            path.join('faq', `${screen.split('_')[0]}.json`),
            JSON.stringify(records, null, 2),
            'utf8'
        );
    });

    console.log('JSON files created successfully');
};

fetchAndConvert().catch(console.error);
