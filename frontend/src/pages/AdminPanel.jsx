import React, { useState, useEffect } from "react";
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
  Dropdown,
} from "react-bootstrap";
import axios from "axios";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger">
          <h5>Something went wrong</h5>
          <p>{this.state.error?.message}</p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("bookings");
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState({});
  const toggleDropdown = (carId) => {
    setDropdownOpen(prev => ({
      ...prev,
      [carId]: !prev[carId]
    }));
  };
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [carTypeFilter, setCarTypeFilter] = useState("all");
  const filteredCars =
    carTypeFilter === "all"
      ? cars
      : cars.filter((car) => car.carType === carTypeFilter);

  // Ticket Management States
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const [partners, setPartners] = useState([]);

  // Partner Management States
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [showPartnerDetailsModal, setShowPartnerDetailsModal] = useState(false);
  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState(null);
  const [partnerCarsForDetails, setPartnerCarsForDetails] = useState([]);
  const [partnerEarnings, setPartnerEarnings] = useState([]);
  const [partnerCars, setPartnerCars] = useState([]);
  const [showPartnerEarningsModal, setShowPartnerEarningsModal] = useState(false);
  const [selectedPartnerForEarnings, setSelectedPartnerForEarnings] = useState(null);
  const [partnerEarningsDetails, setPartnerEarningsDetails] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null);
const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    if (activeTab === "partnerEarnings") {
      fetchPartnerEarnings();
    }
    if (activeTab === "partners") {
      fetchPartners();
      fetchPartnerCars();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "partners") {
      fetchPartners();
      fetchPartnerCars(); // This ensures fresh data when switching to partners tab
    }
    if (activeTab === "partnerEarnings") {
      fetchPartnerEarnings();
    }
  }, [activeTab]);

  const fetchPartnerEarnings = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/partner-earnings",
        getAuthHeaders()
      );
      setPartnerEarnings(response.data);
    } catch (error) {
      setError("Error fetching partner earnings");
      console.error("Fetch partner earnings error:", error);
    }
  };

    const fetchPaymentRequests = async () => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/admin/payments?status=${paymentFilter}`,
      getAuthHeaders()
    );
    setPaymentRequests(response.data);
  } catch (error) {
    setError("Error fetching payment requests");
    console.error("Fetch payment requests error:", error);
  }
};

useEffect(() => {
  if (activeTab === "payments") {
    fetchPaymentRequests();
  }
}, [activeTab, paymentFilter]);

const handleApprovePayment = async (paymentId) => {
  if (!window.confirm("Are you sure you want to approve this payment?")) {
    return;
  }

  try {
    const transactionId = prompt("Enter transaction ID (optional):");
    await axios.put(
      `http://localhost:5000/api/admin/payments/${paymentId}/approve`,
      { transactionId },
      getAuthHeaders()
    );
    setSuccess("Payment approved successfully!");
    fetchPaymentRequests();
    setShowPaymentDetailsModal(false);
  } catch (error) {
    setError("Error approving payment: " + (error.response?.data?.message || error.message));
  }
};

const handleRejectPayment = async (paymentId) => {
  const reason = prompt("Please provide a reason for rejection:");
  if (!reason) return;

  try {
    await axios.put(
      `http://localhost:5000/api/admin/payments/${paymentId}/reject`,
      { reason },
      getAuthHeaders()
    );
    setSuccess("Payment rejected successfully!");
    fetchPaymentRequests();
    setShowPaymentDetailsModal(false);
  } catch (error) {
    setError("Error rejecting payment: " + (error.response?.data?.message || error.message));
  }
};

const handleMarkProcessing = async (paymentId) => {
  if (!window.confirm("Mark this payment as processing?")) {
    return;
  }

  try {
    await axios.put(
      `http://localhost:5000/api/admin/payments/${paymentId}/processing`,
      {},
      getAuthHeaders()
    );
    setSuccess("Payment marked as processing!");
    fetchPaymentRequests();
    setShowPaymentDetailsModal(false);
  } catch (error) {
    setError("Error updating payment: " + (error.response?.data?.message || error.message));
  }
};

  const fetchPartnerCars = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/partner-cars",
        getAuthHeaders()
      );
      setPartnerCars(response.data);
    } catch (error) {
      setError("Error fetching partner cars");
      console.error("Fetch partner cars error:", error);
    }
  };

  const fetchPartnerDetails = async (partner) => {
    try {
      // Use admin endpoint to get ALL partner cars
      const carsResponse = await axios.get(
        `http://localhost:5000/api/admin/partner-cars`,
        getAuthHeaders()
      );

      // Filter cars for this specific partner and compare string IDs
      const partnerCars = carsResponse.data.filter(
        car => car.partner?._id?.toString() === partner.user._id.toString()
      );

      setSelectedPartnerDetails(partner);
      setPartnerCarsForDetails(partnerCars);
      setShowPartnerDetailsModal(true);
    } catch (error) {
      setError("Error fetching partner details");
      console.error("Fetch partner details error:", error);
    }
  };

  const fetchPartnerEarningsDetails = async (partnerId) => {
    try {
      console.log("Fetching earnings details for partner:", partnerId);
      setSelectedPartnerForEarnings(partnerId);

      const response = await axios.get(
        `http://localhost:5000/api/admin/partner-earnings/${partnerId}/details`,
        getAuthHeaders()
      );

      console.log("Earnings details response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setPartnerEarningsDetails(response.data);
        setShowPartnerEarningsModal(true);
      } else {
        console.log("No data or invalid format:", response.data);
        setError("No earnings details found for this partner");
      }
    } catch (error) {
      console.error("Fetch partner earnings details error:", error);
      setError("Error fetching partner earnings details: " + (error.response?.data?.message || error.message));
    }
  };

  // Add partner car management functions
  const handleDeletePartnerCar = async (carId) => {
    if (window.confirm("Are you sure you want to delete this partner car?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/admin/partner-cars/${carId}`,
          getAuthHeaders()
        );
        setSuccess("Partner car deleted successfully");
        fetchPartnerCars();
      } catch (error) {
        setError("Error deleting partner car");
      }
    }
  };

  const handleTogglePartnerCarAvailability = async (carId, available, adminDeactivated) => {
    try {
      let updateData = {};
      let successMessage = "";

      if (adminDeactivated) {
        updateData = { available: false, adminDeactivated: true };
        successMessage = "Car deactivated by admin. Partner cannot reactivate it.";
      } else if (available === true) {
        updateData = { available: true, adminDeactivated: false };
        successMessage = "Car activated successfully";
      } else if (available === false) {
        updateData = { available: false, adminDeactivated: false };
        successMessage = "Car marked as rented";
      }

      // Make the API call
      await axios.put(
        `http://localhost:5000/api/admin/partner-cars/${carId}/availability`,
        updateData,
        getAuthHeaders()
      );

      setSuccess(successMessage);

      // Refresh the cars list using the CORRECT endpoint
      const carsResponse = await axios.get(
        `http://localhost:5000/api/admin/partner-cars`,
        getAuthHeaders()
      );

      // Filter for this specific partner using string comparison
      const filteredCars = carsResponse.data.filter(
        car => car.partner?._id?.toString() === selectedPartnerDetails.user._id.toString()
      );

      setPartnerCarsForDetails(filteredCars);

      // Close dropdown
      setDropdownOpen(prev => ({ ...prev, [carId]: false }));

    } catch (error) {
      console.error("Update car status error:", error);
      setError("Error updating car status: " + (error.response?.data?.message || error.message));

      // Refresh data on error too
      const carsResponse = await axios.get(
        `http://localhost:5000/api/admin/partner-cars`,
        getAuthHeaders()
      );

      const filteredCars = carsResponse.data.filter(
        car => car.partner?._id?.toString() === selectedPartnerDetails.user._id.toString()
      );
      setPartnerCarsForDetails(filteredCars);
    }
  };

  // Car form state
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
  const [uploading, setUploading] = useState(false);

  // Booking filter states
  const [bookingFilter, setBookingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      fetchCars();
      fetchUsers();
      fetchBookings();
      fetchTickets();
    })();
  }, []);

  useEffect(() => {
    if (activeTab === "partners") {
      fetchPartners();
    }
  }, [activeTab, partnerFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchCars = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/cars");
      const sortedCars = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setCars(sortedCars);
    } catch (error) {
      setError("Error fetching cars");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/users",
        getAuthHeaders()
      );
      setUsers(response.data);
    } catch (error) {
      setError("Error fetching users");
      console.error("Fetch users error:", error);
    }
  };

  const filteredPartners =
    partnerFilter === "all"
      ? partners
      : partners.filter((partner) => partner.status === partnerFilter);

  // Add partner status update handler
  const handlePartnerStatusUpdate = async (partnerId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/partners/${partnerId}/status`,
        { status: newStatus },
        getAuthHeaders()
      );

      setSuccess(`Partner application ${newStatus} successfully`);
      fetchPartners(); // Refresh the partners list
      fetchUsers(); // Always refresh users to get updated partner status

    } catch (error) {
      setError(
        "Error updating partner status: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  // Add partner deletion handler
  const handleDeletePartner = async (partnerId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this partner application?"
      )
    ) {
      try {
        await axios.delete(
          `http://localhost:5000/api/admin/partners/${partnerId}`,
          getAuthHeaders()
        );
        setSuccess("Partner application deleted successfully");
        fetchPartners();
      } catch (error) {
        setError("Error deleting partner application");
      }
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/partners?status=${partnerFilter}`,
        getAuthHeaders()
      );
      setPartners(response.data);
    } catch (error) {
      setError("Error fetching partners");
      console.error("Fetch partners error:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/bookings",
        getAuthHeaders()
      );
      setBookings(response.data);
    } catch (error) {
      setError("Error fetching bookings");
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tickets?status=${ticketFilter}`,
        getAuthHeaders()
      );
      setTickets(response.data);
    } catch (error) {
      setError("Error fetching tickets");
    }
  };

  // Filter tickets based on status and search
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticketSearch === "" ||
      ticket.user?.name?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.issue?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket._id?.toLowerCase().includes(ticketSearch.toLowerCase());

    return matchesSearch;
  });

  // Payment Status Management
  const handleUpdatePaymentStatus = async (bookingId, paymentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/payment-status`,
        { paymentStatus },
        getAuthHeaders()
      );
      setSuccess(`Payment status updated to ${paymentStatus}`);
      fetchBookings();
    } catch (error) {
      setError(
        "Error updating payment status: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "secondary",
      processing: "warning",
      paid: "success",
      failed: "danger",
      refunded: "info",
      cancelled: "dark",
    };
    return colors[status] || "secondary";
  };

  // Ticket Management Functions
  const openTicketDetails = async (ticket) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tickets/${ticket._id}`,
        getAuthHeaders()
      );
      setSelectedTicket(response.data);
      setShowTicketModal(true);
    } catch (error) {
      setError("Error fetching ticket details");
    }
  };

  const handleTicketStatusUpdate = async (ticketId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/tickets/${ticketId}/status`,
        { status: newStatus },
        getAuthHeaders()
      );
      setSuccess(`Ticket status updated to ${newStatus}`);
      fetchTickets();
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      setError("Error updating ticket status");
    }
  };

  const handleTicketReply = async () => {
    if (!ticketReply.trim()) {
      setError("Reply message cannot be empty");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/tickets/${selectedTicket._id}/reply`,
        { message: ticketReply },
        getAuthHeaders()
      );
      setSuccess("Reply sent successfully");
      setTicketReply("");
      fetchTickets();
      // Refresh the selected ticket
      const response = await axios.get(
        `http://localhost:5000/api/tickets/${selectedTicket._id}`,
        getAuthHeaders()
      );
      setSelectedTicket(response.data);
    } catch (error) {
      setError("Error sending reply");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/tickets/${ticketId}`,
          getAuthHeaders()
        );
        setSuccess("Ticket deleted successfully");
        fetchTickets();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setShowTicketModal(false);
        }
      } catch (error) {
        setError("Error deleting ticket");
      }
    }
  };

  const getTicketStatusColor = (status) => {
    const colors = {
      open: "warning",
      in_progress: "info",
      closed: "success",
    };
    return colors[status] || "secondary";
  };

  const formatTicketDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Existing functions remain the same...
  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus =
      bookingFilter === "all" || booking.status === bookingFilter;
    const matchesSearch =
      searchQuery === "" ||
      booking.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.car?.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.car?.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking._id?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

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

      if (editingCar) {
        await axios.put(
          `http://localhost:5000/api/cars/${editingCar._id}`,
          carData,
          getAuthHeaders()
        );
        setSuccess("Car updated successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/cars",
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
      });
      fetchCars();
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
      formData.append("image", file);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/upload",
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

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
    });
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
      };

      if (userForm.password && userForm.password.trim() !== "") {
        body.password = userForm.password;
      }

      await axios.put(
        `http://localhost:5000/api/users/${editingUser._id}`,
        body,
        getAuthHeaders()
      );
      setSuccess("User updated successfully!");
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ name: "", email: "", phone: "", password: "" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
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
    });
    setShowModal(true);
  };

  const handleDeleteCar = async (carId) => {
    if (window.confirm("Are you sure you want to delete this car?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/cars/${carId}`,
          getAuthHeaders()
        );
        setSuccess("Car deleted successfully!");
        fetchCars();
      } catch {
        setError("Error deleting car");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/users/${userId}`,
          getAuthHeaders()
        );
        setSuccess("User deleted successfully!");
        fetchUsers();
      } catch {
        setError("Error deleting user");
      }
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        { status },
        getAuthHeaders()
      );
      setSuccess(`Booking status updated to ${status} successfully!`);
      fetchBookings();
      fetchCars();
    } catch (error) {
      setError(
        "Error updating booking status: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleQuickStatusUpdate = async (bookingId, newStatus) => {
    if (
      window.confirm(
        `Are you sure you want to change the status to ${newStatus}?`
      )
    ) {
      await handleUpdateBookingStatus(bookingId, newStatus);
    }
  };

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleDeleteBooking = async (bookingId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this booking? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(
          `http://localhost:5000/api/bookings/${bookingId}`,
          getAuthHeaders()
        );
        setSuccess("Booking deleted successfully!");
        fetchBookings();
        fetchCars();
      } catch (error) {
        setError(
          "Error deleting booking: " +
          (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    setDownloadingInvoice(bookingId);
    setError("");

    try {
      // Fetch actual invoice data from server
      const response = await axios.get(
        `http://localhost:5000/api/bookings/${bookingId}/invoice`,
        getAuthHeaders()
      );

      const invoiceData = response.data;

      // Generate and show the invoice
      generateInvoiceHTML(invoiceData);
    } catch (error) {
      console.error("Invoice generation error:", error);

      // Fallback: Use local data if API fails
      const booking = bookings.find((b) => b._id === bookingId);
      if (booking) {
        let carImageUrl = booking.car?.image || "";
        if (carImageUrl && carImageUrl.startsWith("/uploads")) {
          carImageUrl = `http://localhost:5000${carImageUrl}`;
        }

        const fallbackInvoiceData = {
          invoiceNumber: `INV-${booking._id
            .toString()
            .slice(-8)
            .toUpperCase()}`,
          invoiceDate: booking.createdAt
            ? new Date(booking.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            : new Date().toLocaleDateString(),
          bookingId: booking._id,
          customer: {
            name: booking.user?.name || "Customer",
            email: booking.user?.email || "N/A",
            phone: booking.user?.phone || "N/A",
          },
          car: {
            brand: booking.car?.brand || "N/A",
            model: booking.car?.model || "N/A",
            name: booking.car?.name || "N/A",
            year: booking.car?.year || "N/A",
            image: carImageUrl,
          },
          rentalDetails: {
            startDate: formatDate(booking.startDate),
            endDate: formatDate(booking.endDate),
            totalDays: booking.totalDays,
            pricePerDay: booking.car?.price || 0,
            totalAmount: booking.totalAmount,
          },
          company: {
            name: "CarRental",
            address: "Surat, Gujarat",
            phone: "+91 98751 96322",
            email: "info@carrental.com",
          },
        };

        generateInvoiceHTML(fallbackInvoiceData);
      } else {
        setError("Error generating invoice: Booking not found");
      }
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const generateInvoiceHTML = (invoiceData) => {
    const printWindow = window.open("", "_blank");

    const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - ${invoiceData.invoiceNumber}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                color: #333; 
                line-height: 1.6;
            }
            .header { 
                border-bottom: 2px solid #007bff; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .company-info { 
                text-align: right; 
            }
            .invoice-details { 
                margin: 30px 0; 
            }
            .section { 
                margin: 20px 0; 
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left; 
            }
            th { 
                background-color: #f8f9fa; 
            }
            .total { 
                font-weight: bold; 
                font-size: 1.2em; 
            }
            .footer { 
                margin-top: -40px; 
                padding-top: 20px;
                text-align: center; 
                color: #666; 
            }
            .car-image-container {
                text-align: center;
               margin-top: -200px;
            }
            .car-image {
                max-width: 500px;
                max-height: 500px;
                object-fit: cover;
                border-radius: 8px;
                border: 1px solid #ddd;
            }
            .car-details {
                display: flex;
                gap: 20px;
                align-items: flex-start;
                margin-top: -10px;
            }
            .car-info {
                flex: 1;
            }
                .desc{
                margin-top: -30px;
                }
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1>CAR RENTAL INVOICE</h1>
                <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber
      }</p>
                <p><strong>Invoice Date:</strong> ${invoiceData.invoiceDate}</p>
                <p><strong>Booking ID:</strong> ${invoiceData.bookingId}</p>
            </div>
            <div class="company-info">
                <h3>${invoiceData.company.name}</h3>
                <p>${invoiceData.company.address}</p>
                <p>${invoiceData.company.phone}</p>
                <p>${invoiceData.company.email}</p>
            </div>
        </div>

        <div class="section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${invoiceData.customer.name}</p>
            <p><strong>Email:</strong> ${invoiceData.customer.email}</p>
            <p><strong>Phone:</strong> ${invoiceData.customer.phone}</p>
        </div>

        <div class="section">
            <h3>Vehicle Information</h3>
            <div class="car-details">
                <div class="car-info">
                    <p><strong>Brand:</strong> ${invoiceData.car.brand}</p>
                    <p><strong>Model:</strong> ${invoiceData.car.model}</p>
                    <p><strong>Car Name:</strong> ${invoiceData.car.name}</p>
                    <p><strong>Year:</strong> ${invoiceData.car.year}</p>
                </div>
                ${invoiceData.car.image && invoiceData.car.image !== "N/A"
        ? `
                <div class="car-image-container">
                    <img src="${invoiceData.car.image}" alt="${invoiceData.car.brand} ${invoiceData.car.model}" class="car-image" />
                </div>
                `
        : ""
      }
            </div>
        </div>

        <div class="section desc">
            <h3>Rental Details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Details</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Car Rental (${invoiceData.rentalDetails.totalDays
      } days)</td>
                        <td>${invoiceData.rentalDetails.startDate} to ${invoiceData.rentalDetails.endDate
      }</td>
                        <td>$${invoiceData.rentalDetails.pricePerDay}/day</td>
                    </tr>
                    <tr class="total">
                        <td colspan="2" style="text-align: right;">Total Amount:</td>
                        <td>$${invoiceData.rentalDetails.totalAmount}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Thank you for choosing ${invoiceData.company.name
      }! For any queries, contact ${invoiceData.company.phone}</p>
            <p><em>This is a computer-generated invoice. No signature required.</em></p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Print Invoice
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                Close
            </button>
        </div>
    </body>
    </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      confirmed: "info",
      active: "success",
      completed: "secondary",
      cancelled: "danger",
    };
    return colors[status] || "secondary";
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusOptions = (currentStatus) => {
    const allStatuses = [
      "pending",
      "confirmed",
      "active",
      "completed",
      "cancelled",
    ];
    return allStatuses.filter((status) => status !== currentStatus);
  };

  const getPaymentStatusOptions = (currentStatus) => {
    const allStatuses = [
      "pending",
      "processing",
      "paid",
      "failed",
      "refunded",
      "cancelled",
    ];
    return allStatuses.filter((status) => status !== currentStatus);
  };

  const getBookingStats = () => ({
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    active: bookings.filter((b) => b.status === "active").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  });

  const stats = getBookingStats();

  const handleRoleChange = async (userId, newRole) => {
    if (
      window.confirm(
        `Are you sure you want to change this user's role to ${newRole ? "Admin" : "User"
        }?`
      )
    ) {
      try {
        const response = await axios.put(
          `http://localhost:5000/api/users/${userId}/role`,
          { isAdmin: newRole },
          getAuthHeaders()
        );

        setSuccess(response.data.message);
        await fetchUsers();

        const currentUser = JSON.parse(localStorage.getItem("user"));

        if (currentUser && currentUser.id === userId) {
          try {
            const refreshResponse = await axios.post(
              "http://localhost:5000/api/refresh-token",
              {},
              getAuthHeaders()
            );

            const { token, user: updatedUser } = refreshResponse.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            setSuccess(
              (prev) =>
                prev + " Your permissions have been updated successfully!"
            );

            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } catch (refreshError) {
            setError(
              "Role changed but failed to refresh session. Please log out and log in again."
            );
          }
        }
      } catch (error) {
        setError(error.response?.data?.message || "Error changing user role");
      }
    }
  };

  // Refresh tickets when filter changes
  useEffect(() => {
    fetchTickets();
  }, [ticketFilter]);

  return (
    <Container className="py-5" style={{ marginTop: "50px" }}>
      <Row>
        <Col>
          <h2 className="mb-4">Admin Panel</h2>

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

          {/* Navigation Tabs */}
          <Card className="mb-4">
            <Card.Body className="p-0">
              <Nav
                variant="tabs"
                className="flex-nowrap mb-0"
                style={{
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  flexWrap: "nowrap",
                  display: "flex",
                }}
              >
                <Nav.Item
                  style={{
                    display: "inline-block",
                    float: "none",
                    flexShrink: 0,
                  }}
                >
                  <Nav.Link
                    active={activeTab === "bookings"}
                    onClick={() => setActiveTab("bookings")}
                    style={{ display: "inline-block" }}
                  >
                    Booking Management
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item
                  style={{
                    display: "inline-block",
                    float: "none",
                    flexShrink: 0,
                  }}
                >
                  <Nav.Link
                    active={activeTab === "tickets"}
                    onClick={() => setActiveTab("tickets")}
                    style={{ display: "inline-block" }}
                  >
                    Ticket Management
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item
                  style={{
                    display: "inline-block",
                    float: "none",
                    flexShrink: 0,
                  }}
                >
                  <Nav.Link
                    active={activeTab === "cars"}
                    onClick={() => setActiveTab("cars")}
                    style={{ display: "inline-block" }}
                  >
                    Car Management
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item
                  style={{
                    display: "inline-block",
                    float: "none",
                    flexShrink: 0,
                  }}
                >
                  <Nav.Link
                    active={activeTab === "users"}
                    onClick={() => setActiveTab("users")}
                    style={{ display: "inline-block" }}
                  >
                    User Management
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item
                  style={{
                    display: "inline-block",
                    float: "none",
                    flexShrink: 0,
                  }}
                >
                  <Nav.Link
                    active={activeTab === "partners"}
                    onClick={() => setActiveTab("partners")}
                    style={{ display: "inline-block" }}
                  >
                    Partner Management
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item
                  style={{
                    display: "inline-block",
                    float: "none",
                    flexShrink: 0,
                  }}
                >
                  <Nav.Link
                    active={activeTab === "partnerEarnings"}
                    onClick={() => setActiveTab("partnerEarnings")}
                    style={{ display: "inline-block" }}
                  >
                    Partner Earnings
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item
                  style={{
                    display: "inline-block",
                    float: "none",
                    flexShrink: 0,
                  }}
                >
                  <Nav.Link
                    active={activeTab === "payments"}
                    onClick={() => setActiveTab("payments")}
                    style={{ display: "inline-block" }}
                  >
                    Payment Requests
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>


                  {/* Payment Requests Tab */}
{activeTab === "payments" && (
  <>
    {/* Statistics Cards */}
    <Row className="mb-4">
      <Col md={3}>
        <Card className="bg-warning text-white">
          <Card.Body className="text-center">
            <h6>Pending</h6>
            <h3>{paymentRequests.filter(p => p.status === 'pending').length}</h3>
            <small>
              ${paymentRequests
                .filter(p => p.status === 'pending')
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)}
            </small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="bg-info text-white">
          <Card.Body className="text-center">
            <h6>Processing</h6>
            <h3>{paymentRequests.filter(p => p.status === 'processing').length}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="bg-success text-white">
          <Card.Body className="text-center">
            <h6>Paid</h6>
            <h3>{paymentRequests.filter(p => p.status === 'paid').length}</h3>
            <small>
              ${paymentRequests
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)}
            </small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="bg-primary text-white">
          <Card.Body className="text-center">
            <h6>Total Requests</h6>
            <h3>{paymentRequests.length}</h3>
          </Card.Body>
        </Card>
      </Col>
    </Row>

    {/* Payment Requests Table */}
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Payment Requests</h5>
        <Form.Select
          style={{ width: '200px' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </Form.Select>
      </Card.Header>
      <Card.Body>
        {paymentRequests.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-wallet fa-3x text-muted mb-3"></i>
            <h5>No payment requests found</h5>
            <p className="text-muted">Payment redemption requests will appear here</p>
          </div>
        ) : (
          <Table responsive hover>
            <thead className="bg-light">
              <tr>
                <th>Payment ID</th>
                <th>Partner</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Processed</th>
                <th style={{ width: '250px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <code>#{payment._id.slice(-8)}</code>
                  </td>
                  <td>
                    <strong>{payment.partner?.name}</strong>
                    <br />
                    <small className="text-muted">{payment.partner?.email}</small>
                  </td>
                  <td>
                    <strong className="text-success">${payment.amount?.toFixed(2)}</strong>
                  </td>
                  <td>
                    <Badge bg="secondary">
                      {payment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={getPaymentStatusColor(payment.status)}>
                      {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <small>{formatDate(payment.requestedAt)}</small>
                  </td>
                  <td>
                    <small>{payment.processedAt ? formatDate(payment.processedAt) : 'N/A'}</small>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedPaymentRequest(payment);
                          setShowPaymentDetailsModal(true);
                        }}
                      >
                        View Details
                      </Button>
                      
                      {payment.status === 'pending' && (
                        <>
                          <div className="d-flex gap-1">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApprovePayment(payment._id)}
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRejectPayment(payment._id)}
                            >
                              ✗ Reject
                            </Button>
                          </div>
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleMarkProcessing(payment._id)}
                          >
                            Processing
                          </Button>
                        </>
                      )}
                      
                      {payment.status === 'processing' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprovePayment(payment._id)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  </>
)}

          {/* Booking Management Tab */}
          {activeTab === "bookings" && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Manage Bookings</h5>
                <div className="d-flex gap-2">
                  <InputGroup style={{ width: "300px" }}>
                    <Form.Control
                      placeholder="Search by customer, car, or booking ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: "300px", backgroundColor: "white" }}
                    />
                  </InputGroup>
                  <Form.Select
                    style={{ width: "200px" }}
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Car</th>
                      <th>Dates</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment Status</th>
                      <th>Created</th>
                      <th style={{ width: "220px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>
                          <small>#{booking._id.slice(-8)}</small>
                        </td>
                        <td>
                          <div>
                            <strong>{booking.user?.name || "N/A"}</strong>
                            <br />
                            <small className="text-muted">
                              {booking.user?.email || "N/A"}
                            </small>
                            <br />
                            <small className="text-muted">
                              {booking.user?.phone || "N/A"}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={booking.car?.image || "/placeholder-car.jpg"}
                              alt={booking.car?.name || "Car"}
                              style={{
                                width: "60px",
                                height: "40px",
                                objectFit: "cover",
                              }}
                              className="rounded me-2"
                            />
                            <div>
                              <strong>
                                {booking.car?.brand || "N/A"}{" "}
                                {booking.car?.model || "N/A"}
                              </strong>
                              <br />
                              <small className="text-muted">
                                ${booking.car?.price || "0"}/day
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <small>
                            <strong>From:</strong>{" "}
                            {formatDate(booking.startDate)}
                            <br />
                            <strong>To:</strong> {formatDate(booking.endDate)}
                            <br />
                            <strong>Days:</strong> {booking.totalDays}
                          </small>
                        </td>
                        <td>${booking.totalAmount}</td>
                        <td>
                          <Badge bg={getStatusColor(booking.status)}>
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={getPaymentStatusColor(booking.paymentStatus)}
                          >
                            {booking.paymentStatus.charAt(0).toUpperCase() +
                              booking.paymentStatus.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <small>{formatDate(booking.createdAt)}</small>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openBookingDetails(booking)}
                            >
                              View Details
                            </Button>

                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDownloadInvoice(booking._id)}
                              disabled={downloadingInvoice === booking._id}
                            >
                              {downloadingInvoice === booking._id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-file-invoice me-1"></i>
                                  Invoice
                                </>
                              )}
                            </Button>

                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                size="sm"
                                id="dropdown-status"
                              >
                                Change Status
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {getStatusOptions(booking.status).map(
                                  (status) => (
                                    <Dropdown.Item
                                      key={status}
                                      onClick={() =>
                                        handleQuickStatusUpdate(
                                          booking._id,
                                          status
                                        )
                                      }
                                    >
                                      Set as{" "}
                                      {status.charAt(0).toUpperCase() +
                                        status.slice(1)}
                                    </Dropdown.Item>
                                  )
                                )}
                              </Dropdown.Menu>
                            </Dropdown>

                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-info"
                                size="sm"
                                id="dropdown-payment-status"
                              >
                                Payment Status
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {getPaymentStatusOptions(
                                  booking.paymentStatus
                                ).map((status) => (
                                  <Dropdown.Item
                                    key={status}
                                    onClick={() =>
                                      handleUpdatePaymentStatus(
                                        booking._id,
                                        status
                                      )
                                    }
                                  >
                                    Set as{" "}
                                    {status.charAt(0).toUpperCase() +
                                      status.slice(1)}
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            </Dropdown>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteBooking(booking._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {filteredBookings.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No bookings found.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Ticket Management Tab */}
          {activeTab === "tickets" && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Support Tickets</h5>
                <div className="d-flex gap-2">
                  <InputGroup style={{ width: "300px" }}>
                    <Form.Control
                      placeholder="Search by customer, issue, or ticket ID..."
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      style={{ width: "300px", backgroundColor: "white" }}
                    />
                  </InputGroup>
                  <Form.Select
                    style={{ width: "200px" }}
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Customer</th>
                      <th>Issue</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Updated</th>
                      <th style={{ width: "150px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket._id}>
                        <td>
                          <small>#{ticket._id.slice(-8)}</small>
                        </td>
                        <td>
                          <div>
                            <strong>{ticket.user?.name || "N/A"}</strong>
                            <br />
                            <small className="text-muted">
                              {ticket.user?.email || "N/A"}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: "300px" }}>
                            <strong>{ticket.issue.substring(0, 100)}...</strong>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getTicketStatusColor(ticket.status)}>
                            {ticket.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <small>{formatTicketDate(ticket.createdAt)}</small>
                        </td>
                        <td>
                          <small>{formatTicketDate(ticket.updatedAt)}</small>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openTicketDetails(ticket)}
                            >
                              View Details
                            </Button>
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                size="sm"
                              >
                                Change Status
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  onClick={() =>
                                    handleTicketStatusUpdate(ticket._id, "open")
                                  }
                                >
                                  Set as Open
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() =>
                                    handleTicketStatusUpdate(
                                      ticket._id,
                                      "in_progress"
                                    )
                                  }
                                >
                                  Set as In Progress
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() =>
                                    handleTicketStatusUpdate(
                                      ticket._id,
                                      "closed"
                                    )
                                  }
                                >
                                  Set as Closed
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteTicket(ticket._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {filteredTickets.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No tickets found.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Car Management Tab */}
          {activeTab === "cars" && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Manage Cars</h5>
                <Button variant="primary" onClick={openAddCarModal}>
                  Add New Car
                </Button>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Brand</th>
                      <th>Model</th>
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
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FyIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                            }}
                          />
                        </td>
                        <td>{car.name}</td>
                        <td>{car.brand}</td>
                        <td>{car.model}</td>
                        <td>
                          <Badge
                            bg={
                              car.carType === "luxury"
                                ? "primary"
                                : car.carType === "suv"
                                  ? "success"
                                  : car.carType === "economy"
                                    ? "secondary"
                                    : car.carType === "sports"
                                      ? "danger"
                                      : car.carType === "van"
                                        ? "warning"
                                        : car.carType === "convertible"
                                          ? "info"
                                          : "dark"
                            }
                          >
                            {car.carType
                              ? car.carType.charAt(0).toUpperCase() +
                              car.carType.slice(1)
                              : "Standard"}
                          </Badge>
                        </td>
                        <td>{car.year}</td>
                        <td>${car.price}</td>
                        <td>
                          <Badge bg={car.available ? "success" : "danger"}>
                            {car.available ? "Available" : "Not Available"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditCar(car)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteCar(car._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Manage Users</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone || "N/A"}</td>
                        <td>
                          <Badge bg={user.isAdmin ? "primary" : "secondary"}>
                            {user.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openEditUser(user)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant={
                                user.isAdmin
                                  ? "outline-warning"
                                  : "outline-info"
                              }
                              size="sm"
                              onClick={() =>
                                handleRoleChange(user._id, !user.isAdmin)
                              }
                            >
                              Make {user.isAdmin ? "User" : "Admin"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Partner Management Tab */}
          {activeTab === "partners" && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Partner Management</h5>
                <div className="d-flex gap-2">
                  <Form.Select
                    style={{ width: "200px" }}
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Partner Info</th>
                      <th>Application Status</th>
                      <th>Cars</th>
                      <th>Location</th>
                      <th>Applied</th>
                      <th style={{ width: "250px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.map((partner) => (
                      <tr key={partner._id}>
                        <td>
                          <strong>{partner.user?.name}</strong>
                          <br />
                          <small className="text-muted">
                            {partner.user?.email}
                          </small>
                          <br />
                          <small className="text-muted">
                            {partner.user?.phone || "N/A"}
                          </small>
                        </td>
                        <td>
                          <Badge
                            bg={
                              partner.status === "approved"
                                ? "success"
                                : partner.status === "rejected"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {partner.status.toUpperCase()}
                          </Badge>
                          {partner.approvedAt && (
                            <div>
                              <small className="text-muted">
                                {formatDate(partner.approvedAt)}
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge bg="info">
                            {partnerCars.filter(car => car.partner?._id?.toString() === partner.user?._id?.toString()).length} cars
                          </Badge>
                        </td>
                        <td>
                          <small>
                            {partner.city}, {partner.state}
                            <br />
                            {partner.country}
                          </small>
                        </td>
                        <td>
                          <small>{formatDate(partner.createdAt)}</small>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => fetchPartnerDetails(partner)}
                            >
                              <i className="fas fa-eye me-1"></i>
                              View Details
                            </Button>

                            {partner.status === "pending" && (
                              <div className="d-flex gap-1">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() =>
                                    handlePartnerStatusUpdate(
                                      partner._id,
                                      "approved"
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handlePartnerStatusUpdate(
                                      partner._id,
                                      "rejected"
                                    )
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            )}

                            {(partner.status === "approved" ||
                              partner.status === "rejected") && (
                                <Dropdown>
                                  <Dropdown.Toggle
                                    variant="outline-secondary"
                                    size="sm"
                                  >
                                    Change Status
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    {partner.status !== "pending" && (
                                      <Dropdown.Item
                                        onClick={() =>
                                          handlePartnerStatusUpdate(
                                            partner._id,
                                            "pending"
                                          )
                                        }
                                      >
                                        Set to Pending
                                      </Dropdown.Item>
                                    )}
                                    {partner.status !== "approved" && (
                                      <Dropdown.Item
                                        onClick={() =>
                                          handlePartnerStatusUpdate(
                                            partner._id,
                                            "approved"
                                          )
                                        }
                                      >
                                        Approve
                                      </Dropdown.Item>
                                    )}
                                    {partner.status !== "rejected" && (
                                      <Dropdown.Item
                                        onClick={() =>
                                          handlePartnerStatusUpdate(
                                            partner._id,
                                            "rejected"
                                          )
                                        }
                                      >
                                        Reject
                                      </Dropdown.Item>
                                    )}
                                  </Dropdown.Menu>
                                </Dropdown>
                              )}

                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeletePartner(partner._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {filteredPartners.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No partner applications found.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Partner Earnings Tab */}
          {activeTab === "partnerEarnings" && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Partner Earnings & Commission</h5>
                <Badge bg="success">
                  Total Platform Earnings: $
                  {partnerEarnings
                    .reduce(
                      (total, partner) => total + partner.platformEarnings,
                      0
                    )
                    .toFixed(2)}
                </Badge>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Partner Info</th>
                      <th>Partner ID</th>
                      <th>Total Bookings</th>
                      <th>Partner Earnings</th>
                      <th>Platform Earnings</th>
                      <th>Commission Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerEarnings.map((partner) => (
                      <tr key={partner._id}>
                        <td>
                          <strong>{partner.user?.name}</strong>
                          <br />
                          <small className="text-muted">
                            {partner.user?.email}
                          </small>
                          <br />
                          <Badge
                            bg={
                              partner.status === "approved"
                                ? "success"
                                : "warning"
                            }
                          >
                            {partner.status}
                          </Badge>
                        </td>
                        <td>
                          <code>{partner._id.slice(-8)}</code>
                          <br />
                          <small className="text-muted">
                            User: {partner.user?._id?.slice(-8)}
                          </small>
                        </td>
                        <td>
                          <strong>{partner.totalBookings}</strong> bookings
                        </td>
                        <td>
                          <strong className="text-success">
                            ${partner.partnerEarnings.toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <strong className="text-primary">
                            ${partner.platformEarnings.toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <Badge bg="info">{partner.commissionRate}%</Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() =>
                              fetchPartnerEarningsDetails(partner._id)
                            }
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {partnerEarnings.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No partner earnings data found.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <ErrorBoundary>
        {/* Partner Earnings Details Modal */}
        <Modal
          show={showPartnerEarningsModal}
          onHide={() => {
            setShowPartnerEarningsModal(false);
            setPartnerEarningsDetails([]);
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Partner Earnings Details
              {selectedPartnerForEarnings && (
                <small className="text-muted ms-2">
                  (Partner ID: {selectedPartnerForEarnings.slice(-8)})
                </small>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {partnerEarningsDetails.length > 0 ? (
              <div>
                <h6>Booking Breakdown</h6>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Car</th>
                      <th>Dates</th>
                      <th>Total Amount</th>
                      <th>Partner Share</th>
                      <th>Platform Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerEarningsDetails.map((booking, index) => (
                      <tr key={index}>
                        <td>
                          <small>#{booking.bookingId}</small>
                        </td>
                        <td>{booking.carName}</td>
                        <td>
                          <small>
                            {formatDate(booking.startDate)} to{" "}
                            {formatDate(booking.endDate)}
                          </small>
                        </td>
                        <td>${booking.totalAmount}</td>
                        <td className="text-success">${booking.partnerShare}</td>
                        <td className="text-primary">${booking.platformShare}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="row mt-3">
                  <div className="col-md-6">
                    <Card className="bg-success text-white">
                      <Card.Body>
                        <h6>Total Partner Earnings</h6>
                        <h4>
                          $
                          {partnerEarningsDetails
                            .reduce((sum, item) => sum + parseFloat(item.partnerShare), 0)
                            .toFixed(2)}
                        </h4>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="col-md-6">
                    <Card className="bg-primary text-white">
                      <Card.Body>
                        <h6>Total Platform Earnings</h6>
                        <h4>
                          $
                          {partnerEarningsDetails
                            .reduce((sum, item) => sum + parseFloat(item.platformShare), 0)
                            .toFixed(2)}
                        </h4>
                      </Card.Body>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">No earnings details available for this partner.</p>
                <p className="text-muted small">
                  This partner may not have any completed bookings yet.
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowPartnerEarningsModal(false);
                setPartnerEarningsDetails([]);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </ErrorBoundary>

      {/* Partner Details Modal */}
      <Modal
        show={showPartnerDetailsModal}
        onHide={() => {
          setShowPartnerDetailsModal(false);
          setSelectedPartnerDetails(null);
          setPartnerCarsForDetails([]);
        }}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Partner Details - {selectedPartnerDetails?.user?.name}
            {selectedPartnerDetails && (
              <Badge
                bg={
                  selectedPartnerDetails.status === "approved"
                    ? "success"
                    : selectedPartnerDetails.status === "rejected"
                      ? "danger"
                      : "warning"
                }
                className="ms-2"
              >
                {selectedPartnerDetails.status.toUpperCase()}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPartnerDetails && (
            <div>
              {/* Partner Information */}
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">Partner Information</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p style={{ color: "#000000" }}><strong>Name:</strong> {selectedPartnerDetails.user?.name}</p>
                      <p style={{ color: "#000000" }}> <strong>Email:</strong> {selectedPartnerDetails.user?.email}</p>
                      <p style={{ color: "#000000" }}><strong>Phone:</strong> {selectedPartnerDetails.user?.phone || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <p style={{ color: "#000000" }}><strong>Application Status:</strong>
                        <Badge
                          bg={
                            selectedPartnerDetails.status === "approved"
                              ? "success"
                              : selectedPartnerDetails.status === "rejected"
                                ? "danger"
                                : "warning"
                          }
                          className="ms-2"
                        >
                          {selectedPartnerDetails.status.toUpperCase()}
                        </Badge>
                      </p>
                      <p style={{ color: "#000000" }}> <strong>Applied On:</strong> {formatDate(selectedPartnerDetails.createdAt)}</p>
                      {selectedPartnerDetails.approvedAt && (
                        <p style={{ color: "#000000" }}><strong>Approved On:</strong> {formatDate(selectedPartnerDetails.approvedAt)}</p>
                      )}
                    </Col>
                  </Row>

                  <hr />

                  <Row>
                    <Col md={6}>
                      <h6>Address Information</h6>
                      <p style={{ color: "#000000" }}><strong>Address:</strong> {selectedPartnerDetails.address}</p>
                      <p style={{ color: "#000000" }}><strong>City:</strong> {selectedPartnerDetails.city}</p>
                      <p style={{ color: "#000000" }}><strong>State:</strong> {selectedPartnerDetails.state}</p>
                    </Col>
                    <Col md={6}>
                      <h6>&nbsp;</h6>
                      <p style={{ color: "#000000" }}> <strong>Country:</strong> {selectedPartnerDetails.country}</p>
                      <p style={{ color: "#000000" }}><strong>ZIP Code:</strong> {selectedPartnerDetails.zipCode}</p>
                      <p style={{ color: "#000000" }}><strong>National ID:</strong> {selectedPartnerDetails.nationalId}</p>
                    </Col>
                  </Row>

                  <div className="mt-3">
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => window.open(selectedPartnerDetails.idProof, "_blank")}
                    >
                      <i className="fas fa-file-pdf me-1"></i>
                      View ID Proof Document
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Partner Cars */}
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Partner Cars ({partnerCarsForDetails.length})</h6>
                  <Badge bg="info">
                    {partnerCarsForDetails.filter(car => car.available && !car.adminDeactivated).length} Available
                  </Badge>
                </Card.Header>
                <Card.Body>
                  {partnerCarsForDetails.length > 0 ? (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Car Image</th>
                          <th>Car Details</th>
                          <th>Price/Day</th>
                          <th>Status</th>
                          <th style={{ width: "200px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerCarsForDetails.map((car) => (
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
                                onError={(e) => {
                                  e.target.src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FyIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                                }}
                              />
                            </td>

                            <td>
                              <strong>{car.name}</strong>
                              <br />
                              <small className="text-muted">
                                {car.brand} {car.model}
                              </small>
                              <br />
                              <Badge bg="secondary">{car.carType}</Badge>
                            </td>

                            <td>${car.price}</td>

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
                              <div className="d-flex flex-column gap-1">
                                <Dropdown
                                  show={dropdownOpen[car._id]}
                                  onToggle={() =>
                                    setDropdownOpen((prev) => ({
                                      ...prev,
                                      [car._id]: !prev[car._id],
                                    }))
                                  }
                                  className="position-static"
                                  autoClose="outside"
                                >
                                  <Dropdown.Toggle
                                    variant={
                                      car.adminDeactivated
                                        ? "danger"
                                        : car.available
                                          ? "success"
                                          : "warning"
                                    }
                                    size="sm"
                                    id={`dropdown-status-${car._id}`}
                                  >
                                    Change Status
                                  </Dropdown.Toggle>

                                  <Dropdown.Menu
                                    className="shadow-lg"
                                    style={{ zIndex: 2000, position: "absolute" }}
                                  >
                                    <Dropdown.Item
                                      onClick={async () => {
                                        await handleTogglePartnerCarAvailability(
                                          car._id,
                                          false,
                                          true
                                        );
                                      }}
                                      className={
                                        car.adminDeactivated ? "active fw-bold" : ""
                                      }
                                    >
                                      <i className="fas fa-ban me-2 text-danger"></i>
                                      Admin Deactivated
                                      {car.adminDeactivated && (
                                        <i className="fas fa-check ms-2 text-success"></i>
                                      )}
                                    </Dropdown.Item>

                                    <Dropdown.Item
                                      onClick={async () => {
                                        await handleTogglePartnerCarAvailability(
                                          car._id,
                                          true,
                                          false
                                        );
                                      }}
                                      className={
                                        !car.adminDeactivated && car.available
                                          ? "active fw-bold"
                                          : ""
                                      }
                                    >
                                      <i className="fas fa-check-circle me-2 text-success"></i>
                                      Available
                                      {!car.adminDeactivated && car.available && (
                                        <i className="fas fa-check ms-2 text-success"></i>
                                      )}
                                    </Dropdown.Item>

                                    <Dropdown.Item
                                      onClick={async () => {
                                        await handleTogglePartnerCarAvailability(
                                          car._id,
                                          false,
                                          false
                                        );
                                      }}
                                      className={
                                        !car.adminDeactivated && !car.available
                                          ? "active fw-bold"
                                          : ""
                                      }
                                    >
                                      <i className="fas fa-car me-2 text-warning"></i>
                                      Rented
                                      {!car.adminDeactivated && !car.available && (
                                        <i className="fas fa-check ms-2 text-success"></i>
                                      )}
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>

                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={async () => {
                                    if (window.confirm("Are you sure you want to delete this partner car?")) {
                                      try {
                                        await axios.delete(
                                          `http://localhost:5000/api/admin/partner-cars/${car._id}`,
                                          getAuthHeaders()
                                        );
                                        setSuccess("Partner car deleted successfully");

                                        // Refresh ALL partner cars using admin endpoint
                                        const carsResponse = await axios.get(
                                          `http://localhost:5000/api/admin/partner-cars`,
                                          getAuthHeaders()
                                        );

                                        // Update the main partner cars state
                                        setPartnerCars(carsResponse.data);

                                        // Update the partner details cars
                                        const filteredCars = carsResponse.data.filter(
                                          c => c.partner?._id?.toString() === selectedPartnerDetails.user._id.toString()
                                        );
                                        setPartnerCarsForDetails(filteredCars);

                                      } catch (error) {
                                        setError("Error deleting partner car: " + (error.response?.data?.message || error.message));
                                      }
                                    }
                                  }}
                                >
                                  Delete Car
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">No cars found for this partner.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPartnerDetailsModal(false);
              setSelectedPartnerDetails(null);
              setPartnerCarsForDetails([]);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ticket Details Modal */}
      <Modal
        show={showTicketModal}
        onHide={() => setShowTicketModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Ticket Details - #{selectedTicket?._id.slice(-8)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <div>
              {/* Customer Information */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Customer Information</h6>
                </Card.Header>
                <Card.Body style={{ color: "black" }}>
                  <Row>
                    <Col md={6}>
                      <p style={{ color: "black" }}>
                        <strong>Name:</strong> {selectedTicket.user?.name}
                      </p>
                      <p style={{ color: "black" }}>
                        <strong>Email:</strong> {selectedTicket.user?.email}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p style={{ color: "black" }}>
                        <strong>Phone:</strong>{" "}
                        {selectedTicket.user?.phone || "N/A"}
                      </p>
                      <p style={{ color: "black" }}>
                        <strong>Status:</strong>
                        <Badge
                          bg={getTicketStatusColor(selectedTicket.status)}
                          className="ms-2"
                        >
                          {selectedTicket.status
                            .replace("_", " ")
                            .toUpperCase()}
                        </Badge>
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Issue Details */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Issue Description</h6>
                </Card.Header>
                <Card.Body>
                  <p style={{ color: "black" }}>{selectedTicket.issue}</p>
                </Card.Body>
              </Card>

              {/* Conversation History */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Conversation History</h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {selectedTicket.conversation &&
                    selectedTicket.conversation.length > 0 ? (
                    selectedTicket.conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-3 p-3 rounded ${message.sender === "admin"
                          ? "bg-primary text-white ms-5"
                          : "bg-light text-dark me-5"
                          }`}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <strong>
                            {message.sender === "admin"
                              ? "Support Agent"
                              : selectedTicket.user?.name}
                          </strong>
                          <small>{formatTicketDate(message.timestamp)}</small>
                        </div>
                        <p className="mb-0" style={{ color: "black" }}>
                          {message.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No conversation history yet.</p>
                  )}
                </Card.Body>
              </Card>

              {/* Admin Reply Section */}
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Reply to Customer</h6>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Response</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Type your response here..."
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          handleTicketStatusUpdate(selectedTicket._id, "open")
                        }
                        disabled={selectedTicket.status === "open"}
                      >
                        Mark as Open
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="ms-2"
                        onClick={() =>
                          handleTicketStatusUpdate(
                            selectedTicket._id,
                            "in_progress"
                          )
                        }
                        disabled={selectedTicket.status === "in_progress"}
                      >
                        Mark as In Progress
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="ms-2"
                        onClick={() =>
                          handleTicketStatusUpdate(selectedTicket._id, "closed")
                        }
                        disabled={selectedTicket.status === "closed"}
                      >
                        Mark as Closed
                      </Button>
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleTicketReply}
                      disabled={!ticketReply.trim()}
                    >
                      Send Reply
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTicketModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Car Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
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
                    max="2025"
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
              <Form.Label>Image URL *</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  required
                  value={carForm.image}
                  onChange={(e) =>
                    setCarForm({ ...carForm, image: e.target.value })
                  }
                  placeholder="Enter image URL"
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

      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUserSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                required
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                value={userForm.phone}
                onChange={(e) =>
                  setUserForm({ ...userForm, phone: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                placeholder="Leave blank to keep current password"
              />
              <Form.Text className="text-muted">
                Enter new password only if you want to change it.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        show={showBookingModal}
        onHide={() => setShowBookingModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Booking Details - #{selectedBooking?._id.slice(-8)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: "black" }}>
          {selectedBooking && (
            <div style={{ color: "black" }}>
              <Row>
                <Col md={6}>
                  <h6 style={{ color: "black" }}>Customer Information</h6>
                  <p style={{ color: "black" }}>
                    <strong>Name:</strong> {selectedBooking.user?.name}
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Email:</strong> {selectedBooking.user?.email}
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Phone:</strong>{" "}
                    {selectedBooking.user?.phone || "N/A"}
                  </p>
                </Col>
                <Col md={6}>
                  <h6 style={{ color: "black" }}>Car Information</h6>
                  <div className="d-flex align-items-center mb-2">
                    <img
                      src={selectedBooking.car?.image}
                      alt={selectedBooking.car?.name}
                      style={{
                        width: "80px",
                        height: "60px",
                        objectFit: "cover",
                      }}
                      className="rounded me-2"
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FyIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                      }}
                    />
                    <div>
                      <p className="mb-0" style={{ color: "black" }}>
                        <strong>
                          {selectedBooking.car?.brand}{" "}
                          {selectedBooking.car?.model}
                        </strong>
                      </p>
                      <p className="mb-0 text-muted">
                        {selectedBooking.car?.name}
                      </p>
                      <p className="mb-0" style={{ color: "black" }}>
                        <Badge
                          bg={
                            selectedBooking.car?.carType === "luxury"
                              ? "primary"
                              : selectedBooking.car?.carType === "suv"
                                ? "success"
                                : selectedBooking.car?.carType === "economy"
                                  ? "secondary"
                                  : selectedBooking.car?.carType === "sports"
                                    ? "danger"
                                    : selectedBooking.car?.carType === "van"
                                      ? "warning"
                                      : selectedBooking.car?.carType === "convertible"
                                        ? "info"
                                        : "dark"
                          }
                          className="me-1"
                        >
                          {selectedBooking.car?.carType
                            ? selectedBooking.car.carType
                              .charAt(0)
                              .toUpperCase() +
                            selectedBooking.car.carType.slice(1)
                            : "Standard"}
                        </Badge>
                        ${selectedBooking.car?.price}/day
                      </p>
                      <p className="mb-0" style={{ color: "black" }}>
                        <small className="text-muted">
                          <i className="fas fa-user-friends me-1"></i>
                          {selectedBooking.car?.seats || "N/A"} seats •
                          <i className="fas fa-cog ms-1 me-1"></i>
                          {selectedBooking.car?.transmission || "N/A"} •
                          <i className="fas fa-gas-pump ms-1 me-1"></i>
                          {selectedBooking.car?.fuelType || "N/A"}
                        </small>
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col md={6}>
                  <h6 style={{ color: "black" }}>Rental Period</h6>
                  <p style={{ color: "black" }}>
                    <strong>Start Date:</strong>{" "}
                    {formatDate(selectedBooking.startDate)}
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>End Date:</strong>{" "}
                    {formatDate(selectedBooking.endDate)}
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Total Days:</strong> {selectedBooking.totalDays}
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Pickup Location:</strong>{" "}
                    {selectedBooking.pickupLocation || "N/A"}
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Dropoff Location:</strong>{" "}
                    {selectedBooking.dropoffLocation || "N/A"}
                  </p>
                </Col>
                <Col md={6}>
                  <h6 style={{ color: "black" }}>Payment Details</h6>
                  <p style={{ color: "black" }}>
                    <strong>Total Amount:</strong> $
                    {selectedBooking.totalAmount}
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Daily Rate:</strong> $
                    {selectedBooking.car?.price || "N/A"}/day
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Status:</strong>
                    <Badge
                      bg={getStatusColor(selectedBooking.status)}
                      className="ms-2"
                    >
                      {selectedBooking.status.charAt(0).toUpperCase() +
                        selectedBooking.status.slice(1)}
                    </Badge>
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Payment Status:</strong>
                    <Badge
                      bg={getPaymentStatusColor(selectedBooking.paymentStatus)}
                      className="ms-2"
                    >
                      {selectedBooking.paymentStatus
                        ? selectedBooking.paymentStatus
                          .charAt(0)
                          .toUpperCase() +
                        selectedBooking.paymentStatus.slice(1)
                        : "Pending"}
                    </Badge>
                  </p>
                  <p style={{ color: "black" }}>
                    <strong>Booked On:</strong>{" "}
                    {formatDate(selectedBooking.createdAt)}
                  </p>
                </Col>
              </Row>

              {selectedBooking.specialRequests && (
                <>
                  <hr />
                  <Row>
                    <Col>
                      <h6 style={{ color: "black" }}>Special Requests</h6>
                      <p style={{ color: "black" }}>
                        {selectedBooking.specialRequests}
                      </p>
                    </Col>
                  </Row>
                </>
              )}

              <hr />
              <h6 style={{ color: "black" }}>Update Status</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {getStatusOptions(selectedBooking.status).map((status) => (
                  <Button
                    key={status}
                    variant="outline-primary"
                    size="sm"
                    onClick={() =>
                      handleUpdateBookingStatus(selectedBooking._id, status)
                    }
                  >
                    Set as {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              <h6 style={{ color: "black" }}>Update Payment Status</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {getPaymentStatusOptions(selectedBooking.paymentStatus).map(
                  (status) => (
                    <Button
                      key={status}
                      variant="outline-info"
                      size="sm"
                      onClick={() =>
                        handleUpdatePaymentStatus(selectedBooking._id, status)
                      }
                    >
                      Set Payment as{" "}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  )
                )}
              </div>

              {/* Additional Car Details */}
              <Row>
                <Col>
                  <h6 style={{ color: "black" }}>Car Specifications</h6>
                  <div className="d-flex flex-wrap gap-3">
                    {selectedBooking.car?.year && (
                      <div>
                        <small className="text-muted">Year:</small>
                        <br />
                        <strong style={{ color: "black" }}>
                          {selectedBooking.car.year}
                        </strong>
                      </div>
                    )}
                    {selectedBooking.car?.seats && (
                      <div>
                        <small className="text-muted">Seats:</small>
                        <br />
                        <strong style={{ color: "black" }}>
                          {selectedBooking.car.seats}
                        </strong>
                      </div>
                    )}
                    {selectedBooking.car?.transmission && (
                      <div>
                        <small className="text-muted">Transmission:</small>
                        <br />
                        <strong style={{ color: "black" }}>
                          {selectedBooking.car.transmission
                            .charAt(0)
                            .toUpperCase() +
                            selectedBooking.car.transmission.slice(1)}
                        </strong>
                      </div>
                    )}
                    {selectedBooking.car?.fuelType && (
                      <div>
                        <small className="text-muted">Fuel Type:</small>
                        <br />
                        <strong style={{ color: "black" }}>
                          {selectedBooking.car.fuelType
                            .charAt(0)
                            .toUpperCase() +
                            selectedBooking.car.fuelType.slice(1)}
                        </strong>
                      </div>
                    )}
                    {selectedBooking.car?.mileage && (
                      <div>
                        <small className="text-muted">Mileage:</small>
                        <br />
                        <strong style={{ color: "black" }}>
                          {selectedBooking.car.mileage}
                        </strong>
                      </div>
                    )}
                    {selectedBooking.car?.color && (
                      <div>
                        <small className="text-muted">Color:</small>
                        <br />
                        <strong style={{ color: "black" }}>
                          {selectedBooking.car.color}
                        </strong>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {selectedBooking.car?.features &&
                selectedBooking.car.features.length > 0 && (
                  <Row className="mt-3">
                    <Col>
                      <h6 style={{ color: "black" }}>Car Features</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {selectedBooking.car.features.map((feature, index) => (
                          <Badge
                            key={index}
                            bg="light"
                            text="dark"
                            className="me-1 mb-1"
                          >
                            <i className="fas fa-check me-1"></i>
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </Col>
                  </Row>
                )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBookingModal(false)}
          >
            <i className="fas fa-times me-2"></i>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDownloadInvoice(selectedBooking?._id)}
            disabled={downloadingInvoice === selectedBooking?._id}
          >
            {downloadingInvoice === selectedBooking?._id ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Generating Invoice...
              </>
            ) : (
              <>
                <i className="fas fa-file-invoice me-2"></i>
                Download Invoice
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Payment Details Modal */}
<Modal
  show={showPaymentDetailsModal}
  onHide={() => setShowPaymentDetailsModal(false)}
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title>
      Payment Request Details - #{selectedPaymentRequest?._id.slice(-8)}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedPaymentRequest && (
      <div>
        {/* Partner Information */}
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">Partner Information</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p style={{ color: "#000" }}>
                  <strong>Name:</strong> {selectedPaymentRequest.partner?.name}
                </p>
                <p style={{ color: "#000" }}>
                  <strong>Email:</strong> {selectedPaymentRequest.partner?.email}
                </p>
              </Col>
              <Col md={6}>
                <p style={{ color: "#000" }}>
                  <strong>Status:</strong>{' '}
                  <Badge bg={getPaymentStatusColor(selectedPaymentRequest.status)}>
                    {selectedPaymentRequest.status?.toUpperCase()}
                  </Badge>
                </p>
                <p style={{ color: "#000" }}>
                  <strong>Amount:</strong>{' '}
                  <span className="text-success">${selectedPaymentRequest.amount?.toFixed(2)}</span>
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Payment Details */}
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">Payment Details</h6>
          </Card.Header>
          <Card.Body>
            <p style={{ color: "#000" }}>
              <strong>Payment Method:</strong>{' '}
              {selectedPaymentRequest.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
            </p>
            <p style={{ color: "#000" }}>
              <strong>Requested Date:</strong> {formatDate(selectedPaymentRequest.requestedAt)}
            </p>
            {selectedPaymentRequest.processedAt && (
              <p style={{ color: "#000" }}>
                <strong>Processed Date:</strong> {formatDate(selectedPaymentRequest.processedAt)}
              </p>
            )}
            {selectedPaymentRequest.transactionId && (
              <p style={{ color: "#000" }}>
                <strong>Transaction ID:</strong> <code>{selectedPaymentRequest.transactionId}</code>
              </p>
            )}
            {selectedPaymentRequest.notes && (
              <p style={{ color: "#000" }}>
                <strong>Notes:</strong> {selectedPaymentRequest.notes}
              </p>
            )}
          </Card.Body>
        </Card>

        {/* Bank/UPI Details */}
        {selectedPaymentRequest.paymentMethod === 'bank_transfer' && (
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Bank Account Details</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p style={{ color: "#000" }}>
                    <strong>Account Holder:</strong> {selectedPaymentRequest.bankDetails?.accountName}
                  </p>
                  <p style={{ color: "#000" }}>
                    <strong>Account Number:</strong> {selectedPaymentRequest.bankDetails?.accountNumber}
                  </p>
                </Col>
                <Col md={6}>
                  <p style={{ color: "#000" }}>
                    <strong>Bank Name:</strong> {selectedPaymentRequest.bankDetails?.bankName}
                  </p>
                  <p style={{ color: "#000" }}>
                    <strong>IFSC Code:</strong> {selectedPaymentRequest.bankDetails?.ifscCode}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {selectedPaymentRequest.paymentMethod === 'upi' && (
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">UPI Details</h6>
            </Card.Header>
            <Card.Body>
              <p style={{ color: "#000" }}>
                <strong>UPI ID:</strong> <code>{selectedPaymentRequest.bankDetails?.upiId}</code>
              </p>
              <Alert variant="info" className="mb-0">
                <small>Please verify the UPI ID before processing the payment.</small>
              </Alert>
            </Card.Body>
          </Card>
        )}
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowPaymentDetailsModal(false)}>
      Close
    </Button>
    {selectedPaymentRequest?.status === 'pending' && (
      <>
        <Button
          variant="info"
          onClick={() => handleMarkProcessing(selectedPaymentRequest._id)}
        >
          Mark Processing
        </Button>
        <Button
          variant="danger"
          onClick={() => handleRejectPayment(selectedPaymentRequest._id)}
        >
          Reject Payment
        </Button>
        <Button
          variant="success"
          onClick={() => handleApprovePayment(selectedPaymentRequest._id)}
        >
          Approve & Pay
        </Button>
      </>
    )}
    {selectedPaymentRequest?.status === 'processing' && (
      <Button
        variant="success"
        onClick={() => handleApprovePayment(selectedPaymentRequest._id)}
      >
        Mark as Paid
      </Button>
    )}
  </Modal.Footer>
</Modal>
    </Container>
  );
};

export default AdminPanel;