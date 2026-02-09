
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Login = ({ login }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Validation functions
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

    const validatePassword = (password) => {
        if (!password) {
            return 'Password is required';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        const passwordError = validatePassword(formData.password);
        if (passwordError) newErrors.password = passwordError;

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

        // Clear general error
        if (error) {
            setError('');
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const fieldErrors = { ...errors };

        // Validate on blur
        if (name === 'email') {
            const emailError = validateEmail(value);
            fieldErrors.email = emailError;
        }

        if (name === 'password') {
            const passwordError = validatePassword(value);
            fieldErrors.password = passwordError;
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

        try {
            const response = await axios.post('http://localhost:5000/api/login', formData);
            login(response.data.user, response.data.token);

            // Check if user came from a specific page
            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed. Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5 login-container">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h3>Login</h3>
                                <p className="text-muted">
                                    {location.state?.message || "Welcome back! Please sign in to your account."}
                                </p>
                            </div>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit} noValidate>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter your email"
                                        isInvalid={!!errors.email}
                                        className={errors.email ? 'is-invalid' : ''}
                                    />
                                    {errors.email && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.email}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter your password"
                                        isInvalid={!!errors.password}
                                        className={errors.password ? 'is-invalid' : ''}
                                    />
                                    {errors.password && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.password}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-100 mb-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </Form>

                            <div className="text-center">
    <p className="mb-2" style={{color: "#000000"}}>
        Don't have an account? <Link to="/register">Sign up here</Link>
    </p>
    <p className="mb-0">
        <Link to="/forgot-password">Forgot your password?</Link>
    </p>
</div>
                            
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;