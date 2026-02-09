import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BecomePartner = ({ user, updateUser }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        nationalId: '',
        idProof: null,
        registrationFee: 10.00,
        // Payment fields
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardHolderName: ''
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [partnerApplication, setPartnerApplication] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(false)
    const navigate = useNavigate();
    const [isReapplying, setIsReapplying] = useState(false);


    // Check partner application status on component load
    useEffect(() => {
        if (!isReapplying && user) {
            checkPartnerApplicationStatus();
        }
    }, [isReapplying, user]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Check if user has a pending/rejected partner application
    const checkPartnerApplicationStatus = async () => {
        // Don't check status if user is reapplying
        if (isReapplying) {
            return;
        }

        if (!user) {
            setCheckingStatus(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Use the correct endpoint for users to check their own partner status
            const response = await axios.get('http://localhost:5000/api/partner/status', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.application) {
                setPartnerApplication(response.data.application);
                // Dispatch event to update navbar
                window.dispatchEvent(new CustomEvent('partnerStatusChanged', {
                    detail: { application: response.data.application }
                }));
            } else {
                setPartnerApplication(null);
                // Dispatch event to clear navbar status
                window.dispatchEvent(new CustomEvent('partnerStatusChanged', {
                    detail: { application: null }
                }));
            }
        } catch (error) {
            console.error('Error checking partner application:', error);
            // If endpoint doesn't exist, try the admin endpoint as fallback
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/admin/partners?status=all', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Find user's application
                const userApplication = response.data.find(partner =>
                    partner.user._id === user.id || partner.user === user.id
                );

                if (userApplication) {
                    setPartnerApplication(userApplication);
                    window.dispatchEvent(new CustomEvent('partnerStatusChanged', {
                        detail: { application: userApplication }
                    }));
                } else {
                    setPartnerApplication(null);
                    window.dispatchEvent(new CustomEvent('partnerStatusChanged', {
                        detail: { application: null }
                    }));
                }
            } catch (fallbackError) {
                console.error('Fallback check also failed:', fallbackError);
                setPartnerApplication(null);
            }
        } finally {
            setCheckingStatus(false);
        }
    };

    useEffect(() => {
        const handlePartnerStatusChange = () => {
            checkPartnerApplicationStatus();
        };

        window.addEventListener('partnerStatusChanged', handlePartnerStatusChange);
        return () => {
            window.removeEventListener('partnerStatusChanged', handlePartnerStatusChange);
        };
    }, []);

    // Enhanced validation
    const validateStep1 = () => {
        const newErrors = {};

        // Address validation
        if (!formData.address?.trim()) {
            newErrors.address = 'Address is required';
        } else if (formData.address.trim().length < 10) {
            newErrors.address = 'Address should be at least 10 characters long';
        }

        // City validation
        if (!formData.city?.trim()) {
            newErrors.city = 'City is required';
        } else if (!/^[a-zA-Z\s]{2,50}$/.test(formData.city.trim())) {
            newErrors.city = 'City should contain only letters (2-50 characters)';
        }

        // State validation
        if (!formData.state?.trim()) {
            newErrors.state = 'State is required';
        } else if (!/^[a-zA-Z\s]{2,50}$/.test(formData.state.trim())) {
            newErrors.state = 'State should contain only letters (2-50 characters)';
        }

        // Country validation
        if (!formData.country?.trim()) {
            newErrors.country = 'Country is required';
        } else if (!/^[a-zA-Z\s]{2,50}$/.test(formData.country.trim())) {
            newErrors.country = 'Country should contain only letters (2-50 characters)';
        }

        // ZIP Code validation - Exactly 6 digits
        if (!formData.zipCode?.trim()) {
            newErrors.zipCode = 'ZIP code is required';
        } else if (!/^\d{6}$/.test(formData.zipCode.trim())) {
            newErrors.zipCode = 'ZIP code must be exactly 6 digits';
        }

        // National ID validation
        if (!formData.nationalId?.trim()) {
            newErrors.nationalId = 'National ID is required';
        } else if (formData.nationalId.trim().length < 5) {
            newErrors.nationalId = 'National ID should be at least 5 characters long';
        } else if (!/^[a-zA-Z0-9]{5,20}$/.test(formData.nationalId.trim())) {
            newErrors.nationalId = 'National ID should be alphanumeric (5-20 characters)';
        }

        // ID Proof validation
        if (!formData.idProof) {
            newErrors.idProof = 'ID proof document is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Payment validation
    const validateStep2 = () => {
        const newErrors = {};

        // Card Number validation (16 digits)
        if (!formData.cardNumber?.trim()) {
            newErrors.cardNumber = 'Card number is required';
        } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
            newErrors.cardNumber = 'Card number must be 16 digits';
        }

        // Expiry Date validation (MM/YY format)
        if (!formData.expiryDate?.trim()) {
            newErrors.expiryDate = 'Expiry date is required';
        } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate.trim())) {
            newErrors.expiryDate = 'Expiry date must be in MM/YY format';
        } else {
            // Check if card is expired
            const [month, year] = formData.expiryDate.split('/');
            const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
            const today = new Date();
            if (expiry < today) {
                newErrors.expiryDate = 'Card has expired';
            }
        }

        // CVV validation (3-4 digits)
        if (!formData.cvv?.trim()) {
            newErrors.cvv = 'CVV is required';
        } else if (!/^\d{3,4}$/.test(formData.cvv.trim())) {
            newErrors.cvv = 'CVV must be 3 or 4 digits';
        }

        // Card Holder Name validation
        if (!formData.cardHolderName?.trim()) {
            newErrors.cardHolderName = 'Card holder name is required';
        } else if (!/^[a-zA-Z\s]{2,50}$/.test(formData.cardHolderName.trim())) {
            newErrors.cardHolderName = 'Card holder name should contain only letters (2-50 characters)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        let processedValue = value;

        // Special formatting for specific fields
        switch (name) {
            case 'zipCode':
                // Allow only numbers, max 6 digits
                processedValue = value.replace(/\D/g, '').slice(0, 6);
                break;
            case 'cardNumber':
                // Format as XXXX XXXX XXXX XXXX
                processedValue = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
                break;
            case 'expiryDate':
                // Format as MM/YY
                processedValue = value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/g, '$1/');
                break;
            case 'cvv':
                // Allow only numbers, max 4 digits
                processedValue = value.replace(/\D/g, '').slice(0, 4);
                break;
            case 'city':
            case 'state':
            case 'country':
            case 'cardHolderName':
                // Allow only letters and spaces
                processedValue = value.replace(/[^a-zA-Z\s]/g, '');
                break;
            case 'nationalId':
                // Allow alphanumeric
                processedValue = value.replace(/[^a-zA-Z0-9]/g, '');
                break;
            default:
                processedValue = value;
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));

        // Clear specific error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        if (error) setError('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            setError('Please upload JPEG, PNG, JPG, or PDF files only');
            e.target.value = ''; // Clear the file input
            return;
        }

        if (file.size > maxSize) {
            setError('File size must be less than 5MB');
            e.target.value = ''; // Clear the file input
            return;
        }

        setUploading(true);
        setError('');

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('document', file);
            uploadFormData.append('type', 'id_proof');

            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/upload-partner-doc', uploadFormData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFormData(prev => ({
                ...prev,
                idProof: response.data.url
            }));
            setSuccess('Document uploaded successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Document upload failed');
            e.target.value = ''; // Clear the file input on error
        } finally {
            setUploading(false);
        }
    };

    const handleStep1Submit = async (e) => {
        e.preventDefault();
        if (!validateStep1()) return;

        setLoading(true);
        try {
            setStep(2);
            setSuccess('Partner information saved. Please enter payment details.');
        } catch (error) {
            setError('Failed to proceed to payment');
        } finally {
            setLoading(false);
        }
    };

    // Add this function to update navbar state
    const updateNavbarApplicationStatus = (application) => {
        // This would typically be done through a context or state management
        // For now, we'll trigger a page reload to refresh navbar state
        if (application && application.status !== partnerApplication?.status) {
            window.dispatchEvent(new Event('partnerStatusChanged'));
        }
    };

    const handleStep2Submit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setLoading(true);
        try {
            // Generate OTP for payment verification
            const response = await axios.post('http://localhost:5000/api/generate-partner-otp',
                { email: user.email },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            setGeneratedOtp(response.data.otp);
            setShowOtpModal(true);
            setCountdown(60);
            setStep(3);
            setSuccess('OTP generated successfully. Check the modal for demo OTP.');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to generate OTP');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setError('OTP must contain only numbers');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/become-partner',
                {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    zipCode: formData.zipCode,
                    nationalId: formData.nationalId,
                    idProof: formData.idProof,
                    otp: otp
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setSuccess('Partner application submitted successfully! Waiting for admin approval.');

            // Refresh application status
            await checkPartnerApplicationStatus();
            setIsReapplying(false);

            // Reset form
            setStep(1);
            setFormData({
                address: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                nationalId: '',
                idProof: null,
                registrationFee: 10.00,
                cardNumber: '',
                expiryDate: '',
                cvv: '',
                cardHolderName: ''
            });
            setOtp('');

        } catch (error) {
            console.error('Partner registration error:', error);
            setError(error.response?.data?.message || 'Partner registration failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setShowOtpModal(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/resend-partner-otp',
                { email: user.email },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            setGeneratedOtp(response.data.otp);
            setCountdown(60);
            setSuccess('New OTP sent successfully');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseOtpModal = () => {
        setShowOtpModal(false);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { variant: 'warning', text: 'Pending Review' },
            approved: { variant: 'success', text: 'Approved' },
            rejected: { variant: 'danger', text: 'Rejected' }
        };

        const config = statusConfig[status] || { variant: 'secondary', text: 'Unknown' };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    const getStatusMessage = (application) => {
        if (application.status === 'approved') {
            return 'Congratulations! Your partner application has been approved. You can now access the partner dashboard.';
        } else if (application.status === 'rejected') {
            return 'Your partner application has been rejected. Please contact support for more information.';
        } else {
            return 'Your application is under review. We will notify you once it is processed.';
        }
    };

    // If user has a partner application, show status
    if (partnerApplication && !isReapplying) {
    return (
        <Container className="py-5" style={{ marginTop: '70px' }}>
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow">
                        <Card.Body className="p-4 text-center">
                            <div className="mb-4">
                                <i className="fas fa-file-alt fa-3x text-primary mb-3"></i>
                                <h3>Partner Application Status</h3>
                                <div className="mb-3">
                                    {getStatusBadge(partnerApplication.status)}
                                </div>
                                <p className="text-muted">
                                    {getStatusMessage(partnerApplication)}
                                </p>
                            </div>

                            {partnerApplication.status === 'approved' && (
                                <Button
                                    variant="success"
                                    onClick={() => navigate('/partner-dashboard')}
                                >
                                    Go to Partner Dashboard
                                </Button>
                            )}

                            {partnerApplication.status === 'rejected' && (
                                <div className="d-grid gap-2">
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setIsReapplying(true);
                                            setPartnerApplication(null);
                                            setStep(1);
                                        }}
                                    >
                                        Apply Again
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate('/contact')}
                                    >
                                        Contact Support
                                    </Button>
                                </div>
                            )}

                            <div className="mt-4 text-start">
                                <h6>Application Details:</h6>
                                <p><strong>Applied On:</strong> {new Date(partnerApplication.createdAt).toLocaleDateString()}</p>
                                <p><strong>Address:</strong> {partnerApplication.address}, {partnerApplication.city}, {partnerApplication.state}, {partnerApplication.country} - {partnerApplication.zipCode}</p>
                                {partnerApplication.approvedAt && (
                                    <p><strong>Approved On:</strong> {new Date(partnerApplication.approvedAt).toLocaleDateString()}</p>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

    if (!user) {
        return (
            <Container className="py-5">
                <Alert variant="warning" className="text-center">
                    <h4>Authentication Required</h4>
                    <p>Please <Link to="/login">login</Link> to become a partner.</p>
                </Alert>
            </Container>
        );
    }

    if (user.isPartner) {
        return (
            <Container className="py-5">
                <Alert variant="info" className="text-center">
                    <h4>You are already a partner!</h4>
                    <p>Visit your <Link to="/partner-dashboard">Partner Dashboard</Link> to manage your cars.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5" style={{ marginTop: '70px' }}>
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h3>Become a Partner</h3>
                                <p className="text-muted">
                                    Join our partner network and start earning by renting your cars
                                </p>
                                <Badge bg="info" className="mb-3">
                                    Registration Fee: ${formData.registrationFee}
                                </Badge>
                                <Badge bg="warning" text="dark" className="ms-2">
                                    10% commission on rentals
                                </Badge>
                            </div>

                            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                            {/* Step Indicators */}
                            <div className="d-flex justify-content-center mb-4">
                                <div className="text-center">
                                    <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                                        style={{ width: '30px', height: '30px', fontSize: '14px' }}>
                                        1
                                    </div>
                                    <div className="small mt-1">Partner Info</div>
                                </div>
                                <div className="mx-3 align-self-center">
                                    <div className="bg-secondary" style={{ width: '50px', height: '2px' }}></div>
                                </div>
                                <div className="text-center">
                                    <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                                        style={{ width: '30px', height: '30px', fontSize: '14px' }}>
                                        2
                                    </div>
                                    <div className="small mt-1">Payment</div>
                                </div>
                                <div className="mx-3 align-self-center">
                                    <div className="bg-secondary" style={{ width: '50px', height: '2px' }}></div>
                                </div>
                                <div className="text-center">
                                    <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                                        style={{ width: '30px', height: '30px', fontSize: '14px' }}>
                                        3
                                    </div>
                                    <div className="small mt-1">OTP</div>
                                </div>
                            </div>

                            {/* Step 1: Partner Information */}
                            {step === 1 && (
                                <Form onSubmit={handleStep1Submit}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Address *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    placeholder="Street address"
                                                    isInvalid={!!errors.address}
                                                    disabled={loading}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.address}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>City *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    placeholder="City"
                                                    isInvalid={!!errors.city}
                                                    disabled={loading}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.city}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>State *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    placeholder="State/Province"
                                                    isInvalid={!!errors.state}
                                                    disabled={loading}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.state}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Country *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="country"
                                                    value={formData.country}
                                                    onChange={handleChange}
                                                    placeholder="Country"
                                                    isInvalid={!!errors.country}
                                                    disabled={loading}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.country}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>ZIP Code *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="zipCode"
                                                    value={formData.zipCode}
                                                    onChange={handleChange}
                                                    placeholder="6-digit ZIP code"
                                                    isInvalid={!!errors.zipCode}
                                                    disabled={loading}
                                                    maxLength={6}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.zipCode}
                                                </Form.Control.Feedback>
                                                <Form.Text className="text-muted">
                                                    Exactly 6 digits required
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>National ID Number *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="nationalId"
                                                    value={formData.nationalId}
                                                    onChange={handleChange}
                                                    placeholder="National ID/Aadhaar/SSN"
                                                    isInvalid={!!errors.nationalId}
                                                    disabled={loading}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.nationalId}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-4">
                                        <Form.Label>ID Proof Document *</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={handleFileUpload}
                                            isInvalid={!!errors.idProof}
                                            disabled={uploading || loading}
                                        />
                                        <Form.Text className="text-muted">
                                            Upload a clear photo or scan of your government-issued ID (Max 5MB, JPG/PNG/PDF)
                                        </Form.Text>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.idProof}
                                        </Form.Control.Feedback>
                                        {uploading && (
                                            <div className="text-muted mt-1">
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Uploading document...
                                            </div>
                                        )}
                                        {formData.idProof && (
                                            <Alert variant="success" className="mt-2 py-2">
                                                <i className="fas fa-check me-2"></i>
                                                Document uploaded successfully
                                            </Alert>
                                        )}
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-100"
                                        disabled={loading || uploading || !formData.idProof}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Proceed to Payment'
                                        )}
                                    </Button>
                                </Form>
                            )}

                            {/* Step 2: Payment Details */}
                            {step === 2 && (
                                <Form onSubmit={handleStep2Submit}>
                                    <div className="text-center mb-4">
                                        <h5>Payment Details</h5>
                                        <p className="text-muted">
                                            Enter your card details for the ${formData.registrationFee} registration fee
                                        </p>
                                    </div>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Card Holder Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="cardHolderName"
                                            value={formData.cardHolderName}
                                            onChange={handleChange}
                                            placeholder="Name as on card"
                                            isInvalid={!!errors.cardHolderName}
                                            disabled={loading}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.cardHolderName}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Card Number *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="cardNumber"
                                            value={formData.cardNumber}
                                            onChange={handleChange}
                                            placeholder="1234 5678 9012 3456"
                                            isInvalid={!!errors.cardNumber}
                                            disabled={loading}
                                            maxLength={19}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.cardNumber}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Expiry Date *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="expiryDate"
                                                    value={formData.expiryDate}
                                                    onChange={handleChange}
                                                    placeholder="MM/YY"
                                                    isInvalid={!!errors.expiryDate}
                                                    disabled={loading}
                                                    maxLength={5}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.expiryDate}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>CVV *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="cvv"
                                                    value={formData.cvv}
                                                    onChange={handleChange}
                                                    placeholder="123"
                                                    isInvalid={!!errors.cvv}
                                                    disabled={loading}
                                                    maxLength={4}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.cvv}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="d-grid gap-2">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    Verifying Card...
                                                </>
                                            ) : (
                                                'Verify Card & Send OTP'
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => setStep(1)}
                                            disabled={loading}
                                        >
                                            Back to Partner Info
                                        </Button>
                                    </div>
                                </Form>
                            )}

                            {/* Step 3: OTP Verification */}
                            {step === 3 && (
                                <Form onSubmit={handlePaymentSubmit}>
                                    <div className="text-center mb-4">
                                        <h5>OTP Verification</h5>
                                        <p className="text-muted">
                                            Enter the OTP sent to your email to complete the payment
                                        </p>
                                    </div>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Enter OTP *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtp(value);
                                                if (error) setError('');
                                            }}
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                            className="text-center fs-4"
                                            isInvalid={!!error && error.includes('OTP')}
                                            disabled={isProcessing}
                                        />
                                        <Form.Text className="text-muted">
                                            OTP sent to {user.email}
                                        </Form.Text>
                                        <Form.Control.Feedback type="invalid">
                                            {error}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <div className="d-grid gap-2">
                                        <Button
                                            type="submit"
                                            variant="success"
                                            disabled={isProcessing || otp.length !== 6}
                                            size="lg"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    Processing Payment...
                                                </>
                                            ) : (
                                                `Complete Payment & Submit Application`
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleResendOTP}
                                            disabled={countdown > 0 || loading}
                                        >
                                            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                                        </Button>

                                        <Button
                                            variant="outline-primary"
                                            onClick={() => setStep(2)}
                                            disabled={isProcessing}
                                        >
                                            Back to Payment
                                        </Button>
                                    </div>
                                </Form>
                            )}

                            <div className="text-center mt-4">
                                <p className="text-muted small">
                                    By becoming a partner, you agree to our terms and conditions and
                                    understand that we charge 10% commission on all rental earnings.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* OTP Modal for Demo */}
            <Modal show={showOtpModal} onHide={handleCloseOtpModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Demo: OTP Verification</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>In a real application, this OTP would be sent to your email for payment verification.</p>
                    <p>For demo purposes, use this OTP:</p>
                    <div className="text-center">
                        <h4 className="text-primary">{generatedOtp}</h4>
                    </div>
                    <p className="text-muted small mt-3">
                        This OTP will expire in 10 minutes.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseOtpModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCloseOtpModal}>
                        Got it
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default BecomePartner;