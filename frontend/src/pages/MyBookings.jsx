import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import { useLocation } from 'react-router-dom';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [downloadingInvoice, setDownloadingInvoice] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
  // Check if we came from chatbot payment initiation
  const paymentData = location.state?.paymentData;
  if (paymentData?.bookingId) {
    const booking = bookings.find(b => b._id === paymentData.bookingId);
    if (booking) {
      handleProceedToPayment(booking);
    }
  }
}, [location, bookings]);

    useEffect(() => {
        fetchBookings();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    const fetchBookings = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/bookings', getAuthHeaders());
            setBookings(response.data);
            setLoading(false);
        } catch (error) {
            setError('Error fetching bookings');
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!cancellingBooking) return;

        try {
            await axios.delete(`http://localhost:5000/api/bookings/${cancellingBooking._id}`, getAuthHeaders());
            setSuccess('Booking cancelled successfully!');
            setShowCancelModal(false);
            setCancellingBooking(null);
            fetchBookings();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error cancelling booking';
            setError(errorMessage);
            setShowCancelModal(false);
        }
    };

    const handleProceedToPayment = (booking) => {
        navigate('/checkout', { state: { booking } });
    };

    const handleRetryPayment = async (booking) => {
        setProcessingPayment(booking._id);
        setError('');
        
        try {
            // Create payment intent
            const intentResponse = await axios.post(
                'http://localhost:5000/api/payments/create-intent',
                {
                    bookingId: booking._id,
                    amount: booking.totalAmount
                },
                getAuthHeaders()
            );

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Confirm payment
            const confirmResponse = await axios.post(
                'http://localhost:5000/api/payments/confirm',
                {
                    bookingId: booking._id,
                    paymentIntentId: intentResponse.data.paymentIntentId
                },
                getAuthHeaders()
            );

            setSuccess('Payment successful! Your booking has been confirmed.');
            fetchBookings();
            
        } catch (error) {
            setError(error.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setProcessingPayment(null);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            confirmed: 'info',
            active: 'success',
            completed: 'secondary',
            cancelled: 'danger'
        };
        return colors[status] || 'secondary';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: 'secondary',
            processing: 'warning',
            paid: 'success',
            failed: 'danger',
            refunded: 'info',
            cancelled: 'dark'
        };
        return colors[status] || 'secondary';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDownloadInvoice = async (bookingId) => {
        setDownloadingInvoice(bookingId);
        setError('');
        
        try {
            // Fetch actual invoice data from server
            const response = await axios.get(
                `http://localhost:5000/api/bookings/${bookingId}/invoice`,
                getAuthHeaders()
            );
            
            const invoiceData = response.data;
            
            // Generate and show the invoice
            generateInvoiceHTML(invoiceData);
            
        } catch (error) {
            console.error('Invoice generation error:', error);
            
            // Fallback: Use local data if API fails
            const booking = bookings.find(b => b._id === bookingId);
            if (booking) {
                let carImageUrl = booking.car?.image || '';
                if (carImageUrl && carImageUrl.startsWith('/uploads')) {
                    carImageUrl = `http://localhost:5000${carImageUrl}`;
                }

                const fallbackInvoiceData = {
                    invoiceNumber: `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
                    invoiceDate: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : new Date().toLocaleDateString(),
                    bookingId: booking._id,
                    customer: {
                        name: booking.user?.name || 'Customer',
                        email: booking.user?.email || 'N/A',
                        phone: booking.user?.phone || 'N/A'
                    },
                    car: {
                        brand: booking.car?.brand || 'N/A',
                        model: booking.car?.model || 'N/A',
                        name: booking.car?.name || 'N/A',
                        year: booking.car?.year || 'N/A',
                        image: carImageUrl
                    },
                    rentalDetails: {
                        startDate: formatDate(booking.startDate),
                        endDate: formatDate(booking.endDate),
                        totalDays: booking.totalDays,
                        pricePerDay: booking.car?.price || 0,
                        totalAmount: booking.totalAmount
                    },
                    company: {
                        name: "CarRental",
                        address: "Surat, Gujarat",
                        phone: "+91 98751 96322",
                        email: "info@carrental.com"
                    }
                };
                
                generateInvoiceHTML(fallbackInvoiceData);
            } else {
                setError('Error generating invoice: Booking not found');
            }
        } finally {
            setDownloadingInvoice(null);
        }
    };

    const generateInvoiceHTML = (invoiceData) => {
        const printWindow = window.open('', '_blank');
        
        const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${invoiceData.invoiceNumber}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px; 
                    color: #333; 
                    line-height: 1.6;
                }
                .header { 
                    border-bottom: 2px solid #007bff; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px; 
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .company-info { 
                    text-align: right; 
                }
                .invoice-details { 
                    margin: 30px 0; 
                }
                .section { 
                    margin: 20px 0; 
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 12px; 
                    text-align: left; 
                }
                th { 
                    background-color: #f8f9fa; 
                }
                .total { 
                    font-weight: bold; 
                    font-size: 1.2em; 
                }
                .footer { 
                    margin-top: -40px; 
                    padding-top: 20px;
                    text-align: center; 
                    color: #666; 
                }
                .car-image-container {
                    text-align: center;
                   margin-top: -200px;
                }
                .car-image {
                    max-width: 500px;
                    max-height: 500px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                }
                .car-details {
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                    margin-top: -10px;
                }
                .car-info {
                    flex: 1;
                }
                    .desc{
                    margin-top: -30px;
                    }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>CAR RENTAL INVOICE</h1>
                    <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
                    <p><strong>Invoice Date:</strong> ${invoiceData.invoiceDate}</p>
                    <p><strong>Booking ID:</strong> ${invoiceData.bookingId}</p>
                </div>
                <div class="company-info">
                    <h3>${invoiceData.company.name}</h3>
                    <p>${invoiceData.company.address}</p>
                    <p>${invoiceData.company.phone}</p>
                    <p>${invoiceData.company.email}</p>
                </div>
            </div>

            <div class="section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${invoiceData.customer.name}</p>
                <p><strong>Email:</strong> ${invoiceData.customer.email}</p>
                <p><strong>Phone:</strong> ${invoiceData.customer.phone}</p>
            </div>

            <div class="section">
                <h3>Vehicle Information</h3>
                <div class="car-details">
                    <div class="car-info">
                        <p><strong>Brand:</strong> ${invoiceData.car.brand}</p>
                        <p><strong>Model:</strong> ${invoiceData.car.model}</p>
                        <p><strong>Car Name:</strong> ${invoiceData.car.name}</p>
                        <p><strong>Year:</strong> ${invoiceData.car.year}</p>
                    </div>
                    ${invoiceData.car.image && invoiceData.car.image !== 'N/A' ? `
                    <div class="car-image-container">
                        <img src="${invoiceData.car.image}" alt="${invoiceData.car.brand} ${invoiceData.car.model}" class="car-image" />
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="section desc">
                <h3>Rental Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Details</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Car Rental (${invoiceData.rentalDetails.totalDays} days)</td>
                            <td>${invoiceData.rentalDetails.startDate} to ${invoiceData.rentalDetails.endDate}</td>
                            <td>$${invoiceData.rentalDetails.pricePerDay}/day</td>
                        </tr>
                        <tr class="total">
                            <td colspan="2" style="text-align: right;">Total Amount:</td>
                            <td>$${invoiceData.rentalDetails.totalAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>Thank you for choosing ${invoiceData.company.name}! For any queries, contact ${invoiceData.company.phone}</p>
                <p><em>This is a computer-generated invoice. No signature required.</em></p>
            </div>

            <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Print Invoice
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    Close
                </button>
            </div>
        </body>
        </html>
        `;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    };

    const getPaymentActionButton = (booking) => {
        if (booking.paymentStatus === 'paid') {
            return null;
        }

        if (booking.paymentStatus === 'pending') {
            return (
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleProceedToPayment(booking)}
                >
                    <i className="fas fa-credit-card me-1"></i>
                    Pay Now
                </Button>
            );
        }

        if (booking.paymentStatus === 'failed') {
            return (
                <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleRetryPayment(booking)}
                    disabled={processingPayment === booking._id}
                >
                    {processingPayment === booking._id ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-redo me-1"></i>
                            Retry Payment
                        </>
                    )}
                </Button>
            );
        }

        if (booking.paymentStatus === 'processing') {
            return (
                <Button
                    variant="info"
                    size="sm"
                    disabled
                >
                    <Spinner animation="border" size="sm" className="me-2" />
                    Processing...
                </Button>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <Container className="py-5" style={{ marginTop: '50px' }}>
                <div className="text-center">
                    <Spinner animation="border" role="status" className="text-primary">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-3 text-muted">Loading your bookings...</p>
                </div>
            </Container>
        );
    }

    return (
        <>
            <Container className="py-5" style={{ marginTop: '50px' }}>
                <h2 className="mb-4">My Bookings</h2>

                {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                {bookings.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="mb-4">
                            <i className="fas fa-calendar-times fa-4x text-muted"></i>
                        </div>
                        <h4>No bookings found</h4>
                        <p className="text-muted">You haven't made any car reservations yet.</p>
                        <Button variant="primary" href="/cars" className="mt-3">
                            <i className="fas fa-car me-2"></i>
                            Browse Available Cars
                        </Button>
                    </div>
                ) : (
                    <Row>
                        {bookings.map((booking) => (
                            <Col lg={6} key={booking._id} className="mb-4">
                                <Card className="h-100 shadow-sm booking-card">
                                    <Card.Body className="d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <h5 className="mb-0">{booking.car?.brand} {booking.car?.model}</h5>
                                            <div className="d-flex flex-column align-items-end">
                                                <Badge bg={getStatusColor(booking.status)} className="mb-1">
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                </Badge>
                                                <Badge bg={getPaymentStatusColor(booking.paymentStatus)}>
                                                    Payment: {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <img
                                                    src={booking?.car?.image && booking.car.image.startsWith('/uploads')
                                                        ? `http://localhost:5000${booking.car.image}`
                                                        : booking.car?.image}
                                                    alt={booking.car?.name}
                                                    className="img-fluid rounded"
                                                    style={{ height: '80px', objectFit: 'cover', width: '100%' }}
                                                    onError={(e) => {
                                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FyIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                                                    }}
                                                />
                                            </Col>
                                            <Col md={8}>
                                                <p className="text-muted mb-1">{booking?.car?.name}</p>
                                                <p className="mb-1" style={{ color: 'black' }}>
                                                    <strong>Booking ID:</strong> #{booking._id.slice(-8)}
                                                </p>
                                                <p className="mb-0" style={{ color: 'black' }}>
                                                    <strong>Total:</strong> ${booking.totalAmount}
                                                </p>
                                                {booking.paidAt && (
                                                    <p className="mb-0 text-muted small">
                                                        <strong>Paid on:</strong> {formatDateTime(booking.paidAt)}
                                                    </p>
                                                )}
                                            </Col>
                                        </Row>

                                        <hr />

                                        <Row className="mb-2">
                                            <Col xs={5}><strong>Pickup:</strong></Col>
                                            <Col xs={7}>{formatDate(booking.startDate)}</Col>
                                        </Row>
                                        <Row className="mb-2">
                                            <Col xs={5}><strong>Return:</strong></Col>
                                            <Col xs={7}>{formatDate(booking.endDate)}</Col>
                                        </Row>
                                        <Row className="mb-2">
                                            <Col xs={5}><strong>Duration:</strong></Col>
                                            <Col xs={7}>{booking.totalDays} days</Col>
                                        </Row>
                                        <Row className="mb-2">
                                            <Col xs={5}><strong>Pickup Location:</strong></Col>
                                            <Col xs={7}>{booking.pickupLocation}</Col>
                                        </Row>
                                        <Row className="mb-2">
                                            <Col xs={5}><strong>Drop-off Location:</strong></Col>
                                            <Col xs={7}>{booking.dropoffLocation}</Col>
                                        </Row>
                                        <Row className="mb-2">
                                            <Col xs={5}><strong>Contact:</strong></Col>
                                            <Col xs={7}>{booking.contactNumber}</Col>
                                        </Row>

                                        {booking.specialRequests && (
                                            <Row className="mb-2">
                                                <Col xs={5}><strong>Special Requests:</strong></Col>
                                                <Col xs={7}>{booking.specialRequests}</Col>
                                            </Row>
                                        )}

                                        <hr />

                                        <div className="d-flex justify-content-between align-items-center mt-auto">
                                            <small className="text-muted">
                                                Booked on {formatDateTime(booking.createdAt)}
                                            </small>

                                            <div className="d-flex gap-2 flex-wrap">
                                                {/* Payment Action Button */}
                                                {getPaymentActionButton(booking)}

                                                {/* Download Invoice Button */}
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleDownloadInvoice(booking._id)}
                                                    disabled={downloadingInvoice === booking._id}
                                                >
                                                    {downloadingInvoice === booking._id ? (
                                                        <>
                                                            <Spinner animation="border" size="sm" className="me-2" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-download me-1"></i>
                                                            Invoice
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Cancel Button - Only show for pending/confirmed bookings that aren't paid */}
                                                {['pending', 'confirmed'].includes(booking.status) && 
                                                 booking.paymentStatus !== 'paid' && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => {
                                                            setCancellingBooking(booking);
                                                            setShowCancelModal(true);
                                                        }}
                                                    >
                                                        <i className="fas fa-times me-1"></i>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Cancel Confirmation Modal */}
                <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Cancel Booking</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {cancellingBooking && (
                            <div>
                                <p>Are you sure you want to cancel this booking?</p>
                                <div className="bg-light p-3 rounded">
                                    <strong>{cancellingBooking.car?.brand} {cancellingBooking.car?.model}</strong><br />
                                    <small>
                                        {formatDate(cancellingBooking.startDate)} - {formatDate(cancellingBooking.endDate)}
                                        <br />
                                        Total: ${cancellingBooking.totalAmount}
                                    </small>
                                </div>
                                <p className="mt-3 text-muted">
                                    <small>
                                        Note: {cancellingBooking.paymentStatus === 'paid' 
                                            ? 'If you have already paid, a refund will be processed according to our cancellation policy.' 
                                            : 'This booking will be cancelled immediately.'}
                                    </small>
                                </p>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                            Keep Booking
                        </Button>
                        <Button variant="danger" onClick={handleCancelBooking}>
                            Cancel Booking
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
            <Footer />

            <style jsx="true">{`
                .booking-card {
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                
                .booking-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
                }

                @media (max-width: 768px) {
                    .booking-card .btn {
                        font-size: 0.8rem;
                        padding: 0.25rem 0.5rem;
                    }
                }
            `}</style>
        </>
    );
};

export default MyBookings;