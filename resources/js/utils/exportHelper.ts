/**
 * Helper Ekspor Laporan & Spreadsheet Profesional (Excel .xls, PDF, & CSV)
 * Biro Sarana & Prasarana - Universitas Nurul Huda
 * 
 * Menghasilkan file spreadsheet rapi dengan border, header berbobot, 
 * penggabungan sel (merged cells), multi-sheet (tab per ruangan), 
 * dan tampilan cetak PDF dengan kop surat resmi.
 */

export interface ExportColumn {
    title: string;
    subheaders?: string[]; // Jika ada sub-header (misal: "Kondisi" memiliki sub: ["Baik", "Sedang", "Rusak"])
    width?: number; // Lebar kolom dalam pixel / points
    align?: 'left' | 'center' | 'right';
    isCurrency?: boolean;
    isNumber?: boolean;
}

export interface ExportSheet {
    name: string; // Nama Tab Sheet (Maks 31 karakter, misal: "Gudang Kampus B", "Kampus A")
    title?: string; // Judul Besar di atas tabel (misal: "GUDANG KAMPUS B")
    subtitle?: string; // Sub-judul
    meta?: Array<{ label: string; value: string | number }>;
    columns: ExportColumn[];
    rows: Array<Array<string | number | null | undefined>>;
    summaryRow?: Array<string | number | null | undefined>; // Baris Total Akhir (opsional)
}

function escapeXml(unsafe: any): string {
    if (unsafe === null || unsafe === undefined) return '';
    const str = String(unsafe);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeSheetName(name: string): string {
    const cleaned = name.replace(/[\\/*?:\[\]]/g, ' ').trim();
    return cleaned.slice(0, 31) || 'Sheet';
}

function escapeCsv(val: any): string {
    const str = String(val ?? '');
    if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Ekspor Data sebagai File Excel Resmi (.xls) berbasis SpreadsheetML XML
 * Menghasilkan format identik dengan template resmi (Border hitam kotak, Header putih/hitam rapi, 
 * Tab sheet per ruangan di bagian bawah).
 */
export function exportToExcel(filename: string, sheets: ExportSheet[]): void {
    const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Biro Sarana dan Prasarana UNUHA</Author>
  <Company>Universitas Nurul Huda</Company>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  
  <!-- Style Judul Ruangan di Row 2 (Persis Gambar: GUDANG KAMPUS B, Bold, Hitam) -->
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#000000"/>
   <Alignment ss:Vertical="Center" ss:Horizontal="Left"/>
  </Style>

  <!-- Style Sub Judul / Meta -->
  <Style ss:ID="SubtitleStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
   <Alignment ss:Vertical="Center"/>
  </Style>

  <!-- Style Header Tabel Utama (Border Hitam Penuh, Teks Hitam Tebal, Latar Putih Bersih) -->
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>

  <!-- Style Sub-Header Tabel (Baik, Sedang, Rusak) -->
  <Style ss:ID="SubHeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>

  <!-- Style Data Cells dengan Garis Border Kotak Standar Excel -->
  <Style ss:ID="CellLeft">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>

  <Style ss:ID="CellCenter">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>

  <Style ss:ID="CellRight">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>

  <Style ss:ID="CellCurrency">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
   <NumberFormat ss:Format="#,##0"/>
  </Style>

  <!-- Style Baris Total / Summary -->
  <Style ss:ID="TotalCell">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>

  <Style ss:ID="TotalCellRight">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#000000"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
 </Styles>
`;

    let worksheetsXml = '';
    const usedNames = new Set<string>();

    sheets.forEach((sheet, sheetIdx) => {
        let sName = sanitizeSheetName(sheet.name || `Ruangan_${sheetIdx + 1}`);
        if (usedNames.has(sName)) {
            sName = `${sName.slice(0, 27)} (${sheetIdx + 1})`;
        }
        usedNames.add(sName);

        const hasSubheaders = sheet.columns.some((c) => c.subheaders && c.subheaders.length > 0);

        let tableXml = '  <Table>\n';

        // Definisikan lebar kolom
        sheet.columns.forEach((col) => {
            if (col.subheaders && col.subheaders.length > 0) {
                col.subheaders.forEach(() => {
                    const w = col.width ? Math.round(col.width / col.subheaders!.length) : 55;
                    tableXml += `   <Column ss:Width="${w}"/>\n`;
                });
            } else {
                const w = col.width || 100;
                tableXml += `   <Column ss:Width="${w}"/>\n`;
            }
        });

        // Row 1: Kosong (Persis seperti template di Excel pada gambar)
        tableXml += '   <Row ss:Height="14"/>\n';

        // Row 2: Judul Ruangan (misal: GUDANG KAMPUS B di Cell A2)
        if (sheet.title) {
            tableXml += `   <Row ss:Height="20">\n`;
            tableXml += `    <Cell ss:Index="1" ss:StyleID="TitleStyle"><Data ss:Type="String">${escapeXml(sheet.title)}</Data></Cell>\n`;
            tableXml += `   </Row>\n`;
        }

        // Row 3 & 4: Baris Header Tabel
        if (hasSubheaders) {
            // Baris Header 1
            tableXml += `   <Row ss:Height="22">\n`;
            sheet.columns.forEach((col) => {
                if (col.subheaders && col.subheaders.length > 0) {
                    tableXml += `    <Cell ss:MergeAcross="${col.subheaders.length - 1}" ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col.title)}</Data></Cell>\n`;
                } else {
                    tableXml += `    <Cell ss:MergeDown="1" ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col.title)}</Data></Cell>\n`;
                }
            });
            tableXml += `   </Row>\n`;

            // Baris Header 2 (Sub-headers: Baik, Sedang, Rusak)
            tableXml += `   <Row ss:Height="20">\n`;
            let colIndex = 1;
            sheet.columns.forEach((col) => {
                if (col.subheaders && col.subheaders.length > 0) {
                    col.subheaders.forEach((sub, sIdx) => {
                        const idxAttr = sIdx === 0 ? ` ss:Index="${colIndex}"` : '';
                        tableXml += `    <Cell${idxAttr} ss:StyleID="SubHeaderStyle"><Data ss:Type="String">${escapeXml(sub)}</Data></Cell>\n`;
                        colIndex++;
                    });
                } else {
                    colIndex++;
                }
            });
            tableXml += `   </Row>\n`;
        } else {
            tableXml += `   <Row ss:Height="22">\n`;
            sheet.columns.forEach((col) => {
                tableXml += `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(col.title)}</Data></Cell>\n`;
            });
            tableXml += `   </Row>\n`;
        }

        // Baris Data (Row 5 s/d selesai)
        sheet.rows.forEach((row) => {
            tableXml += `   <Row ss:Height="20">\n`;
            row.forEach((val, cIdx) => {
                const colDef = sheet.columns[cIdx];
                let style = 'CellLeft';
                if (colDef?.align === 'center') style = 'CellCenter';
                else if (colDef?.isCurrency) style = 'CellCurrency';
                else if (colDef?.align === 'right' || colDef?.isNumber) style = 'CellRight';

                const isNum = typeof val === 'number';
                const dataType = isNum ? 'Number' : 'String';
                // Jika nilai null/undefined atau angka 0 pada kolom kondisi kosong, kosongkan selnya agar identik dengan foto
                const displayVal = val === null || val === undefined ? '' : String(val);

                tableXml += `    <Cell ss:StyleID="${style}"><Data ss:Type="${dataType}">${escapeXml(displayVal)}</Data></Cell>\n`;
            });
            tableXml += `   </Row>\n`;
        });

        // Baris Summary / Total jika ada
        if (sheet.summaryRow && sheet.summaryRow.length > 0) {
            tableXml += `   <Row ss:Height="22">\n`;
            sheet.summaryRow.forEach((val, cIdx) => {
                const colDef = sheet.columns[cIdx];
                let style = 'TotalCell';
                if (colDef?.isCurrency || colDef?.align === 'right') style = 'TotalCellRight';

                const isNum = typeof val === 'number';
                const dataType = isNum ? 'Number' : 'String';
                const displayVal = val === null || val === undefined ? '' : String(val);

                tableXml += `    <Cell ss:StyleID="${style}"><Data ss:Type="${dataType}">${escapeXml(displayVal)}</Data></Cell>\n`;
            });
            tableXml += `   </Row>\n`;
        }

        tableXml += '  </Table>\n';

        worksheetsXml += ` <Worksheet ss:Name="${escapeXml(sName)}">\n${tableXml} </Worksheet>\n`;
    });

    const fullXml = `${xmlHeader}${worksheetsXml}</Workbook>`;
    const blob = new Blob([fullXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Ekspor Data sebagai File PDF Resmi Bergaris Tabel Lengkap & Berkualitas Tinggi
 * Membuka jendela pratinjau cetak / Simpan sebagai PDF dengan layout landscape A4 presisi.
 */
export function exportToPdf(filename: string, sheets: ExportSheet[]): void {
    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date());

    const sheetsHtml = sheets
        .map((sheet, sheetIdx) => {
            const hasSubheaders = sheet.columns.some((c) => c.subheaders && c.subheaders.length > 0);

            let theadHtml = '';
            if (hasSubheaders) {
                let row1 = '';
                let row2 = '';
                sheet.columns.forEach((c) => {
                    if (c.subheaders && c.subheaders.length > 0) {
                        row1 += `<th colspan="${c.subheaders.length}" style="text-align:center;">${escapeXml(c.title)}</th>`;
                        c.subheaders.forEach((sub) => {
                            row2 += `<th style="text-align:center;font-size:10px;">${escapeXml(sub)}</th>`;
                        });
                    } else {
                        row1 += `<th rowspan="2" style="text-align:center;">${escapeXml(c.title)}</th>`;
                    }
                });
                theadHtml = `<thead><tr>${row1}</tr><tr>${row2}</tr></thead>`;
            } else {
                const row1 = sheet.columns
                    .map((c) => `<th style="text-align:center;">${escapeXml(c.title)}</th>`)
                    .join('');
                theadHtml = `<thead><tr>${row1}</tr></thead>`;
            }

            const tbodyRows = sheet.rows
                .map((row) => {
                    const cells = row
                        .map((val, cIdx) => {
                            const colDef = sheet.columns[cIdx];
                            const align = colDef?.align || (colDef?.isCurrency ? 'right' : 'left');
                            const displayVal = val === null || val === undefined ? '' : String(val);
                            return `<td style="text-align:${align};">${escapeXml(displayVal)}</td>`;
                        })
                        .join('');
                    return `<tr>${cells}</tr>`;
                })
                .join('');

            let summaryHtml = '';
            if (sheet.summaryRow && sheet.summaryRow.length > 0) {
                const summaryCells = sheet.summaryRow
                    .map((val, cIdx) => {
                        const colDef = sheet.columns[cIdx];
                        const align = colDef?.align || (colDef?.isCurrency ? 'right' : 'center');
                        const displayVal = val === null || val === undefined ? '' : String(val);
                        return `<td style="text-align:${align};font-weight:bold;background:#f1f5f9;">${escapeXml(displayVal)}</td>`;
                    })
                    .join('');
                summaryHtml = `<tfoot><tr>${summaryCells}</tr></tfoot>`;
            }

            return `
            <div class="sheet-container" style="${sheetIdx > 0 ? 'page-break-before: always; margin-top: 24px;' : ''}">
                <div class="room-title">${escapeXml(sheet.title || sheet.name.toUpperCase())}</div>
                <table>
                    ${theadHtml}
                    <tbody>
                        ${tbodyRows}
                    </tbody>
                    ${summaryHtml}
                </table>
            </div>
            `;
        })
        .join('');

    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) {
        alert('Mohon izinkan pop-up pada browser Anda untuk mengunduh / mencetak laporan PDF.');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8" />
            <title>${escapeXml(filename)}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 12mm 15mm;
                }
                * { box-sizing: border-box; }
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000000;
                    margin: 0;
                    padding: 16px 20px;
                    font-size: 11px;
                }
                .kop {
                    border-bottom: 2px solid #000000;
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .kop-title {
                    text-align: center;
                    flex: 1;
                }
                .kop-title h1 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .kop-title h2 {
                    margin: 2px 0;
                    font-size: 12px;
                    font-weight: bold;
                }
                .kop-title p {
                    margin: 0;
                    font-size: 9.5px;
                    color: #334155;
                }
                .room-title {
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin: 10px 0 6px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 16px;
                }
                th, td {
                    border: 1px solid #000000;
                    padding: 4px 6px;
                    font-size: 10px;
                }
                th {
                    background-color: #ffffff;
                    font-weight: bold;
                }
                .signature-section {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                    page-break-inside: avoid;
                }
                .sig-box {
                    text-align: center;
                    width: 230px;
                    font-size: 11px;
                }
            </style>
        </head>
        <body>
            <div class="kop">
                <div class="kop-title">
                    <h1>UNIVERSITAS NURUL HUDA</h1>
                    <h2>BIRO SARANA DAN PRASARANA (SARPRAS)</h2>
                    <p>Jl. Kotabaru No. 1 Sukaraja, Ogan Komering Ulu Timur, Sumatera Selatan | Email: sarpras@unuha.ac.id</p>
                </div>
            </div>

            ${sheetsHtml}

            <div class="signature-section">
                <div class="sig-box">
                    <p>Sukaraja, ${todayFormatted}</p>
                    <p style="font-weight: bold; margin-top: 4px;">Kepala Biro Sarana &amp; Prasarana</p>
                    <div style="height: 55px;"></div>
                    <p style="font-weight: bold; text-decoration: underline;">( .................................................. )</p>
                    <p style="font-size: 9.5px; color: #475569;">NIP. ..........................................</p>
                </div>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 300);
}

/**
 * Ekspor Data sebagai File CSV Rapi dengan UTF-8 BOM dan Header Separator (sep=;)
 * Mencegah error kolom bertumpuk di Excel versi Windows/Indonesia.
 */
export function exportToCsv(filename: string, sheets: ExportSheet[]): void {
    const lines: string[] = [];

    // Header direktif Excel agar langsung membedah kolom dengan titik koma (;)
    lines.push('sep=;');

    sheets.forEach((sheet) => {
        if (sheets.length > 1) {
            lines.push(`"=== LEMBAR: ${sheet.name.toUpperCase()} ==="`);
        }
        if (sheet.title) {
            lines.push(`"${sheet.title.replace(/"/g, '""')}"`);
        }
        if (sheet.subtitle) {
            lines.push(`"${sheet.subtitle.replace(/"/g, '""')}"`);
        }
        if (sheet.meta && sheet.meta.length > 0) {
            sheet.meta.forEach((m) => {
                lines.push(`"${m.label}:";"${String(m.value).replace(/"/g, '""')}"`);
            });
        }
        lines.push('');

        // Headers
        const hasSubheaders = sheet.columns.some((c) => c.subheaders && c.subheaders.length > 0);
        if (hasSubheaders) {
            const h1: string[] = [];
            const h2: string[] = [];
            sheet.columns.forEach((c) => {
                if (c.subheaders && c.subheaders.length > 0) {
                    c.subheaders.forEach((sub, sIdx) => {
                        h1.push(sIdx === 0 ? c.title : '');
                        h2.push(sub);
                    });
                } else {
                    h1.push(c.title);
                    h2.push('');
                }
            });
            lines.push(h1.map(escapeCsv).join(';'));
            lines.push(h2.map(escapeCsv).join(';'));
        } else {
            lines.push(sheet.columns.map((c) => escapeCsv(c.title)).join(';'));
        }

        // Data Rows
        sheet.rows.forEach((row) => {
            lines.push(row.map(escapeCsv).join(';'));
        });

        // Summary Row
        if (sheet.summaryRow && sheet.summaryRow.length > 0) {
            lines.push(sheet.summaryRow.map(escapeCsv).join(';'));
        }

        lines.push('');
        lines.push('');
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Ekspor Data sebagai Dokumen Microsoft Word (.doc) dengan Kop Surat Resmi & Tabel Rapi
 * Format kompatibel dibuka di Microsoft Word dan WPS Office (A4 Landscape, margin proporsional).
 */
export function exportToWord(filename: string, sheets: ExportSheet[]): void {
    const todayFormatted = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const sheetsHtml = sheets
        .map((sheet, sheetIdx) => {
            const hasSubheaders = sheet.columns.some((c) => c.subheaders && c.subheaders.length > 0);
            let theadHtml = '';

            if (hasSubheaders) {
                let row1 = '';
                let row2 = '';
                sheet.columns.forEach((c) => {
                    if (c.subheaders && c.subheaders.length > 0) {
                        row1 += `<th colspan="${c.subheaders.length}" style="text-align:center;font-weight:bold;background-color:#f1f5f9;border:1pt solid #000000;padding:5pt 4pt;font-size:9pt;">${escapeXml(c.title)}</th>`;
                        c.subheaders.forEach((sub) => {
                            row2 += `<th style="text-align:center;font-size:8.5pt;font-weight:bold;background-color:#f8fafc;border:1pt solid #000000;padding:4pt 3pt;">${escapeXml(sub)}</th>`;
                        });
                    } else {
                        row1 += `<th rowspan="2" style="text-align:center;font-weight:bold;background-color:#f1f5f9;border:1pt solid #000000;padding:5pt 4pt;font-size:9pt;">${escapeXml(c.title)}</th>`;
                    }
                });
                theadHtml = `<thead><tr>${row1}</tr><tr>${row2}</tr></thead>`;
            } else {
                const row1 = sheet.columns
                    .map((c) => `<th style="text-align:center;font-weight:bold;background-color:#f1f5f9;border:1pt solid #000000;padding:5pt 4pt;font-size:9pt;">${escapeXml(c.title)}</th>`)
                    .join('');
                theadHtml = `<thead><tr>${row1}</tr></thead>`;
            }

            const tbodyRows = sheet.rows
                .map((row) => {
                    const cells = row
                        .map((val, cIdx) => {
                            const colDef = sheet.columns[cIdx];
                            const align = colDef?.align || (colDef?.isCurrency ? 'right' : 'left');
                            const displayVal = val === null || val === undefined ? '' : String(val);
                            return `<td style="text-align:${align};border:1pt solid #000000;padding:4pt 5pt;font-size:8.5pt;">${escapeXml(displayVal)}</td>`;
                        })
                        .join('');
                    return `<tr>${cells}</tr>`;
                })
                .join('');

            let summaryHtml = '';
            if (sheet.summaryRow && sheet.summaryRow.length > 0) {
                const summaryCells = sheet.summaryRow
                    .map((val, cIdx) => {
                        const colDef = sheet.columns[cIdx];
                        const align = colDef?.align || (colDef?.isCurrency ? 'right' : 'center');
                        const displayVal = val === null || val === undefined ? '' : String(val);
                        return `<td style="text-align:${align};font-weight:bold;background-color:#f1f5f9;border:1pt solid #000000;padding:4pt 5pt;font-size:8.5pt;">${escapeXml(displayVal)}</td>`;
                    })
                    .join('');
                summaryHtml = `<tfoot><tr>${summaryCells}</tr></tfoot>`;
            }

            return `
            <div style="${sheetIdx > 0 ? 'page-break-before:always;margin-top:20pt;' : ''}">
                <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;margin:10pt 0 4pt 0;color:#000000;">
                    ${escapeXml(sheet.title || sheet.name.toUpperCase())}
                </div>
                ${sheet.subtitle ? `<div style="font-size:9pt;color:#475569;margin-bottom:6pt;font-style:italic;">${escapeXml(sheet.subtitle)}</div>` : ''}
                <table style="width:100%;border-collapse:collapse;margin-bottom:12pt;font-family:Calibri,Arial,sans-serif;">
                    ${theadHtml}
                    <tbody>
                        ${tbodyRows}
                    </tbody>
                    ${summaryHtml}
                </table>
            </div>
            `;
        })
        .join('');

    const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset='utf-8'>
        <title>${escapeXml(filename)}</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
            @page Section1 {
                size: 841.95pt 595.35pt;
                mso-page-orientation: landscape;
                margin: 36.0pt 36.0pt 36.0pt 36.0pt;
            }
            div.Section1 {
                page: Section1;
            }
            body {
                font-family: Calibri, 'Segoe UI', Arial, sans-serif;
                font-size: 9.5pt;
                color: #000000;
                margin: 0;
                padding: 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12pt;
            }
            th, td {
                border: 1pt solid #000000;
                padding: 4pt 5pt;
                font-size: 8.5pt;
            }
            th {
                background-color: #f1f5f9;
                font-weight: bold;
            }
            .kop {
                border-bottom: 2pt solid #000000;
                padding-bottom: 6pt;
                margin-bottom: 10pt;
                text-align: center;
            }
            .kop h1 {
                margin: 0;
                font-size: 13pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5pt;
            }
            .kop h2 {
                margin: 2pt 0;
                font-size: 10.5pt;
                font-weight: bold;
            }
            .kop p {
                margin: 0;
                font-size: 8.5pt;
                color: #334155;
            }
            .signature-table {
                width: 100%;
                border: none;
                margin-top: 20pt;
            }
            .signature-table td {
                border: none;
                padding: 0;
            }
        </style>
    </head>
    <body>
        <div class="Section1">
            <div class="kop">
                <h1>UNIVERSITAS NURUL HUDA</h1>
                <h2>BIRO SARANA DAN PRASARANA (SARPRAS)</h2>
                <p>Jl. Kotabaru No. 1 Sukaraja, Ogan Komering Ulu Timur, Sumatera Selatan | Email: sarpras@unuha.ac.id</p>
            </div>

            ${sheetsHtml}

            <table class="signature-table">
                <tr>
                    <td style="width:65%;"></td>
                    <td style="width:35%;text-align:center;">
                        <p style="margin:0;font-size:9.5pt;">Sukaraja, ${todayFormatted}</p>
                        <p style="margin:3pt 0 0 0;font-weight:bold;font-size:9.5pt;">Kepala Biro Sarana &amp; Prasarana</p>
                        <div style="height:50pt;"></div>
                        <p style="margin:0;font-weight:bold;text-decoration:underline;font-size:9.5pt;">( .................................................. )</p>
                        <p style="margin:2pt 0 0 0;font-size:8.5pt;color:#475569;">NIP. ..........................................</p>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob(['\uFEFF' + wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.doc') ? filename : `${filename}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
