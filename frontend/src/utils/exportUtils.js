import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file (.xlsx)
 */
export const exportToExcel = (data, fileName = 'export.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, fileName);
};

/**
 * Generates a structured PDF report from raw data (No screenshots!)
 * @param {Object} options - { title, subtitle, columns, data, fileName }
 */
export const generateDataPDF = ({ title, subtitle, data, columns, fileName = 'report.pdf' }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle || 'Swastik Tracker Generated Report', 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    doc.setLineWidth(0.5);
    doc.setDrawColor(249, 166, 66); // Accent color
    doc.line(14, 42, pageWidth - 14, 42);

    // 2. Table
    doc.autoTable({
        startY: 50,
        head: [columns],
        body: data.map(item => columns.map(col => item[col] || '')),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 }
    });

    doc.save(fileName);
};

/**
 * Generates a dashboard summary report with metrics and recent items
 */
export const generateDashboardPDF = (metrics, businessName = 'Business') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text(businessName, 14, 25);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Performance & Operational Summary', 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 32);

    // Metrics Section (Styled Boxes)
    const stats = [
        { l: 'Total Affiliates', v: metrics.totals.totalAffiliates },
        { l: 'Contacted', v: metrics.totals.contacted },
        { l: 'Samples Given', v: metrics.totals.samplesGiven },
        { l: 'Follow Ups', v: metrics.totals.followUpVisit }
    ];

    doc.autoTable({
        startY: 45,
        head: [['Affiliate Metrics Dashboard']],
        body: [[
            `Total: ${stats[0].v}`,
            `Contacted: ${stats[1].v}`,
            `Samples: ${stats[2].v}`,
            `Follow Ups: ${stats[3].v}`
        ]],
        theme: 'plain',
        styles: { fontSize: 13, fontStyle: 'bold', halign: 'center', cellPadding: 8 },
        headStyles: { fillColor: [249, 166, 66], textColor: [0, 0, 0] }
    });

    // Recent Activity Table
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Recent System Activity', 14, doc.autoTable.previous.finalY + 15);

    const activityRows = metrics.recentActivities.map(a => [
        new Date(a.createdAt).toLocaleString(),
        a.message,
        a.type
    ]);

    doc.autoTable({
        startY: doc.autoTable.previous.finalY + 20,
        head: [['Timestamp', 'Description', 'Event Type']],
        body: activityRows.slice(0, 15),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [51, 65, 85] }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 285, { align: 'center' });
    }

    doc.save(`${businessName}_Summary_Report.pdf`);
};

/**
 * Fallback: Exports a DOM element to PDF (Screenshot mode)
 */
export const exportElementToPDF = async (element, fileName = 'screenshot_report.pdf', options = {}) => {
    if (!element) return;

    const canvas = await html2canvas(element, {
        scale: options.scale || 2,
        useCORS: true,
        backgroundColor: options.backgroundColor || '#0f172a',
        logging: false,
        onclone: (clonedDoc) => {
            // Force expand all scrollable containers
            const scrollables = clonedDoc.querySelectorAll('*');
            scrollables.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    el.style.overflow = 'visible';
                    el.style.height = 'auto';
                }
            });
        },
        ...options
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
};

/**
 * Reads an Excel file and returns JSON data
 */
export const readExcelAsJSON = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};
