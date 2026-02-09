import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

const BookingModal = ({ show, onHide, car, onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    pickupLocation: '',
    dropoffLocation: '',
    contactNumber: '',
    specialRequests: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [close, setClose] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate total when dates change
    if (name === 'startDate' || name === 'endDate') {
      const updatedData = { ...formData, [name]: value };
      calculateTotal(updatedData.startDate, updatedData.endDate);
    }
  };

  const calculateTotal = (startDate, endDate) => {
    if (startDate && endDate && car) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end > start) {
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const amount = days * car.price;
        setTotalDays(days);
        setTotalAmount(amount);
      } else {
        setTotalDays(0);
        setTotalAmount(0);
      }
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await axios.post(
      'http://localhost:5000/api/bookings',
      {
        carId: car._id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        contactNumber: formData.contactNumber,
        specialRequests: formData.specialRequests
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    // Instead of showing success message, redirect to checkout
    onHide(); // Close the modal
    navigate('/checkout', { state: { booking: response.data } });
    
  } catch (error) {
    setError(error.response?.data?.message || 'Booking failed');
  } finally {
    setLoading(false);
  }
};

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Book {car?.brand} {car?.model}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="success">{"Booking Successful"}</Alert>}

        {!close && car && (
          <div className="mb-4 p-3 bg-light rounded">
            <Row>
              <Col md={4}>
                <img
                  src={car.image}
                  alt={car.name}
                  className="img-fluid rounded"
                />
              </Col>

              <Col md={8}>
                <h5>{car.brand} {car.model}</h5>
                <p className="text-muted">{car.name} ({car.year})</p>
                <p className='text-muted'>{car.description}</p>
                <h6 className="text-primary">${car.price}/day</h6>
              </Col>
            </Row>
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Pickup Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={today}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Return Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || today}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Pickup Location *</Form.Label>
                <Form.Control
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  placeholder="Enter pickup address"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Drop-off Location *</Form.Label>
                <Form.Control
                  type="text"
                  name="dropoffLocation"
                  value={formData.dropoffLocation}
                  onChange={handleChange}
                  placeholder="Enter drop-off address"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Contact Number *</Form.Label>
            <Form.Control
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Your phone number"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Special Requests (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              placeholder="Any special requirements or notes..."
            />
          </Form.Group>

          {totalDays > 0 && (
            <div className="bg-primary text-white p-3 rounded mb-3">
              <Row>
                <Col>
                  <strong>Rental Summary:</strong>
                </Col>
              </Row>
              <Row>
                <Col>Total Days: {totalDays}</Col>
                <Col>Rate: ${car?.price}/day</Col>
                <Col><strong>Total: ${totalAmount}</strong></Col>
              </Row>
            </div>
          )}

          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={onHide}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || totalDays === 0}
            >
              {loading ? 'Booking...' : `Book Now - $${totalAmount}`}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default BookingModal;