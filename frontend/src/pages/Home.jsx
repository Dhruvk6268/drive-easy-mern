import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot'; 

const Home = ({ user, logout }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      // The backend now sorts by latest first (createdAt: -1)
      const response = await axios.get('http://localhost:5000/api/cars');
      setCars(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error fetching cars. Please try again later.');
      setLoading(false);
    }
  };

  const handleRentNow = (car) => {
    if (!user) {
      setSelectedCar(car);
      setShowAuthModal(true);
      return;
    }
    setSelectedCar(car);
    setShowBookingModal(true);
  };

  const handleAuthChoice = (choice) => {
    setShowAuthModal(false);
    if (choice === 'login') {
      navigate('/login', {
        state: {
          from: '/',
          selectedCar: selectedCar,
          message: 'Please login to rent this car'
        }
      });
    } else if (choice === 'register') {
      navigate('/register', {
        state: {
          from: '/',
          selectedCar: selectedCar,
          message: 'Create an account to start renting cars'
        }
      });
    }
  };

  const handleBookingSuccess = () => {
    setError('');
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success alert-dismissible fade show';
    successAlert.innerHTML = `
      <strong>Success!</strong> Your booking has been confirmed. Check your bookings to view details.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').insertBefore(successAlert, document.querySelector('.py-5'));

    setTimeout(() => {
      if (successAlert.parentNode) {
        successAlert.remove();
      }
    }, 5000);

    fetchCars(); // Refresh cars to update availability
  };

  const scrollToCars = () => {
    document.getElementById('cars-section').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading available cars...</p>
        </div>
      </Container>
    );
  }

  return (
    <div>
      {/* Hero Section */}
<div
  className="hero-section text-white py-5 position-relative"
  style={{
    backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('http://localhost:5000/uploads/car.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
}}
>
  <Container>
    <Row className="align-items-center min-vh-100 py-5">
      <Col lg={6} className="position-relative z-2">
        <div className="floating">
          <h1 className="display-3 fw-bold mb-4">
            Premium Car Rental<br />
            <span className="gradient-text">Experience</span>
          </h1>
        </div>
        <p className="lead mb-4 fs-5">
          Discover our exclusive collection of luxury vehicles. 
          Unmatched quality, exceptional service, and memories that last a lifetime.
        </p>
        <div className="d-flex gap-3 flex-wrap">
          <Button
            variant="light"
            size="lg"
            onClick={scrollToCars}
            className="pulse px-4 py-3 fw-semibold"
          >
            <i className="fas fa-search me-2"></i>
            Explore Collection
          </Button>
            {user && <Chatbot />}

          {!user && (
            <Button
              variant="outline-light"
              size="lg"
              onClick={() => navigate('/register')}
              className="px-4 py-3 fw-semibold"
            >
              <i className="fas fa-rocket me-2"></i>
              Get Started
            </Button>
          )}
        </div>
        
        {/* Stats Counter */}
        <Row className="mt-5 pt-4">
          <Col xs={4} className="text-center">
            <div className="counter">50+</div>
            <small>Premium Vehicles</small>
          </Col>
          <Col xs={4} className="text-center">
            <div className="counter">1000+</div>
            <small>Happy Customers</small>
          </Col>
          <Col xs={4} className="text-center">
            <div className="counter">24/7</div>
            <small>Support</small>
          </Col>
        </Row>
      </Col>
      <Col lg={6} className="text-center position-relative z-2">
        
      </Col>
    </Row>
    
    {/* Scroll Indicator */}
    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-2" style={{ width: '30px', height: '30px' }}></div>
        <small>Scroll to explore</small>
      </div>
    </div>
  </Container>
</div>

      {/* Cars Section */}
      <Container className="py-5" id="cars-section">
        <div className="text-center mb-5">
          <h2>Our Available Cars</h2>
          <p className="text-muted">Choose from our fleet of well-maintained vehicles</p>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Row>
          {cars.length > 0 ? (
            cars
              .filter(car => car.available)
              // The cars array is already sorted by the backend (latest first), so we just slice the first 6
              .slice(0, 6) 
              .map((car) => (
                <Col md={6} lg={4} key={car._id} className="mb-4">
                  <Card className="h-100 shadow-sm car-card">
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={car.image}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      {!user && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <span className="badge bg-warning text-dark">
                            <i className="fas fa-lock me-1"></i>Login Required
                          </span>
                        </div>
                      )}
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="h5">{car.brand} {car.model}</Card.Title>
                      <Card.Text className="text-muted small">{car.name} ({car.year})</Card.Text>
                      <Card.Text className="flex-grow-1 text-muted">{car.description}</Card.Text>
                      {/* Car features */}
                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="fas fa-users me-1"></i> {car.seats || 5} seats
                          <span className="mx-2">•</span>
                          <i className="fas fa-cog me-1"></i> {car.transmission || 'Auto'}
                          <span className="mx-2">•</span>
                          <i className="fas fa-gas-pump me-1"></i> {car.fuelType || 'Petrol'}
                        </small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <div>
                          <h5 className="text-primary mb-0">${car.price}/day</h5>
                          <small className="text-muted">Starting from</small>
                        </div>
                        <Button
                          variant={car.available ? "primary" : "secondary"}
                          size="sm"
                          disabled={!car.available}
                          onClick={() => handleRentNow(car)}
                          className={!user ? "rent-button-guest" : ""}
                        >
                          {car.available ? (
                            <>
                              <i className="fas fa-car me-1"></i>
                              Rent Now
                            </>
                          ) : (
                            <>
                              <i className="fas fa-times me-1"></i>
                              Not Available
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
          ) : (
            <Col xs={12}>
              <div className="text-center py-5">
                <i className="fas fa-car fa-4x text-muted mb-3"></i>
                <h4 className="text-muted">No cars available at the moment</h4>
                <p className="text-muted">Please check back later for available vehicles.</p>
                <Button variant="outline-primary" onClick={fetchCars}>
                  <i className="fas fa-refresh me-2"></i>
                  Refresh
                </Button>
              </div>
            </Col>
          )}
        </Row>
      </Container>

      {/* Features Section */}
      <div className="bg-light py-5">
        <Container>
          <div className="text-center mb-5">
            <h2>Why Choose Us?</h2>
            <p className="text-muted">Experience the difference with our premium car rental service</p>
          </div>
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="feature-icon mb-3">
                <div className="bg-primary bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-car fa-2x"></i>
                </div>
              </div>
              <h5>Quality Vehicles</h5>
              <p className="text-muted">
                All our cars are well-maintained and regularly serviced to ensure your safety and comfort.
              </p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="feature-icon mb-3">
                <div className="bg-success bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-dollar-sign fa-2x"></i>
                </div>
              </div>
              <h5>Affordable Prices</h5>
              <p className="text-muted">
                Competitive pricing with no hidden fees. Get the best value for your money.
              </p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="feature-icon mb-3">
                <div className="bg-info bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-clock fa-2x"></i>
                </div>
              </div>
              <h5>24/7 Support</h5>
              <p className="text-muted">
                Our customer support team is available round the clock to assist you.
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <Footer />

      {/* Authentication Required Modal */}
      <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-lock text-primary me-2"></i>
            Authentication Required
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <i className="fas fa-car fa-3x text-primary mb-3"></i>
          <h5>Ready to rent this car?</h5>
          <p className="text-muted mb-4">
            You need to be logged in to make a booking.
            {selectedCar && (
              <span> Continue to rent the <strong>{selectedCar.brand} {selectedCar.model}</strong>.</span>
            )}
          </p>
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleAuthChoice('login')}
            >
              <i className="fas fa-sign-in-alt me-2"></i>
              Login to Continue
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => handleAuthChoice('register')}
            >
              <i className="fas fa-user-plus me-2"></i>
              Create New Account
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="text-center border-0">
          <small className="text-muted w-100">
            Join thousands of satisfied customers who trust us with their car rental needs.
          </small>
        </Modal.Footer>
      </Modal>

      {/* Booking Modal */}
      {user && (
        <BookingModal
          show={showBookingModal}
          onHide={() => setShowBookingModal(false)}
          car={selectedCar}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

    
      <style jsx="true">{`
        .car-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        
        .car-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }

        .rent-button-guest {
          position: relative;
          overflow: hidden;
        }

        .rent-button-guest:hover::after {
          content: "Login Required";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .min-vh-50 {
          min-height: 50vh;
        }

        @media (max-width: 768px) {
          .display-4 {
            font-size: 2rem;
          }
          
          .lead {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;