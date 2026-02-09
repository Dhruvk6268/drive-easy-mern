import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal } from 'react-bootstrap';
import "./Footer.css";

export default function Footer() {

    return (<>
        {/* Footer Section */}
        <footer className="footer bg-dark text-white pt-5 pb-4 mt-5">
            <Container>
                <Row>
                    {/* About */}
                    <Col md={4} className="mb-4">
                        <h5 className="fw-bold mb-3">CarRental</h5>
                        <p>
                            Your trusted partner for affordable and reliable car rentals.
                            Book your next ride with us and enjoy a hassle-free experience.
                        </p>
                    </Col>

                    {/* Quick Links */}
                    <Col md={2} className="mb-4" >
                        <h6 className="fw-bold mb-3" >Quick Links</h6>
                        <ul className="list-unstyled">
                            <li><a href="/" className="text-decoration-none" style={{ color: 'white' }}>Home</a></li>
                            <li><a href="/about" className="text-decoration-none "style={{ color: 'white' }}>About</a></li>
                            <li><a href="/cars" className="text-decoration-none"style={{ color: 'white' }}>Cars</a></li>
                            <li><a href="/contact" className="text-decoration-none"style={{ color: 'white' }}>Contact</a></li>
                        </ul>
                    </Col>

                    {/* Contact */}
                    <Col md={3} className="mb-4">
                        <h6 className="fw-bold mb-3">Contact Us</h6>
                        <p className="mb-1">
                            <i className="fas fa-map-marker-alt me-2"></i>123 Main Street, City
                        </p>
                        <p className=" mb-1">
                            <i className="fas fa-phone me-2"></i>+91 98765 43210
                        </p>
                        <p>
                            <i className="fas fa-envelope me-2"></i>support@carrental.com
                        </p>
                    </Col>

                    {/* Socials */}
                    <Col md={3} className="mb-4 text-center text-md-start">
                        <h6 className="fw-bold mb-3">Follow Us</h6>
                        <div className="d-flex gap-3 justify-content-center justify-content-md-start">
                            <a href="#" className="text-white fs-5"><i className="fab fa-facebook-f"></i></a>
                            <a href="#" className="text-white fs-5"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="text-white fs-5"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="text-white fs-5"><i className="fab fa-linkedin-in"></i></a>
                        </div>
                    </Col>
                </Row>

                <hr className="border-secondary" />
                <Row>
                    <Col className="text-center">
                        <p className="mb-0  text">
                            © {new Date().getFullYear()} CarRental. All Rights Reserved.
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    </>
    );
};