require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.API_KEY;

const fetchAndConvert = async (sheetName, outputDir, dataProcessor, fileName = null) => {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: sheetName,
    });

    const rows = response.data.values;
    if (!rows.length) {
        console.log(`No data found in sheet: ${sheetName}`);
        return;
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row, rowIndex) =>
        headers.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
        }, { key: `row_${rowIndex + 1}` })
    );

    const processedData = dataProcessor(data);

    fs.mkdirSync(outputDir, { recursive: true });
    if (fileName) {
        fs.writeFileSync(
            path.join(outputDir, fileName),
            JSON.stringify(processedData, null, 2),
            'utf8'
        );
    } else {
        Object.entries(processedData).forEach(([screen, records]) => {
            fs.writeFileSync(
                path.join(outputDir, `${screen.split('_')[0]}.json`),
                JSON.stringify(records, null, 2),
                'utf8'
            );
        });
    }

    console.log(`JSON files created successfully in ${outputDir}`);
};

const processFAQData = (data) => {
    return data.reduce((acc, row) => {
        const screen = row['해당 화면'];
        acc[screen] = acc[screen] || [];
        acc[screen].push({
            key: row.key,
            question: row.question,
            answer: row.answer
        });
        return acc;
    }, {});
};

const processDescriptionData = (data) => {
    return data.reduce((acc, row) => {
        const screen = row['해당 화면'];
        acc[screen.split('_')[0]] = {
            title: row.title,
            description: row.description,
            key: row.key
        };
        return acc;
    }, {});
};

const main = async () => {
    await fetchAndConvert('FAQ', 'faq', processFAQData);
    await fetchAndConvert('Description', 'description', processDescriptionData, 'description.json');
};

main().catch(console.error);
