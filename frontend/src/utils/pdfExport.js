import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportDashboardToPDF = async (dashboardRef, businessName) => {
    const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f121a', // Match theme
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Swastik_Review_${businessName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
