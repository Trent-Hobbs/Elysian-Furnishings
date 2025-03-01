import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './VendorDashboard.module.css';

function VendorDashboard() {
    const [products, setProducts] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        fetch('http://localhost:5000/api/vendor/dashboard', {
            credentials: 'include'
        })
        .then(res => {
            if (res.status === 401) {
                navigate('/vendor/login');
                throw new Error('Not authenticated');
            }
            return res.json();
        })
        .then(data => {
            console.log('Received data:', data);
            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                console.error('Expected array but got:', typeof data);
                setProducts([]);
            }
        })
        .catch(err => {
            console.error('Error fetching products:', err);
            setError(err.message);
            setProducts([]);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('http://localhost:5000/api/vendor/products', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error;
                } catch {
                    errorMessage = errorText;
                }
                throw new Error(errorMessage || 'Failed to add product');
            }

            const data = await response.json();
            
            // Normalize new product data
            const newProduct = {
                ...data.newProduct,
                image_path: data.newProduct.image_path.replace(/\\/g, '/')
            };
            
            setProducts(prev => Array.isArray(prev) ? [...prev, newProduct] : [newProduct]);
            setMessage('Product added successfully');
            e.target.reset();
        } catch (err) {
            console.error('Error details:', err);
            setMessage(err.message || 'Error adding product');
        }
    };

    const handleDelete = async (productId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/vendor/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            setProducts(products.filter(product => product.id !== productId));
            setMessage('Product deleted successfully');
        } catch (err) {
            console.error('Error deleting product:', err);
            setMessage('Error deleting product');
        }
    };

    const renderProduct = (product) => {
        // Construct image URL once
        const imageUrl = `http://localhost:5000/${product.image_path}`;
        
        return (
            <div key={product.id} className={styles.productCard}>
                <img
                    src={imageUrl}
                    alt={product.name}
                    className={styles.productImage}
                    onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                    }}
                />
                <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <p className={styles.brand}>Brand: {product.make}</p>
                    <p className={styles.price}>Price: ${parseFloat(product.price).toFixed(2)}</p>
                    <p className={styles.description}>{product.description}</p>
                    <button 
                        onClick={() => handleDelete(product.id)}
                        className={styles.deleteButton}
                    >
                        Delete
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.dashboard}>
            <h1>Vendor Dashboard</h1>
            {message && <p className={styles.message}>{message}</p>}

            <form onSubmit={handleSubmit} className={styles.form} encType="multipart/form-data">
                <input type="text" name="name" placeholder="Product Name" required />
                <input type="text" name="make" placeholder="Manufacturer" required />
                <input type="text" name="brand" placeholder="Brand Name" required />
                <select name="category" required>
                    <option value="">Select Category</option>
                    <option value="chair">Chair</option>
                    <option value="sofa">Sofa</option>
                    <option value="bed">Bed</option>
                    <option value="table">Table</option>
                </select>
                <input type="number" name="price" placeholder="Price" step="0.01" required />
                <textarea name="description" placeholder="Description" required />
                <input 
                    type="file" 
                    name="image" 
                    accept="image/jpeg,image/jpg" 
                    required 
                />
                <button type="submit">Add Product</button>
            </form>

            <div className={styles.productList}>
                {Array.isArray(products) && products.length > 0 ? (
                    products.map(renderProduct)
                ) : (
                    <p>No products found. Add your first product above!</p>
                )}
            </div>
        </div>
    );
}

export default VendorDashboard;