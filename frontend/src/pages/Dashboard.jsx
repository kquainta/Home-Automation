import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Cloud,
  Sun,
  Moon,
  Zap,
  Sun as SunIcon,
  Battery,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  BarChart3,
  DollarSign,
  Activity,
  Home,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  MapPin,
} from 'lucide-react';
import { PowerFlowDiagram } from '../components/PowerFlowDiagram';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Home Overview data
  const [weatherData, setWeatherData] = useState(null);
  const [weatherTemperatureSensor, setWeatherTemperatureSensor] = useState(null); // HA sensor.blink_whole_house_temperature
  const [sunData, setSunData] = useState(null);
  const [moonData, setMoonData] = useState(null);
  const [houseImageUrl, setHouseImageUrl] = useState(null);
  const [houseImageError, setHouseImageError] = useState(null);
  const [houseImageMetadata, setHouseImageMetadata] = useState(null);
  const houseImageUrlRef = useRef(null);
  
  // Energy data
  const [powerConsumption, setPowerConsumption] = useState(null);
  const [solarOutput, setSolarOutput] = useState(null);
  const [batteryData, setBatteryData] = useState(null);
  const [batteryPower, setBatteryPower] = useState(null); // Charge/discharge rate
  const [gridData, setGridData] = useState(null);
  
  // Usage Statistics
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [usageStats, setUsageStats] = useState(null);
  const [electricCostCurrentMonth, setElectricCostCurrentMonth] = useState(null);
  const [projectedMonthlyCost, setProjectedMonthlyCost] = useState(null);
  const [monthlyUsageToDate, setMonthlyUsageToDate] = useState(null);
  const [projectedMonthlyUsage, setProjectedMonthlyUsage] = useState(null);
  const [energyHistory, setEnergyHistory] = useState([]);
  const [energyHistoryLoading, setEnergyHistoryLoading] = useState(false);

  // Home Assistant connection state
  const [haConfigured, setHaConfigured] = useState(null);
  const [haError, setHaError] = useState(null);

  const fetchHomeAssistantEntities = async () => {
    try {
      const statusRes = await api.get('/homeassistant/status').catch(() => ({ data: { configured: false } }));
      const configured = statusRes?.data?.configured === true;
      setHaConfigured(configured);
      setHaError(null);

      if (!configured) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await api.get('/homeassistant/dashboard');
      const entities = Array.isArray(data) ? data : [];

      setHaError(null);

      // Extract weather data (card layout, humidity, wind)
      const weatherEntity = entities.find(e =>
        e.entity_id?.includes('weather') ||
        e.attributes?.device_class === 'temperature'
      );
      setWeatherData(weatherEntity ?? null);
      // Current temperature from HA sensor.blink_whole_house_temperature
      const blinkTemp = entities.find(e => e.entity_id === 'sensor.blink_whole_house_temperature') ?? null;
      setWeatherTemperatureSensor(blinkTemp);

      // Extract sun data
      const sunEntity = entities.find(e => e.entity_id?.includes('sun'));
      setSunData(sunEntity ?? null);

      // Extract energy data
      const powerEntity = entities.find(e =>
        e.entity_id?.includes('power') ||
        e.entity_id?.includes('consumption') ||
        e.attributes?.unit_of_measurement === 'kW' ||
        e.attributes?.unit_of_measurement === 'W'
      );
      setPowerConsumption(powerEntity ?? null);

      // Solar: prefer Envoy 121544051333 Current power production (HA API), fallback to solar/pv entities
      const ENVOY_SOLAR_FRIENDLY_NAME = 'Envoy 121544051333 Current power production';
      const solarEntity = entities.find(e =>
        e.attributes?.friendly_name === ENVOY_SOLAR_FRIENDLY_NAME
      ) ?? entities.find(e =>
        e.entity_id?.includes('solar') ||
        e.entity_id?.includes('pv')
      );
      setSolarOutput(solarEntity ?? null);

      const batteryEntity = entities.find(e =>
        (e.entity_id?.includes('battery') || e.entity_id?.includes('powerwall')) &&
        (e.attributes?.unit_of_measurement === '%' || e.attributes?.device_class === 'battery')
      );
      setBatteryData(batteryEntity ?? null);

      const batteryPowerEntity = entities.find(e =>
        (e.entity_id?.includes('battery') || e.entity_id?.includes('powerwall')) &&
        (e.attributes?.unit_of_measurement === 'kW' || e.attributes?.unit_of_measurement === 'W') &&
        (e.entity_id?.includes('power') || e.entity_id?.includes('charge') || e.entity_id?.includes('discharge'))
      );
      setBatteryPower(batteryPowerEntity ?? null);

      const gridEntity = entities.find(e =>
        e.entity_id?.includes('grid') ||
        e.entity_id?.includes('import') ||
        e.entity_id?.includes('export')
      );
      setGridData(gridEntity ?? null);

      // SMUD electric billing entities (HA API)
      const byFriendlyName = (name) => entities.find(e => e.attributes?.friendly_name === name) ?? null;
      setElectricCostCurrentMonth(byFriendlyName('SMUD Electric Current bill electric cost to date'));
      setProjectedMonthlyCost(byFriendlyName('SMUD Electric Current bill electric forecasted cost'));
      setMonthlyUsageToDate(byFriendlyName('SMUD Electric Current bill electric usage to date'));
      setProjectedMonthlyUsage(byFriendlyName('SMUD Electric Current bill electric forecasted usage'));
    } catch (err) {
      console.error('Failed to fetch Home Assistant data:', err);
      setHaError(err.response?.data?.detail || err.message || 'Unable to reach Home Assistant.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHouseImage = async () => {
    try {
      setHouseImageError(null);
      // Add timestamp query to bust cache and ensure hourly refresh
      const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // Changes every hour
      
      // Fetch both image and metadata in parallel
      const [imageResponse, metadataResponse] = await Promise.all([
        api.get('/homeassistant/house-image', {
          params: { t: timestamp },
          responseType: 'blob',
        }),
        api.get('/homeassistant/house-image-metadata', {
          params: { t: timestamp },
        }).catch(() => null), // Metadata is optional, don't fail if it errors
      ]);
      
      // response.data is already a Blob when responseType is 'blob'
      if (!(imageResponse.data instanceof Blob)) {
        const errorMsg = 'Invalid response type - expected blob';
        console.error(errorMsg, typeof imageResponse.data);
        setHouseImageError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Create object URL from blob
      const imageUrl = URL.createObjectURL(imageResponse.data);
      
      // Revoke previous URL to prevent memory leaks
      if (houseImageUrlRef.current && houseImageUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(houseImageUrlRef.current);
      }
      
      houseImageUrlRef.current = imageUrl;
      setHouseImageUrl(imageUrl);
      
      // Set metadata if available
      if (metadataResponse?.data) {
        setHouseImageMetadata(metadataResponse.data);
      }
      
      setHouseImageError(null);
    } catch (err) {
      console.error('Failed to fetch house image:', err);
      let errorMsg = 'Failed to load image';
      if (err.response) {
        console.error('Response status:', err.response.status);
        if (err.response.status === 404) {
          errorMsg = 'Image not found';
        } else if (err.response.status === 500) {
          errorMsg = 'Server error loading image';
        } else {
          errorMsg = `Error ${err.response.status}: ${err.response.data?.detail || 'Unknown error'}`;
        }
        console.error('Response data:', err.response.data);
      } else if (err.message) {
        errorMsg = err.message;
      }
      setHouseImageError(errorMsg);
      setHouseImageMetadata(null);
      // Revoke URL if it exists
      if (houseImageUrlRef.current && houseImageUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(houseImageUrlRef.current);
      }
      houseImageUrlRef.current = null;
      setHouseImageUrl(null);
    }
  };

  useEffect(() => {
    fetchHomeAssistantEntities();
    const interval = setInterval(fetchHomeAssistantEntities, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHouseImage();
    // Refresh hourly (3600000 ms = 1 hour)
    const interval = setInterval(fetchHouseImage, 3600000);
    return () => {
      clearInterval(interval);
      // Cleanup blob URL on unmount
      if (houseImageUrlRef.current && houseImageUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(houseImageUrlRef.current);
      }
    };
  }, []);

  const fetchEnergyHistory = async () => {
    try {
      setEnergyHistoryLoading(true);
      // Calculate date range based on selected period
      const today = new Date();
      let fromDate = null;
      
      if (selectedPeriod === 'day') {
        // Last 7 days
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
      } else if (selectedPeriod === 'week') {
        // Last 4 weeks
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 28);
      } else if (selectedPeriod === 'month') {
        // Last 3 months
        fromDate = new Date(today);
        fromDate.setMonth(today.getMonth() - 3);
      } else if (selectedPeriod === 'year') {
        // Last year
        fromDate = new Date(today);
        fromDate.setFullYear(today.getFullYear() - 1);
      }

      const params = {};
      if (fromDate) {
        params.from_date = fromDate.toISOString().split('T')[0];
      }
      params.to_date = today.toISOString().split('T')[0];

      const { data } = await api.get('/homeassistant/energy-history', { params });
      setEnergyHistory(data?.data || []);
    } catch (err) {
      console.error('Failed to fetch energy history:', err);
      setEnergyHistory([]);
    } finally {
      setEnergyHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchEnergyHistory();
  }, [selectedPeriod]);

  // Calculate moon phase (simplified calculation)
  const calculateMoonPhase = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // Simple moon phase calculation (approximate)
    const daysSinceNewMoon = (year * 365.25 + month * 30.44 + day) % 29.53;
    const phase = daysSinceNewMoon / 29.53;
    
    if (phase < 0.03) return { name: 'New Moon', icon: '🌑', illumination: 0 };
    if (phase < 0.22) return { name: 'Waxing Crescent', icon: '🌒', illumination: phase * 100 };
    if (phase < 0.28) return { name: 'First Quarter', icon: '🌓', illumination: 50 };
    if (phase < 0.47) return { name: 'Waxing Gibbous', icon: '🌔', illumination: phase * 100 };
    if (phase < 0.53) return { name: 'Full Moon', icon: '🌕', illumination: 100 };
    if (phase < 0.72) return { name: 'Waning Gibbous', icon: '🌖', illumination: (1 - phase) * 100 };
    if (phase < 0.78) return { name: 'Last Quarter', icon: '🌗', illumination: 50 };
    return { name: 'Waning Crescent', icon: '🌘', illumination: (1 - phase) * 100 };
  };

  const moonPhase = calculateMoonPhase();

  // Format time helper
  const formatTime = (timeString) => {
    if (!timeString) return '—';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  // Format number helper
  const formatNumber = (value, decimals = 1) => {
    if (value === null || value === undefined) return '—';
    return Number(value).toFixed(decimals);
  };

  // Get weather condition icon based on condition string
  const getWeatherIcon = (condition) => {
    if (!condition) return Cloud;
    const cond = condition.toLowerCase();
    if (cond.includes('sun') || cond === 'clear' || cond === 'clear-day') return Sun;
    if (cond.includes('rain') || cond.includes('drizzle')) return CloudRain;
    if (cond.includes('snow') || cond.includes('sleet')) return CloudSnow;
    if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) return CloudFog;
    if (cond.includes('thunder') || cond.includes('storm') || cond.includes('lightning')) return CloudLightning;
    if (cond.includes('cloud') || cond.includes('overcast')) return Cloud;
    return Cloud; // Default
  };

  // Get weather condition from data
  const weatherCondition = weatherData?.attributes?.condition || weatherData?.state || null;
  const WeatherIcon = getWeatherIcon(weatherCondition);

  // Convert to kW helper (handles W to kW conversion)
  const toKW = (value, unit) => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    if (unit === 'W' || unit === 'w') {
      return num / 1000; // Convert W to kW
    }
    return num; // Already in kW
  };

  // Extract energy values for power flow diagram (with safe null checks)
  const solarPowerKW = solarOutput?.state ? toKW(solarOutput.state, solarOutput.attributes?.unit_of_measurement) : 0;
  const batteryLevel = batteryData?.state ? (Number(batteryData.state) || 0) : 0;
  // Battery power: positive = charging, negative = discharging
  const batteryPowerKW = batteryPower?.state ? toKW(batteryPower.state, batteryPower.attributes?.unit_of_measurement) : 0;
  const gridPowerKW = gridData?.state ? toKW(gridData.state, gridData.attributes?.unit_of_measurement) : 0;
  const homeConsumptionKW = powerConsumption?.state ? toKW(powerConsumption.state, powerConsumption.attributes?.unit_of_measurement) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      {/* Welcome Section */}
      <section className="glass p-6 rounded-3xl border-l-4 border-emerald-500/60 flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-400">
          Welcome, <span className="text-sky-400 font-medium">{user?.email}</span>.
        </p>
        <button
          type="button"
          onClick={fetchHomeAssistantEntities}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 disabled:opacity-50 text-sm font-medium transition-colors"
          aria-label="Refresh data"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="w-4 h-4" aria-hidden />
          )}
          Refresh
        </button>
      </section>

      {/* Home Assistant connection status */}
      {haConfigured === false && (
        <section className="glass p-4 rounded-2xl border-l-4 border-amber-500/60 text-amber-200/90 text-sm">
          Home Assistant is not configured. Set <code className="bg-black/20 px-1 rounded">HOME_ASSISTANT_URL</code> and <code className="bg-black/20 px-1 rounded">HOME_ASSISTANT_TOKEN</code> in the backend environment to see live data.
        </section>
      )}
      {haError && (
        <section className="glass p-4 rounded-2xl border-l-4 border-red-500/60 text-red-200/90 text-sm">
          {haError}
        </section>
      )}

      {/* Section 1: HOME OVERVIEW */}
      <section className="glass p-8 rounded-3xl border-l-4 border-sky-500/50">
        <h2 className="text-lg font-bold mb-6 text-slate-100 flex items-center gap-2">
          <SunIcon className="w-5 h-5 text-sky-400" aria-hidden />
          HOME OVERVIEW
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weather Card */}
          <div className="glass p-6 rounded-2xl border-l-4 border-sky-400/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Current Weather</h3>
              <Cloud className="w-5 h-5 text-sky-400" aria-hidden />
            </div>
            {(weatherData || weatherTemperatureSensor) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-4xl font-bold text-slate-100">
                      {weatherTemperatureSensor != null && weatherTemperatureSensor.state !== undefined && weatherTemperatureSensor.state !== ''
                        ? `${formatNumber(weatherTemperatureSensor.state)}${weatherTemperatureSensor.attributes?.unit_of_measurement ?? '°F'}`
                        : weatherData
                          ? `${formatNumber(weatherData.state)}°F`
                          : '—'}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {weatherTemperatureSensor ? 'Outside Temperature' : (weatherData?.attributes?.friendly_name ?? 'Weather')}
                    </div>
                  </div>
                  {weatherData && weatherCondition && (
                    <div className="flex-shrink-0 ml-4">
                      <WeatherIcon className="w-16 h-16 text-sky-400" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500">Humidity:</span>{' '}
                    {weatherData?.attributes?.humidity ?? '—'}%
                  </div>
                  <div>
                    <span className="text-slate-500">Wind:</span>{' '}
                    {weatherData?.attributes?.wind_speed ?? '—'} mph
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No weather data available</div>
            )}
          </div>

          {/* Sun Data Card */}
          <div className="glass p-6 rounded-2xl border-l-4 border-amber-400/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Sun</h3>
              <Sun className="w-5 h-5 text-amber-400" aria-hidden />
            </div>
            {sunData ? (
              <div className="space-y-3">
                <div className="text-lg font-semibold text-slate-100">
                  {sunData.state === 'above_horizon' ? 'Above Horizon' : 'Below Horizon'}
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  <div>
                    <span className="text-slate-500">Sunrise:</span>{' '}
                    {formatTime(sunData.attributes?.next_rising)}
                  </div>
                  <div>
                    <span className="text-slate-500">Sunset:</span>{' '}
                    {formatTime(sunData.attributes?.next_setting)}
                  </div>
                  <div>
                    <span className="text-slate-500">Elevation:</span>{' '}
                    {formatNumber(sunData.attributes?.elevation)}°
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No sun data available</div>
            )}
          </div>

          {/* Moon Data Card */}
          <div className="glass p-6 rounded-2xl border-l-4 border-purple-400/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Moon</h3>
              <Moon className="w-5 h-5 text-purple-400" aria-hidden />
            </div>
            <div className="space-y-3">
              <div className="text-2xl mb-2">{moonPhase.icon}</div>
              <div className="text-lg font-semibold text-slate-100">{moonPhase.name}</div>
              <div className="text-sm text-slate-400">
                <span className="text-slate-500">Illumination:</span>{' '}
                {formatNumber(moonPhase.illumination, 0)}%
              </div>
            </div>
          </div>

          {/* House Image Card */}
          <div className="glass p-6 rounded-2xl border-l-4 border-emerald-500/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">House View</h3>
              <Home className="w-5 h-5 text-emerald-400" aria-hidden />
            </div>
            {houseImageUrl ? (
              <div className="space-y-2">
                <img
                  src={houseImageUrl}
                  alt="Latest house view"
                  className="w-full h-auto rounded-lg object-cover max-h-64"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    setHouseImageUrl(null);
                    setHouseImageError('Image failed to load');
                  }}
                />
                <div className="text-xs text-slate-400 text-center space-y-1">
                  <div>Latest image from Home Assistant</div>
                  {houseImageMetadata && (
                    <div className="text-slate-500">
                      {houseImageMetadata.date_from_filename ? (() => {
                        // Parse date string as local date (YYYY-MM-DD format)
                        const [year, month, day] = houseImageMetadata.date_from_filename.split('-').map(Number);
                        const dateFromFilename = new Date(year, month - 1, day);
                        return (
                          <>
                            {dateFromFilename.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {' • '}
                          </>
                        );
                      })() : null}
                      {(() => {
                        // Parse the ISO datetime string (backend sends UTC with 'Z' suffix)
                        // JavaScript automatically converts UTC to user's local timezone
                        const modifiedDate = new Date(houseImageMetadata.modified_datetime);
                        // Display in user's local timezone
                        return modifiedDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm flex items-center justify-center h-32">
                <div className="text-center">
                  <div>{houseImageError || 'No image available'}</div>
                  {houseImageError && (
                    <div className="text-xs mt-1 text-red-400">Check browser console for details</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map Card - OpenStreetMap embed centered on house */}
          <div className="glass p-6 rounded-2xl border-l-4 border-blue-500/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Location</h3>
              <MapPin className="w-5 h-5 text-blue-400" aria-hidden />
            </div>
            <div className="space-y-2">
              {/* bbox = min_lon, min_lat, max_lon, max_lat - centered on 38.41729588, -121.44286712 */}
              <div className="rounded-lg overflow-hidden border border-white/10 aspect-[4/3] max-h-64">
                <iframe
                  title="Map showing 5058 Willow Vale Way, Elk Grove, CA 95758"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-121.4462%2C38.4148%2C-121.4395%2C38.4198&layer=mapnik&marker=38.41729588%2C-121.44286712"
                  className="w-full h-full min-h-[240px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="text-xs text-slate-400 text-center space-y-1">
                <div className="text-slate-300 font-medium">5058 Willow Vale Way</div>
                <div className="text-slate-500">Elk Grove, CA 95758</div>
                <a
                  href="https://www.google.com/maps/search/5058+Willow+Vale+Way,+Elk+Grove,+CA+95758"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Weather Radar Card - Windy.com embed centered on Elk Grove */}
          <div className="glass p-6 rounded-2xl border-l-4 border-cyan-500/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Weather Radar</h3>
              <CloudRain className="w-5 h-5 text-cyan-400" aria-hidden />
            </div>
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border border-white/10 aspect-[4/3] max-h-64">
                <iframe
                  title="Weather radar for Elk Grove, CA area"
                  src="https://embed.windy.com/embed.html?lat=38.4173&lon=-121.4429&zoom=9&level=surface&overlay=radar&product=radar&menu=&message=&marker=&calendar=&type=map&location=coordinates&detail=&detailLat=38.4173&detailLon=-121.4429&metricWind=default&metricTemp=default&metricRain=default"
                  className="w-full h-full min-h-[240px] border-0"
                  loading="lazy"
                />
              </div>
              <div className="text-xs text-slate-400 text-center">
                <a
                  href="https://www.windy.com/?38.417,-121.443,9,radar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Open full radar on Windy.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: ENERGY */}
      <section className="glass p-8 rounded-3xl border-l-4 border-emerald-500/60">
        <h2 className="text-lg font-bold mb-6 text-slate-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" aria-hidden />
          ENERGY
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Energy Cards - Stacked vertically */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Power Consumption Card */}
            <div className="glass p-6 rounded-2xl border-l-4 border-orange-500/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Power Consumption</h3>
                <Activity className="w-4 h-4 text-orange-400" aria-hidden />
              </div>
              {powerConsumption ? (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-100">
                    {formatNumber(powerConsumption.state)} kW
                  </div>
                  <div className="text-xs text-slate-400">
                    {powerConsumption.attributes?.friendly_name || 'Consumption'}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No data</div>
              )}
            </div>

            {/* Solar Output Card */}
            <div className="glass p-6 rounded-2xl border-l-4 border-yellow-500/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Solar Output</h3>
                <SunIcon className="w-4 h-4 text-yellow-400" aria-hidden />
              </div>
              {solarOutput ? (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-100">
                    {formatNumber(solarOutput.state)} kW
                  </div>
                  <div className="text-xs text-slate-400">
                    {solarOutput.attributes?.friendly_name || 'Solar'}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No data</div>
              )}
            </div>

            {/* Battery Card */}
            <div className="glass p-6 rounded-2xl border-l-4 border-cyan-500/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Battery</h3>
                <Battery className="w-4 h-4 text-cyan-400" aria-hidden />
              </div>
              {batteryData ? (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-100">
                    {formatNumber(batteryData.state)}%
                  </div>
                  <div className="text-xs text-slate-400">
                    {batteryData.attributes?.friendly_name || 'Battery'}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Power Flow Diagram - Wider */}
          <div className="lg:col-span-3 glass p-4 rounded-2xl border border-emerald-500/30">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Power Flow</h3>
            <PowerFlowDiagram
              solarPower={solarPowerKW}
              batteryPower={batteryPowerKW}
              batteryLevel={batteryLevel}
              gridPower={gridPowerKW}
              homeConsumption={homeConsumptionKW}
            />
          </div>
        </div>
      </section>

      {/* Section 3: USAGE STATISTICS */}
      <section className="glass p-8 rounded-3xl border-l-4 border-purple-500/60">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" aria-hidden />
            USAGE STATISTICS
          </h2>
          <div className="flex gap-2">
            {['day', 'week', 'month', 'year'].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graph cards - stacked vertically */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consumption Graph */}
            <div className="glass p-6 rounded-2xl border border-purple-500/30">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Consumption Over Time
              </h3>
              <div className="h-48">
                {energyHistoryLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                ) : energyHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-500 text-sm">
                      No historical data available
                      <br />
                      <span className="text-xs text-slate-600">Data will appear after daily snapshots are recorded</span>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '11px' }}
                        label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '11px' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                        }}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }}
                        formatter={(value) => {
                          return value != null ? [`${Number(value).toFixed(1)} kWh`, 'Usage'] : ['N/A', 'Usage'];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="usage_kwh"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Electricity Cost Over Time Graph */}
            <div className="glass p-6 rounded-2xl border border-purple-500/30">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Electricity Cost Over Time
              </h3>
              <div className="h-48">
                {energyHistoryLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                ) : energyHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-500 text-sm">
                      No historical data available
                      <br />
                      <span className="text-xs text-slate-600">Data will appear after daily snapshots are recorded</span>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '11px' }}
                        label={{ value: '$', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '11px' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                        }}
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }}
                        formatter={(value) => {
                          return value != null ? [`$${Number(value).toFixed(2)}`, 'Cost'] : ['N/A', 'Cost'];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cost_usd"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Cost Card */}
            <div className="glass p-6 rounded-2xl border-l-4 border-purple-400/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Energy Cost</h3>
                <DollarSign className="w-4 h-4 text-purple-400" aria-hidden />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-slate-100">$—</div>
                  <div className="text-xs text-slate-400">Today</div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-lg font-semibold text-slate-100">$—</div>
                  <div className="text-xs text-slate-400">This {selectedPeriod}</div>
                </div>
              </div>
            </div>

            {/* Electric Cost Current Month card - SMUD from HA */}
            <div className="glass p-6 rounded-2xl border-l-4 border-emerald-500/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Electric Cost Current Month</h3>
                <DollarSign className="w-4 h-4 text-emerald-400" aria-hidden />
              </div>
              {electricCostCurrentMonth != null ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-slate-100">
                    {typeof electricCostCurrentMonth.state === 'number' || typeof electricCostCurrentMonth.state === 'string'
                      ? `$${Number(electricCostCurrentMonth.state).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `$${String(electricCostCurrentMonth.state ?? '—')}`}
                  </div>
                  <div className="text-xs text-slate-400">
                    {electricCostCurrentMonth.attributes?.friendly_name ?? 'Bill electric cost to date'}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No data</div>
              )}
            </div>

            {/* Projected monthly electric cost - SMUD from HA */}
            <div className="glass p-6 rounded-2xl border-l-4 border-amber-500/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Projected Monthly Electric Cost</h3>
                <DollarSign className="w-4 h-4 text-amber-400" aria-hidden />
              </div>
              {projectedMonthlyCost != null ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-slate-100">
                    {typeof projectedMonthlyCost.state === 'number' || typeof projectedMonthlyCost.state === 'string'
                      ? `$${Number(projectedMonthlyCost.state).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : String(projectedMonthlyCost.state ?? '—')}
                  </div>
                  <div className="text-xs text-slate-400">Forecasted cost this month</div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No data</div>
              )}
            </div>

            {/* Monthly electric usage to date - SMUD from HA */}
            <div className="glass p-6 rounded-2xl border-l-4 border-sky-500/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Monthly Electric Usage to Date</h3>
                <Activity className="w-4 h-4 text-sky-400" aria-hidden />
              </div>
              {monthlyUsageToDate != null ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-slate-100">
                    {typeof monthlyUsageToDate.state === 'number' || typeof monthlyUsageToDate.state === 'string'
                      ? `${Number(monthlyUsageToDate.state).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${monthlyUsageToDate.attributes?.unit_of_measurement ?? 'kWh'}`
                      : String(monthlyUsageToDate.state ?? '—')}
                  </div>
                  <div className="text-xs text-slate-400">Usage so far this month</div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No data</div>
              )}
            </div>

            {/* Projected monthly electric usage - SMUD from HA */}
            <div className="glass p-6 rounded-2xl border-l-4 border-indigo-500/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Projected Monthly Electric Usage</h3>
                <Activity className="w-4 h-4 text-indigo-400" aria-hidden />
              </div>
              {projectedMonthlyUsage != null ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-slate-100">
                    {typeof projectedMonthlyUsage.state === 'number' || typeof projectedMonthlyUsage.state === 'string'
                      ? `${Number(projectedMonthlyUsage.state).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${projectedMonthlyUsage.attributes?.unit_of_measurement ?? 'kWh'}`
                      : String(projectedMonthlyUsage.state ?? '—')}
                  </div>
                  <div className="text-xs text-slate-400">Forecasted usage this month</div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No data</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
