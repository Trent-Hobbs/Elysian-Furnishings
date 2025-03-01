import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ky from 'ky';
import './ProductDetails.css';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

function ProductDetail() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { addToWishlist } = useWishlist();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [showMessage, setShowMessage] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [editingReview, setEditingReview] = useState(null);
    const { isLoggedIn } = useAuth();
    const [currentUserEmail, setCurrentUserEmail] = useState('');

    // Fetch product details
    useEffect(() => {
        ky.get(`http://localhost:5000/api/products/${id}`)
            .json()
            .then((data) => {
                setProduct(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching product:', error);
                setLoading(false);
            });
    }, [id]);
    

    // Fetch reviews from backend for the specific product
    useEffect(() => {
        setReviewsLoading(true);
        ky.get(`${API_BASE_URL}/reviews/${id}`, { 
            credentials: 'include' 
        })
        .json()
        .then((data) => {
            console.log('Reviews data:', data); // Debug log
            setReviews(data);
            calculateAverageRating(data);
            setReviewsLoading(false);
        })
        .catch((error) => {
            console.error('Error fetching reviews:', error);
            setReviewsLoading(false);
        });
    }, [id]);

    useEffect(() => {
        if (isLoggedIn) {
            ky.get(`${API_BASE_URL}/api/check-session`, { 
                credentials: 'include'
            })
            .json()
            .then(data => {
                console.log('Session data:', data); // Debug log
                setCurrentUserEmail(data.email);
            })
            .catch(err => {
                console.error('Error fetching user session:', err);
            });
        }
    }, [isLoggedIn]);
    
    // Handle adding product to cart
    const handleAddToCart = (product) => {
        addToCart(product);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    };

    // Handle adding product to wishlist
    const handleAddToWishlist = (product) => {
        addToWishlist(product);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000); // Hide message after 2 seconds
    };

    // Calculate the average rating
    const calculateAverageRating = (reviewsList) => {
        if (reviewsList.length === 0) {
            setAverageRating(0);
            return;
        }
        const avg = reviewsList.reduce((sum, review) => sum + review.rating, 0) / reviewsList.length;
        setAverageRating(avg);
    };

    // Submit review
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0 || comment.trim() === '') return;

        try {
            const response = await ky.post(`http://localhost:5000/reviews/${id}`, {
                json: { rating, comment },
                credentials: 'include',
            });

            const newReview = await response.json();

            // Add the new review to the state
            setReviews([
                ...reviews,
                { ...newReview, rating, comment, date: new Date().toLocaleDateString(), userEmail: newReview.userEmail || 'Anonymous' },
            ]);

            setRating(0);
            setComment('');
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await ky.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
                credentials: 'include'
            });
            setReviews(reviews.filter(review => review.id !== reviewId));
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const handleEditReview = async (reviewId, updatedReview) => {
        try {
            await ky.put(`${API_BASE_URL}/reviews/${reviewId}`, {
                json: updatedReview,
                credentials: 'include'
            });
            setReviews(reviews.map(review => 
                review.id === reviewId 
                    ? { ...review, ...updatedReview } 
                    : review
            ));
            setEditingReview(null);
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };

    const renderStars = () => (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={star <= (hoverRating || rating) ? 'star filled' : 'star'}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                >
                    ★
                </span>
            ))}
        </div>
    );

    const renderReview = (review, index) => {
        console.log('Rendering review:', review); // Debug log
        console.log('Current user email:', currentUserEmail); // Debug log
        
        return (
            <div key={index} className="review">
                {editingReview === review.id ? (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleEditReview(review.id, {
                            rating: rating,
                            comment: comment
                        });
                    }}>
                        {renderStars()}
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="review-comment-input"
                        />
                        <div className="edit-review-buttons">
                            <button type="submit" className="submit-review-btn">Save</button>
                            <button 
                                type="button" 
                                onClick={() => setEditingReview(null)}
                                className="cancel-edit-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="review-rating">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                        <p className="review-comment">{review.comment}</p>
                        <p className="review-user">Reviewed by: {review.userEmail}</p>
                        <p className="review-date">{review.date}</p>
                        {currentUserEmail && currentUserEmail === review.userEmail && (
                            <div className="review-actions">
                                <button 
                                    onClick={() => setEditingReview(review.id)}
                                    className="edit-review-btn"
                                    title="Edit review"
                                >
                                    ✎
                                </button>
                                <button 
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="delete-review-btn"
                                    title="Delete review"
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    if (loading) return <div>Loading product details...</div>;
    if (!product) return <div>Product not found</div>;

    return (
        <div className="product-detail">
            <div className="product-detail-image-container">
                <img src={product.image} alt={product.name} className="product-detail-image" />
            </div>
            <div className="product-info">
                <h2 className="product-name">{product.name}</h2>
                <p className="product-brand">Brand: {product.make}</p>
                <div className="product-meta">
                    <p className="product-price">${parseFloat(product.price || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                </div>

                <div className="product-actions">
                    <label className="quantity-label">
                        Quantity:
                        <select
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                            className="quantity-select"
                        >
                            {[...Array(10).keys()].map((num) => (
                                <option key={num + 1} value={num + 1}>
                                    {num + 1}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button onClick={() => addToCart(product)} className="add-to-cart-btn">
                        Add to Cart
                    </button>
                    <button onClick={() => addToWishlist(product)} className="add-to-wishlist-btn">
                        <img src="/img/Wishlist2.png" alt="Add to Wishlist" />
                    </button>
                </div>

                {showMessage && (
                    <div className="added-to-cart-message">
                        <p>Item added to cart!</p>
                    </div>
                )}

                {/* Review Form - Star Rating & Comments */}
                <div className="review-form">
                    <h3 className="review-header">Leave a Review</h3>
                    {renderStars()}
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your review here"
                        className="review-comment-input"
                    />
                    <button onClick={handleReviewSubmit} className="submit-review-btn">
                        Submit Review
                    </button>
                </div>

                {/* Customer Reviews Section */}
                <div className="reviews-section">
                    <h3 className="review-header">Customer Reviews</h3>

                    {/* Average Rating */}
                    {averageRating > 0 && (
                        <div className="average-rating">
                            <h4>Average Rating:</h4>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={star <= Math.round(averageRating) ? 'star filled' : 'star'}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <p>{averageRating.toFixed(1)} / 5</p>
                        </div>
                    )}

                    {/* Show reviews or loading state */}
                    {reviewsLoading ? (
                        <p>Loading reviews...</p>
                    ) : reviews.length > 0 ? (
                        reviews.map((review, index) => renderReview(review, index))
                    ) : (
                        <p>No reviews yet. Be the first to review!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
