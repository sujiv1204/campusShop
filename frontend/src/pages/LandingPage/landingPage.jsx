import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './landingPage.css';

const LandingPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/items/');
      setItems(response.data);
    } catch (err) {
      console.error('Full error object:', err);
      setError(`Failed to fetch items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <div className="loading">Loading items...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="landing-page">
      <h1>Available Items</h1>
      
      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <div className="items-list">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <div className="item-image">
                <img src={item.imageUrl} alt={item.title} />
              </div>
              <div className="item-content">
                {/* <h3>{item.title}</h3> */}
                <p className="description">{item.description}</p>
                <p className="price">${item.price}</p>
                <p className="date">Posted: {new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingPage;