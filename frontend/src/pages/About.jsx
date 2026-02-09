import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Footer from '../components/Footer';
const About = () => {
    return (
        <div>

            {/* Page Header */}
            <div className="page-header bg-primary text-white py-5">
                <Container>
                    <Row style={{ marginTop: '50px' }}>
                        <Col>
                            <h1 className="display-4">About Us</h1>
                            <p className="lead">Learn more about our car rental service</p>
                        </Col>
                    </Row>
                </Container>
            </div>

            <Container className="py-5">
                {/* Company Story */}
                <Row className="mb-5">
                    <Col lg={8} className="mx-auto">
                        <h2 className="text-center mb-4">Our Story</h2>
                        <p className="lead text-center text-muted mb-4">
                            Founded in 2020, CarRental has been serving customers with reliable and affordable car rental services.
                        </p>
                        <p style={{ color: '#555' }}>
                            We started with a simple mission: to make car rental easy, affordable, and accessible to everyone.
                            Over the years, we have grown to become one of the most trusted car rental companies in the region,
                            serving thousands of satisfied customers.
                        </p>
                        <p style={{ color: '#555' }}>
                            Our fleet consists of well-maintained vehicles ranging from economy cars to luxury vehicles,
                            ensuring that we have the perfect car for every occasion and budget. Whether you need a car for
                            a business trip, family vacation, or just daily commute, we have got you covered.
                        </p>
                    </Col>
                </Row>

                {/* Mission & Vision */}
                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Body className="text-center p-4">
                                <div className="mb-3">
                                    <i className="fas fa-bullseye fa-3x text-primary"></i>
                                </div>
                                <h4>Our Mission</h4>
                                <p className="text-muted">
                                    To provide reliable, affordable, and convenient car rental services while ensuring
                                    customer satisfaction through quality vehicles and exceptional service.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Body className="text-center p-4">
                                <div className="mb-3">
                                    <i className="fas fa-eye fa-3x text-primary"></i>
                                </div>
                                <h4>Our Vision</h4>
                                <p className="text-muted">
                                    To become the leading car rental company by continuously improving our services
                                    and expanding our reach to serve more customers across the region.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Values */}
                <Row className="mb-5">
                    <Col>
                        <h2 className="text-center mb-4">Our Values</h2>
                        <Row>
                            <Col md={3} className="text-center mb-4">
                                <div className="mb-3">
                                    <i className="fas fa-handshake fa-2x text-primary"></i>
                                </div>
                                <h6>Trust</h6>
                                <p className="text-muted small">
                                    Building lasting relationships through transparency and reliability.
                                </p>
                            </Col>
                            <Col md={3} className="text-center mb-4">
                                <div className="mb-3">
                                    <i className="fas fa-star fa-2x text-primary"></i>
                                </div>
                                <h6>Quality</h6>
                                <p className="text-muted small">
                                    Maintaining high standards in our vehicles and services.
                                </p>
                            </Col>
                            <Col md={3} className="text-center mb-4">
                                <div className="mb-3">
                                    <i className="fas fa-users fa-2x text-primary"></i>
                                </div>
                                <h6>Customer Focus</h6>
                                <p className="text-muted small">
                                    Putting our customers' needs and satisfaction first.
                                </p>
                            </Col>
                            <Col md={3} className="text-center mb-4">
                                <div className="mb-3">
                                    <i className="fas fa-lightbulb fa-2x text-primary"></i>
                                </div>
                                <h6>Innovation</h6>
                                <p className="text-muted small">
                                    Continuously improving and adopting new technologies.
                                </p>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                {/* Stats */}
                <div className="bg-light rounded p-5">
                    <Row className="text-center">
                        <Col md={3} className="mb-3">
                            <h3 className="text-primary">500+</h3>
                            <p className="text-muted">Happy Customers</p>
                        </Col>
                        <Col md={3} className="mb-3">
                            <h3 className="text-primary">50+</h3>
                            <p className="text-muted">Quality Vehicles</p>
                        </Col>
                        <Col md={3} className="mb-3">
                            <h3 className="text-primary">3+</h3>
                            <p className="text-muted">Years Experience</p>
                        </Col>
                        <Col md={3} className="mb-3">
                            <h3 className="text-primary">24/7</h3>
                            <p className="text-muted">Customer Support</p>
                        </Col>
                    </Row>
                </div>
                
            </Container>
            <Footer />
        </div>
    );
};

export default About;