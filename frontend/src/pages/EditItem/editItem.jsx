// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { itemsAPI } from '../../services/api';
// import './EditItem.css';

// const EditItem = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     price: '',
//   });
//   const [image, setImage] = useState(null);
//   const [currentImage, setCurrentImage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchItem();
//   }, [id]);

//   const fetchItem = async () => {
//     try {
//       const response = await itemsAPI.getById(id);
//       const item = response.data;
//       setFormData({
//         title: item.title,
//         description: item.description || '',
//         price: item.price,
//       });
//       setCurrentImage(item.imageUrl || '');
//     } catch (err) {
//         console.error(err);
//       setError('Failed to load item');
//     } finally {
//       setLoading(false);
//     }
//   };

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
//     setUpdating(true);
//     setError('');

//     try {
//       // Update item details
//       await itemsAPI.update(id, formData);

//       // Upload new image if provided
//       if (image) {
//         await itemsAPI.uploadImage(id, image);
//       }

//       navigate('/dashboard');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to update item');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   const handleCancel = () => {
//     navigate('/dashboard');
//   };

//   if (loading) return <div className="loading">Loading item...</div>;
//   if (error) return <div className="error">{error}</div>;

//   return (
//     <div className="edit-item-page">
//       <div className="edit-item-container">
//         <h2>Edit Item</h2>
        
//         {error && <div className="error-message">{error}</div>}
        
//         <form onSubmit={handleSubmit} className="item-form">
//           <div className="form-group">
//             <label htmlFor="title">Title *</label>
//             <input
//               type="text"
//               id="title"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               rows="4"
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
//               min="0"
//               step="0.01"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="image">New Image (optional)</label>
//             <input
//               type="file"
//               id="image"
//               accept="image/*"
//               onChange={handleImageChange}
//             />
//           </div>

//           {currentImage && (
//             <div className="current-image">
//               <p>Current Image:</p>
//               <img src={currentImage} alt="Current item" />
//             </div>
//           )}

//           <div className="form-actions">
//             <button type="button" onClick={handleCancel} className="cancel-btn">
//               Cancel
//             </button>
//             <button type="submit" disabled={updating} className="submit-btn">
//               {updating ? 'Updating...' : 'Update Item'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditItem;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { itemsAPI } from '../../services/api';
// import './editItem.css';

// const EditItem = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [formData, setFormData] = useState({ title: '', description: '', price: '' });
//     const [newImage, setNewImage] = useState(null);
//     const [currentImageUrl, setCurrentImageUrl] = useState('');
//     const [newImagePreview, setNewImagePreview] = useState('');
//     const [loading, setLoading] = useState(true);
//     const [updating, setUpdating] = useState(false);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const fetchItem = async () => {
//             try {
//                 setLoading(true);
//                 const response = await itemsAPI.getById(id);
//                 const item = response.data;
//                 setFormData({
//                     title: item.title,
//                     description: item.description || '',
//                     price: item.price,
//                 });
//                 setCurrentImageUrl(item.imageUrl || '');
//             } catch (err) {
//                 console.error(err);
//                 setError('Failed to load item data. Please try again.');
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchItem();
//     }, [id]);

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleImageChange = (e) => {
//         if (e.target.files && e.target.files[0]) {
//             const file = e.target.files[0];
//             setNewImage(file);
//             setNewImagePreview(URL.createObjectURL(file));
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setUpdating(true);
//         setError('');

//         try {
//             // Step 1: Update the text-based item details
//             await itemsAPI.update(id, formData);

//             // Step 2: If a new image was chosen, upload it
//             if (newImage) {
//                 await itemsAPI.uploadImage(id, newImage);
//             }

//             // Step 3: Navigate back to the profile page on success
//             navigate('/profile');
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to update item.');
//         } finally {
//             setUpdating(false);
//         }
//     };

//     const handleCancel = () => {
//         navigate('/profile');
//     };

//     if (loading) return (
//         <div className="page-loading">
//             <div className="loading-spinner-large"></div>
//             <span>Loading Item...</span>
//         </div>
//     );

//     return (
//         <div className="edit-item-page">
//             <div className="edit-item-container">
//                 <div className="form-header">
//                     <h2>Edit Your Item</h2>
//                     <p>Update the details for your listing.</p>
//                 </div>
//                 {error && <div className="error-message">{error}</div>}
//                 <form onSubmit={handleSubmit} className="item-form">
//                     <div className="form-group">
//                         <label htmlFor="title">Item Title *</label>
//                         <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
//                     </div>
//                     <div className="form-group">
//                         <label htmlFor="description">Description</label>
//                         <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="5" />
//                     </div>
//                     <div className="form-group">
//                         <label htmlFor="price">Price ($) *</label>
//                         <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required />
//                     </div>
//                     {currentImageUrl && !newImagePreview && (
//                         <div className="form-group">
//                             <label>Current Image</label>
//                             <div className="image-preview current">
//                                 <img src={currentImageUrl} alt="Current item" />
//                             </div>
//                         </div>
//                     )}
//                     <div className="form-group">
//                         <label htmlFor="image">Change Photo</label>
//                         <div className="file-input-wrapper">
//                             <input type="file" id="image" accept="image/*" onChange={handleImageChange} className="file-input" />
//                             <label htmlFor="image" className="file-input-label">📤 Choose New Image</label>
//                             {newImagePreview && (
//                                 <div className="image-preview new">
//                                     <img src={newImagePreview} alt="New preview" />
//                                     <span>{newImage.name}</span>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                     <div className="form-actions">
//                         <button type="button" onClick={handleCancel} className="btn btn-cancel" disabled={updating}>Cancel</button>
//                         <button type="submit" className="btn btn-submit" disabled={updating}>
//                             {updating ? <div className="loading-spinner-small"></div> : 'Update Item'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default EditItem;



import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { itemsAPI } from '../../services/api';
import './editItem.css';

const EditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: ''
  });
  const [currentImage, setCurrentImage] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get item data from navigation state or fetch it
  const itemFromState = location.state?.item;

  useEffect(() => {
    if (itemFromState) {
      // Use item data passed from navigation
      setFormData({
        title: itemFromState.title || '',
        description: itemFromState.description || '',
        price: itemFromState.price || ''
      });
      setCurrentImage(itemFromState.imageUrl || '');
      setLoading(false);
    } else {
      // Fetch item data if not passed via state
      fetchItem();
    }
  }, [id, itemFromState]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await itemsAPI.getById(id);
      const item = response.data;
      
      setFormData({
        title: item.title || '',
        description: item.description || '',
        price: item.price || ''
      });
      setCurrentImage(item.imageUrl || '');
      
    } catch (err) {
      console.error('Error fetching item:', err);
      setError('Failed to load item details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      console.log('Updating item:', id, 'with data:', formData);
      
      // Update item details
      const response = await itemsAPI.update(id, formData);
      console.log('Update successful:', response.data);

      // Upload new image if provided
      if (newImage) {
        console.log('Uploading new image...');
        await itemsAPI.uploadImage(id, newImage);
        console.log('Image upload successful');
      }

      setSuccess('Item updated successfully!');
      
      // Redirect to user profile after 2 seconds
      setTimeout(() => {
        navigate('/user-profile');
      }, 2000);

    } catch (err) {
      console.error('Error updating item:', err);
      
      if (err.response?.status === 403) {
        setError('You can only edit your own items.');
      } else if (err.response?.status === 404) {
        setError('Item not found. It may have been deleted.');
      } else if (err.response?.status === 401) {
        setError('Please login again to edit items.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to update item. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/user-profile');
  };

  const removeImage = () => {
    setNewImage(null);
    // Note: To remove existing image, you might need a separate API endpoint
  };

  if (loading) {
    return (
      <div className="edit-item-loading">
        <div className="loading-spinner"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  return (
    <div className="edit-item-page">
      <div className="edit-item-container">
        <div className="edit-item-header">
          <h1>✏️ Edit Item</h1>
          <p>Update your item details below</p>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <strong>Success:</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-item-form">
          <div className="form-section">
            <h3>Item Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Item Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter item title"
                required
                disabled={updating}
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
                placeholder="Describe your item..."
                rows="4"
                disabled={updating}
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
                disabled={updating}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Item Image</h3>
            
            {/* Current Image */}
            {currentImage && (
              <div className="current-image-section">
                <label>Current Image:</label>
                <div className="current-image-container">
                  <img src={currentImage} alt="Current item" />
                  <small>Existing image will be kept unless you upload a new one</small>
                </div>
              </div>
            )}

            {/* New Image Upload */}
            <div className="form-group">
              <label htmlFor="image">New Image (Optional)</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={updating}
                  className="file-input"
                />
                <label htmlFor="image" className="file-upload-label">
                  📷 Choose New Image
                </label>
                {newImage && (
                  <div className="file-info">
                    <span>Selected: {newImage.name}</span>
                    <button type="button" onClick={removeImage} className="remove-file-btn">
                      ❌
                    </button>
                  </div>
                )}
              </div>
              <small>Leave empty to keep current image. Supported formats: JPG, PNG</small>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="cancel-btn"
              disabled={updating}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={updating}
              className="submit-btn"
            >
              {updating ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Updating...
                </>
              ) : (
                'Update Item'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditItem;