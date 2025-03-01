import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import './wishlist.css';

function Wishlist() {
    const { wishlist, removeFromWishlist } = useWishlist();

    const handleRemove = async (productId) => {
        await removeFromWishlist(productId);
    };

    if (wishlist.length === 0) {
        return <div className="wishlist-empty">Your Wishlist Is Empty</div>;
    }

    return (
        <div className="wishlist-container">
            <h2>Your Wishlist</h2>
            <div className="wishlist-items-grid">
                {wishlist.map((item) => (
                    <div key={item.product_id} className="wishlist-item">
                        <div className="wishlist-item-image-container">
                            <img 
                                src={item.image} 
                                alt={item.name}
                                className="wishlist-item-image" 
                            />
                        </div>
                        <div className="wishlist-item-details">
                            <h3 className="wishlist-item-name">{item.name}</h3>
                            <p className="wishlist-item-brand">{item.make}</p>
                            <p className="wishlist-item-price">${parseFloat(item.price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                            <button 
                                onClick={() => handleRemove(item.product_id)} 
                                className="remove-button"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Wishlist;
