import React, { useState, useEffect, useRef } from "react";
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
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(false);
  
  const mapBounds = [
    [24, 44],
    [40, 64],
  ];
  const [mapCenter, setMapCenter] = useState(null);
  const markerRefs = useRef({});
  
  // Refresh interval in milliseconds (5 minutes)
  const REFRESH_INTERVAL = 5 * 60 * 1000;

  // The color classification is based on the earthquake magnitude (Richter scale).
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
    
    // On mobile, after selecting a point, hide the table
    if (window.innerWidth < 768) {
      setIsTableVisible(false);
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

  // Toggle table visibility on mobile
  const toggleTable = () => {
    setIsTableVisible(!isTableVisible);
  };

  // Initial data fetch on component mount
  useEffect(() => {
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center">
          <img
            src="logo.svg"
            alt="logo-zirezamin"
            className="w-10 h-10 md:w-12 md:h-12"
          />
          <p className="mx-2 text-lg md:text-xl font-semibold">ZireZamin</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-xs md:text-sm text-right" dir="rtl">
            <span>آخرین به‌روزرسانی: </span>
            <span>{formatLastUpdated()}</span>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className={`px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm text-white rounded ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isLoading ? "در حال بارگیری..." : "به‌روزرسانی"}
          </button>
        </div>
      </div>

      {/* Mobile toggle button for table */}
      <div className="md:hidden flex justify-center p-2">
        <button 
          onClick={toggleTable}
          className="w-full bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded text-center"
          dir="rtl"
        >
          {isTableVisible ? "بستن لیست زلزله‌ها" : "نمایش لیست زلزله‌ها"}
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row flex-1 h-full">
        {/* Map Container */}
        <div className={`${isTableVisible ? 'hidden' : 'flex-1'} md:flex-1 md:w-2/3`}>
          <MapContainer
            className="h-full w-full"
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

        {/* Earthquake List */}
        <div 
          className={`${isTableVisible ? 'flex-1' : 'hidden'} md:flex md:flex-1 md:w-1/3 overflow-auto border-l`}
          dir="rtl"
        >
          <div className="w-full">
            <div className="p-4 flex justify-between items-center sticky top-0 bg-white z-10 border-b">
              <h3 className="text-lg font-bold">لیست زلزله‌ها</h3>
              <span className="text-sm text-gray-600">
                {earthquakes.length} رویداد
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">زمان</th>
                    <th className="p-2 border">بزرگی</th>
                    <th className="p-2 border">عمق</th>
                    <th className="p-2 border">منطقه</th>
                    <th className="p-2 border">نمایش</th>
                  </tr>
                </thead>
                <tbody>
                  {earthquakes.map((eq, index) => (
                    <tr
                      key={index}
                      className={selectedPoint === index ? "bg-blue-50" : ""}
                    >
                      <td className="p-2 border text-xs">{eq.dateTime}</td>
                      <td className={`p-2 border ${parseFloat(eq.magnitude) >= 6 ? "bg-red-50" : ""}`}>
                        {eq.magnitude}
                      </td>
                      <td className="p-2 border">{eq.depth}</td>
                      <td className="p-2 border text-xs">{eq.location}</td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() =>
                            flyToPoint(
                              parseFloat(eq.latitude),
                              parseFloat(eq.longitude),
                              index
                            )
                          }
                          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
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
      </div>
    </div>
  );
}

export default App;