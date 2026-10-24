import React, { useState } from 'react';
import { 
  Barcode, Search, CheckCircle2, ShieldCheck, 
  MapPin, Calendar, User, 
  Printer, X, QrCode, 
  Award, ArrowLeft
} from 'lucide-react';
import type { BuyerInvoiceRecord } from '../types/bms';

interface BuyerLookupModalProps {
  onClose: () => void;
  onSelectCoordinates?: (coords: { lat: number; lng: number }, buyerName: string) => void;
  isFullDashboardView?: boolean;
}

// Mock database of buyer invoices linked to battery packs
const SAMPLE_BUYERS: BuyerInvoiceRecord[] = [
  {
    invoiceId: "INV-2024-8849",
    barcode: "BC-LFP-32700-4X4-89F3A4",
    packId: "BMS-LFP-32700-4X4-89F3A4",
    buyerName: "Henrik Lindqvist",
    companyName: "Hamburg Green Logistics SE",
    taxId: "DE-814902188",
    contactEmail: "h.lindqvist@hamburggreen.eu",
    purchaseDate: "2024-11-12",
    dealer: "Aether Energy Systems Munich GmbH",
    deliveryAddress: "Logistics Hub B-4, Am Sandtorkai 64, 20457 Hamburg, Germany",
    destinationCoords: { lat: 53.5432, lng: 9.9921 },
    totalAmount: 4850.00,
    currency: "EUR",
    warrantyExpiry: "2029-11-12",
    warrantyStatus: "VALID",
    applicationType: "Commercial Fleet EV",
    items: [
      { description: "CellSalus 16S LiFePO4 Smart Battery Pack (51.2V 50Ah)", qty: 1, unitPrice: 4200.00 },
      { description: "Dynamic Relay Isolation Controller (L298N Bistable Edition)", qty: 1, unitPrice: 350.00 },
      { description: "EU Digital Battery Passport Cryptographic Certificate", qty: 1, unitPrice: 300.00 }
    ],
    verifiedStamp: true,
    digitalHash: "0x89e2bc9fa360c7f2162589be4041d8e1fae39d107293b6e82c5a0b9e8210ff4a"
  },
  {
    invoiceId: "INV-2025-0412",
    barcode: "BC-ESS-48V-NORDIC-77",
    packId: "BMS-LFP-32700-ESS-N44",
    buyerName: "Astrid Nygård",
    companyName: "Nordic CleanPower AS",
    taxId: "NO-983104921MVA",
    contactEmail: "procurement@nordiccleanpower.no",
    purchaseDate: "2025-03-18",
    dealer: "Oslo Renewable Energy Grid Tech",
    deliveryAddress: "Substation 12, Fjordveien 88, 0287 Oslo, Norway",
    destinationCoords: { lat: 59.9139, lng: 10.7522 },
    totalAmount: 3200.00,
    currency: "EUR",
    warrantyExpiry: "2028-03-18",
    warrantyStatus: "VALID",
    applicationType: "Second-Life Grid Storage",
    items: [
      { description: "Second-Life BESS Modular Pack (Grade A Recertified)", qty: 1, unitPrice: 2800.00 },
      { description: "Autonomous Shunt Bypass Retrofit Board", qty: 1, unitPrice: 400.00 }
    ],
    verifiedStamp: true,
    digitalHash: "0x44bf9102c771ae29b63a99281ff01092a831e67b9310ca735e1289fe9923bb19"
  },
  {
    invoiceId: "INV-2026-9031",
    barcode: "BC-SOLAR-BERLIN-9031",
    packId: "BMS-LFP-32700-SOLAR-B9",
    buyerName: "Lukas Weber",
    companyName: "Berlin Urban Solar Cooperative",
    taxId: "DE-309118234",
    contactEmail: "energy@berlinsolarcoop.org",
    purchaseDate: "2026-02-04",
    dealer: "Berlin Clean Tech Distribution KG",
    deliveryAddress: "Solar Array Hub, Sonnenallee 142, 12059 Berlin, Germany",
    destinationCoords: { lat: 52.4827, lng: 13.4389 },
    totalAmount: 3750.00,
    currency: "EUR",
    warrantyExpiry: "2031-02-04",
    warrantyStatus: "VALID",
    applicationType: "Stationary Solar BESS",
    items: [
      { description: "Stationary Energy Storage Pack (51.2V 60Ah)", qty: 1, unitPrice: 3400.00 },
      { description: "NTC Multi-Sensor Bus Harness", qty: 1, unitPrice: 350.00 }
    ],
    verifiedStamp: true,
    digitalHash: "0xfa1298c9031bfe6620598adbc1072481023910abef67319020491029481239aa"
  }
];

export const BuyerLookupModal: React.FC<BuyerLookupModalProps> = ({ 
  onClose, 
  onSelectCoordinates,
  isFullDashboardView = false 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("INV-2024-8849");
  const [activeRecord, setActiveRecord] = useState<BuyerInvoiceRecord>(SAMPLE_BUYERS[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) return;

    const found = SAMPLE_BUYERS.find(b => 
      b.invoiceId.toUpperCase().includes(q) ||
      b.barcode.toUpperCase().includes(q) ||
      b.packId.toUpperCase().includes(q) ||
      b.companyName.toUpperCase().includes(q) ||
      b.buyerName.toUpperCase().includes(q)
    );

    if (found) {
      setActiveRecord(found);
      setSearchFeedback(`Record verified for ${found.companyName}`);
    } else {
      setSearchFeedback("No matching buyer or bill found. Try sample presets below.");
    }
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setSearchFeedback("Optical sensor active: Aligning barcode / QR matrix...");
    
    setTimeout(() => {
      setIsScanning(false);
      setActiveRecord(SAMPLE_BUYERS[0]);
      setSearchQuery(SAMPLE_BUYERS[0].barcode);
      setSearchFeedback("Barcode Scanned: [BC-LFP-32700-4X4-89F3A4] - Authenticity verified via EU Passport.");
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  const contentJSX = (
    <div 
      style={{ 
        width: '100%',
        maxWidth: isFullDashboardView ? '100%' : '900px', 
        maxHeight: isFullDashboardView ? 'none' : '92vh', 
        overflowY: 'auto',
        padding: '28px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: isFullDashboardView ? '0 4px 20px rgba(15, 23, 42, 0.05)' : '0 25px 60px rgba(15, 23, 42, 0.15)',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
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
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <Barcode className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Battery Purchaser & Bill Registry
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>EU Verifiable</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Instant buyer provenance, invoice lookup, warranty authentication & delivery mapping.
            </p>
          </div>
        </div>
        {!isFullDashboardView && (
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search & Scanner Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '260px' }}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Enter Barcode, Bill / Invoice #, or Pack Serial..." 
            style={{
              width: '100%',
              padding: '11px 14px 11px 38px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#0f172a',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => handleSearch(searchQuery)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px' }}
        >
          <Search size={14} /> Find Bill
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={handleSimulateScan}
          disabled={isScanning}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: isScanning ? '#eff6ff' : undefined }}
        >
          <QrCode size={14} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning Lens...' : 'Scan Barcode'}
        </button>
      </div>

      {/* Scanner Visualizer Overlay */}
      {isScanning && (
        <div style={{ background: '#f8fafc', border: '1px dashed #3b82f6', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '220px', height: '60px', border: '2px solid rgba(37, 99, 235, 0.6)', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
            <div style={{ width: '100%', height: '2px', background: '#ef4444', boxShadow: '0 0 10px #ef4444', position: 'absolute' }} />
            <Barcode size={36} className="text-blue-500" />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: '8px', fontWeight: 600 }}>
            AI Barcode Sensor active: Aligning 1D/2D data matrix...
          </span>
        </div>
      )}

      {/* Quick Sample Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Quick Presets:</span>
        {SAMPLE_BUYERS.map((b) => (
          <button
            key={b.invoiceId}
            onClick={() => {
              setSearchQuery(b.invoiceId);
              setActiveRecord(b);
              setSearchFeedback(`Loaded record for ${b.companyName}`);
            }}
            style={{
              fontSize: '0.75rem',
              background: activeRecord.invoiceId === b.invoiceId ? '#eff6ff' : '#f8fafc',
              border: activeRecord.invoiceId === b.invoiceId ? '1px solid #3b82f6' : '1px solid #cbd5e1',
              color: activeRecord.invoiceId === b.invoiceId ? '#1d4ed8' : '#475569',
              fontWeight: activeRecord.invoiceId === b.invoiceId ? 600 : 500,
              padding: '5px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {b.invoiceId} ({b.companyName.split(' ')[0]})
          </button>
        ))}
      </div>

      {searchFeedback && (
        <div style={{ 
          padding: '10px 14px', 
          borderRadius: '8px', 
          background: searchFeedback.includes('No matching') ? '#fef2f2' : '#f0fdf4', 
          border: searchFeedback.includes('No matching') ? '1px solid #fecaca' : '1px solid #bbf7d0', 
          marginBottom: '16px', 
          fontSize: '0.82rem', 
          color: searchFeedback.includes('No matching') ? '#b91c1c' : '#166534',
          fontWeight: 500
        }}>
          {searchFeedback}
        </div>
      )}

      {/* Verified Bill Card - Clean White Style */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '22px', marginBottom: '20px' }}>
        {/* Top Bar of Record */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>{activeRecord.companyName}</span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Tax / VAT Reg: <strong style={{ color: '#334155' }}>{activeRecord.taxId}</strong> | Application: <strong style={{ color: '#334155' }}>{activeRecord.applicationType}</strong>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Verified Invoice Number</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2563eb' }}>{activeRecord.invoiceId}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <User size={13} className="text-blue-500" /> Primary Purchaser / Officer
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{activeRecord.buyerName}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{activeRecord.contactEmail}</div>
          </div>

          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <Calendar size={13} className="text-purple-500" /> Purchase & Flashing Date
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{activeRecord.purchaseDate}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Dealer: {activeRecord.dealer}</div>
          </div>

          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <Barcode size={13} className="text-amber-500" /> Linked Hardware Barcode
            </span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706', marginTop: '4px', fontFamily: 'monospace' }}>{activeRecord.barcode}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Pack ID: {activeRecord.packId}</div>
          </div>

          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <Award size={13} className="text-emerald-500" /> Warranty Status
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
              {activeRecord.warrantyStatus} (Through {activeRecord.warrantyExpiry})
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Coverage: 5 Years / 3,000 Cycles</div>
          </div>
        </div>

        {/* Delivery & Map Destination */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '10px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={13} /> Registered Delivery / Operating Address
            </span>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
              {activeRecord.deliveryAddress}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
              GPS Coordinates: {activeRecord.destinationCoords.lat.toFixed(4)}° N, {activeRecord.destinationCoords.lng.toFixed(4)}° E
            </span>
          </div>

          {onSelectCoordinates && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                onSelectCoordinates(activeRecord.destinationCoords, activeRecord.companyName);
                onClose();
              }}
              style={{ fontSize: '0.78rem', padding: '7px 16px' }}
            >
              <MapPin size={13} /> Track On Live Map
            </button>
          )}
        </div>

        {/* Itemized Bill Table */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Itemized Invoice Statement
          </span>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Line Item Description</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Unit Price</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {activeRecord.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#1e293b' }}>{item.description}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{item.qty}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>€{item.unitPrice.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>€{(item.qty * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
              <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={3} style={{ padding: '12px', textAlign: 'right', color: '#0f172a' }}>Total Paid Amount:</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontSize: '1.05rem' }}>
                  €{activeRecord.totalAmount.toFixed(2)} {activeRecord.currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cryptographic EU Passport Verification Hash */}
        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', fontSize: '0.74rem', color: '#64748b', wordBreak: 'break-all', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#334155', fontWeight: 600, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} className="text-emerald-500" /> Digital EU Blockchain Certificate Hash:
          </div>
          <code style={{ color: '#0284c7', fontFamily: 'monospace' }}>{activeRecord.digitalHash}</code>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Verified compliant with EU Battery Directive 2023/1542 (Annex XIII).
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
            <Printer size={14} /> Print Bill Receipt
          </button>
          <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.82rem', padding: '8px 20px' }}>
            {isFullDashboardView ? 'Back to Dashboard' : 'Close'}
          </button>
        </div>
      </div>
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
