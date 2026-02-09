import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Nav,
  Badge,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const PartnerDashboard = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState("cars");
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifyingStatus, setVerifyingStatus] = useState(true);
  const [blockedAmount, setBlockedAmount] = useState(0);

  // Payment Redemption States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [redeeming, setRedeeming] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const [carForm, setCarForm] = useState({
    name: "",
    brand: "",
    model: "",
    year: "",
    price: "",
    image: "",
    description: "",
    available: true,
    seats: 5,
    transmission: "automatic",
    fuelType: "petrol",
    carType: "sedan",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/partner/payment-history",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPaymentHistory(response.data.payments || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  // Fetch partner balance
  const fetchPartnerBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/partner/balance",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableBalance(response.data.availableBalance || 0);
      setPendingBalance(response.data.pendingBalance || 0);
      setBlockedAmount(response.data.blockedAmount || 0);
    } catch (error) {
      console.error("Error fetching partner balance:", error);
    }
  };

  const fetchPartnerData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const [carsResponse, bookingsResponse, earningsResponse] =
        await Promise.all([
          axios.get("http://localhost:5000/api/partner/cars", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/partner/bookings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/partner/earnings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      setCars(carsResponse.data.cars || []);
      setBookings(bookingsResponse.data.bookings || []);
      setEarnings(earningsResponse.data.earnings || 0);

      // Fetch additional payment data
      await fetchPaymentHistory();
      await fetchPartnerBalance();
    } catch (error) {
      setError(
        "Error fetching partner data: " +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const verifyPartnerAccess = async () => {
      setVerifyingStatus(true);

      if (!user) {
        navigate("/login");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/user/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const freshUser = response.data.user;
        localStorage.setItem("user", JSON.stringify(freshUser));

        if (setUser && freshUser.isPartner !== user.isPartner) {
          setUser(freshUser);
        }

        if (!freshUser.isPartner) {
          if (isMounted) {
            navigate("/");
          }
          return;
        }

        if (isMounted) {
          setVerifyingStatus(false);
          await fetchPartnerData();
        }
      } catch (error) {
        console.error("Partner verification failed:", error);
        if (isMounted) {
          navigate("/login");
        }
      }
    };

    verifyPartnerAccess();

    return () => {
      isMounted = false;
    };
  }, [user, navigate, fetchPartnerData, setUser, location.pathname]);

  const handleRedeemPayment = async (e) => {
    e.preventDefault();
    setRedeeming(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const redeemData = {
        amount: parseFloat(redeemAmount),
        paymentMethod,
        bankDetails: paymentMethod === "bank_transfer" || paymentMethod === "upi" ? bankDetails : undefined,
      };

      const response = await axios.post(
        "http://localhost:5000/api/partner/redeem",
        redeemData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message || "Payment redemption request submitted successfully!");
        setShowPaymentModal(false);
        setRedeemAmount("");
        setBankDetails({
          accountName: "",
          accountNumber: "",
          bankName: "",
          ifscCode: "",
          upiId: ""
        });

        // Refresh data
        await fetchPartnerData();
      } else {
        setError(response.data.message || "Redemption failed");
      }
    } catch (error) {
      console.error('Redemption error:', error);
      setError(
        "Redemption failed: " +
        (error.response?.data?.message || error.message || "Unknown error")
      );
    } finally {
      setRedeeming(false);
    }
  };

  const handleCarSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const carData = {
        ...carForm,
        year: Number(carForm.year),
        price: Number(carForm.price),
        seats: Number(carForm.seats),
      };

      if (editingCar && editingCar.adminDeactivated && carForm.available) {
        setError(
          "This car has been deactivated by admin. Please contact support to reactivate."
        );
        setLoading(false);
        return;
      }

      if (editingCar) {
        await axios.put(
          `http://localhost:5000/api/partner/cars/${editingCar._id}`,
          carData,
          getAuthHeaders()
        );
        setSuccess("Car updated successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/partner/cars",
          carData,
          getAuthHeaders()
        );
        setSuccess("Car added successfully!");
      }

      setShowModal(false);
      setEditingCar(null);
      setCarForm({
        name: "",
        brand: "",
        model: "",
        year: "",
        price: "",
        image: "",
        description: "",
        available: true,
        seats: 5,
        transmission: "automatic",
        fuelType: "petrol",
        carType: "sedan",
      });
      fetchPartnerData();
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("carImage", file);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/upload-partner-car-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const url = response.data?.url || "";
      if (url) {
        setCarForm({ ...carForm, image: url });
        setSuccess("Image uploaded successfully");
      } else {
        setError("Upload response missing URL");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleEditCar = (car) => {
    setEditingCar(car);
    setCarForm({
      name: car.name,
      brand: car.brand,
      model: car.model,
      year: car.year.toString(),
      price: car.price.toString(),
      image: car.image,
      description: car.description,
      available: car.available,
      seats: car.seats?.toString() || "5",
      transmission: car.transmission || "automatic",
      fuelType: car.fuelType || "petrol",
      carType: car.carType || "sedan",
    });
    setShowModal(true);
  };

  const handleStatusChange = async (carId, action, available) => {
    try {
      let updateData = {};

      if (action === 'admin_deactivated') {
        updateData = {
          available: false,
          adminDeactivated: true
        };
      } else if (action === 'reactivate') {
        updateData = {
          available: true,
          adminDeactivated: false
        };
      } else {
        updateData = {
          available: available,
          ...(available && { adminDeactivated: false })
        };
      }

      await axios.put(
        `http://localhost:5000/api/partner/cars/${carId}`,
        updateData,
        getAuthHeaders()
      );

      setSuccess(`Car status updated successfully!`);
      fetchPartnerData();
    } catch (error) {
      setError(
        "Error updating car status: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDeleteCar = async (carId) => {
    if (window.confirm("Are you sure you want to delete this car?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/partner/cars/${carId}`,
          getAuthHeaders()
        );
        setSuccess("Car deleted successfully!");
        fetchPartnerData();
      } catch {
        setError("Error deleting car");
      }
    }
  };

  const openAddCarModal = () => {
    setEditingCar(null);
    setCarForm({
      name: "",
      brand: "",
      model: "",
      year: "",
      price: "",
      image: "",
      description: "",
      available: true,
      seats: 5,
      transmission: "automatic",
      fuelType: "petrol",
      carType: "sedan",
    });
    setShowModal(true);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      confirmed: "info",
      active: "success",
      completed: "secondary",
      cancelled: "danger",
      processing: "info",
      paid: "success",
      failed: "danger",
    };
    return colors[status] || "secondary";
  };

  if (verifyingStatus) {
    return (
      <Container className="py-5" style={{ marginTop: "70px" }}>
        <Row className="justify-content-center">
          <Col className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Verifying partner status...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!user?.isPartner) {
    return (
      <Container className="py-5" style={{ marginTop: "70px" }}>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow">
              <Card.Body className="p-4 text-center">
                <i className="fas fa-lock fa-3x text-warning mb-3"></i>
                <h4>Partner Access Required</h4>
                <p className="text-muted">
                  Your partner application is pending admin approval or you
                  don't have partner access.
                </p>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                  className="me-2"
                >
                  Refresh Status
                </Button>
                <Button variant="outline-primary" onClick={() => navigate("/")}>
                  Go Home
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: "70px" }}>
      {/* Top Section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Partner Dashboard</h2>
            <div className="d-flex gap-3">
              <Card className="bg-success text-white shadow-sm">
                <Card.Body className="py-3 text-center">
                  <h6 className="mb-1">Available Balance</h6>
                  <h4 className="mb-0">${(availableBalance || 0).toFixed(2)}</h4>
                  <small className="opacity-75">Ready to redeem</small>
                </Card.Body>
              </Card>
              <Card className="bg-primary text-white shadow-sm">
                <Card.Body className="py-3 text-center">
                  <h6 className="mb-1">Total Earnings</h6>
                  <h4 className="mb-0">${(earnings || 0).toFixed(2)}</h4>
                  <small className="opacity-75">
                    After 10% platform commission
                  </small>
                </Card.Body>
              </Card>
              <Card className="bg-warning text-white shadow-sm">
                <Card.Body className="py-3 text-center">
                  <h6 className="mb-1">Pending</h6>
                  <h4 className="mb-0">${(pendingBalance || 0).toFixed(2)}</h4>
                  <small className="opacity-75">Processing payments</small>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link
            active={activeTab === "cars"}
            onClick={() => setActiveTab("cars")}
            className="d-flex align-items-center gap-2"
          >
            <i className="fas fa-car"></i> My Cars ({cars.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === "bookings"}
            onClick={() => setActiveTab("bookings")}
            className="d-flex align-items-center gap-2"
          >
            <i className="fas fa-calendar-check"></i> Bookings (
            {bookings.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeTab === "payments"}
            onClick={() => setActiveTab("payments")}
            className="d-flex align-items-center gap-2"
          >
            <i className="fas fa-money-bill-wave"></i> Payments
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Cars Tab */}
          {activeTab === "cars" && (
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                <h5 className="mb-0">Manage Your Cars</h5>
                <Button variant="primary" onClick={openAddCarModal}>
                  <i className="fas fa-plus me-2"></i>Add New Car
                </Button>
              </Card.Header>
              <Card.Body>
                {cars.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="bg-light">
                        <tr>
                          <th>Image</th>
                          <th>Car Details</th>
                          <th>Type</th>
                          <th>Year</th>
                          <th>Price/Day</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cars.map((car) => (
                          <tr key={car._id}>
                            <td>
                              <img
                                src={car.image}
                                alt={car.name}
                                style={{
                                  width: "80px",
                                  height: "60px",
                                  objectFit: "cover",
                                }}
                                className="rounded"
                              />
                            </td>
                            <td>
                              <strong>{car.name}</strong>
                              <br />
                              <small className="text-muted">
                                {car.brand} {car.model}
                              </small>
                            </td>
                            <td>
                              <Badge bg="secondary">
                                {car.carType?.charAt(0).toUpperCase() +
                                  car.carType?.slice(1)}
                              </Badge>
                            </td>
                            <td>{car.year}</td>
                            <td>
                              <strong>${car.price}</strong>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  car.adminDeactivated
                                    ? "danger"
                                    : car.available
                                      ? "success"
                                      : "warning"
                                }
                              >
                                {car.adminDeactivated
                                  ? "Admin Deactivated"
                                  : car.available
                                    ? "Available"
                                    : "Rented"}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditCar(car)}
                                  title="Edit"
                                  disabled={
                                    car.adminDeactivated && !car.available
                                  }
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteCar(car._id)}
                                  title="Delete"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-car fa-3x text-muted mb-3"></i>
                    <h5>No cars added yet</h5>
                    <p className="text-muted">
                      Add your first car to start earning!
                    </p>
                    <Button variant="primary" onClick={openAddCarModal}>
                      Add Your First Car
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Car Bookings</h5>
              </Card.Header>
              <Card.Body>
                {bookings.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="bg-light">
                        <tr>
                          <th>Booking ID</th>
                          <th>Car</th>
                          <th>Customer</th>
                          <th>Rental Dates</th>
                          <th>Financial</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking._id}>
                            <td>
                              <strong>#{booking._id.slice(-8)}</strong>
                            </td>
                            <td>
                              <strong>
                                {booking.car?.brand} {booking.car?.model}
                              </strong>
                              <small className="text-muted d-block">
                                {booking.car?.name}
                              </small>
                            </td>
                            <td>
                              <strong>{booking.user?.name}</strong>
                              <small className="text-muted d-block">
                                {booking.user?.email}
                              </small>
                            </td>
                            <td>
                              <div className="small">
                                <div>
                                  Pickup: {formatDate(booking.startDate)}
                                </div>
                                <div>Return: {formatDate(booking.endDate)}</div>
                                <Badge bg="light" text="dark" className="mt-1">
                                  {booking.totalDays} days
                                </Badge>
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <div>
                                  Total: <strong>${booking.totalAmount}</strong>
                                </div>
                                <div className="text-success">
                                  Earnings:{" "}
                                  <strong>
                                    ${(booking.totalAmount * 0.9).toFixed(2)}
                                  </strong>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge bg={getStatusColor(booking.status)}>
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h5>No bookings yet for your cars.</h5>
                    <p className="text-muted">
                      When customers book your vehicles, they will appear here.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Payment History & Redemption</h5>
                  <Button
                    variant="success"
                    onClick={() => setShowPaymentModal(true)}
                    disabled={availableBalance <= 0}
                  >
                    <i className="fas fa-wallet me-2"></i>
                    Redeem Funds
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {/* Balance Summary */}
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="bg-success text-white">
                      <Card.Body className="text-center">
                        <h6>Available Balance</h6>
                        <h3>${(availableBalance || 0).toFixed(2)}</h3>
                        <small>Ready for redemption</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="bg-warning text-white">
                      <Card.Body className="text-center">
                        <h6>Pending Balance</h6>
                        <h3>${(pendingBalance || 0).toFixed(2)}</h3>
                        <small>Awaiting approval</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="bg-info text-white">
                      <Card.Body className="text-center">
                        <h6>Total Redeemed</h6>
                        <h3>${(earnings - availableBalance - pendingBalance || 0).toFixed(2)}</h3>
                        <small>Already paid out</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="bg-primary text-white">
                      <Card.Body className="text-center">
                        <h6>Total Earnings</h6>
                        <h3>${(earnings || 0).toFixed(2)}</h3>
                        <small>All time earnings</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Payment History */}
                <h6 className="mb-3">Payment History</h6>
                {paymentHistory.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="bg-light">
                        <tr>
                          <th>Payment ID</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Requested Date</th>
                          <th>Processed Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment) => (
                          <tr key={payment._id}>
                            <td>
                              <strong>#{payment._id.slice(-8)}</strong>
                            </td>
                            <td>
                              <strong>${payment.amount?.toFixed(2)}</strong>
                            </td>
                            <td>
                              <Badge bg="info">
                                {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={getStatusColor(payment.status)}>
                                {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                              </Badge>
                            </td>
                            <td>
                              {payment.requestedAt ? formatDateTime(payment.requestedAt) : 'N/A'}
                            </td>
                            <td>
                              {payment.processedAt ? formatDateTime(payment.processedAt) : 'Pending'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-money-bill-wave fa-3x text-muted mb-3"></i>
                    <h5>No payment history yet</h5>
                    <p className="text-muted">
                      Your payment redemption requests will appear here.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* Car Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingCar ? "Edit Car" : "Add New Car"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCarSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Car Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={carForm.name}
                    onChange={(e) =>
                      setCarForm({ ...carForm, name: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={carForm.brand}
                    onChange={(e) =>
                      setCarForm({ ...carForm, brand: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={carForm.model}
                    onChange={(e) =>
                      setCarForm({ ...carForm, model: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year *</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min="2000"
                    max="2024"
                    value={carForm.year}
                    onChange={(e) =>
                      setCarForm({ ...carForm, year: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price per Day ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={carForm.price}
                    onChange={(e) =>
                      setCarForm({ ...carForm, price: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Seats *</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min="2"
                    max="9"
                    value={carForm.seats}
                    onChange={(e) =>
                      setCarForm({ ...carForm, seats: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Transmission *</Form.Label>
                  <Form.Select
                    value={carForm.transmission}
                    onChange={(e) =>
                      setCarForm({ ...carForm, transmission: e.target.value })
                    }
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fuel Type *</Form.Label>
                  <Form.Select
                    value={carForm.fuelType}
                    onChange={(e) =>
                      setCarForm({ ...carForm, fuelType: e.target.value })
                    }
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Car Type *</Form.Label>
                  <Form.Select
                    value={carForm.carType}
                    onChange={(e) =>
                      setCarForm({ ...carForm, carType: e.target.value })
                    }
                    required
                  >
                    <option value="economy">Economy</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury</option>
                    <option value="sports">Sports</option>
                    <option value="van">Van</option>
                    <option value="convertible">Convertible</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Image *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  required
                  value={carForm.image}
                  onChange={(e) =>
                    setCarForm({ ...carForm, image: e.target.value })
                  }
                  placeholder="Image URL or upload file"
                />
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <div className="text-muted mt-1">Uploading image...</div>
              )}
              {carForm.image && (
                <div className="mt-2">
                  <img
                    src={carForm.image}
                    alt="Preview"
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                    }}
                    className="rounded"
                  />
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={carForm.description}
                onChange={(e) =>
                  setCarForm({ ...carForm, description: e.target.value })
                }
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Available for booking"
              checked={carForm.available}
              onChange={(e) =>
                setCarForm({ ...carForm, available: e.target.checked })
              }
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : editingCar ? "Update Car" : "Add Car"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Payment Redemption Modal */}
      <Modal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Redeem Payment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRedeemPayment}>
          <Modal.Body>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Available balance: <strong>${(availableBalance || 0).toFixed(2)}</strong>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Amount to Redeem *</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  required
                  min="1"
                  max={availableBalance}
                  step="0.01"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder={`Maximum: $${(availableBalance || 0).toFixed(2)}`}
                />
              </InputGroup>
              <Form.Text className="text-muted">
                Minimum redemption amount: $1.00
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
              </Form.Select>
            </Form.Group>

            {paymentMethod === "bank_transfer" && (
              <>
                <h6 className="mb-3">Bank Details</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Holder Name *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={bankDetails.accountName}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            accountName: e.target.value,
                          })
                        }
                        placeholder="John Doe"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Number *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={bankDetails.accountNumber}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            accountNumber: e.target.value,
                          })
                        }
                        placeholder="1234567890"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bank Name *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={bankDetails.bankName}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            bankName: e.target.value,
                          })
                        }
                        placeholder="Bank of America"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>IFSC Code *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={bankDetails.ifscCode}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            ifscCode: e.target.value,
                          })
                        }
                        placeholder="ABCD0123456"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {paymentMethod === "upi" && (
              <>
                <h6 className="mb-3">UPI Details</h6>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>UPI ID *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={bankDetails.upiId}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            upiId: e.target.value,
                          })
                        }
                        placeholder="yourname@upi"
                      />
                      <Form.Text className="text-muted">
                        Please ensure your UPI ID is verified and active
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Alert variant="warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  For UPI payments, please ensure your UPI account is verified and linked to your bank account.
                </Alert>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={redeeming || !redeemAmount || parseFloat(redeemAmount) <= 0}
            >
              {redeeming ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-wallet me-2"></i>
                  Redeem ${redeemAmount || "0.00"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default PartnerDashboard;