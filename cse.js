const axios = require('axios');
const xlsx = require('xlsx');


const SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';
const API_KEY = 'AIzaSyAGAHFgzpsHkTsLirPMgF7MntX_mS_oTKY';
const CSE_ID = 'e16680644b0694e27';

async function searchInstagramProfile(name, workplace) {
  try {
    const response = await axios.get(SEARCH_API_URL, {
      params: {
        key: API_KEY,
        cx: CSE_ID,
        q: `${name} ${workplace} Instagram profile`
      }
    });
    // Filtering results to only include links that contain "www.instagram.com"
    if (response.data.items && response.data.items.length > 0) {
      // Loop through items and find the first one that matches "www.instagram.com"
      for (const item of response.data.items) {
        if (item.link && item.link.includes('www.instagram.com')) {
          return item.link; // Return the Instagram link
        }
      }
    }
  } catch (error) {
    console.error("Error searching for profile:", error);
  }
  return null; // Return null if no Instagram link is found
}


const fs = require('fs');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function main() {
    // Read the CSV file
    const agents = [];
    fs.createReadStream('scrape.csv')
        .pipe(csvParser())
        .on('data', (row) => {
            agents.push(row);
        })
        .on('end', async () => {
            // Process each row
            for (const agent of agents) {
                const name = agent.FirstName + ' ' + agent.LastName;
                const workplace = agent.Company;

                // Use a legal and ethical method to get the Instagram link
                agent.Instagram = await searchInstagramProfile(name, workplace); // Replace with your function
            }

            // Write the updated data back to a new CSV file
            const csvWriter = createCsvWriter({
                path: 'updated-file.csv',
                header: [
                    {id: 'FirstName', title: 'FirstName'},
                    {id: 'LastName', title: 'LastName'},
                    {id: 'Company', title: 'Company'},
                    {id: 'Email', title: 'Email'},
                    {id: 'PhoneNumber', title: 'PhoneNumber'},
                    {id: 'Instagram', title: 'Instagram'}
                ]
            });

            csvWriter.writeRecords(agents)
                .then(() => console.log('The CSV file was written successfully'));
        });
}

main()
