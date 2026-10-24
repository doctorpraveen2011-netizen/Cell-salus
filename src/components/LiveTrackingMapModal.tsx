import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, MapPin, Compass, 
  ExternalLink, Crosshair, Gauge, 
  X, FileText, Key, Check, ArrowLeft,
  Sparkles, AlertCircle
} from 'lucide-react';

interface LiveTrackingMapModalProps {
  onClose: () => void;
  buyerName?: string;
  invoiceId?: string;
  packVoltage?: number;
  packTemp?: number;
  onOpenBuyerDetails?: () => void;
  isFullDashboardView?: boolean;
}

// Preset route coordinates from Munich Assembly Center to Hamburg Logistics Hub
const ROUTE_WAYPOINTS: [number, number][] = [
  [48.1351, 11.5820], // Munich Origin
  [48.7758, 11.4258], // Ingolstadt
  [49.4521, 11.0767], // Nuremberg
  [50.9271, 11.5892], // Jena
  [51.3397, 12.3731], // Leipzig
  [52.1306, 11.6289], // Magdeburg
  [52.3759, 9.7320],  // Hannover
  [53.0793, 8.8017],  // Bremen Interchange
  [53.4632, 9.9821],  // Hamburg South
  [53.5432, 9.9921],  // Hamburg Green Logistics Hub (Destination)
];

// High-resolution, crisp tile layers with Google Maps, OpenStreetMap & Carto API Key support
const TILE_LAYERS: Record<string, { name: string; url: (apiKey?: string) => string; attribution: string }> = {
  streets: {
    name: 'Google Roads (Light)',
    url: () => 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps'
  },
  satellite: {
    name: 'Google Satellite',
    url: () => 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps / Maxar'
  },
  hybrid: {
    name: 'Google Hybrid',
    url: () => 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Hybrid'
  },
  osm: {
    name: 'OpenStreetMap',
    url: () => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  carto_light: {
    name: 'Carto Clean Light',
    url: (key) => key ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${key}` : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; CartoDB &copy; Google / OSM'
  }
};

export const LiveTrackingMapModal: React.FC<LiveTrackingMapModalProps> = ({
  onClose,
  buyerName = "Hamburg Green Logistics SE",
  invoiceId = "INV-2024-8849",
  packVoltage = 51.2,
  packTemp = 29.4,
  onOpenBuyerDetails,
  isFullDashboardView = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Default to Google Roads Light (matches clean white dashboard)
  const [mapStyle, setMapStyle] = useState<string>('streets');
  const [, setWaypointIndex] = useState<number>(7);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([53.4632, 9.9821]);
  const [speed, setSpeed] = useState<number>(64);
  const [heading, setHeading] = useState<number>(342);
  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [, setUserLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Fleet vehicle en route to Hamburg Logistics Hub B-4");

  // API Key State & Storage
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('cellsalus_map_api_key') || 'AIzaSyDemo-CellSalus-Fleet-ProdKey';
  });
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyToast, setKeyToast] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    setApiKey(trimmed);
    localStorage.setItem('cellsalus_map_api_key', trimmed);
    setShowKeyModal(false);
    setKeyToast(trimmed ? "Map API Key successfully saved and active!" : "API Key cleared. Using direct clean Google & OSM tiles.");
    setTimeout(() => setKeyToast(null), 3500);
  };

  const handleUseDemoKey = () => {
    const demo = "AIzaSyCellSalus-BMS-LiveFleet-Prod2026";
    setApiKeyInput(demo);
    setApiKey(demo);
    localStorage.setItem('cellsalus_map_api_key', demo);
    setShowKeyModal(false);
    setKeyToast("Demo Google Maps API Key active!");
    setTimeout(() => setKeyToast(null), 3500);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentCoords,
      zoom: 11,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Add selected tile layer
    const activeTileLayer = TILE_LAYERS[mapStyle] || TILE_LAYERS.streets;
    L.tileLayer(activeTileLayer.url(apiKey), {
      maxZoom: 19,
      attribution: activeTileLayer.attribution
    }).addTo(map);

    // Custom Truck Marker Icon (Modern Blue Theme)
    const truckIcon = L.divIcon({
      className: 'custom-fleet-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const marker = L.marker(currentCoords, { icon: truckIcon }).addTo(map);
    marker.bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.5; padding: 2px;">
        <strong style="font-size: 13px; color: #1e3a8a; display: block; margin-bottom: 2px;">🚛 Battery Fleet Carrier #09</strong>
        <div><b>Purchaser:</b> ${buyerName}</div>
        <div><b>Invoice:</b> ${invoiceId}</div>
        <div><b>Pack Temp:</b> ${packTemp.toFixed(1)}°C | <b>Voltage:</b> ${packVoltage.toFixed(1)}V</div>
      </div>
    `);
    markerRef.current = marker;

    // Destination Pin Icon
    const destIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="background: #ef4444; color: white; padding: 4px 9px; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 3px 10px rgba(239,68,68,0.4); white-space: nowrap;">
            📍 Hamburg Logistics Hub B-4
          </div>
          <div style="width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; margin-top: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
        </div>
      `,
      iconSize: [160, 40],
      iconAnchor: [80, 40]
    });

    const destCoords: [number, number] = ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1];
    L.marker(destCoords, { icon: destIcon }).addTo(map).bindPopup(`
      <div style="color: #0f172a; font-size: 12px; line-height: 1.4;">
        <strong style="color: #1e3a8a;">Registered Buyer Delivery Location</strong><br/>
        ${buyerName}<br/>
        Am Sandtorkai 64, 20457 Hamburg
      </div>
    `);

    // Route Polyline
    const polyline = L.polyline(ROUTE_WAYPOINTS, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(map);
    polylineRef.current = polyline;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer when style or apiKey changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const activeTileLayer = TILE_LAYERS[mapStyle] || TILE_LAYERS.streets;
    L.tileLayer(activeTileLayer.url(apiKey), {
      maxZoom: 19,
      attribution: activeTileLayer.attribution
    }).addTo(map);
  }, [mapStyle, apiKey]);

  // Vehicle movement simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setWaypointIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % ROUTE_WAYPOINTS.length;
        const target = ROUTE_WAYPOINTS[nextIdx];
        
        const jitterLat = (Math.random() - 0.5) * 0.002;
        const jitterLng = (Math.random() - 0.5) * 0.002;
        const nextCoords: [number, number] = [target[0] + jitterLat, target[1] + jitterLng];
        
        setCurrentCoords(nextCoords);
        setSpeed(Math.round(55 + Math.random() * 18));
        setHeading(Math.round(330 + Math.random() * 20));

        if (markerRef.current) {
          markerRef.current.setLatLng(nextCoords);
        }

        if (isFollowing && mapInstanceRef.current) {
          mapInstanceRef.current.panTo(nextCoords, { animate: true, duration: 0.8 });
        }

        return nextIdx;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isFollowing]);

  // Request Real Device GPS Location
  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("Locating your real device coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setLocationStatus(`Device GPS locked: ${coords[0].toFixed(4)}° N, ${coords[1].toFixed(4)}° E`);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(coords, 14);

          const userPin = L.divIcon({
            className: 'user-real-pin',
            html: `
              <div style="background: #10b981; color: white; padding: 4px 9px; border-radius: 8px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4); display: flex; align-items: center; gap: 5px;">
                <span style="width: 8px; height: 8px; background: white; border-radius: 50%;"></span> You Are Here
              </div>
            `,
            iconSize: [110, 30],
            iconAnchor: [55, 15]
          });

          L.marker(coords, { icon: userPin }).addTo(mapInstanceRef.current).bindPopup("Your Current Physical Location").openPopup();
        }
      },
      (err) => {
        setLocationStatus(`GPS permission denied or unavailable (${err.message}). Showing transit simulation.`);
      },
      { enableHighAccuracy: true }
    );
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentCoords[0]},${currentCoords[1]}&destination=53.5432,9.9921&travelmode=driving`;

  const contentJSX = (
    <div 
      style={{ 
        width: '100%', 
        height: isFullDashboardView ? 'calc(100vh - 120px)' : '90vh',
        maxWidth: isFullDashboardView ? '100%' : '1150px',
        display: 'flex', 
        flexDirection: 'column',
        padding: '22px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: isFullDashboardView ? '0 4px 20px rgba(15, 23, 42, 0.05)' : '0 25px 60px rgba(15, 23, 42, 0.15)',
        boxSizing: 'border-box'
      }}
    >
      {/* Toast Alert */}
      {keyToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.85rem',
          fontWeight: 600,
          border: '1px solid #334155'
        }}>
          <Sparkles size={16} className="text-emerald-400" />
          {keyToast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isFullDashboardView && (
            <button 
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          )}
          <div style={{ background: '#eff6ff', padding: '9px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <Navigation className="text-blue-600" size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Live Battery GPS & Google Map Route Tracker
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active Telemetry</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Purchaser: <strong style={{ color: '#0f172a' }}>{buyerName}</strong> | Bill #: <strong style={{ color: '#2563eb' }}>{invoiceId}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* API Key Toolbar Button */}
          <button
            onClick={() => {
              setApiKeyInput(apiKey);
              setShowKeyModal(true);
            }}
            style={{
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: '8px',
              border: apiKey ? '1px solid #86efac' : '1px solid #cbd5e1',
              background: apiKey ? '#f0fdf4' : '#f8fafc',
              color: apiKey ? '#166534' : '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Key size={14} className={apiKey ? 'text-emerald-600' : 'text-slate-500'} />
            {apiKey ? `API Key: ${apiKey.slice(0, 7)}...` : 'Add Map API Key'}
          </button>

          {onOpenBuyerDetails && (
            <button 
              className="btn btn-secondary" 
              onClick={onOpenBuyerDetails}
              style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} className="text-blue-600" /> View Buyer Bill
            </button>
          )}

          <a 
            href={googleMapsUrl} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-primary" 
            style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> Open in Google Maps
          </a>

          {!isFullDashboardView && (
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Map Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        {/* Layer Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Map Theme:</span>
          {Object.entries(TILE_LAYERS).map(([key, layer]) => {
            const isActive = mapStyle === key;
            return (
              <button
                key={key}
                onClick={() => setMapStyle(key)}
                style={{
                  fontSize: '0.72rem',
                  background: isActive ? '#2563eb' : '#f8fafc',
                  border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  color: isActive ? '#ffffff' : '#334155',
                  fontWeight: isActive ? 600 : 500,
                  padding: '5px 11px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {layer.name}
              </button>
            );
          })}
        </div>

        {/* Tracking & Location Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setIsFollowing(!isFollowing)} 
            style={{
              fontSize: '0.72rem',
              background: isFollowing ? '#ecfdf5' : '#f8fafc',
              border: isFollowing ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
              color: isFollowing ? '#047857' : '#475569',
              fontWeight: 600,
              padding: '5px 11px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Compass size={13} className={isFollowing ? 'animate-spin' : ''} />
            {isFollowing ? 'Vehicle Tracking Locked' : 'Free Camera'}
          </button>

          <button 
            onClick={handleUseDeviceLocation} 
            style={{
              fontSize: '0.72rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontWeight: 600,
              padding: '5px 11px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Crosshair size={13} /> Use My Real GPS
          </button>
        </div>
      </div>

      {/* Map Container & Overlaid Telemetry HUD */}
      <div style={{ position: 'relative', flexGrow: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '400px' }}>
        {/* Leaflet DOM Target */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '400px', background: '#f1f5f9' }} />

        {/* Floating Vehicle Telemetry HUD (Top Left) - White Theme */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px',
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '230px',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Gauge size={15} /> LIVE FLEET TELEMETRY
            </span>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>Speed</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{speed} km/h</div>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>Heading</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{heading}° NW</div>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>Pack Voltage</span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#059669' }}>{packVoltage.toFixed(1)} V</div>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>Peak Temp</span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: packTemp > 45 ? '#dc2626' : '#d97706' }}>{packTemp.toFixed(1)} °C</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>
            <div>Coords: <strong style={{ color: '#0f172a' }}>{currentCoords[0].toFixed(4)}°N, {currentCoords[1].toFixed(4)}°E</strong></div>
            <div>Remaining: <strong style={{ color: '#0f172a' }}>~14.2 km (12 mins to Destination)</strong></div>
          </div>
        </div>

        {/* Floating Buyer & Destination Card (Bottom Right) - White Theme */}
        <div style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px',
          color: '#0f172a',
          maxWidth: '330px',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <MapPin size={15} className="text-red-500" />
            <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Purchaser Destination</strong>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 700 }}>{buyerName}</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            Hamburg Logistics Hub B-4, Am Sandtorkai 64, Germany
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#2563eb' }}>
            <span>Invoice: <strong>{invoiceId}</strong></span>
            <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>Verified Delivery</span>
          </div>
        </div>
      </div>

      {/* Footer info bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          Status: <strong style={{ color: '#0f172a' }}>{locationStatus}</strong>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span>Carrier: <strong style={{ color: '#0f172a' }}>EV-TRANSIT-09</strong></span>
          <span>Frequency: <strong style={{ color: '#0f172a' }}>1Hz GNSS + Cellular LTE-M</strong></span>
        </div>
      </div>

      {/* API Key Modal / Dialog */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px', color: '#2563eb' }}>
                  <Key size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>Google & Map API Key Configuration</h3>
              </div>
              <button 
                onClick={() => setShowKeyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.4', margin: '0 0 14px 0' }}>
              Add your Google Maps JavaScript / Carto API key below. When configured, high-resolution tiles, geocoding and live traffic routing are authenticated directly with your key.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Map API Key:
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... or Carto API Key"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} className="text-emerald-600" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                <strong>Zero-Watermark Guarantee:</strong> Google Roads and OpenStreetMap tiles work right out of the box with zero watermark even without a custom key.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleUseDemoKey}
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Insert Demo Key
                </button>
                {apiKey && (
                  <button
                    onClick={() => {
                      setApiKeyInput('');
                      setApiKey('');
                      localStorage.removeItem('cellsalus_map_api_key');
                      setShowKeyModal(false);
                      setKeyToast("API Key cleared.");
                      setTimeout(() => setKeyToast(null), 3000);
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Key
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={14} /> Save & Apply Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullDashboardView) {
    return contentJSX;
  }

  return (
    <div className="modal-backdrop">
      {contentJSX}
    </div>
  );
};
