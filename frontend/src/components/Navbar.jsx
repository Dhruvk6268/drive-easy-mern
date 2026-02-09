import React, { useState, useEffect } from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ user, logout, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [partnerApplication, setPartnerApplication] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check partner application status
  const checkPartnerApplicationStatus = async () => {
    if (!user) {
      setCheckingStatus(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingStatus(false);
      return;
    }

    setCheckingStatus(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/partners?status=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Find user's application
      const userApplication = response.data.find(partner => 
        partner.user._id === user.id || partner.user === user.id
      );
      
      if (userApplication) {
        setPartnerApplication(userApplication);
      } else {
        setPartnerApplication(null);
      }
    } catch (error) {
      console.error('Partner status check failed:', error);
      setPartnerApplication(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Check partner status when user changes or on route change
  useEffect(() => {
    checkPartnerApplicationStatus();
  }, [user, location.pathname]);

  // Listen for partner status changes from BecomePartner component
  useEffect(() => {
    const handlePartnerStatusChange = (event) => {
      if (event.detail && event.detail.application) {
        setPartnerApplication(event.detail.application);
      } else {
        setPartnerApplication(null);
      }
    };

    window.addEventListener('partnerStatusChanged', handlePartnerStatusChange);
    return () => {
      window.removeEventListener('partnerStatusChanged', handlePartnerStatusChange);
    };
  }, []);

  const handleLogout = () => {
    setPartnerApplication(null);
    logout();
    navigate('/');
  };

  const handleBecomePartner = () => {
    if (!user) {
      navigate('/login', { state: { message: 'Please login to become a partner' } });
      return;
    }
    navigate('/become-partner');
  };

  const getApplicationStatusBadge = () => {
    if (!partnerApplication) return null;

    const statusConfig = {
      pending: { variant: 'warning', text: 'Application Pending' },
      approved: { variant: 'success', text: 'Partner' },
      rejected: { variant: 'danger', text: 'Application Rejected' }
    };
    
    const config = statusConfig[partnerApplication.status] || { variant: 'secondary', text: 'Unknown' };
    
    return (
      <Badge bg={config.variant} className="ms-2">
        {config.text}
      </Badge>
    );
  };

  const getPartnerDropdownItem = () => {
    // User is already a partner
    if (user?.isPartner) {
      return (
        <Dropdown.Item as={Link} to="/partner-dashboard">
          <i className="fas fa-tachometer-alt me-2"></i>Partner Dashboard
        </Dropdown.Item>
      );
    }

    // User has a partner application
    if (partnerApplication) {
      if (partnerApplication.status === 'pending') {
        return (
          <Dropdown.Item disabled>
            <i className="fas fa-clock me-2"></i>Application Pending
          </Dropdown.Item>
        );
      } else if (partnerApplication.status === 'rejected') {
        return (
          <Dropdown.Item onClick={handleBecomePartner}>
            <i className="fas fa-redo me-2"></i>Reapply (Rejected)
          </Dropdown.Item>
        );
      }
    }

    // No application and not a partner - show Become Partner option
    if (!user?.isAdmin) {
      return (
        <Dropdown.Item onClick={handleBecomePartner}>
          <i className="fas fa-handshake me-2"></i>Become Partner
        </Dropdown.Item>
      );
    }

    return null;
  };

  return (
    <BootstrapNavbar 
      expand="lg" 
      fixed="top" 
      className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
      variant="light"
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
          <i className="fas fa-car me-2"></i>
          <span>CarRental</span>
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/cars">Cars</Nav.Link>
            <Nav.Link as={Link} to="/about">About</Nav.Link>
            <Nav.Link as={Link} to="/contact">Contact</Nav.Link>
            {user && (
              <>
                <Nav.Link as={Link} to="/my-bookings">My Bookings</Nav.Link>
                <Nav.Link as={Link} to="/my-tickets">My Tickets</Nav.Link>
              </>
            )}
            {user?.isAdmin && (
              <Nav.Link as={Link} to="/admin">Admin Panel</Nav.Link>
            )}
            {user?.isPartner && (
              <Nav.Link as={Link} to="/partner-dashboard">
                <i className="fas fa-tachometer-alt me-1"></i>Partner Dashboard
              </Nav.Link>
            )}
          </Nav>
          
          <Nav className="ms-auto">
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center">
                  <i className="fas fa-user-circle me-2"></i>
                  {user.name}
                  {user.isAdmin && <Badge bg="warning" text="dark" className="ms-2">Admin</Badge>}
                  {user.isPartner && <Badge bg="success" className="ms-2">Partner</Badge>}
                  {partnerApplication && !user.isPartner && getApplicationStatusBadge()}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {getPartnerDropdownItem()}
                  
                  <Dropdown.Item as={Link} to="/my-bookings">
                    <i className="fas fa-calendar-alt me-2"></i>My Bookings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Button as={Link} to="/login" variant="outline-primary" className="px-4">
                  Login
                </Button>
                <Button as={Link} to="/register" variant="primary" className="px-4">
                  Register
                </Button>
              </div>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;