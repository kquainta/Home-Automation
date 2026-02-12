import React from 'react';

export function PowerFlowDiagram({ solarPower = 0, batteryPower = 0, batteryLevel = 0, gridPower = 0, homeConsumption = 0 }) {
  // Convert to numbers and handle kW/W units, ensure all are valid numbers
  const solar = Math.abs(isNaN(Number(solarPower)) ? 0 : Number(solarPower));
  const batteryChargeRate = isNaN(Number(batteryPower)) ? 0 : Number(batteryPower); // Positive = charging, Negative = discharging
  const batteryPct = Math.max(0, Math.min(100, isNaN(Number(batteryLevel)) ? 0 : Number(batteryLevel)));
  const grid = isNaN(Number(gridPower)) ? 0 : Number(gridPower); // Positive = importing, Negative = exporting
  const consumption = Math.abs(isNaN(Number(homeConsumption)) ? 0 : Number(homeConsumption));

  // Simplified flow calculation based on available data
  // Handle grid: positive = importing, negative = exporting
  const isGridImporting = grid > 0;
  const isGridExporting = grid < 0;
  const gridImport = isGridImporting ? grid : 0;
  const gridExport = isGridExporting ? Math.abs(grid) : 0;
  
  // Solar flows: to home, to battery (if charging), excess to grid
  const solarToHome = solar > 0 && consumption > 0 ? Math.min(solar, consumption) : 0;
  const solarToBattery = solar > 0 && batteryChargeRate > 0 ? Math.min(solar - solarToHome, batteryChargeRate) : 0;
  const solarToGrid = Math.max(0, solar - solarToHome - solarToBattery);
  
  // Battery flows: discharging to home or grid
  const batteryToHome = batteryChargeRate < 0 ? Math.min(Math.abs(batteryChargeRate), consumption - solarToHome) : 0;
  const batteryToGrid = batteryChargeRate < 0 ? Math.max(0, Math.abs(batteryChargeRate) - batteryToHome) : 0;
  
  // Grid flows: importing to home or battery
  const gridToHome = gridImport > 0 ? Math.max(0, consumption - solarToHome - batteryToHome) : 0;
  const gridToBattery = gridImport > 0 && batteryChargeRate > 0 ? Math.min(gridImport - gridToHome, batteryChargeRate - solarToBattery) : 0;
  
  // Total export (solar + battery to grid)
  const totalExport = solarToGrid + batteryToGrid;

  // Arrow width calculation (min 2px, max 8px, proportional to power)
  const maxPower = Math.max(solar, Math.abs(batteryChargeRate), Math.abs(grid), consumption, 1); // Use 1 instead of 10 to avoid division issues
  const getArrowWidth = (power) => {
    if (power === 0 || maxPower === 0) return 0;
    const width = (Math.abs(power) / maxPower) * 8;
    return Math.max(2, Math.min(8, isNaN(width) ? 2 : width));
  };

  // Arrow opacity based on power
  const getArrowOpacity = (power) => {
    if (power === 0 || maxPower === 0) return 0;
    const opacity = Math.abs(power) / maxPower;
    return Math.max(0.3, Math.min(1, isNaN(opacity) ? 0.3 : opacity));
  };

  const svgWidth = 500;
  const svgHeight = 350;
  const centerX = svgWidth / 2;
  // Layout: Home (top), Grid/Battery/Solar evenly spaced below
  const homeY = 50;
  const bottomRowY = 250;
  const gridX = centerX - 120;
  const batteryX = centerX;
  const solarX = centerX + 120;

  return (
    <div className="w-full">
      <svg
        width="100%"
        height="350"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definitions for arrow markers */}
        <defs>
          <marker
            id="arrowhead-green"
            markerWidth="4"
            markerHeight="4"
            refX="3.5"
            refY="1.5"
            orient="auto"
          >
            <polygon points="0 0, 4 1.5, 0 3" fill="#22c55e" />
          </marker>
          <marker
            id="arrowhead-cyan"
            markerWidth="4"
            markerHeight="4"
            refX="3.5"
            refY="1.5"
            orient="auto"
          >
            <polygon points="0 0, 4 1.5, 0 3" fill="#06b6d4" />
          </marker>
          <marker
            id="arrowhead-orange"
            markerWidth="4"
            markerHeight="4"
            refX="3.5"
            refY="1.5"
            orient="auto"
          >
            <polygon points="0 0, 4 1.5, 0 3" fill="#f97316" />
          </marker>
          <marker
            id="arrowhead-yellow"
            markerWidth="4"
            markerHeight="4"
            refX="3.5"
            refY="1.5"
            orient="auto"
          >
            <polygon points="0 0, 4 1.5, 0 3" fill="#eab308" />
          </marker>
          {/* Animated gradient for flowing energy */}
          <linearGradient id="flow-gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3">
              <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8">
              <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="flow-gradient-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3">
              <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8">
              <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          <linearGradient id="flow-gradient-orange" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3">
              <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.8">
              <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>

        {/* Home <-> Grid - Always visible */}
        <g>
          {/* When power flows TO Home: path from Grid to Home, arrow at Home end */}
          {(gridToHome > 0 || gridImport > 0) && (
            <path
              d={`M ${gridX} ${bottomRowY - 25} L ${centerX - 30} ${homeY + 28}`}
              stroke="#f97316"
              strokeWidth={getArrowWidth(Math.max(gridToHome, gridImport))}
              fill="none"
              opacity={getArrowOpacity(Math.max(gridToHome, gridImport))}
              markerEnd="url(#arrowhead-orange)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* When power flows FROM Home (export): path from Home to Grid, arrow at Grid end */}
          {gridExport > 0 && gridToHome === 0 && (
            <path
              d={`M ${centerX - 30} ${homeY + 28} L ${gridX} ${bottomRowY - 25}`}
              stroke="#eab308"
              strokeWidth={getArrowWidth(gridExport)}
              fill="none"
              opacity={getArrowOpacity(gridExport)}
              markerEnd="url(#arrowhead-yellow)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* Inactive line when no flow */}
          {gridToHome === 0 && gridExport === 0 && (
            <path
              d={`M ${centerX - 30} ${homeY + 28} L ${gridX} ${bottomRowY - 25}`}
              stroke="#64748b"
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
              strokeDasharray="3,3"
            />
          )}
          {(gridToHome > 0 || gridImport > 0 || gridExport > 0) && (
            <text
              x={(centerX - 30 + gridX) / 2}
              y={(homeY + bottomRowY) / 2}
              fill={gridExport > 0 ? "#eab308" : "#f97316"}
              fontSize="10"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {gridExport > 0 ? gridExport.toFixed(1) : Math.max(gridToHome, gridImport).toFixed(1)} kW
            </text>
          )}
        </g>

        {/* Home <-> Battery - Always visible */}
        <g>
          {/* When battery discharges TO Home: path from Battery to Home, arrow at Home end */}
          {batteryToHome > 0 && (
            <path
              d={`M ${batteryX} ${bottomRowY - 25} L ${centerX} ${homeY + 28}`}
              stroke="#06b6d4"
              strokeWidth={getArrowWidth(batteryToHome)}
              fill="none"
              opacity={getArrowOpacity(batteryToHome)}
              markerEnd="url(#arrowhead-cyan)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* When battery charges FROM Home: path from Home to Battery, arrow at Battery end */}
          {batteryChargeRate > 0 && batteryToHome === 0 && (
            <path
              d={`M ${centerX} ${homeY + 28} L ${batteryX} ${bottomRowY - 25}`}
              stroke="#06b6d4"
              strokeWidth={getArrowWidth(batteryChargeRate)}
              fill="none"
              opacity={getArrowOpacity(batteryChargeRate)}
              markerEnd="url(#arrowhead-cyan)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* Inactive line when no flow */}
          {batteryToHome === 0 && batteryChargeRate <= 0 && (
            <path
              d={`M ${centerX} ${homeY + 28} L ${batteryX} ${bottomRowY - 25}`}
              stroke="#64748b"
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
              strokeDasharray="3,3"
            />
          )}
          {(batteryToHome > 0 || batteryChargeRate > 0) && (
            <text
              x={centerX}
              y={(homeY + bottomRowY) / 2}
              fill="#06b6d4"
              fontSize="10"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {Math.max(batteryToHome, Math.abs(batteryChargeRate)).toFixed(1)} kW
            </text>
          )}
        </g>

        {/* Home <-> Solar - Always visible */}
        <g>
          {/* When solar flows TO Home: path from Solar to Home, arrow at Home end */}
          {solarToHome > 0 && (
            <path
              d={`M ${solarX} ${bottomRowY - 25} L ${centerX + 30} ${homeY + 28}`}
              stroke="#eab308"
              strokeWidth={getArrowWidth(solarToHome)}
              fill="none"
              opacity={getArrowOpacity(solarToHome)}
              markerEnd="url(#arrowhead-yellow)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* Inactive line when no solar flow to home */}
          {solarToHome === 0 && (
            <path
              d={`M ${centerX + 30} ${homeY + 28} L ${solarX} ${bottomRowY - 25}`}
              stroke="#64748b"
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
              strokeDasharray="3,3"
            />
          )}
          {solarToHome > 0 && (
            <text
              x={(centerX + 30 + solarX) / 2}
              y={(homeY + bottomRowY) / 2}
              fill="#eab308"
              fontSize="10"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {solarToHome.toFixed(1)} kW
            </text>
          )}
        </g>

        {/* Grid <-> Battery - Always visible */}
        <g>
          {/* When Grid charges Battery: path from Grid to Battery */}
          {gridToBattery > 0 && (
            <path
              d={`M ${gridX + 25} ${bottomRowY} L ${batteryX - 25} ${bottomRowY}`}
              stroke="#f97316"
              strokeWidth={getArrowWidth(gridToBattery)}
              fill="none"
              opacity={getArrowOpacity(gridToBattery)}
              markerEnd="url(#arrowhead-orange)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* When Solar charges Battery: path from Solar to Battery */}
          {solarToBattery > 0 && gridToBattery === 0 && (
            <path
              d={`M ${solarX - 25} ${bottomRowY} L ${batteryX - 25} ${bottomRowY}`}
              stroke="#eab308"
              strokeWidth={getArrowWidth(solarToBattery)}
              fill="none"
              opacity={getArrowOpacity(solarToBattery)}
              markerEnd="url(#arrowhead-yellow)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* Inactive line when no flow */}
          {gridToBattery === 0 && solarToBattery === 0 && (
            <path
              d={`M ${gridX + 25} ${bottomRowY} L ${batteryX - 25} ${bottomRowY}`}
              stroke="#64748b"
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
              strokeDasharray="3,3"
            />
          )}
          {(gridToBattery > 0 || solarToBattery > 0) && (
            <text
              x={(gridX + batteryX) / 2}
              y={bottomRowY - 15}
              fill={gridToBattery > 0 ? "#f97316" : "#eab308"}
              fontSize="10"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {Math.max(gridToBattery, solarToBattery).toFixed(1)} kW
            </text>
          )}
        </g>

        {/* Solar <-> Grid - Always visible */}
        <g>
          {/* When Solar exports to Grid: path from Solar to Grid */}
          {solarToGrid > 0 && (
            <path
              d={`M ${solarX - 25} ${bottomRowY} L ${gridX + 25} ${bottomRowY}`}
              stroke="#eab308"
              strokeWidth={getArrowWidth(solarToGrid)}
              fill="none"
              opacity={getArrowOpacity(solarToGrid)}
              markerEnd="url(#arrowhead-yellow)"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
          {/* Inactive line when no flow */}
          {solarToGrid === 0 && (
            <path
              d={`M ${solarX - 25} ${bottomRowY} L ${gridX + 25} ${bottomRowY}`}
              stroke="#64748b"
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
              strokeDasharray="3,3"
            />
          )}
          {solarToGrid > 0 && (
            <text
              x={(solarX + gridX) / 2}
              y={bottomRowY - 15}
              fill="#eab308"
              fontSize="10"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {solarToGrid.toFixed(1)} kW
            </text>
          )}
        </g>

        {/* Home Icon - Top */}
        <g>
          <circle cx={centerX} cy={homeY} r="25" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
          {/* Home icon SVG */}
          <path
            d={`M ${centerX} ${homeY - 10} L ${centerX - 8} ${homeY - 2} L ${centerX - 8} ${homeY + 6} L ${centerX + 8} ${homeY + 6} L ${centerX + 8} ${homeY - 2} Z`}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect
            x={centerX - 2.5}
            y={homeY + 1}
            width="5"
            height="5"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
          />
          <text x={centerX} y={homeY + 40} fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="600">
            Home
          </text>
          <text x={centerX} y={homeY + 53} fill="#22c55e" fontSize="10" textAnchor="middle" fontFamily="monospace">
            {consumption.toFixed(1)} kW
          </text>
        </g>

        {/* Grid Icon - Bottom Left */}
        <g>
          <circle cx={gridX} cy={bottomRowY} r="22" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="2" />
          {/* Lightning/Zap icon SVG */}
          <path
            d={`M ${gridX - 3} ${bottomRowY - 8} L ${gridX + 5} ${bottomRowY - 1} L ${gridX} ${bottomRowY} L ${gridX + 3} ${bottomRowY + 8} L ${gridX - 5} ${bottomRowY + 1} Z`}
            fill="#f97316"
            stroke="#f97316"
            strokeWidth="1"
          />
          <text x={gridX} y={bottomRowY + 38} fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="600">
            Grid
          </text>
          <text 
            x={gridX} 
            y={bottomRowY + 51} 
            fill={grid > 0 ? "#f97316" : grid < 0 ? "#eab308" : "#94a3b8"} 
            fontSize="10" 
            textAnchor="middle" 
            fontFamily="monospace"
          >
            {grid > 0 ? '+' : ''}{grid.toFixed(1)} kW
          </text>
        </g>

        {/* Battery Icon - Bottom Center */}
        <g>
          <circle cx={batteryX} cy={bottomRowY} r="22" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="2" />
          {/* Battery icon SVG */}
          <rect
            x={batteryX - 9}
            y={bottomRowY - 6}
            width="18"
            height="12"
            rx="2"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
          />
          <rect
            x={batteryX + 9}
            y={bottomRowY - 3}
            width="2"
            height="6"
            fill="#06b6d4"
          />
          {/* Battery fill level */}
          {batteryPct > 0 && (
            <rect
              x={batteryX - 7}
              y={bottomRowY - 4}
              width={Math.max(0, Math.min(14, (14 * batteryPct) / 100))}
              height="8"
              rx="1"
              fill="#06b6d4"
              opacity="0.6"
            />
          )}
          <text x={batteryX} y={bottomRowY + 38} fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="600">
            Battery
          </text>
          <text x={batteryX} y={bottomRowY + 51} fill="#06b6d4" fontSize="10" textAnchor="middle" fontFamily="monospace">
            {batteryPct.toFixed(0)}%
          </text>
          {batteryChargeRate !== 0 && (
            <text x={batteryX} y={bottomRowY + 63} fill={batteryChargeRate > 0 ? "#22c55e" : "#f97316"} fontSize="9" textAnchor="middle" fontFamily="monospace">
              {batteryChargeRate > 0 ? '+' : ''}{batteryChargeRate.toFixed(1)} kW
            </text>
          )}
        </g>

        {/* Solar Panel Icon - Bottom Right */}
        <g>
          <circle cx={solarX} cy={bottomRowY} r="22" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" strokeWidth="2" />
          {/* Sun icon SVG */}
          <circle cx={solarX} cy={bottomRowY} r="6" fill="#eab308" />
          <path
            d={`M ${solarX} ${bottomRowY - 8} L ${solarX} ${bottomRowY - 13} M ${solarX} ${bottomRowY + 8} L ${solarX} ${bottomRowY + 13} M ${solarX - 8} ${bottomRowY} L ${solarX - 13} ${bottomRowY} M ${solarX + 8} ${bottomRowY} L ${solarX + 13} ${bottomRowY} M ${solarX - 6} ${bottomRowY - 6} L ${solarX - 9} ${bottomRowY - 9} M ${solarX + 6} ${bottomRowY - 6} L ${solarX + 9} ${bottomRowY - 9} M ${solarX - 6} ${bottomRowY + 6} L ${solarX - 9} ${bottomRowY + 9} M ${solarX + 6} ${bottomRowY + 6} L ${solarX + 9} ${bottomRowY + 9}`}
            stroke="#eab308"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <text x={solarX} y={bottomRowY + 38} fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="600">
            Solar
          </text>
          <text x={solarX} y={bottomRowY + 51} fill="#eab308" fontSize="10" textAnchor="middle" fontFamily="monospace">
            {solar.toFixed(1)} kW
          </text>
        </g>
      </svg>
    </div>
  );
}
