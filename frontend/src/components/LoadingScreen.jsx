import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const LoadingScreen = () => {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark">
      <Container>
        <Row className="justify-content-center text-center">
          <Col md={6}>
            <div className="loading-spinner mx-auto mb-4"></div>
            <h3 className="text-white mb-3">CarRental Premium</h3>
            <div className="progress" style={{ height: '4px', background: 'rgba(255,255,255,0.2)' }}>
              <div 
                className="progress-bar" 
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: '75%',
                  transition: 'width 1s ease'
                }}
              ></div>
            </div>
            <p className="text-muted mt-3">Loading premium experience...</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoadingScreen;