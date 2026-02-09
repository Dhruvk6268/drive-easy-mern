import jsPDF from 'jspdf';

export const generatePDFInvoice = (invoiceData) => {
    const doc = new jsPDF();
    
    // Set initial coordinates
    let yPosition = 20;
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 128); // Blue color
    doc.text('CAR RENTAL INVOICE', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Reset font
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black color
    
    // Invoice details
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 20, yPosition);
    doc.text(`Date: ${invoiceData.invoiceDate}`, 150, yPosition);
    yPosition += 10;
    
    doc.text(`Booking ID: ${invoiceData.bookingId}`, 20, yPosition);
    yPosition += 15;
    
    // Company Information
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('CarRental Company', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 7;
    
    doc.text(`${invoiceData.company.address}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${invoiceData.company.phone} | Email: ${invoiceData.company.email}`, 20, yPosition);
    yPosition += 15;
    
    // Customer Information
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Details:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 7;
    
    doc.text(`Name: ${invoiceData.customer.name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Email: ${invoiceData.customer.email}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${invoiceData.customer.phone}`, 20, yPosition);
    yPosition += 15;
    
    // Car Information
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Vehicle Details:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 7;
    
    doc.text(`Car: ${invoiceData.car.brand} ${invoiceData.car.model}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Type: ${invoiceData.car.name}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Year: ${invoiceData.car.year}`, 20, yPosition);
    yPosition += 15;
    
    // Rental Details
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Rental Period:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 7;
    
    doc.text(`From: ${invoiceData.rentalDetails.startDate}`, 20, yPosition);
    yPosition += 5;
    doc.text(`To: ${invoiceData.rentalDetails.endDate}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Total Days: ${invoiceData.rentalDetails.totalDays}`, 20, yPosition);
    yPosition += 15;
    
    // Pricing Table
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Details:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 10;
    
    // Table headers
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, 170, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Description', 25, yPosition + 6);
    doc.text('Amount', 160, yPosition + 6, { align: 'right' });
    yPosition += 12;
    
    // Table content
    doc.setFont(undefined, 'normal');
    doc.text(`Car Rental (${invoiceData.rentalDetails.totalDays} days)`, 25, yPosition + 6);
    doc.text(`$${invoiceData.rentalDetails.totalAmount}`, 160, yPosition + 6, { align: 'right' });
    yPosition += 10;
    
    // Total
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', 25, yPosition + 10);
    doc.text(`$${invoiceData.rentalDetails.totalAmount}`, 160, yPosition + 10, { align: 'right' });
    
    // Footer
    yPosition += 25;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing CarRental!', 105, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text('For any queries, please contact our customer support.', 105, yPosition, { align: 'center' });
    
    // Save the PDF
    doc.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
};