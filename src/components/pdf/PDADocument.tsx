import { ShipData, CostData } from "@/types";

interface PDADocumentProps {
  shipData: ShipData;
  costData: CostData;
  remarks?: string;
  comments?: Record<keyof CostData, string>;
}

export const generatePDAHTML = ({ shipData, costData, remarks, comments }: PDADocumentProps): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  const exchangeRate = parseFloat(shipData.exchangeRate);
  
  const costItems = [
    { id: "pilotageIn", description: "Pilotage (In)", usd: costData.pilotageIn },
    { id: "towageIn", description: "Towage (In)", usd: costData.towageIn },
    { id: "lightDues", description: "Light Dues", usd: costData.lightDues },
    { id: "dockage", description: "Dockage", usd: costData.dockage },
    { id: "linesman", description: "Linesman", usd: costData.linesman },
    { id: "launchBoat", description: "Launch Boat", usd: costData.launchBoat },
    { id: "immigration", description: "Immigration", usd: costData.immigration },
    { id: "freePratique", description: "Free Pratique", usd: costData.freePratique },
    { id: "shippingAssociation", description: "Shipping Association", usd: costData.shippingAssociation },
    { id: "clearance", description: "Clearance", usd: costData.clearance },
    { id: "paperlessPort", description: "Paperless Port", usd: costData.paperlessPort },
    { id: "agencyFee", description: "Agency Fee", usd: costData.agencyFee },
    { id: "waterway", description: "Waterway", usd: costData.waterway },
  ];

  const totalUSD = costItems.reduce((sum, item) => sum + item.usd, 0) + 
    (costData.customLines || []).reduce((sum, line) => sum + line.costUSD, 0);
  const totalBRL = totalUSD * exchangeRate;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Port Disbursement Account - ${shipData.vesselName}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    @media print {
      body { 
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      .no-print { display: none; }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      background: white;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
    }
    
    .logo {
      height: 80px;
      margin-bottom: 15px;
    }
    
    .title {
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 12px;
      color: #64748b;
    }
    
    .vessel-info {
      margin-bottom: 25px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    
    .vessel-info h3 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #1e40af;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .info-item {
      display: flex;
    }
    
    .info-label {
      font-weight: bold;
      width: 120px;
      color: #475569;
    }
    
    .info-value {
      color: #1e293b;
    }
    
    .costs-section {
      margin-bottom: 25px;
    }
    
    .costs-section h3 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #1e40af;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }
    
    .costs-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .costs-table th,
    .costs-table td {
      padding: 8px 12px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    
    .costs-table th {
      background: #f1f5f9;
      font-weight: bold;
      color: #1e40af;
      font-size: 10px;
      text-transform: uppercase;
    }
    
    .costs-table td {
      font-size: 11px;
    }
    
    .costs-table .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    
    .costs-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .total-row {
      background: #2563eb !important;
      color: white !important;
      font-weight: bold;
    }
    
    .total-row td {
      border-color: #1d4ed8 !important;
    }
    
    .exchange-rate {
      margin-bottom: 20px;
      padding: 10px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }
    
    .exchange-rate strong {
      color: #92400e;
    }
    
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .print-button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Save as PDF</button>
  
  <div class="header">
    <img src="/zyon-logo.png" class="logo" alt="Zyon Shipping" />
    <div class="title">PORT DISBURSEMENT ACCOUNT (PDA)</div>
    <div class="subtitle">Generated on ${currentDate}</div>
  </div>
  
  <div class="vessel-info">
    <h3>Vessel Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Vessel Name:</span>
        <span class="info-value">${shipData.vesselName}</span>
      </div>
      ${shipData.imoNumber ? `
      <div class="info-item">
        <span class="info-label">IMO Number:</span>
        <span class="info-value">${shipData.imoNumber}</span>
      </div>
      ` : ''}
      <div class="info-item">
        <span class="info-label">DWT:</span>
        <span class="info-value">${shipData.dwt}</span>
      </div>
      <div class="info-item">
        <span class="info-label">LOA:</span>
        <span class="info-value">${shipData.loa}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Port:</span>
        <span class="info-value">${shipData.port}</span>
      </div>
      ${shipData.terminal ? `
      <div class="info-item">
        <span class="info-label">Terminal:</span>
        <span class="info-value">${shipData.terminal}</span>
      </div>
      ` : ''}
      ${shipData.cargoType ? `
      <div class="info-item">
        <span class="info-label">Cargo Type:</span>
        <span class="info-value">${shipData.cargoType}</span>
      </div>
      ` : ''}
      <div class="info-item">
        <span class="info-label">Arrival Date:</span>
        <span class="info-value">${new Date(shipData.arrivalDate).toLocaleDateString()}</span>
      </div>
      ${shipData.departureDate ? `
      <div class="info-item">
        <span class="info-label">Departure Date:</span>
        <span class="info-value">${new Date(shipData.departureDate).toLocaleDateString()}</span>
      </div>
      ` : ''}
      ${shipData.agent ? `
      <div class="info-item">
        <span class="info-label">Agent:</span>
        <span class="info-value">${shipData.agent}</span>
      </div>
      ` : ''}
    </div>
  </div>
  
  <div class="exchange-rate">
    <strong>Exchange Rate:</strong> 1 USD = ${exchangeRate.toFixed(4)} BRL
    ${shipData.exchangeRateSource ? ` (Source: ${shipData.exchangeRateSource})` : ''}
  </div>
  
  <div class="costs-section">
    <h3>Port Disbursement Details</h3>
    <table class="costs-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount (USD)</th>
          <th>Amount (BRL)</th>
          <th>Comments</th>
        </tr>
      </thead>
      <tbody>
        ${costItems.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="amount">$${item.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="amount">R$${(item.usd * exchangeRate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="font-size: 10px;">${comments?.[item.id as keyof CostData] || ''}</td>
          </tr>
        `).join('')}
        ${(costData.customLines || []).map(line => `
          <tr style="background: #f8fafc;">
            <td>${line.label}</td>
            <td class="amount">$${line.costUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="amount">R$${(line.costUSD * exchangeRate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="font-size: 10px;">${line.comment || ''}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td class="amount"><strong>$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
          <td class="amount"><strong>R$${totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
  
  ${remarks ? `
  <div class="costs-section">
    <h3>Remarks</h3>
    <div style="white-space: pre-wrap; font-size: 11px; line-height: 1.4; margin-bottom: 20px;">
      ${remarks.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
      <div style="font-size: 10px; color: #dc3545; font-weight: bold; text-align: center;">
        CONFIDENTIAL COMMUNICATION
      </div>
      <div style="font-size: 10px; color: #6c757d; text-align: center; margin-top: 5px;">
        This communication is confidential and intended for the designated recipient(s) only. Unauthorized use or disclosure is strictly prohibited.
      </div>
    </div>
    <div style="font-size: 10px; color: #64748b; text-align: center;">
      This document was generated electronically by Zyon Shipping PDA System
    </div>
  </div>
</body>
</html>`;
};