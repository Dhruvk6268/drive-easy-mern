import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from '../components/Footer';
const Cars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nameFilter, setNameFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/cars");
        if (!response.ok) throw new Error("Failed to fetch cars");
        const data = await response.json();
        setCars(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  if (loading) return <div style={{ padding: "2rem" }}>Loading cars...</div>;
  if (error)
    return <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>;

  // Sort cars so the latest is first
  const sortedCars = [...cars].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (a._id && b._id) {
      return b._id.localeCompare(a._id);
    }
    return 0;
  });

  // Filtering logic
  const filteredCars = sortedCars.filter((car) => {
    const matchesName =
      nameFilter.trim() === "" ||
      car.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesMin = minPrice === "" || car.price >= Number(minPrice);
    const matchesMax = maxPrice === "" || car.price <= Number(maxPrice);
    return matchesName && matchesMin && matchesMax;
  });

  return (
    <><div style={{ padding: "1rem", marginTop: "60px", maxWidth: "1400px", marginInline: "auto" }}>
      <h1 style={{ marginBottom: "1.5rem", fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)" }}>Available Cars</h1>

      {/* Filters */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          background: "linear-gradient(90deg, #e3f0ff 0%, #f9f9f9 100%)",
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          padding: "16px",
          border: "1px solid #e0e7ef",
        }}
      >
        {/* Name Filter */}
        <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: 500, color: "#007bff", marginBottom: 4 }}>Name</label>
          <input
            type="text"
            placeholder="e.g. Camry"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 6,
              border: "1px solid #b6c6e3",
              fontSize: 15,
              outline: "none",
              background: "#fff",
              color: "#222",
            }} />
        </div>

        {/* Min Price */}
        <div style={{ flex: "1 1 120px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: 500, color: "#007bff", marginBottom: 4 }}>Min Price</label>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 6,
              border: "1px solid #b6c6e3",
              fontSize: 15,
              outline: "none",
              background: "#fff",
              color: "#222",
            }} />
        </div>

        {/* Max Price */}
        <div style={{ flex: "1 1 120px", display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: 500, color: "#007bff", marginBottom: 4 }}>Max Price</label>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 6,
              border: "1px solid #b6c6e3",
              fontSize: 15,
              outline: "none",
              background: "#fff",
              color: "#222",
            }} />
        </div>
      </div>

      {/* Car Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredCars.length > 0 ? (
          filteredCars.map((car) => (
            <div
              key={car._id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 16,
                background: "#2d3748",
                color: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <img
                src={car.image.startsWith("/uploads")
                  ? `http://localhost:5000${car.image}`
                  : car.image}
                alt={car.name}
                style={{
                  width: "100%",
                  borderRadius: 4,
                  height: 180,
                  objectFit: "cover",
                }} />
              <h2 style={{ marginTop: 12, fontSize: "1.2rem" }}>
               {car.name}  {car.model} ({car.year})
              </h2>
              <p style={{ marginBottom: 4 }}>{car.brand} </p>
              <p style={{ flexGrow: 1, fontSize: "0.9rem" }}>{car.description}</p>

              <div style={{ fontSize: 14, marginBottom: 8 }}>
                <b>Seats:</b> {car.seats || 5} • <b>Transmission:</b> {car.transmission || "Auto"} • <b>Fuel:</b> {car.fuel || "Petrol"}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#007bff", fontSize: 18 }}>
                    ${car.price}
                  </span>
                  <span style={{ fontSize: 13 }}>/day</span>
                </div>
                <button
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 14px",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    opacity: car.available ? 1 : 0.5,
                    width: "fit-content",
                  }}
                  disabled={!car.available}
                  onClick={() => navigate(`/cars/${car._id}`)}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: "#888", fontSize: 18 }}>No cars available.</div>
        )}
      </div>

    </div><Footer /></>
  );
};

export default Cars;
