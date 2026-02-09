import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import Footer from '../components/Footer';
const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [showAlert, setShowAlert] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real application, you would send this data to your backend
        console.log('Form submitted:', formData);
        setShowAlert(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setShowAlert(false), 5000);
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header bg-primary text-white py-5" style={{ marginTop: '50px' }}>
                <Container>
                    <Row>
                        <Col>
                            <h1 className="display-4">Contact Us</h1>
                            <p className="lead">Get in touch with our team</p>
                        </Col>
                    </Row>
                </Container>
            </div>

            <Container className="py-5">
                {showAlert && (
                    <Alert variant="success" className="mb-4">
                        Thank you for your message! We'll get back to you soon.
                    </Alert>
                )}

                <Row>
                    {/* Contact Form */}
                    <Col lg={8} className="mb-5">
                        <Card className="shadow-sm">
                            <Card.Header>
                                <h4 className="mb-0">Send us a Message</h4>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Name *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Your full name"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Email *</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="your.email@example.com"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Subject *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            placeholder="What is this regarding?"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Message *</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            placeholder="Please describe your inquiry in detail..."
                                        />
                                    </Form.Group>

                                    <Button type="submit" variant="primary" size="lg">
                                        Send Message
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Contact Information */}
                    <Col lg={4}>
                        <Card className="shadow-sm mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Contact Information</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3">
                                        <i className="fas fa-map-marker-alt fa-lg text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0">Address</h6>
                                        <small className="text-muted">Surat, Gujarat</small>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3">
                                        <i className="fas fa-phone fa-lg text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0">Phone</h6>
                                        <small className="text-muted">+91 98751 96322</small>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3">
                                        <i className="fas fa-envelope fa-lg text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0">Email</h6>
                                        <small className="text-muted">info@carrental.com</small>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center">
                                    <div className="me-3">
                                        <i className="fas fa-clock fa-lg text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="mb-0">Business Hours</h6>
                                        <small className="text-muted">Anytime To Serve You</small>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm">
                            <Card.Header>
                                <h5 className="mb-0">Emergency Contact</h5>
                            </Card.Header>
                            <Card.Body>
                                <p className="mb-2">
                                    <strong style={{ color: 'red' }}>24/7 Roadside Assistance:</strong>
                                </p>
                                <p className="text-primary h5">+91 98751 96322</p>
                                <small className="text-muted">
                                    Available round the clock for any emergency assistance during your rental period.
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* FAQ Section */}
                <Row className="mt-5">
                    <Col>
                        <h3 className="text-center mb-4">Frequently Asked Questions</h3>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Card className="h-100 border-0 bg-light">
                                    <Card.Body>
                                        <h6>What do I need to rent a car?</h6>
                                        <p className="text-muted small mb-0">
                                            You need a valid driver's license, credit card, and must be at least 21 years old.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Card className="h-100 border-0 bg-light">
                                    <Card.Body>
                                        <h6>Can I cancel my reservation?</h6>
                                        <p className="text-muted small mb-0">
                                            Yes, you can cancel up to 24 hours before your pickup time for a full refund.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Card className="h-100 border-0 bg-light">
                                    <Card.Body>
                                        <h6>Do you offer insurance?</h6>
                                        <p className="text-muted small mb-0">
                                            Yes, we offer various insurance options to protect you during your rental period.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Card className="h-100 border-0 bg-light">
                                    <Card.Body>
                                        <h6>What is your fuel policy?</h6>
                                        <p className="text-muted small mb-0">
                                            We operate on a full-to-full fuel policy. Return the car with the same fuel level.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
              <Footer />
        </div>
    );
};

export default Contact;