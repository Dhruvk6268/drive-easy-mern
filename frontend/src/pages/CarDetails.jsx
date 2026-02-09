import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from '../components/Footer';
const CarDetails = () => {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/cars/${id}`);
        if (!response.ok) throw new Error("Failed to fetch car details");
        const data = await response.json();
        setCar(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  // Booking form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const navigate = useNavigate();

  // Check if user is logged in (token in localStorage)
  const token = localStorage.getItem("token");

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    setBookingError("");
    setBookingLoading(true);
    if (!token) {
      setBookingError("You must be logged in to book a car.");
      setBookingLoading(false);
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          carId: car._id,
          startDate,
          endDate,
          pickupLocation: "N/A",
          dropoffLocation: "N/A",
          contactNumber: "N/A",
          specialRequests: ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      setMessage("Booking successful! Check your bookings page.");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading car details...</div>;
  if (error) return <div style={{ padding: 32, color: "red" }}>Error: {error}</div>;
  if (!car) return null;

  return (
    <><div style={{ maxWidth: 700, margin: "40px auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 32 }}>
      <img src={car.image.startsWith("/uploads") ? `http://localhost:5000${car.image}` : car.image} alt={car.name} style={{ width: "100%", borderRadius: 8, height: 300, objectFit: "cover", marginBottom: 24 }} />
      <h2>{car.name} {car.model} ({car.year})</h2>
      <p style={{ color: '#888' }}>{car.brand} </p>
      <p style={{ color: 'black' }}>{car.description}</p>
      <div style={{ fontSize: 15, color: '#555', marginBottom: 12 }}>
        <span><b>Seats:</b> {car.seats || 5}</span>
        <span style={{ margin: '0 10px' }}>•</span>
        <span><b>Transmission:</b> {car.transmission || 'Auto'}</span>
        <span style={{ margin: '0 10px' }}>•</span>
        <span><b>Fuel:</b> {car.fuel || 'Petrol'}</span>
      </div>
      <div style={{ fontWeight: 600, color: '#007bff', fontSize: 20, marginBottom: 24 }}>
        ${car.price} <span style={{ color: '#888', fontSize: 15 }}>/day</span>
      </div>
      <form onSubmit={handleBooking} style={{ borderTop: '1px solid #eee', paddingTop: 24, marginTop: 24 }}>
        <h4>Book this car</h4>
        {!token ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: 'red', marginBottom: 12 }}>You must be logged in to book a car.</div>
            <button
              type="button"
              style={{ background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', fontWeight: 600, fontSize: 16 }}
              onClick={() => navigate('/login')}
            >
              Login to Book
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
              </div>
            </div>
            <button type="submit" style={{ background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', fontWeight: 600, fontSize: 16 }} disabled={bookingLoading}>Book Now</button>
            {bookingLoading && <div style={{ marginTop: 12, color: '#007bff' }}>Booking...</div>}
            {message && <div style={{ marginTop: 16, color: 'green' }}>{message}</div>}
            {bookingError && <div style={{ marginTop: 16, color: 'red' }}>{bookingError}</div>}
          </>
        )}
      </form>

    </div><Footer /></>
  );
  
};

export default CarDetails;