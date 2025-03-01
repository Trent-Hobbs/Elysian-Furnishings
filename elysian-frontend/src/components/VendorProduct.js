import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ky from 'ky';
import './ProductDetails.css';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function VendorProduct() {
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

    // Fetch vendor product details
    useEffect(() => {
        ky.get(`http://localhost:5000/api/vendor-products/${id}`)
            .json()
            .then((data) => {
                // Normalize the data structure to match regular products
                const normalizedProduct = {
                    ...data,
                    image: `http://localhost:5000/${data.image_path}`,
                    price: parseFloat(data.price),
                    is_vendor: true
                };
                setProduct(normalizedProduct);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching product:', error);
                setLoading(false);
            });
    }, [id]);

    // Fetch reviews (same as ProductDetail)
    useEffect(() => {
        setReviewsLoading(true);
        ky.get(`http://localhost:5000/reviews/${id}`, { credentials: 'include' })
            .json()
            .then((data) => {
                setReviews(data);
                calculateAverageRating(data);
                setReviewsLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching reviews:', error);
                setReviewsLoading(false);
            });
    }, [id]);

    // Rest of the functions from ProductDetail.js
    const handleAddToCart = (product) => {
        addToCart(product);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000);
    };

    const handleAddToWishlist = (product) => {
        addToWishlist(product);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000);
    };

    const calculateAverageRating = (reviewsList) => {
        if (reviewsList.length === 0) {
            setAverageRating(0);
            return;
        }
        const avg = reviewsList.reduce((sum, review) => sum + review.rating, 0) / reviewsList.length;
        setAverageRating(avg);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0 || comment.trim() === '') return;

        try {
            const response = await ky.post(`http://localhost:5000/reviews/${id}`, {
                json: { rating, comment },
                credentials: 'include',
            });

            const newReview = await response.json();
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

    if (loading) return <div>Loading product details...</div>;
    if (!product) return <div>Product not found</div>;

    // Same return JSX as ProductDetail.js
    return (
        <div className="product-detail">
            <div className="product-detail-image-container">
                <img src={product.image} alt={product.name} className="product-detail-image" />
            </div>
            <div className="product-info">
                <h2 className="product-name">{product.name}</h2>
                <p className="product-brand">Brand: {product.make}</p>
                <div className="product-meta">
                    <p className="product-price">${product.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
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

                {/* Review sections identical to ProductDetail.js */}
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

                <div className="reviews-section">
                    <h3 className="review-header">Customer Reviews</h3>
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

                    {reviewsLoading ? (
                        <p>Loading reviews...</p>
                    ) : reviews.length > 0 ? (
                        reviews.map((review, index) => (
                            <div key={index} className="review">
                                <div className="review-rating">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                                <p className="review-comment">{review.comment}</p>
                                <p className="review-user">Reviewed by: {review.userEmail || 'Anonymous'}</p>
                                <p className="review-date">{review.date}</p>
                            </div>
                        ))
                    ) : (
                        <p>No reviews yet. Be the first to review!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VendorProduct;