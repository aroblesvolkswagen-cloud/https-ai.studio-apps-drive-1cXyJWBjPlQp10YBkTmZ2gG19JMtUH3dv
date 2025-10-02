import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

export const downloadFile = (filename: string, content: string, mimeType: string) => {
    const bom = '\uFEFF'; // Byte Order Mark for UTF-8
    const element = document.createElement('a');
    const file = new Blob([bom + content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

export const exportDataToCSV = <T extends Record<string, any>>(
    data: T[],
    columns: Record<keyof T | string, string>,
    selectedColumns: (keyof T | string)[],
    fileName: string
) => {
    // Filter headers based on selected columns and maintain order
    const header = selectedColumns.map(key => `"${columns[key]}"`).join(',');

    // Map data to selected columns
    const rows = data.map(row => {
        return selectedColumns.map(key => {
            // Handle nested properties if needed, but for now assuming direct access
            const value = row[key as keyof T];
            const stringValue = value !== null && value !== undefined ? String(value) : '';
            // Escape double quotes by doubling them and wrap in double quotes
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',');
    }).join('\n');

    const csvContent = `${header}\n${rows}`;
    downloadFile(fileName, csvContent, 'text/csv;charset=utf-8;');
};

const showLoadingOverlay = (message: string) => {
    const overlay = document.getElementById('pdf-loading-overlay');
    const messageEl = document.getElementById('pdf-loading-message');
    if (overlay && messageEl) {
        messageEl.textContent = message;
        overlay.style.display = 'flex';
    }
};

const hideLoadingOverlay = () => {
    const overlay = document.getElementById('pdf-loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
};

// --- Professional Data-Driven PDF Generation ---

interface PdfSection {
    type: 'kpis' | 'table' | 'chart' | 'custom';
    title: string;
    data: any;
    elementSelector?: string;
    head?: any[][];
    body?: any[][];
}

const addHeader = (doc: jsPDF, title: string, recipient: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.setTextColor(22, 53, 94); // venki-deep-blue-ish
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Reporte para: ${recipient}`, 15, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - 15, 30, { align: 'right' });
    doc.setDrawColor(22, 53, 94);
    doc.line(15, 35, pageWidth - 15, 35);
};

const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
        doc.text('Venki Quality Hub - Reporte Confidencial', 15, pageHeight - 10);
    }
};

export const generatePdfReport = async (
    reportTitle: string,
    recipient: string,
    sections: PdfSection[]
) => {
    showLoadingOverlay('Iniciando generación de PDF...');
    const doc = new jsPDF('p', 'mm', 'a4');
    let yPos = 45; // Initial y position after header

    addHeader(doc, reportTitle, recipient);

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        showLoadingOverlay(`Procesando sección ${i + 1} de ${sections.length}: ${section.title}...`);

        const pageHeight = doc.internal.pageSize.getHeight();
        if (yPos > pageHeight - 40) { // Check if new section needs a new page
             doc.addPage();
             addHeader(doc, reportTitle, recipient);
             yPos = 45;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text(section.title, 15, yPos);
        yPos += 8;

        switch (section.type) {
            case 'kpis':
                section.data.forEach((kpi: { title: string; value: string }, index: number) => {
                    if (index % 2 === 0) { // Start a new line for every 2 KPIs
                        yPos += 1;
                    }
                    const xPos = 15 + (index % 2) * 95;
                    doc.setDrawColor(220, 220, 220);
                    doc.roundedRect(xPos, yPos - 5, 85, 20, 3, 3, 'S');
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(kpi.title, xPos + 5, yPos);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0);
                    doc.text(kpi.value, xPos + 5, yPos + 8);
                     doc.setFont('helvetica', 'normal');

                    if (index % 2 !== 0) { // Move yPos down after the second KPI in a row
                        yPos += 22;
                    }
                });
                if (section.data.length % 2 !== 0) { // Adjust yPos if there's an odd number of KPIs
                     yPos += 22;
                }
                break;
            case 'table':
                autoTable(doc, {
                    head: section.head,
                    body: section.body,
                    startY: yPos,
                    theme: 'grid',
                    headStyles: { fillColor: [22, 53, 94] },
                    styles: { fontSize: 8 },
                });
                yPos = (doc as any).autoTable.previous.finalY + 10;
                break;

            case 'chart':
                const chartElement = document.querySelector(section.elementSelector || '') as HTMLElement;
                if (chartElement) {
                    const canvas = await html2canvas(chartElement, {
                        scale: 3, // Higher scale for better quality
                        backgroundColor: '#ffffff', // Force white background
                        onclone: (doc) => {
                            // Ensure text is black for the capture
                            doc.querySelectorAll('.recharts-wrapper text, .recharts-cartesian-axis-tick-value, .recharts-label').forEach((textElement: any) => {
                                textElement.style.fill = '#000000';
                            });
                        }
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 180;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    if (yPos + imgHeight > pageHeight - 20) {
                        doc.addPage();
                        addHeader(doc, reportTitle, recipient);
                        yPos = 45;
                         doc.setFontSize(14);
                         doc.setTextColor(40, 40, 40);
                         doc.text(section.title, 15, yPos);
                         yPos += 8;
                    }
                    doc.addImage(imgData, 'PNG', 15, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 10;
                }
                break;
             case 'custom':
                // For special layouts like the ink order details
                yPos = section.data(doc, yPos); // The function should return the new yPos
                break;
        }
        yPos += 5; // Spacing between sections
    }

    addFooter(doc);

    showLoadingOverlay('Guardando PDF...');
    await new Promise(resolve => setTimeout(resolve, 500));
    doc.save(`${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    hideLoadingOverlay();
};