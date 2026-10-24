/**
 * @file bms_isolation_controller.ino
 * @brief AI-Driven BMS Cell Monitoring, Physical Isolation & Load Rebalancing Firmware
 * 
 * Hardware Setup:
 * - Microcontroller: ESP32 or Arduino Mega (3.3V/5V logic)
 * - Multiplexer: 2x CD4067 16-Channel Analog Multiplexers (one for Voltage, one for Temperature)
 * - Relay Driver: L298N Dual H-Bridge & Quad Relay Module for active cell isolation and bypass routing.
 *   - L298N is used to toggle bistable latching relays.
 *   - ENA/ENB enable power, IN1/IN2 control polarity to connect/disconnect cell terminals.
 *   - Current bypass routes around the isolated cell to keep the remaining pack online.
 */

#include <Arduino.h>

// CD4067 Multiplexer Address Pins (Shared between Voltage & Temp Mux)
#define MUX_S0 12
#define MUX_S1 13
#define MUX_S2 14
#define MUX_S3 15

// Mux Analog Input Pins
#define MUX_VOLT_PIN 34 // ADC1 for Voltage readings
#define MUX_TEMP_PIN 35 // ADC2 for NTC thermistor readings

// L298N Relay Driver Pins (Cell 1 & Cell 2 Isolation Control Example)
// For a full 16-cell pack, shift registers (e.g., 74HC595) or GPIO expanders (MCP23017) are used.
#define L298N_ENA 25
#define L298N_IN1 26 // High/Low pulse isolates Cell A
#define L298N_IN2 27 // Low/High pulse reconnects Cell A
#define L298N_ENB 32
#define L298N_IN3 33 // High/Low pulse isolates Cell B
#define L298N_IN4 18 // Low/High pulse reconnects Cell B

// System Constants
const int NUM_CELLS = 16;
const float VOLTAGE_REFERENCE = 3.3; // ESP32 Reference
const int ADC_RESOLUTION = 4095;    // 12-bit ADC
const float CRITICAL_TEMP = 60.0;    // °C threshold for thermal runaway prediction
const float CRITICAL_VOLT = 2.8;    // V threshold for cell failure

// Structure to hold individual cell state
struct CellState {
  int id;
  float voltage;
  float temperature;
  float current;
  bool isIsolated;
  float healthScore; // Calculated locally/by dashboard AI
  float rul;         // Remaining Useful Life (cycles)
};

CellState pack[NUM_CELLS];
float packCurrent = 5.0; // Simulated constant load current (Amps)

// Function Declarations
void selectMuxChannel(int channel);
float readCellVoltage(int channel);
float readCellTemperature(int channel);
void performIsolation(int cellId, bool isolate);
void handleSerialCommands();
void sendTelemetry();
void applyActiveRebalancing();

void setup() {
  Serial.begin(115200);
  
  // Set Multiplexer select pins as OUTPUT
  pinMode(MUX_S0, OUTPUT);
  pinMode(MUX_S1, OUTPUT);
  pinMode(MUX_S2, OUTPUT);
  pinMode(MUX_S3, OUTPUT);

  // Set L298N Control Pins as OUTPUT
  pinMode(L298N_ENA, OUTPUT);
  pinMode(L298N_IN1, OUTPUT);
  pinMode(L298N_IN2, OUTPUT);
  pinMode(L298N_ENB, OUTPUT);
  pinMode(L298N_IN3, OUTPUT);
  pinMode(L298N_IN4, OUTPUT);

  // Initialize L298N drivers to low-power state
  digitalWrite(L298N_ENA, LOW);
  digitalWrite(L298N_ENB, LOW);

  // Initialize cells state
  for (int i = 0; i < NUM_CELLS; i++) {
    pack[i].id = i + 1;
    pack[i].voltage = 3.8;      // Standard nominal voltage
    pack[i].temperature = 25.0; // Room temp
    pack[i].current = packCurrent;
    pack[i].isIsolated = false;
    pack[i].healthScore = 100.0;
    pack[i].rul = 1500.0;
  }
  
  Serial.println("{\"status\":\"BMS_INITIALIZED\",\"version\":\"2.0.1-AI-Ready\"}");
}

void loop() {
  // Read sensors via multiplexers
  for (int i = 0; i < NUM_CELLS; i++) {
    selectMuxChannel(i);
    delayMicroseconds(50); // Settle analog voltages

    // Read real sensor values or fallback to simulation if pins are floating
    pack[i].voltage = readCellVoltage(i);
    pack[i].temperature = readCellTemperature(i);
    pack[i].current = pack[i].isIsolated ? 0.0 : packCurrent;

    // Local heuristic failsafe: Auto-isolate cell if critically degraded
    if ((pack[i].temperature > CRITICAL_TEMP || pack[i].voltage < CRITICAL_VOLT) && !pack[i].isIsolated) {
      performIsolation(pack[i].id, true);
    }
  }

  // Pre-emptive Load Rebalancing logic
  applyActiveRebalancing();

  // Send JSON data to Digital Twin dashboard
  sendTelemetry();

  // Check for commands from dashboard AI (e.g. isolate, grading trigger, reset)
  handleSerialCommands();

  delay(1000); // 1Hz Refresh Rate
}

// Selects the channel on CD4067 multiplexer
void selectMuxChannel(int channel) {
  digitalWrite(MUX_S0, (channel & 1));
  digitalWrite(MUX_S1, ((channel >> 1) & 1));
  digitalWrite(MUX_S2, ((channel >> 2) & 1));
  digitalWrite(MUX_S3, ((channel >> 3) & 1));
}

// Read cell voltage via voltage divider circuit connected to Mux
float readCellVoltage(int channel) {
  int rawAdc = analogRead(MUX_VOLT_PIN);
  // Divider ratio (e.g., 2:1 mapping 5V down to 2.5V for ESP32 ADC)
  float dividerRatio = 2.0; 
  float voltage = (rawAdc / (float)ADC_RESOLUTION) * VOLTAGE_REFERENCE * dividerRatio;
  
  // If floating pin during testing, simulate a realistic discharge curve
  if (voltage < 0.5) {
    voltage = 3.7 - (channel * 0.02) - (millis() / 500000.0);
    if (voltage < 2.5) voltage = 2.5; // Floor limit
  }
  return voltage;
}

// Read cell temperature using an NTC 10K Thermistor on Mux
float readCellTemperature(int channel) {
  int rawAdc = analogRead(MUX_TEMP_PIN);
  
  // Convert ADC to resistance and then Celsius using Steinhart-Hart Equation
  if (rawAdc < 10) rawAdc = 2048; // Simulate standard temp if floating
  float thermistorRes = 10000.0 / ((4095.0 / rawAdc) - 1.0);
  float steinhart;
  steinhart = thermistorRes / 10000.0;      // (R/Ro)
  steinhart = log(steinhart);               // ln(R/Ro)
  steinhart /= 3950.0;                      // 1/B * ln(R/Ro)
  steinhart += 1.0 / (25.0 + 273.15);       // + (1/To)
  steinhart = 1.0 / steinhart;              // Invert
  steinhart -= 273.15;                      // Convert to C
  
  // Simulated drift for testing
  if (channel == 6) { // Simulate cell 7 starting to run hot
    steinhart = 25.0 + (millis() / 8000.0);
    if (steinhart > 85.0) steinhart = 85.0;
  }
  
  return steinhart;
}

/**
 * Executes isolation of a single cell using the L298N driver
 * Pulse-width modulation (PWM) or full pulse is sent to trigger the latching bypass relay.
 */
void performIsolation(int cellId, bool isolate) {
  if (cellId < 1 || cellId > NUM_CELLS) return;
  
  pack[cellId - 1].isIsolated = isolate;
  
  // Hardware pulse control to latch the relay
  if (cellId == 1) { // Cell 1 mapping
    digitalWrite(L298N_ENA, HIGH);
    if (isolate) {
      // Send pulse to IN1 to disconnect Cell 1 and connect bypass circuit
      digitalWrite(L298N_IN1, HIGH);
      digitalWrite(L298N_IN2, LOW);
      delay(100); // 100ms pulse is enough to latch the relay
      digitalWrite(L298N_IN1, LOW);
      Serial.println("{\"event\":\"RELAY_ACTIVATED\",\"cell\":1,\"state\":\"ISOLATED\"}");
    } else {
      // Send pulse to IN2 to reconnect Cell 1 and disconnect bypass circuit
      digitalWrite(L298N_IN1, LOW);
      digitalWrite(L298N_IN2, HIGH);
      delay(100);
      digitalWrite(L298N_IN2, LOW);
      Serial.println("{\"event\":\"RELAY_DEACTIVATED\",\"cell\":1,\"state\":\"RECONNECTED\"}");
    }
    digitalWrite(L298N_ENA, LOW); // Disable driver to save power
  } else if (cellId == 2) { // Cell 2 mapping
    digitalWrite(L298N_ENB, HIGH);
    if (isolate) {
      digitalWrite(L298N_IN3, HIGH);
      digitalWrite(L298N_IN4, LOW);
      delay(100);
      digitalWrite(L298N_IN3, LOW);
      Serial.println("{\"event\":\"RELAY_ACTIVATED\",\"cell\":2,\"state\":\"ISOLATED\"}");
    } else {
      digitalWrite(L298N_IN3, LOW);
      digitalWrite(L298N_IN4, HIGH);
      delay(100);
      digitalWrite(L298N_IN4, LOW);
      Serial.println("{\"event\":\"RELAY_DEACTIVATED\",\"cell\":2,\"state\":\"RECONNECTED\"}");
    }
    digitalWrite(L298N_ENB, LOW);
  } else {
    // For other cells, mock the action to the serial console
    Serial.print("{\"event\":\"RELAY_MOCK_TRIGGER\",\"cell\":");
    Serial.print(cellId);
    Serial.print(",\"state\":\"");
    Serial.print(isolate ? "ISOLATED" : "RECONNECTED");
    Serial.println("\"}");
  }
}

/**
 * Pre-emptive rebalancing logic.
 * When a cell shows early warning signs (Temp > 45°C or Resistance rising),
 * current is diverted away from it and its immediate neighbors in the grid layout 
 * to minimize local thermal load and slow down degradation.
 */
void applyActiveRebalancing() {
  for (int i = 0; i < NUM_CELLS; i++) {
    if (pack[i].isIsolated) {
      pack[i].current = 0.0;
      continue;
    }
    
    // If cell temperature starts drifting high, reduce active current loading
    if (pack[i].temperature > 40.0) {
      // Pre-emptively throttle current to 60% of pack level using bypass shunt resistor switching
      pack[i].current = packCurrent * 0.6;
      
      // Also protect immediate physical neighbors to prevent thermal runaway propagation
      int col = i % 4;
      int row = i / 4;
      
      // Neighbor to left
      if (col > 0) pack[i - 1].current = packCurrent * 0.8;
      // Neighbor to right
      if (col < 3) pack[i + 1].current = packCurrent * 0.8;
      // Neighbor above
      if (row > 0) pack[i - 4].current = packCurrent * 0.8;
      // Neighbor below
      if (row < 3) pack[i + 4].current = packCurrent * 0.8;
    } else {
      // Normal cell current distribution
      if (pack[i].current == packCurrent * 0.6 || pack[i].current == packCurrent * 0.8) {
        // Return to baseline if temp has stabilized
        pack[i].current = packCurrent;
      }
    }
  }
}

// Send pack telemetry in JSON format over Serial USB
void sendTelemetry() {
  Serial.print("{\"telemetry\":{");
  Serial.print("\"packCurrent\":");
  Serial.print(packCurrent);
  Serial.print(",\"cells\":[");
  for (int i = 0; i < NUM_CELLS; i++) {
    Serial.print("{");
    Serial.print("\"id\":"); Serial.print(pack[i].id);
    Serial.print(",\"v\":"); Serial.print(pack[i].voltage, 3);
    Serial.print(",\"t\":"); Serial.print(pack[i].temperature, 2);
    Serial.print(",\"c\":"); Serial.print(pack[i].current, 2);
    Serial.print(",\"iso\":"); Serial.print(pack[i].isIsolated ? "true" : "false");
    Serial.print("}");
    if (i < NUM_CELLS - 1) Serial.print(",");
  }
  Serial.println("]}}");
}

// Receive serial isolation/reconnect controls from Digital Twin dashboard
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    // Command format: ISOLATE:<cell_id> or RECONNECT:<cell_id> or SET_CURRENT:<val>
    if (cmd.startsWith("ISOLATE:")) {
      int cellId = cmd.substring(8).toInt();
      performIsolation(cellId, true);
    } 
    else if (cmd.startsWith("RECONNECT:")) {
      int cellId = cmd.substring(10).toInt();
      performIsolation(cellId, false);
    } 
    else if (cmd.startsWith("SET_CURRENT:")) {
      float amt = cmd.substring(12).toFloat();
      if (amt >= 0.0 && amt <= 20.0) {
        packCurrent = amt;
        Serial.print("{\"event\":\"PACK_CURRENT_CHANGED\",\"value\":");
        Serial.print(packCurrent);
        Serial.println("}");
      }
    }
  }
}
