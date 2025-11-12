// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './landingPage.css';

// const LandingPage = () => {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchItems = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await axios.get('/api/items/');
//       setItems(response.data);
//     } catch (err) {
//       console.error('Full error object:', err);
//       setError(`Failed to fetch items: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchItems();
//   }, []);

//   if (loading) return <div className="loading">Loading items...</div>;
//   if (error) return <div className="error">Error: {error}</div>;

//   return (
//     <div className="landing-page">
//       <h1>Available Items</h1>

//       {items.length === 0 ? (
//         <p>No items found.</p>
//       ) : (
//         <div className="items-list">
//           {items.map(item => (
//             <div key={item.id} className="item-row">
//               <div className="item-image">
//                 <img src={item.imageUrl} alt={item.title} />
//               </div>
//               <div className="item-content">
//                 {/* <h3>{item.title}</h3> */}
//                 <p className="description">{item.description}</p>
//                 <p className="price">${item.price}</p>
//                 <p className="date">Posted: {new Date(item.createdAt).toLocaleDateString()}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default LandingPage;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { itemsAPI } from "../../services/api";
import "./landingPage.css";

const LandingPage = ({ isAuthenticated }) => {
    const [items, setItems] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true); // For first load
    const [searchLoading, setSearchLoading] = useState(false); // For search/filter updates
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [priceRange, setPriceRange] = useState({ min: "", max: "" });
    const itemsPerPage = 24; // Show 24 items per page (6x4 grid)
    const navigate = useNavigate();

    const fetchItems = async (page = 1, isInitial = false) => {
        try {
            if (isInitial) {
                setInitialLoading(true);
            } else {
                setSearchLoading(true);
            }
            setError(null);

            // Build query parameters for server-side filtering
            const params = {
                page,
                limit: itemsPerPage,
            };

            // Add search term if present
            if (searchTerm && searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            // Add sort parameter
            if (sortBy) {
                params.sortBy = sortBy;
            }

            // Add price range filters
            if (priceRange.min) {
                params.minPrice = priceRange.min;
            }
            if (priceRange.max) {
                params.maxPrice = priceRange.max;
            }

            const response = await itemsAPI.getAll(params);

            // Handle paginated response
            if (response.data.items && response.data.pagination) {
                setItems(response.data.items);
                setPagination(response.data.pagination);
            } else {
                // Fallback for non-paginated response
                setItems(response.data);
                setPagination(null);
            }
        } catch (err) {
            console.error("Error fetching items:", err);
            setError("Failed to load items. Please try again later.");
        } finally {
            setInitialLoading(false);
            setSearchLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchItems(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch items when page, search, sort, or filters change
    useEffect(() => {
        // Skip if this is the initial load
        if (initialLoading) return;

        // Debounce search to avoid too many API calls
        const delayDebounceFn = setTimeout(() => {
            fetchItems(currentPage, false);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm, sortBy, priceRange]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || (pagination && newPage > pagination.totalPages))
            return;
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setCurrentPage(1); // Reset to first page on sort change
    };

    const handlePriceFilterChange = (type, value) => {
        setPriceRange((prev) => ({ ...prev, [type]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSortBy("newest");
        setPriceRange({ min: "", max: "" });
        setCurrentPage(1);
    };

    const handlePlaceBid = (item) => {
        if (!isAuthenticated) {
            alert("Please login to place bids");
            navigate("/login");
            return;
        }
        navigate(`/place-bid/${item.id}`, { state: { item } });
    };

    if (initialLoading)
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading amazing deals...</p>
            </div>
        );

    if (error)
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button onClick={fetchItems} className="retry-btn">
                    Try Again
                </button>
            </div>
        );

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Campus Marketplace</h1>
                    <p className="hero-subtitle">
                        Discover amazing deals from your fellow students
                    </p>
                    <div className="hero-actions">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => navigate("/create-item")}
                                    className="cta-button primary"
                                >
                                    🎯 Sell Your Item
                                </button>
                                <button
                                    onClick={() => navigate("/buy-items")}
                                    className="cta-button secondary"
                                >
                                    💰 Place a Bid
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="cta-button primary"
                                >
                                    🚀 Get Started
                                </button>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="cta-button secondary"
                                >
                                    🔐 Sign In
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="hero-stats">
                    <div className="stat">
                        <span className="stat-number">
                            {pagination ? pagination.totalItems : items.length}
                        </span>
                        <span className="stat-label">Items Available</span>
                    </div>
                    <div className="stat">
                        <span className="stat-number">24/7</span>
                        <span className="stat-label">Active Marketplace</span>
                    </div>
                </div>
            </section>

            {/* Search and Filter Section */}
            <section
                className="filters-section"
                style={{ padding: "2rem", backgroundColor: "#f9fafb" }}
            >
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    {/* Search Bar */}
                    <div style={{ marginBottom: "1.5rem" }}>
                        <div style={{ position: "relative" }}>
                            <span
                                style={{
                                    position: "absolute",
                                    left: "1rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "1.25rem",
                                }}
                            >
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Search items by title or description..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault(); // Prevent form submission/page reload
                                    }
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem 0.75rem 3rem",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                    fontSize: "1rem",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#3b82f6")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#e5e7eb")
                                }
                            />
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1rem",
                            alignItems: "center",
                        }}
                    >
                        {/* Sort Dropdown */}
                        <div style={{ flex: "1 1 200px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                }}
                            >
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={handleSortChange}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                    fontSize: "1rem",
                                    outline: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="price-low">
                                    Price: Low to High
                                </option>
                                <option value="price-high">
                                    Price: High to Low
                                </option>
                            </select>
                        </div>

                        {/* Price Range Filters */}
                        <div style={{ flex: "1 1 150px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                }}
                            >
                                Min Price (₹)
                            </label>
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) =>
                                    handlePriceFilterChange(
                                        "min",
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault(); // Prevent form submission/page reload
                                    }
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                    fontSize: "1rem",
                                    outline: "none",
                                }}
                            />
                        </div>

                        <div style={{ flex: "1 1 150px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                }}
                            >
                                Max Price (₹)
                            </label>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) =>
                                    handlePriceFilterChange(
                                        "max",
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault(); // Prevent form submission/page reload
                                    }
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                    fontSize: "1rem",
                                    outline: "none",
                                }}
                            />
                        </div>

                        {/* Clear Filters Button */}
                        <div
                            style={{ flex: "0 1 auto", alignSelf: "flex-end" }}
                        >
                            <button
                                onClick={handleClearFilters}
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "0.5rem",
                                    fontSize: "1rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                    (e.target.style.backgroundColor = "#dc2626")
                                }
                                onMouseLeave={(e) =>
                                    (e.target.style.backgroundColor = "#ef4444")
                                }
                            >
                                🗑️ Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchTerm || priceRange.min || priceRange.max) && (
                        <div
                            style={{
                                marginTop: "1rem",
                                display: "flex",
                                gap: "0.5rem",
                                flexWrap: "wrap",
                            }}
                        >
                            {searchTerm && (
                                <span
                                    style={{
                                        padding: "0.5rem 1rem",
                                        backgroundColor: "#dbeafe",
                                        color: "#1e40af",
                                        borderRadius: "9999px",
                                        fontSize: "0.875rem",
                                    }}
                                >
                                    Search: "{searchTerm}"
                                </span>
                            )}
                            {priceRange.min && (
                                <span
                                    style={{
                                        padding: "0.5rem 1rem",
                                        backgroundColor: "#dbeafe",
                                        color: "#1e40af",
                                        borderRadius: "9999px",
                                        fontSize: "0.875rem",
                                    }}
                                >
                                    Min: ₹{priceRange.min}
                                </span>
                            )}
                            {priceRange.max && (
                                <span
                                    style={{
                                        padding: "0.5rem 1rem",
                                        backgroundColor: "#dbeafe",
                                        color: "#1e40af",
                                        borderRadius: "9999px",
                                        fontSize: "0.875rem",
                                    }}
                                >
                                    Max: ₹{priceRange.max}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Pagination Info Section */}
            {pagination && (
                <section className="filters-section">
                    <div className="results-count">
                        Showing {items.length} items (Page{" "}
                        {pagination.currentPage} of {pagination.totalPages})
                    </div>
                </section>
            )}

            {/* Items Grid */}
            <section
                className="items-section"
                style={{ position: "relative", minHeight: "400px" }}
            >
                {/* Search Loading Overlay */}
                {searchLoading && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            backdropFilter: "blur(2px)",
                        }}
                    >
                        <div style={{ textAlign: "center" }}>
                            <div
                                className="loading-spinner"
                                style={{ margin: "0 auto 1rem" }}
                            ></div>
                            <p style={{ color: "#374151", fontWeight: "600" }}>
                                Searching...
                            </p>
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="no-items">
                        <div className="no-items-icon">📦</div>
                        <h3>No items found</h3>
                        <p>Check back later for new listings</p>
                    </div>
                ) : (
                    <>
                        <h2 className="section-title">Featured Items</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 bg-gray-100">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:scale-105"
                                >
                                    {/* Image and Price Badge */}
                                    <div className="relative">
                                        <img
                                            src={
                                                item.imageUrl ||
                                                "/api/placeholder/300/200"
                                            }
                                            alt={item.title}
                                            className="w-full h-48 object-cover"
                                            // This onError handler is preserved from your original code
                                            onError={(e) => {
                                                e.target.src =
                                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-sm font-semibold px-2.5 py-1 rounded-full">
                                            ₹{parseFloat(item.price).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">
                                            {item.description}
                                        </p>

                                        {/* Date */}
                                        <div className="flex items-center text-xs text-gray-500">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <span>
                                                {new Date(
                                                    item.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-4">
                                            {isAuthenticated ? (
                                                <button
                                                    onClick={() =>
                                                        handlePlaceBid(item)
                                                    }
                                                    className="w-full inline-flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mr-2"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 00-1-1V3.5z" />
                                                        <path d="M15.5 10a1.5 1.5 0 00-3 0V11a1 1 0 01-1 1H5a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 011-1v-1.5a1.5 1.5 0 00-3 0V15a1 1 0 001 1h3a1 1 0 001-1v-2a1 1 0 00-1-1h-3a1 1 0 01-1-1v-1.5z" />
                                                    </svg>
                                                    Place Bid
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        navigate("/login")
                                                    }
                                                    className="w-full inline-flex items-center justify-center text-gray-900 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mr-2"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Login to Buy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={!pagination.hasPrevPage}
                                    className="pagination-btn"
                                >
                                    ← Previous
                                </button>

                                <div className="pagination-info">
                                    {(() => {
                                        const pages = [];
                                        const maxVisiblePages = 5;
                                        let startPage = Math.max(
                                            1,
                                            currentPage -
                                                Math.floor(maxVisiblePages / 2)
                                        );
                                        let endPage = Math.min(
                                            pagination.totalPages,
                                            startPage + maxVisiblePages - 1
                                        );

                                        if (
                                            endPage - startPage <
                                            maxVisiblePages - 1
                                        ) {
                                            startPage = Math.max(
                                                1,
                                                endPage - maxVisiblePages + 1
                                            );
                                        }

                                        for (
                                            let i = startPage;
                                            i <= endPage;
                                            i++
                                        ) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() =>
                                                        handlePageChange(i)
                                                    }
                                                    className={`page-number ${
                                                        i === currentPage
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                        return pages;
                                    })()}
                                </div>

                                <button
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={!pagination.hasNextPage}
                                    className="pagination-btn"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Footer Section */}
            <footer className="landing-footer">
                <p>
                    © 2025 Campus shop. Connecting IITJ students through
                    E-commerce.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
