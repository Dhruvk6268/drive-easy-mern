import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Validation functions (keep all your existing validation functions the same)
  const validateName = (name) => {
    if (!name) {
      return 'Full name is required';
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Name should contain only letters and spaces';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) {
      return 'Phone number is required';
    }
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    if (!/^[+]?[\d\s\-\(\)]+$/.test(phone)) {
      return 'Please enter a valid phone number';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Clear general error and success messages
    if (error) setError('');
    if (success) setSuccess('');

    // Real-time validation for confirm password
    if (name === 'confirmPassword' || name === 'password') {
      const passwordToCheck = name === 'password' ? value : formData.password;
      const confirmPasswordToCheck = name === 'confirmPassword' ? value : formData.confirmPassword;

      if (confirmPasswordToCheck && passwordToCheck !== confirmPasswordToCheck) {
        setErrors({
          ...errors,
          confirmPassword: 'Passwords do not match'
        });
      } else if (errors.confirmPassword) {
        setErrors({
          ...errors,
          confirmPassword: ''
        });
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldErrors = { ...errors };

    // Validate on blur
    switch (name) {
      case 'name':
        fieldErrors.name = validateName(value);
        break;
      case 'email':
        fieldErrors.email = validateEmail(value);
        break;
      case 'phone':
        fieldErrors.phone = validatePhone(value);
        break;
      case 'password':
        fieldErrors.password = validatePassword(value);
        // Also revalidate confirm password if it exists
        if (formData.confirmPassword) {
          fieldErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword, value);
        }
        break;
      case 'confirmPassword':
        fieldErrors.confirmPassword = validateConfirmPassword(value, formData.password);
        break;
      default:
        break;
    }

    setErrors(fieldErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { confirmPassword, ...registerData } = formData;
      await axios.post('http://localhost:5000/api/register', registerData);
      setSuccess('Registration successful! Redirecting to login page...');
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

    if (strength <= 2) return { text: 'Weak', color: 'danger' };
    if (strength <= 3) return { text: 'Medium', color: 'warning' };
    return { text: 'Strong', color: 'success' };
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow" style={{ marginTop: '80px' }}>
            <Card.Body className="p-4" >
              <div className="text-center mb-4" >
                <h3>Create Account</h3>
                <p className="text-muted">
                  {location.state?.message || "Join us today and start renting cars!"}
                </p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit} noValidate>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter your full name"
                        isInvalid={!!errors.name}
                        className={errors.name ? 'is-invalid' : ''}
                      />
                      {errors.name && (
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter your phone number"
                        isInvalid={!!errors.phone}
                        className={errors.phone ? 'is-invalid' : ''}
                      />
                      {errors.phone && (
                        <Form.Control.Feedback type="invalid">
                          {errors.phone}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your email address"
                    isInvalid={!!errors.email}
                    className={errors.email ? 'is-invalid' : ''}
                  />
                  {errors.email && (
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Create a password"
                          isInvalid={!!errors.password}
                          className={errors.password ? 'is-invalid' : ''}
                        />
                        <InputGroup.Text 
                          style={{ cursor: 'pointer' }}
                          onClick={togglePasswordVisibility}
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </InputGroup.Text>
                        {errors.password && (
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                      {formData.password && !errors.password && (
                        <Form.Text className={`text-${getPasswordStrength(formData.password).color}`}>
                          Password strength: {getPasswordStrength(formData.password).text}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Confirm your password"
                          isInvalid={!!errors.confirmPassword}
                          className={errors.confirmPassword ? 'is-invalid' : ''}
                        />
                        <InputGroup.Text 
                          style={{ cursor: 'pointer' }}
                          onClick={toggleConfirmPasswordVisibility}
                        >
                          <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </InputGroup.Text>
                        {errors.confirmPassword && (
                          <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                      {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                        <Form.Text className="text-success">
                          ✓ Passwords match
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <div className="mb-3">
                  <small className="text-muted">
                    Password requirements: At least 6 characters with uppercase, lowercase, and number
                  </small>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0" style={{color: "#000000"}}>
                  Already have an account? <Link to="/login">Sign in here</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;