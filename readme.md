# ZireZamin - Real-time Iranian Seismological Monitoring
<img width="100%" loading="lazy" src="./public/demo-wallpaper.png" />

## Overview
ZireZamin is an interactive web application for monitoring and visualizing earthquake data across Iran and surrounding regions. The dashboard provides a real-time map interface combined with a detailed data table, allowing users to efficiently track seismic activities. This project is built with a modern, lightweight architecture, featuring a zero-build frontend powered by Vanilla JavaScript and an Express server.

<img width="100%" loading="lazy" src="./public/demo.png" />

## ✨ Key Features
- **Intelligent & Interactive Map**: Visualizes earthquake locations with color-coded markers based on magnitude. The map is geo-fenced to the Iranian region, with surrounding countries styled in grayscale to maintain focus.
- **Detailed Data Table**: Displays comprehensive information for each seismic event in a scrollable list.
- **Point Selection & Focus**: Clicking a row in the table or a marker on the map automatically centers the view and opens a detailed popup.
- **Theme Switcher**: Instantly switch between **Light** and **Dark** modes. The user's preference is saved in `localStorage` for future visits.
- **Smart Date Formatting**: Displays event times relatively (e.g., "Today, at 10:30" or "Yesterday, at 17:00") for quicker understanding.
- **Color-Coded Severity**: An intuitive and modern color system indicates earthquake severity:
  - <span style="color: #facc15;">●</span> **Yellow**: < 4 magnitude
  - <span style="color: #fb923c;">●</span> **Orange**: 4 - 5.9 magnitude
  - <span style="color: #f87171;">●</span> **Red**: 6 - 6.9 magnitude
  - <span style="color: #c084fc;">●</span> **Purple**: 7 - 7.9 magnitude
  - <span style="color: #a5b4fc;">●</span> **Indigo**: ≥ 8 magnitude
- **Responsive Design**: The user interface is optimized for both desktop and mobile screens.

## 🛠️ Technology Stack

This project utilizes a **Zero-Build Frontend** approach.

### Backend
- **Node.js**: Server-side JavaScript runtime environment.
- **Express.js**: Web framework for building the API and serving the application.
- **Handlebars.js (hbs)**: Template engine for server-side rendering of the HTML layout.
- **node-fetch**: For fetching data from the external seismological source on the server.

### Frontend
- **Vanilla JavaScript (ES6+)**: Powers all client-side logic and interactivity without a framework.
- **Leaflet.js (CDN)**: A powerful, lightweight library for interactive maps.
- **Tailwind CSS (CDN)**: A utility-first CSS framework for rapid and modern UI design.

## 🏛️ Architecture
The application follows an integrated client-server architecture:
1.  **Express Server**: Acts as the application's core. The server is responsible for:
    -   Rendering and serving the main application page using an `index.hbs` template.
    -   Providing an **internal API** at `/api/earthquakes`, which acts as a caching proxy. It fetches data from the primary source (Iranian Seismological Center), caches it, and serves it to the client.
2.  **Client (Vanilla JS)**: The client-side JavaScript, running in the browser, fetches data from the internal API (`/api/earthquakes`) and handles all rendering logic for the map, table, and user interactions.

## 📊 Data Visualization
- **Marker Size**: Proportional to the earthquake's magnitude.
- **Marker Color**: Based on the severity classification.
- **Popup Information**: Includes the region, precise date and time, magnitude, and depth of the earthquake.
- **Map Mask**: A GeoJSON layer is used as a mask to render Iran in full color while desaturating the surrounding countries, creating a clear visual focus.

## 🚀 Installation and Setup
1.  First, clone this repository:
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    ```
2.  Navigate into the project folder and install the dependencies:
    ```bash
    cd zirezamin-project
    npm install
    ```
3.  Start the server:
    ```bash
    node server.js
    ```
    Or, if you have a `start` script in your `package.json`:
    ```bash
    npm start
    ```
4.  Open your browser and navigate to `http://localhost:5000` (or the port you have configured in `server.js`).

## ⚙️ Internal API
The application expects the internal API at `/api/earthquakes` to provide data in the following format:
```json
{
  "lastUpdated": "ISO_Date_String",
  "count": "number",
  "earthquakes": [
    {
      "dateTime": "string",
      "magnitude": "string",
      "depth": "string",
      "location": "string",
      "latitude": "string",
      "longitude": "string"
    }
  ]
}