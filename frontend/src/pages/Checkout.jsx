import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import axios from 'axios';
import Footer from '../components/Footer';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!booking) {
      navigate('/my-bookings');
    }
  }, [booking, navigate]);

  const validateCardNumber = (number) => {
  const cleaned = number.replace(/\s/g, '');
  
  // Check if it's all numbers
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, message: 'Card number must contain only digits' };
  }
  
  // Check length
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { isValid: false, message: 'Card number must be 13-19 digits' };
  }
 
  return {
    isValid: true,
    message: ''
  };
};

  const validateExpiryDate = (expiry) => {
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) return false;
    
    const [month, year] = expiry.split('/').map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    
    return true;
  };

  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateCardholderName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };

  const validateForm = () => {
  const errors = {};
  
  console.log('Validating form with payment method:', paymentMethod);
  
  if (paymentMethod === 'card') {
    if (!cardDetails.number.trim()) {
      errors.cardNumber = 'Card number is required';
      console.log('Card number missing');
    } else {
      const validation = validateCardNumber(cardDetails.number);
      if (!validation.isValid) {
        errors.cardNumber = validation.message;
        console.log('Card number invalid:', validation.message);
      }
    }

    // Add similar console logs for other validations...
    if (!cardDetails.expiry.trim()) {
      errors.expiry = 'Expiry date is required';
      console.log('Expiry date missing');
    } else if (!validateExpiryDate(cardDetails.expiry)) {
      errors.expiry = 'Please enter a valid expiry date (MM/YY)';
      console.log('Expiry date invalid');
    }

    if (!cardDetails.cvv.trim()) {
      errors.cvv = 'CVV is required';
      console.log('CVV missing');
    } else if (!validateCVV(cardDetails.cvv)) {
      errors.cvv = 'Please enter a valid CVV (3-4 digits)';
      console.log('CVV invalid');
    }

    if (!cardDetails.name.trim()) {
      errors.cardholderName = 'Cardholder name is required';
      console.log('Cardholder name missing');
    } else if (!validateCardholderName(cardDetails.name)) {
      errors.cardholderName = 'Please enter a valid cardholder name';
      console.log('Cardholder name invalid');
    }
  }

  

  console.log('Validation errors found:', Object.keys(errors).length, errors);
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};

  const handleCardInput = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces (only numbers allowed)
    if (name === 'number') {
      // Remove all non-digit characters
      formattedValue = value.replace(/\D/g, '');
      
      // Add spaces every 4 digits
      formattedValue = formattedValue.replace(/(\d{4})(?=\d)/g, '$1 ');
      
      // Limit to 16 digits (19 characters with spaces)
      if (formattedValue.length > 19) formattedValue = formattedValue.substring(0, 19);
      
      // Clear error when user starts typing
      if (formErrors.cardNumber) {
        setFormErrors(prev => ({ ...prev, cardNumber: '' }));
      }
    }
    // Format expiry date (only numbers allowed)
    else if (name === 'expiry') {
      // Remove all non-digit characters
      formattedValue = value.replace(/\D/g, '');
      
      // Add slash after 2 digits
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
      }
      
      // Limit to 4 digits (5 characters with slash)
      if (formattedValue.length > 5) formattedValue = formattedValue.substring(0, 5);
      
      if (formErrors.expiry) {
        setFormErrors(prev => ({ ...prev, expiry: '' }));
      }
    }
    // Format CVV (only numbers allowed)
    else if (name === 'cvv') {
      // Remove all non-digit characters and limit to 4 digits
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
      
      if (formErrors.cvv) {
        setFormErrors(prev => ({ ...prev, cvv: '' }));
      }
    }
    // Cardholder name (allow letters and spaces only)
    else if (name === 'name') {
      // Allow only letters and spaces
      formattedValue = value.replace(/[^a-zA-Z\s]/g, '');
      
      if (formErrors.cardholderName) {
        setFormErrors(prev => ({ ...prev, cardholderName: '' }));
      }
    }

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  // Prevent non-numeric input for card number field
  const handleCardNumberKeyPress = (e) => {
    if (e.target.name === 'number') {
      // Allow only numbers and control keys
      if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
        e.preventDefault();
      }
    }
  };

  // Prevent paste with non-numeric characters for card fields
  const handleCardFieldPaste = (e) => {
    if (e.target.name === 'number' || e.target.name === 'expiry' || e.target.name === 'cvv') {
      const pasteData = e.clipboardData.getData('text');
      if (!/^\d+$/.test(pasteData)) {
        e.preventDefault();
      }
    }
  };

  const handlePayment = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  // Validate form before proceeding
  if (!validateForm()) {
    setError('Please fix the validation errors before proceeding.');
    return;
  }

  setProcessing(true);

  try {
    // Validate booking exists and is still valid
    if (!booking || !booking._id) {
      throw new Error('Invalid booking data');
    }

    console.log('Checking booking with ID:', booking._id);

    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }

    console.log('Token found:', token ? 'Yes' : 'No');

    // FIX: Use the correct endpoint with proper authentication
    const bookingResponse = await axios.get(
      `http://localhost:5000/api/bookings`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('All bookings response:', bookingResponse.data);

    // Find the specific booking from the list
    const allBookings = bookingResponse.data;
    const currentBooking = allBookings.find(b => b._id === booking._id);

    if (!currentBooking) {
      throw new Error('Booking not found in your account');
    }

    if (currentBooking.status === 'cancelled') {
      throw new Error('This booking has been cancelled');
    }

    if (currentBooking.status === 'completed') {
      throw new Error('This booking has already been completed');
    }

    if (currentBooking.paymentStatus === 'paid') {
      throw new Error('This booking has already been paid');
    }

    console.log('Booking check passed, creating payment intent...');

    // Create payment intent
    const intentResponse = await axios.post(
      'http://localhost:5000/api/payments/create-intent',
      {
        bookingId: booking._id,
        amount: booking.totalAmount
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 30000
      }
    );

    if (!intentResponse.data.clientSecret) {
      throw new Error('Failed to initialize payment');
    }

    console.log('Payment intent created, confirming payment...');

    // Confirm payment
    const confirmResponse = await axios.post(
      'http://localhost:5000/api/payments/confirm',
      {
        bookingId: booking._id,
        paymentIntentId: intentResponse.data.paymentIntentId
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 30000
      }
    );

    if (confirmResponse.data.success) {
      setSuccess('Payment successful! Your booking has been confirmed. Redirecting...');
      
      // Redirect to bookings page after success
      setTimeout(() => {
        navigate('/my-bookings', { 
          state: { 
            paymentSuccess: true,
            bookingId: booking._id 
          } 
        });
      }, 2000);
    } else {
      throw new Error('Payment confirmation failed');
    }

  } catch (error) {
    console.error('Payment error:', error);
    
    if (error.code === 'ECONNABORTED') {
      setError('Payment request timed out. Please try again.');
    } else if (error.response?.status === 401) {
      setError('Session expired. Please login again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else if (error.response?.status === 404) {
      setError('Booking not found. It may have been cancelled or deleted.');
    } else if (error.response?.status === 500) {
      setError('Server error. Please try again later.');
    } else {
      setError(error.response?.data?.message || error.message || 'Payment failed. Please try again.');
    }
  } finally {
    setProcessing(false);
  }
};

  const handleCancel = async () => {
    setCancelling(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/payments/cancel',
        { bookingId: booking._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 15000
        }
      );

      if (response.data.success) {
        setShowCancelModal(false);
        setSuccess('Booking cancelled successfully. Redirecting...');
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      setError(error.response?.data?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate days until pickup
  const getDaysUntilPickup = () => {
    const pickupDate = new Date(booking.startDate);
    const today = new Date();
    const diffTime = pickupDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!booking) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: '50px', minHeight: '60vh' }}>
        <Alert variant="warning" className="mb-4">
          <h4>No Booking Found</h4>
          <p>Redirecting to your bookings...</p>
        </Alert>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const daysUntilPickup = getDaysUntilPickup();

  return (
    <>
      <Container className="py-5" style={{ marginTop: '50px', minHeight: '80vh' }}>
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Checkout</h2>
              <div className="text-muted">
                Booking ID: <strong>{booking._id?.slice(-8) || 'N/A'}</strong>
              </div>
            </div>
            
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert variant="success">
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
              </Alert>
            )}

            {daysUntilPickup <= 1 && (
              <Alert variant="info" className="mb-4">
                <i className="bi bi-clock me-2"></i>
                <strong>Urgent:</strong> Your pickup is in {daysUntilPickup} day(s). Complete payment to confirm your booking.
              </Alert>
            )}

            <Row>
              {/* Order Summary */}
              <Col lg={6} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-receipt me-2"></i>
                      Booking Summary
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex align-items-start mb-4">
                      <img 
                        src={booking.car?.image} 
                        alt={booking.car?.name}
                        style={{ 
                          width: '100px', 
                          height: '75px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        className="me-3"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x75?text=Car+Image';
                        }}
                      />
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{booking.car?.brand} {booking.car?.model}</h6>
                        <p className="text-muted small mb-1">{booking.car?.name} • {booking.car?.year}</p>
                        <div className="small text-muted">
                          <i className="bi bi-people me-1"></i>
                          {booking.car?.seats} seats • 
                          <i className="bi bi-gear me-1 ms-2"></i>
                          {booking.car?.transmission} • 
                          <i className="bi bi-fuel-pump me-1 ms-2"></i>
                          {booking.car?.fuelType}
                        </div>
                      </div>
                    </div>
                    
                    <hr />
                    
                    <div className="mb-3">
                      <h6 className="text-primary">
                        <i className="bi bi-calendar-range me-2"></i>
                        Rental Period
                      </h6>
                      <div className="ps-4">
                        <div className="d-flex justify-content-between">
                          <span>Pickup:</span>
                          <strong>{new Date(booking.startDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Return:</span>
                          <strong>{new Date(booking.endDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</strong>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="text-primary">
                        <i className="bi bi-geo-alt me-2"></i>
                        Locations
                      </h6>
                      <div className="ps-4">
                        <div className="mb-2">
                          <small className="text-muted">Pickup</small>
                          <div>{booking.pickupLocation}</div>
                        </div>
                        <div>
                          <small className="text-muted">Drop-off</small>
                          <div>{booking.dropoffLocation}</div>
                        </div>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="mb-3">
                        <h6 className="text-primary">
                          <i className="bi bi-chat-text me-2"></i>
                          Special Requests
                        </h6>
                        <div className="ps-4">
                          <em>"{booking.specialRequests}"</em>
                        </div>
                      </div>
                    )}

                    <hr />
                    
                    <div className="booking-breakdown">
                      <h6 className="text-primary mb-3">
                        <i className="bi bi-calculator me-2"></i>
                        Price Breakdown
                      </h6>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Daily Rate ({booking.totalDays} days):</span>
                        <span>{formatCurrency(booking.car?.price)}/day</span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(booking.car?.price * booking.totalDays)}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Taxes & Fees:</span>
                        <span>{formatCurrency(0)}</span>
                      </div>
                      
                      <hr />
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="h5 mb-0">Total Amount:</strong>
                        <span className="h4 text-primary fw-bold">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Payment Form */}
              <Col lg={6}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-success text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-credit-card me-2"></i>
                      Payment Details
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handlePayment} noValidate>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">Payment Method</Form.Label>
                        <div className="border rounded p-3">
                          <Form.Check
                            type="radio"
                            label={
                              <div className="d-flex align-items-center">
                                <i className="bi bi-credit-card-2-front me-2"></i>
                                Credit/Debit Card
                              </div>
                            }
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mb-2"
                          />
                          </div>
                      </Form.Group>

                      {paymentMethod === 'card' && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                              Card Number {formErrors.cardNumber && <span className="text-danger">*</span>}
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="number"
                              value={cardDetails.number}
                              onChange={handleCardInput}
                              onKeyPress={handleCardNumberKeyPress}
                              onPaste={handleCardFieldPaste}
                              placeholder="1234 5678 9012 3456"
                              isInvalid={!!formErrors.cardNumber}
                              required
                              className="py-2"
                              inputMode="numeric"
                              pattern="[0-9\s]*"
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors.cardNumber}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                              Enter 13-19 digit card number
                            </Form.Text>
                          </Form.Group>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                  Expiry Date {formErrors.expiry && <span className="text-danger">*</span>}
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="expiry"
                                  value={cardDetails.expiry}
                                  onChange={handleCardInput}
                                  onPaste={handleCardFieldPaste}
                                  placeholder="MM/YY"
                                  isInvalid={!!formErrors.expiry}
                                  required
                                  className="py-2"
                                  inputMode="numeric"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {formErrors.expiry}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                  CVV {formErrors.cvv && <span className="text-danger">*</span>}
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="cvv"
                                  value={cardDetails.cvv}
                                  onChange={handleCardInput}
                                  onPaste={handleCardFieldPaste}
                                  placeholder="123"
                                  isInvalid={!!formErrors.cvv}
                                  required
                                  className="py-2"
                                  inputMode="numeric"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {formErrors.cvv}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                  3 or 4 digits on back of card
                                </Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              Cardholder Name {formErrors.cardholderName && <span className="text-danger">*</span>}
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={cardDetails.name}
                              onChange={handleCardInput}
                              placeholder="John Doe"
                              isInvalid={!!formErrors.cardholderName}
                              required
                              className="py-2"
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors.cardholderName}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </>
                      )}

                      {paymentMethod === 'paypal' && (
                        <div className="text-center py-4 border rounded bg-light">
                          <i className="bi bi-paypal display-4 text-primary mb-3"></i>
                          <p className="mb-3">You will be redirected to PayPal to complete your payment securely.</p>
                          <small className="text-muted">
                            Don't have PayPal? <a href="#" onClick={() => setPaymentMethod('card')}>Use credit card instead</a>
                          </small>
                        </div>
                      )}

                      <div className="d-grid gap-2 mt-4">
                        <Button
                          variant="success"
                          type="submit"
                          // disabled={processing}
                          size="lg"
                          className="py-3 fw-semibold"
                        >
                          {processing ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-lock-fill me-2"></i>
                              Pay {formatCurrency(booking.totalAmount)}
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          onClick={openCancelModal}
                          disabled={processing || cancelling}
                          className="py-2"
                        >
                          {cancelling ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-x-circle me-2"></i>
                              Cancel Booking
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>

                    <div className="mt-4 text-center">
                      <div className="d-flex justify-content-center align-items-center text-muted small">
                        <i className="bi bi-shield-check me-2 text-success"></i>
                        <span>Your payment is secure and encrypted</span>
                      </div>
                      <div className="mt-2">
                        <small className="text-muted">
                          By completing this purchase, you agree to our Terms of Service and Privacy Policy
                        </small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={closeCancelModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel this booking?</p>
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Warning:</strong> This action cannot be undone. Your booking will be cancelled immediately.
          </div>
          <div className="small text-muted">
            Booking: <strong>{booking.car?.brand} {booking.car?.model}</strong><br />
            Amount: <strong>{formatCurrency(booking.totalAmount)}</strong>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCancelModal} disabled={cancelling}>
            Keep Booking
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel Booking'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
};

export default Checkout;