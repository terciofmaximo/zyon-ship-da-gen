import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFData {
  shipData: {
    vesselName: string;
    imoNumber?: string;
    dwt: string;
    loa: string;
    beam?: string;
    draft?: string;
    portName: string;
    berth?: string;
    daysAlongside?: string;
    cargo?: string;
    quantity?: string;
    date: string;
    exchangeRate: string;
    exchangeRateSource?: string;
    exchangeRateTimestamp?: string;
    to?: string;
    from?: string;
  };
  costData: {
    pilotageIn: number;
    towageIn: number;
    lightDues: number;
    dockage: number;
    linesman: number;
    launchBoat: number;
    immigration: number;
    freePratique: number;
    shippingAssociation: number;
    clearance: number;
    paperlessPort: number;
    agencyFee: number;
    waterway: number;
  };
  costComments: Record<string, string>;
  remarks?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: PDFData = await req.json();
    console.log('Generating PDF for vessel:', data.shipData.vesselName);

    // Calculate totals
    const totalUSD = Object.values(data.costData).reduce((sum, cost) => sum + (cost || 0), 0);
    const totalBRL = totalUSD * parseFloat(data.shipData.exchangeRate || "5.25");

    // Format numbers
    const formatUSD = (value: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

    const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

    // Format exchange rate source
    let exchangeRateDisplay = `1 USD = R$ ${data.shipData.exchangeRate}`;
    if (data.shipData.exchangeRateSource && data.shipData.exchangeRateSource !== 'MANUAL') {
      exchangeRateDisplay += ` • Fonte: ${data.shipData.exchangeRateSource}`;
      if (data.shipData.exchangeRateTimestamp) {
        exchangeRateDisplay += ` • Atualizado: ${data.shipData.exchangeRateTimestamp}`;
      }
    } else if (data.shipData.exchangeRateSource === 'MANUAL') {
      exchangeRateDisplay += ' • Fonte: Manual';
    }

    // Cost items for the table
    const costItems = [
      { label: "1. Pilot IN/OUT", value: data.costData.pilotageIn, key: 'pilotageIn' },
      { label: "2. Towage IN/OUT", value: data.costData.towageIn, key: 'towageIn' },
      { label: "3. Light dues", value: data.costData.lightDues, key: 'lightDues' },
      { label: "4. Dockage (Wharfage)", value: data.costData.dockage, key: 'dockage' },
      { label: "5. Linesman (mooring/unmooring)", value: data.costData.linesman, key: 'linesman' },
      { label: "6. Launch boat (mooring/unmooring)", value: data.costData.launchBoat, key: 'launchBoat' },
      { label: "7. Immigration tax (Funapol)", value: data.costData.immigration, key: 'immigration' },
      { label: "8. Free pratique tax", value: data.costData.freePratique, key: 'freePratique' },
      { label: "9. Shipping association", value: data.costData.shippingAssociation, key: 'shippingAssociation' },
      { label: "10. Clearance", value: data.costData.clearance, key: 'clearance' },
      { label: "11. Paperless Port System", value: data.costData.paperlessPort, key: 'paperlessPort' },
      { label: "12. Agency fee", value: data.costData.agencyFee, key: 'agencyFee' },
      { label: "13. Waterway channel (Table I)", value: data.costData.waterway, key: 'waterway' },
    ];

    // Process remarks markdown for HTML (simple conversion)
    const processMarkdown = (text: string) => {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/\|(.+)\|/g, (match) => {
          const cells = match.split('|').filter(cell => cell.trim());
          return `<table style="border-collapse: collapse; width: 100%; margin: 8px 0;"><tr>${cells.map(cell => 
            `<td style="border: 1px solid #E5E7EB; padding: 6px 8px; font-weight: 600;">${cell.trim()}</td>`
          ).join('')}</tr></table>`;
        });
    };

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PDA - ${data.shipData.vesselName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1f2937;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .logo {
            width: 220px;
        }
        
        .title-section {
            text-align: right;
            flex: 1;
            margin-left: 20px;
        }
        
        .title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 15px;
        }
        
        .metadata {
            font-size: 9px;
            color: #6b7280;
            text-align: right;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
        }
        
        .info-value {
            color: #1f2937;
        }
        
        .expenses-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .expenses-table th,
        .expenses-table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        
        .expenses-table th {
            background-color: #f9fafb;
            font-weight: 600;
            font-size: 10px;
        }
        
        .expenses-table td {
            font-size: 10px;
        }
        
        .expenses-table .number-cell {
            text-align: right;
        }
        
        .total-row {
            font-weight: 600;
            background-color: #f3f4f6;
        }
        
        .disclaimer {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 10px;
            font-style: italic;
        }
        
        .footer {
            position: fixed;
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
        
        .page-number {
            position: fixed;
            bottom: 8mm;
            right: 20mm;
            font-size: 9px;
            color: #6b7280;
        }
        
        .remarks-content {
            line-height: 1.5;
            margin-top: 10px;
        }
        
        .remarks-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
        }
        
        .remarks-content th,
        .remarks-content td {
            border: 1px solid #e5e7eb;
            padding: 6px 8px;
            vertical-align: top;
        }
        
        .remarks-content th {
            font-weight: 600;
        }
        
        .remarks-content p {
            margin: 6px 0;
        }
    </style>
</head>
<body>
    <div class="page">
        <header class="header">
            <div class="logo">
                <svg width="220" height="60" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="15" width="80" height="20" fill="#2563eb" rx="4"/>
                    <text x="50" y="28" text-anchor="middle" fill="white" font-family="Inter" font-weight="700" font-size="12">ZYON</text>
                    <text x="100" y="28" fill="#1f2937" font-family="Inter" font-weight="400" font-size="10">SHIPPING</text>
                </svg>
            </div>
            <div class="title-section">
                <h1 class="title">Port Disbursement Account</h1>
                <div class="subtitle">PDA</div>
                <div class="metadata">
                    Date: ${data.shipData.date}<br>
                    Prepared by Zyon Shipping
                </div>
            </div>
        </header>

        <div class="section">
            <h2 class="section-title">Schedule & Financial</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">From:</span>
                    <span class="info-value">${data.shipData.from || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">To:</span>
                    <span class="info-value">${data.shipData.to || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${data.shipData.date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Exchange Rate:</span>
                    <span class="info-value">${exchangeRateDisplay}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Vessel Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Ship's Name:</span>
                    <span class="info-value">${data.shipData.vesselName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">IMO:</span>
                    <span class="info-value">${data.shipData.imoNumber || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">DWT:</span>
                    <span class="info-value">${data.shipData.dwt}t</span>
                </div>
                <div class="info-item">
                    <span class="info-label">LOA:</span>
                    <span class="info-value">${data.shipData.loa}m</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Beam:</span>
                    <span class="info-value">${data.shipData.beam || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Draft:</span>
                    <span class="info-value">${data.shipData.draft || '—'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Port & Cargo Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Port's Name:</span>
                    <span class="info-value">${data.shipData.portName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Berth(s):</span>
                    <span class="info-value">${data.shipData.berth || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Days alongside:</span>
                    <span class="info-value">${data.shipData.daysAlongside || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Cargo:</span>
                    <span class="info-value">${data.shipData.cargo || '—'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Quantity:</span>
                    <span class="info-value">${data.shipData.quantity || '—'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Port Expenses</h2>
            <table class="expenses-table">
                <thead>
                    <tr>
                        <th style="width: 5%">Nº</th>
                        <th style="width: 35%">Port Expenses</th>
                        <th style="width: 15%">Est. Costs – USD</th>
                        <th style="width: 15%">Est. Costs – BRL</th>
                        <th style="width: 30%">Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${costItems.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.label.replace(/^\d+\.\s/, '')}</td>
                            <td class="number-cell">${formatUSD(item.value || 0)}</td>
                            <td class="number-cell">${formatBRL((item.value || 0) * parseFloat(data.shipData.exchangeRate || "5.25"))}</td>
                            <td>${data.costComments[item.key] || ''}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="2"><strong>TOTAL</strong></td>
                        <td class="number-cell"><strong>${formatUSD(totalUSD)}</strong></td>
                        <td class="number-cell"><strong>${formatBRL(totalBRL)}</strong></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${data.remarks ? `
        <div class="section">
            <h2 class="section-title">Remarks</h2>
            <div class="remarks-content">
                ${processMarkdown(data.remarks)}
            </div>
        </div>
        ` : ''}

        <div class="disclaimer">
            <strong>Disclaimer:</strong> This communication is confidential and intended for the designated recipient(s) only. Unauthorized use or disclosure is strictly prohibited.
        </div>
    </div>

    <div class="footer">
        Rua V09, Nº15, Quadra 11, Parque Shalon, São Luís - MA • Postal Code: 65073-110 • E-mail: ops.slz@zyonshipping.com.br
    </div>
    
    <div class="page-number">
        Page 1 of 1
    </div>
</body>
</html>`;

    // Convert HTML to PDF using Puppeteer
    const puppeteerResponse = await fetch('https://api.htmlcsstoimage.com/v1/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('HTMLCSS_API_KEY') || 'demo'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        format: 'pdf',
        width: 794,
        height: 1123,
        device_scale_factor: 2,
      }),
    });

    if (!puppeteerResponse.ok) {
      console.error('PDF generation failed:', await puppeteerResponse.text());
      // Fallback: return HTML content as PDF placeholder
      const encoder = new TextEncoder();
      const pdfData = encoder.encode(htmlContent);
      
      return new Response(pdfData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="PDA_${data.shipData.vesselName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.shipData.portName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.shipData.date.replace(/\//g, '-')}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const pdfBuffer = await puppeteerResponse.arrayBuffer();
    
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PDA_${data.shipData.vesselName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.shipData.portName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.shipData.date.replace(/\//g, '-')}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});