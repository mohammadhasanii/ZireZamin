const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const path = require('path');


const app = express();
app.use(cors());



/**
 * @param {string} str
 * @return {string}
 */
function convertPersianNumbersToEnglish(str) {
  const persianNumbers = [
    /۰/g, /۱/g, /۲/g, /۳/g, /۴/g,
    /۵/g, /۶/g, /۷/g, /۸/g, /۹/g,
  ];
  const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  let result = str;
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.replace(persianNumbers[i], englishNumbers[i]);
  }
  return result;
}

/**
 * @param {string} htmlContent
 * @return {Array}
 */
function extractDataFromHTML(htmlContent) {
  const dom = new JSDOM(htmlContent);
  const doc = dom.window.document;
  const dataRows = Array.from(
    doc.querySelectorAll('tr[class^="DataRow"][class$="_F"]')
  );
  const extractedData = [];

  dataRows.forEach((row) => {
    const tds = row.querySelectorAll("td");
    if (tds.length !== 6) return;

    const td1 = tds[0];
    const firstLink = td1.querySelector("a font b");
    const dateTime = firstLink
      ? convertPersianNumbersToEnglish(firstLink.textContent.trim())
      : "";

    const td2 = tds[1];
    const magnitude = td2.querySelector("b")
      ? convertPersianNumbersToEnglish(td2.querySelector("b").textContent.trim())
      : "";

    const latitude = convertPersianNumbersToEnglish(tds[2].textContent.trim());
    const longitude = convertPersianNumbersToEnglish(tds[3].textContent.trim());
    const depth = convertPersianNumbersToEnglish(tds[4].textContent.trim());
    const location = tds[5].textContent.trim();

    extractedData.push({
      dateTime,
      magnitude,
      latitude,
      longitude,
      depth,
      location,
    });
  });

  return extractedData;
}

/**
 * @param {string} url
 * @return {Array}
 */
async function fetchAndExtractData(url) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "fa,en;q=0.9,es;q=0.8",
        "upgrade-insecure-requests": "1",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    });

    const html = await response.text();
    if (!html || html.length < 100) {
      console.error(`HTML content from ${url} is empty or too short.`);
      return [];
    }

    return extractDataFromHTML(html);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return [];
  }
}


// --- Caching and Background Polling Logic ---

// 1. Variables to hold the cached data and the last update time
let cachedEarthquakes = [];
let lastUpdated = null;



const fetchAndUpdateCache = async () => {
  console.log("Attempting to fetch new earthquake data...");
  try {
    const baseUrl = "http://irsc.ut.ac.ir/index.php";
    const pages = [1, 2, 3];
    

    const pageDataPromises = pages.map((page) => {
      const url = `${baseUrl}?page=${page}&lang=fa`;
      return fetchAndExtractData(url);
    });

    const results = await Promise.all(pageDataPromises);

    const allEarthquakes = [];
    results.forEach((pageData) => {
      allEarthquakes.push(...pageData);
    });

    // Update cache and timestamp
    cachedEarthquakes = allEarthquakes;
    lastUpdated = new Date();
    
    console.log(`✅ Cache updated successfully at ${lastUpdated.toLocaleTimeString()} with ${cachedEarthquakes.length} records.`);

  } catch (error) {
    // Log the error but don't crash the server. The old cache will be used.
    console.error("❌ Failed to update cache:", error.message);
  }
};


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get("/api/earthquakes", (req, res) => {
  res.json({
    lastUpdated: lastUpdated,
    count: cachedEarthquakes.length,
    earthquakes: cachedEarthquakes,
  });
});


app.get('/', (req, res) => {
    res.render('index', {
      layout: false, 
      title: 'زیره زمین -لرزه نگاری لحظه ای ایران'
    });
  });




const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // 2. Fetch the data for the first time immediately when the server starts.
  fetchAndUpdateCache();

  // 3. Set an interval to re-fetch data every 2 minutes (120,000 ms).
  // Adjust the interval as needed.
  setInterval(fetchAndUpdateCache, 120000);
});