import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Reset password
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return 'Email is required';
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        return '';
    };

    const validateOTP = (otp) => {
        if (!otp) return 'OTP is required';
        if (otp.length !== 6) return 'OTP must be 6 digits';
        if (!/^\d+$/.test(otp)) return 'OTP must contain only numbers';
        return '';
    };

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters long';
        return '';
    };

    const validateConfirmPassword = (confirmPassword) => {
        if (!confirmPassword) return 'Please confirm your password';
        if (confirmPassword !== formData.newPassword) return 'Passwords do not match';
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear errors when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        if (error) setError('');
        if (success) setSuccess('');
    };

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        
        const emailError = validateEmail(formData.email);
        if (emailError) {
            setErrors({ email: emailError });
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/forgot-password', {
                email: formData.email
            });

            setOtpSent(true);
            setGeneratedOtp(response.data.otp);
            setShowOtpModal(true);
            setCountdown(60); // 1 minute countdown for resend
            setStep(2);
            
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
const handleVerifyOTP = async (e) => {
  e.preventDefault();
  
  const otpError = validateOTP(formData.otp);
  if (otpError) {
    setErrors({ otp: otpError });
    return;
  }

  // FIX: Add OTP verification check
  if (formData.otp !== generatedOtp) {
    setErrors({ otp: 'Invalid OTP. Please check and try again.' });
    return;
  }

  setLoading(true);
  setError('');

  try {
    // Verify OTP with backend
    const response = await axios.post('http://localhost:5000/api/verify-otp', {
      email: formData.email,
      otp: formData.otp
    });

    if (response.data.success) {
      setStep(3);
      setShowOtpModal(false);
      setSuccess('OTP verified successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Invalid OTP');
    }
    
  } catch (error) {
    setError(error.response?.data?.message || 'Invalid OTP');
  } finally {
    setLoading(false);
  }
};

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        const passwordError = validatePassword(formData.newPassword);
        const confirmError = validateConfirmPassword(formData.confirmPassword);

        if (passwordError || confirmError) {
            setErrors({
                newPassword: passwordError,
                confirmPassword: confirmError
            });
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/reset-password', {
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });

            setSuccess('Password reset successfully! Redirecting to login...');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Password reset successfully! Please login with your new password.' 
                    } 
                });
            }, 2000);
            
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/resend-otp', {
                email: formData.email
            });

            setGeneratedOtp(response.data.otp);
            setCountdown(60);
            setSuccess('New OTP sent successfully');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
            
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6} lg={5}>
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h3>Reset Your Password</h3>
                                <p className="text-muted">
                                    {step === 1 && "Enter your email to receive an OTP"}
                                    {step === 2 && "Enter the OTP sent to your email"}
                                    {step === 3 && "Create your new password"}
                                </p>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            {/* Step 1: Enter Email */}
                            {step === 1 && (
                                <Form onSubmit={handleSendOTP}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                            isInvalid={!!errors.email}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.email}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-100 mb-3"
                                        disabled={loading}
                                    >
                                        {loading ? 'Sending OTP...' : 'Send OTP'}
                                    </Button>
                                </Form>
                            )}

                            {/* Step 2: Enter OTP */}
                            {step === 2 && (
                                <Form onSubmit={handleVerifyOTP}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Enter OTP</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="otp"
                                            value={formData.otp}
                                            onChange={handleChange}
                                            placeholder="Enter 6-digit OTP"
                                            isInvalid={!!errors.otp}
                                            maxLength={6}
                                        />
                                        <Form.Text className="text-muted">
                                            Enter the 6-digit OTP sent to {formData.email}
                                        </Form.Text>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.otp}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <div className="d-grid gap-2">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Verifying...' : 'Verify OTP'}
                                        </Button>
                                        
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleResendOTP}
                                            disabled={countdown > 0 || loading}
                                        >
                                            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                                        </Button>
                                    </div>
                                </Form>
                            )}

                            {/* Step 3: Reset Password */}
                            {step === 3 && (
                                <Form onSubmit={handleResetPassword}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>New Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            placeholder="Enter new password"
                                            isInvalid={!!errors.newPassword}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.newPassword}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Confirm New Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm new password"
                                            isInvalid={!!errors.confirmPassword}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.confirmPassword}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-100"
                                        disabled={loading}
                                    >
                                        {loading ? 'Resetting Password...' : 'Reset Password'}
                                    </Button>
                                </Form>
                            )}

                            <div className="text-center mt-3">
                                <p className="mb-0" style={{color: "#000000"}}>
                                    Remember your password? <Link to="/login">Back to Login</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* OTP Modal for Demo */}
            <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title> OTP Verification</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <h4 className="text-primary">{generatedOtp}</h4>
                    </div>
                    <p className="text-muted small mt-3">
                        This OTP will expire in 10 minutes.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOtpModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ForgotPassword;