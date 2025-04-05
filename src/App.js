import React from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function App() {
  const [earthquakes, setEarthquakes] = React.useState([]);
  const [selectedPoint, setSelectedPoint] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const mapBounds = [
    [24, 44],
    [40, 64],
  ];
  const [mapCenter, setMapCenter] = React.useState(null);
  const markerRefs = React.useRef({});
  
  // Refresh interval in milliseconds (5 minutes)
  const REFRESH_INTERVAL = 5 * 60 * 1000;

  // The color classification is based on the earthquake magnitude (Richter scale).
  // This follows the standard used by global seismology organizations such as USGS and EMSC.
  // Colors indicate the severity of the earthquake
  const getColorByMagnitude = (magnitude) => {
    if (magnitude < 4) return "yellow";
    if (magnitude >= 4 && magnitude < 6) return "orange";
    if (magnitude >= 6 && magnitude < 7) return "red";
    if (magnitude >= 7 && magnitude < 8) return "purple";
    if (magnitude >= 8) return "brown";
    return "gray";
  };

  const flyToPoint = (latitude, longitude, index) => {
    setMapCenter([latitude, longitude]);
    setSelectedPoint(index);

    const marker = markerRefs.current[index];
    if (marker) {
      marker.openPopup();
    }
  };

  const fetchEarthquakeData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://zirzamin-api.mohammadhasanii.ir/api/earthquakes");
      const data = response.data;
      
      const validEarthquakes = data.filter((eq) => {
        const lat = parseFloat(eq.latitude);
        const lng = parseFloat(eq.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });
      
      setEarthquakes(validEarthquakes);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching earthquake data:", error);
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchEarthquakeData();
  };

  // Initial data fetch on component mount
  React.useEffect(() => {
    fetchEarthquakeData();
    
    // Set up interval for periodic refresh
    const intervalId = setInterval(() => {
      fetchEarthquakeData();
    }, REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format the last updated date/time
  const formatLastUpdated = () => {
    if (!lastUpdated) return "هنوز به‌روزرسانی نشده";
    
    // Format to Persian-friendly format
    return lastUpdated.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", padding: "10px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="logo.svg"
            alt="logo-zirezamin"
            style={{ width: "50px", height: "50px" }}
          />
          <p style={{ margin: 5, fontSize: "20px" }}>ZireZamin</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ direction: "rtl" }}>
            <span>آخرین به‌روزرسانی: </span>
            <span>{formatLastUpdated()}</span>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: "5px 15px",
              backgroundColor: isLoading ? "#cccccc" : "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "در حال بارگیری..." : "به‌روزرسانی"}
          </button>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: "20px", height: "calc(100vh - 100px)" }}
      >
        <div style={{ flex: "0 0 66%" }}>
          <MapContainer
            style={{ height: "100%", width: "100%" }}
            bounds={mapBounds}
            maxBounds={mapBounds}
            maxBoundsViscosity={1.0}
            minZoom={5}
            maxZoom={8}
          >
            {mapCenter && <MapController center={mapCenter} zoom={7} />}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {earthquakes.map((eq, index) => (
              <CircleMarker
                ref={(element) => (markerRefs.current[index] = element)}
                key={index}
                center={[parseFloat(eq.latitude), parseFloat(eq.longitude)]}
                radius={Math.max(parseFloat(eq.magnitude) * 2, 5)}
                pathOptions={{
                  color: "#000000",
                  fillColor: getColorByMagnitude(parseFloat(eq.magnitude)),
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div dir="rtl">
                    <strong>زمان: {eq.dateTime}</strong>
                    <br />
                    <strong>بزرگی: {eq.magnitude}</strong>
                    <br />
                    <strong>عمق: {eq.depth} کیلومتر</strong>
                    <br />
                    <strong>منطقه: {eq.location}</strong>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div style={{ flex: "0 0 33%", direction: "rtl", overflow: "auto" }}>
          <div style={{ padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>لیست زلزله‌ها</h3>
            <span style={{ fontSize: "14px", color: "#555" }}>
              {earthquakes.length} رویداد
            </span>
          </div>
          
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "#f2f2f2",
                  position: "sticky",
                  top: 0,
                }}
              >
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  زمان
                </th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  بزرگی
                </th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  عمق
                </th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  منطقه
                </th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  نمایش
                </th>
              </tr>
            </thead>
            <tbody>
              {earthquakes.map((eq, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor:
                      selectedPoint === index ? "#e6f3ff" : "white",
                  }}
                >
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                    {eq.dateTime}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: parseFloat(eq.magnitude) >= 6 ? "#ffeeee" : "inherit" }}>
                    {eq.magnitude}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                    {eq.depth}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                    {eq.location}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      border: "1px solid #ddd",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() =>
                        flyToPoint(
                          parseFloat(eq.latitude),
                          parseFloat(eq.longitude),
                          index
                        )
                      }
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      نمایش
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;