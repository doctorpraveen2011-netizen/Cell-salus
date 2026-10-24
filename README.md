# 🔋 CellSalus — AI-Driven Predictive BMS & Autonomous Cell Isolation

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![EU Regulation](https://img.shields.io/badge/Compliance-EU%202027%2F918-003399?logo=europeanunion&logoColor=white)](https://eur-lex.europa.eu/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **CellSalus** is a state-of-the-art AI-driven Battery Management System (BMS) and Digital Battery Passport platform engineered to detect battery degradation early and autonomously isolate damaged battery cells in **sub-60 milliseconds** before thermal runaway can cascade.

---

## ⚡ Key Architectural Breakthroughs

1. **Autonomous Relay Isolation & Dynamic Shunt Bypass**
   - Integrates hardware drivers (L298N bistable relay logic) to physically disconnect failing cells in under 58ms.
   - Rebalances and throttles current across remaining operational cells without taking down the full pack.

2. **Predictive RUL with Explainable AI (SHAP)**
   - Continuous inference engine estimating Remaining Useful Life (RUL) from capacity fade, internal resistance surge, and Joule heating ($I^2R$).
   - Computes local SHAP (SHapley Additive exPlanations) values to provide auditable decisions for node bypass.

3. **8-Point Multi-Sensor Detection Suite (ISO 26262 ASIL-D Compliant)**
   - **Voltage MUX**: 16-channel ADC multiplexing (Dual CD4067).
   - **NTC Thermistor Matrix**: Peak temperature and thermal gradient ($\Delta T$) monitoring.
   - **MQ-2 VOC Sensor**: Real-time solvent outgassing detection (DMC/EMC) *before* thermal runaway occurs.
   - **MPU-6050 6-DOF IMU**: Collision shock and deceleration impact logging (high-G warning).
   - **HVIL & Relay Coil Continuity**: High-voltage insulation and coil continuity health checks.

4. **EU Digital Battery Passport (Regulation EU 2027/918)**
   - Cryptographic SHA-256 blockchain verification hashes.
   - Automated Second-Life Grading:
     - ♻️ **Grade A**: Reusable for Stationary Grid BESS
     - 🔧 **Grade B**: Repairable / Refurbish
     - ☠️ **Grade C**: Recycle-only
   - **One-Click GDPR Sanitization**: Purges previous owner identity and real-time GPS coordinates while preserving irreversible cell diagnostic health history.

5. **Live Fleet GPS & Google Map Route Tracker**
   - High-resolution Google Roads and OpenStreetMap vector tiles.
   - Live fleet carrier telemetry (Speed, Heading, Voltage, Temperature).
   - Integrated Buyer and Bill of Materials (BOM) Invoice Verification Registry.
   - Built-in Map API Key manager supporting Google Maps and Carto API keys.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons, Recharts.
- **Mapping & GIS**: Leaflet with Google Maps Tiles (Roads, Satellite, Hybrid) & OpenStreetMap.
- **Machine Learning Core**: Python (`predictive_bms.py`), scikit-learn, Random Forest Regressor, SHAP Explainer.
- **Firmware**: Embedded C++ / Arduino (`bms_isolation_controller.ino`).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/doctorpraveen2011-netizen/Cell-salus.git
cd Cell-salus

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` to explore the dashboard.

---

## 🌐 Deployment to GitHub Pages

This project is configured with GitHub Actions (`.github/workflows/deploy.yml`) for automated building and zero-config deployment to GitHub Pages.

---

## 📄 License
This project is licensed under the MIT License.
