import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { itemsAPI } from "../../services/api";
import "./buyitems.css";

const BuyItems = ({ isAuthenticated }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const itemsPerPage = 20;
    const navigate = useNavigate();

    useEffect(() => {
        fetchItems(currentPage);
    }, [currentPage]);

    const fetchItems = async (page = 1) => {
        try {
            setLoading(true);
            setError("");
            const response = await itemsAPI.getAll({
                page,
                limit: itemsPerPage,
            });

            // Handle paginated response
            if (response.data.items) {
                const availableItems = response.data.items.filter(
                    (item) => item.status !== "sold"
                );
                setItems(availableItems);
                setPagination(response.data.pagination);
            } else {
                // Fallback for non-paginated response (backward compatibility)
                const availableItems = response.data.filter(
                    (item) => item.status !== "sold"
                );
                setItems(availableItems);
            }
        } catch (err) {
            setError("Failed to load items");
            console.error("Error fetching items:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePlaceBid = (item) => {
        if (!isAuthenticated) {
            alert("Please login to place a bid");
            navigate("/login");
            return;
        }
        navigate(`/place-bid/${item.id}`, { state: { item } });
    };

    if (loading)
        return <div className="loading">Loading available items...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="buy-items-page">
            <div className="buy-items-header">
                <h1>🛍️ Available Items for Bidding</h1>
                <p>Place your bids on items from other students</p>
            </div>

            <div className="items-stats">
                <p>
                    Found {pagination.totalItems || items.length} item(s)
                    available for bidding
                </p>
                {pagination.totalPages > 1 && (
                    <p>
                        Page {currentPage} of {pagination.totalPages}
                    </p>
                )}
            </div>

            {items.length === 0 ? (
                <div className="no-items">
                    <h3>No items available for bidding</h3>
                    <p>Check back later for new listings!</p>
                </div>
            ) : (
                <>
                    <div className="items-grid">
                        {items.map((item) => (
                            <div key={item.id} className="item-card">
                                {item.imageUrl && (
                                    <div className="item-image">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                        />
                                    </div>
                                )}

                                <div className="item-content">
                                    <h3 className="item-title">{item.title}</h3>
                                    <p className="item-description">
                                        {item.description}
                                    </p>

                                    <div className="item-details">
                                        <div className="item-price">
                                            Starting Price: ₹
                                            {parseFloat(item.price).toFixed(2)}
                                        </div>
                                        <div className="item-seller">
                                            Seller ID:{" "}
                                            {item.sellerId?.substring(0, 8)}...
                                        </div>
                                        <div className="item-date">
                                            Listed:{" "}
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="item-actions">
                                        <button
                                            onClick={() => handlePlaceBid(item)}
                                            className="bid-btn"
                                            title="Place a bid on this item"
                                        >
                                            💰 Place Bid
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
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
                                {/* Show page numbers */}
                                {Array.from(
                                    {
                                        length: Math.min(
                                            5,
                                            pagination.totalPages
                                        ),
                                    },
                                    (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (
                                            currentPage >=
                                            pagination.totalPages - 2
                                        ) {
                                            pageNum =
                                                pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() =>
                                                    handlePageChange(pageNum)
                                                }
                                                className={`page-number ${
                                                    currentPage === pageNum
                                                        ? "active"
                                                        : ""
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                )}
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
        </div>
    );
};

export default BuyItems;
