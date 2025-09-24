// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { itemsAPI } from '../../services/api';
// import './createItem.css'; // Make sure the CSS file name matches

// const CreateItem = () => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     price: '',
//   });
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleImageChange = (e) => {
//     setImage(e.target.files[0]);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     // Basic validation
//     if (!formData.title.trim() || !formData.price) {
//       setError('Please fill in all required fields');
//       setLoading(false);
//       return;
//     }

//     try {
//       // First create the item
//       const response = await itemsAPI.create(formData);
//       const newItem = response.data;

//       // Then upload image if provided
//       if (image) {
//         await itemsAPI.uploadImage(newItem.id, image);
//       }

//       // Redirect to dashboard
//       navigate('/dashboard');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to create item. Please try again.');
//       console.error('Create item error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     navigate('/dashboard');
//   };

//   return (
//     <div className="create-item-page">
//       <div className="create-item-container">
//         <h2>Create New Item</h2>
//         <p className="form-subtitle">Fill in the details below to list your item for sale</p>
        
//         {error && (
//           <div className="error-message">
//             <strong>Error:</strong> {error}
//           </div>
//         )}
        
//         <form onSubmit={handleSubmit} className="item-form">
//           <div className="form-group">
//             <label htmlFor="title">Title *</label>
//             <input
//               type="text"
//               id="title"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               placeholder="Enter item title"
//               required
//               disabled={loading}
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               placeholder="Describe your item..."
//               rows="4"
//               disabled={loading}
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="price">Price ($) *</label>
//             <input
//               type="number"
//               id="price"
//               name="price"
//               value={formData.price}
//               onChange={handleChange}
//               placeholder="0.00"
//               min="0"
//               step="0.01"
//               required
//               disabled={loading}
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="image">Item Image</label>
//             <input
//               type="file"
//               id="image"
//               name="image"
//               accept="image/*"
//               onChange={handleImageChange}
//               disabled={loading}
//             />
//             <small className="file-help">Upload a clear photo of your item (optional)</small>
//           </div>

//           <div className="form-actions">
//             <button 
//               type="button" 
//               onClick={handleCancel} 
//               className="cancel-btn"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={loading} 
//               className="submit-btn"
//             >
//               {loading ? (
//                 <>
//                   <span className="loading-spinner"></span>
//                   Creating Item...
//                 </>
//               ) : (
//                 'Create Item'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateItem;



// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { itemsAPI } from '../../services/api';
// import './CreateItem.css';

// const CreateItem = () => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     price: '',
//   });
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleImageChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setImage(e.target.files[0]);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     // Check if token exists
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setError('You are not authenticated. Please login again.');
//       setLoading(false);
//       navigate('/login');
//       return;
//     }

//     // Basic validation
//     if (!formData.title.trim()) {
//       setError('Title is required');
//       setLoading(false);
//       return;
//     }

//     if (!formData.price || parseFloat(formData.price) <= 0) {
//       setError('Please enter a valid price');
//       setLoading(false);
//       return;
//     }

//     try {
//       console.log('Creating item with data:', formData);
//       console.log('Using token:', token ? 'Token exists' : 'No token');
      
//       // First create the item
//       const response = await itemsAPI.create(formData);
//       const newItem = response.data;
//       console.log('Item created successfully:', newItem);

//       // Then upload image if provided
//       if (image) {
//         console.log('Uploading image...');
//         await itemsAPI.uploadImage(newItem.id, image);
//         console.log('Image uploaded successfully');
//       }

//       // Redirect to dashboard
//       navigate('/dashboard');
//     } catch (err) {
//       console.error('Error creating item:', err);
      
//       if (err.response?.status === 401) {
//         setError('Your session has expired. Please login again.');
//         localStorage.removeItem('token');
//         navigate('/login');
//       } else {
//         const errorMessage = err.response?.data?.message || 
//                             err.response?.data?.error || 
//                             'Failed to create item. Please try again.';
//         setError(errorMessage);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     navigate('/dashboard');
//   };

//   return (
//     <div className="create-item-page">
//       <div className="create-item-container">
//         <h2>Sell Your Item</h2>
//         <p className="form-subtitle">List your item for sale on CampusShop</p>
        
//         {error && (
//           <div className="error-message">
//             <strong>Error:</strong> {error}
//           </div>
//         )}
        
//         <form onSubmit={handleSubmit} className="item-form">
//           <div className="form-group">
//             <label htmlFor="title">Item Title *</label>
//             <input
//               type="text"
//               id="title"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               placeholder="e.g., MacBook Pro 2020, Calculus Textbook"
//               required
//               disabled={loading}
//               className="form-input"
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               placeholder="Describe your item's condition, features, and any relevant details..."
//               rows="5"
//               disabled={loading}
//               className="form-textarea"
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="price">Price ($) *</label>
//             <input
//               type="number"
//               id="price"
//               name="price"
//               value={formData.price}
//               onChange={handleChange}
//               placeholder="0.00"
//               min="0"
//               step="0.01"
//               required
//               disabled={loading}
//               className="form-input"
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="image">Item Photo</label>
//             <div className="file-input-container">
//               <input
//                 type="file"
//                 id="image"
//                 accept="image/*"
//                 onChange={handleImageChange}
//                 disabled={loading}
//                 className="file-input"
//               />
//               <label htmlFor="image" className="file-input-label">
//                 Choose File
//               </label>
//               <span className="file-name">
//                 {image ? image.name : 'No file chosen'}
//               </span>
//             </div>
//             <small className="file-help">
//               Supported formats: JPG, PNG, GIF (Max 5MB)
//             </small>
//           </div>

//           <div className="form-actions">
//             <button 
//               type="button" 
//               onClick={handleCancel} 
//               className="cancel-btn"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={loading} 
//               className="submit-btn"
//             >
//               {loading ? (
//                 <>
//                   <span className="loading-spinner"></span>
//                   Creating Item...
//                 </>
//               ) : (
//                 'Create Listing'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateItem;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI } from '../../services/api';
import './CreateItem.css';

const CreateItem = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  });
//   const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

//   const handleImageChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setImage(e.target.files[0]);
//     }
//   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not authenticated. Please login again.');
      setLoading(false);
      navigate('/login');
      return;
    }

    // Basic validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      setLoading(false);
      return;
    }

    try {
      console.log('Creating item with data:', formData);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      // First create the item
      const response = await itemsAPI.create(formData);
      const newItem = response.data;
      console.log('Item created successfully:', newItem);

      // Then upload image if provided
    //   if (image) {
    //     console.log('Uploading image...');
    //     await itemsAPI.uploadImage(newItem.id, image);
    //     console.log('Image uploaded successfully');
    //   }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating item:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMessage = err.response?.data?.message || 
                            err.response?.data?.error || 
                            'Failed to create item. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="create-item-page">
      <div className="create-item-container">
        <h2>Sell Your Item</h2>
        <p className="form-subtitle">List your item for sale on CampusShop</p>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-group">
            <label htmlFor="title">Item Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., MacBook Pro 2020, Calculus Textbook"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item's condition, features, and any relevant details..."
              rows="5"
              disabled={loading}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            {/* <label htmlFor="image">Item Photo</label>
            <div className="file-input-container">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                className="file-input"
              />
              <label htmlFor="image" className="file-input-label">
                Choose File
              </label>
              <span className="file-name">
                {image ? image.name : 'No file chosen'}
              </span>
            </div> */}
            <small className="file-help">
              Supported formats: JPG, PNG, GIF (Max 5MB)
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="submit-btn"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Item...
                </>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItem;