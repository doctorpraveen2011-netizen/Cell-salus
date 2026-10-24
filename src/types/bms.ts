export interface CellState {
  id: number;
  voltage: number;
  temperature: number;
  current: number;
  resistance: number;
  soh: number;
  rul: number;
  isIsolated: boolean;
  isRebalanced: boolean;
  isHotNeighbor: boolean;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  cellId: number;
  eventType: 'ISOLATION' | 'RECONNECT' | 'REBALANCE' | 'WARNING' | 'CRITICAL' | 'NORMAL';
  message: string;
  shapValues?: {
    temperature: number;
    resistance: number;
    soh: number;
  };
}

export interface BatteryPassport {
  id: string;
  manufacturer: string;
  chemistry: string;
  manufactureDate: string;
  initialCapacityAh: number;
  cycleCount: number;
  currentSoH: number;
  grade: 'A' | 'B' | 'C';
  ownerName: string;
  facilityLocation: string;
  isSanitized: boolean;
  blockchainHash: string;
}

export interface AutopsyReport {
  cellId: number;
  timestamp: string;
  preFailureV: number;
  preFailureT: number;
  preFailureR: number;
  failureMode: string;
  verdict: string;
}

export interface BuyerInvoiceRecord {
  invoiceId: string;
  barcode: string;
  packId: string;
  buyerName: string;
  companyName: string;
  taxId: string;
  contactEmail: string;
  purchaseDate: string;
  dealer: string;
  deliveryAddress: string;
  destinationCoords: { lat: number; lng: number };
  totalAmount: number;
  currency: string;
  warrantyExpiry: string;
  warrantyStatus: 'VALID' | 'EXPIRED' | 'CLAIMED';
  applicationType: 'Commercial Fleet EV' | 'Stationary Solar BESS' | 'Second-Life Grid Storage';
  items: { description: string; qty: number; unitPrice: number }[];
  verifiedStamp: boolean;
  digitalHash: string;
}

export interface SensorTelemetry {
  voltageMux: {
    channelCount: number;
    status: 'NOMINAL' | 'CALIBRATING' | 'FAULT';
    noiseFloorMv: number;
  };
  thermistorArray: {
    channelCount: number;
    status: 'NOMINAL' | 'GRADIENT_ALERT' | 'DISCONNECTED';
    peakTemp: number;
    minTemp: number;
    deltaT: number;
  };
  currentHall: {
    status: 'NOMINAL' | 'SATURATED' | 'OFFSET_DRIFT';
    currentAmps: number;
    accuracyPercent: number;
  };
  gasSensor: {
    status: 'SAFE' | 'WARNING' | 'CRITICAL_OUTGAS';
    vocPpm: number;
    baselinePpm: number;
    gasType: string;
  };
  imuVibration: {
    status: 'STABLE' | 'VIBRATION_WARNING' | 'IMPACT_DETECTED';
    gForce: number;
    pitchDeg: number;
    rollDeg: number;
  };
  moistureSensor: {
    status: 'DRY_SEALED' | 'HUMIDITY_WARN' | 'WATER_INGRESS';
    relativeHumidity: number;
    sealIntegrity: boolean;
  };
  insulationResistance: {
    status: 'HEALTHY' | 'ISOLATION_FAULT';
    mohms: number;
  };
  relayContinuity: {
    status: 'CLOSED_HEALTHY' | 'OPEN_ISOLATED' | 'COIL_FAULT' | 'CONTACT_WELDED';
    coilResistanceOhms: number;
    contactResistanceMohms: number;
  };
}

export interface GPSLocationState {
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  altitudeM: number;
  address: string;
  destinationName: string;
  distanceKm: number;
  etaMinutes: number;
  isTrackingReal: boolean;
  routeProgress: number;
}
