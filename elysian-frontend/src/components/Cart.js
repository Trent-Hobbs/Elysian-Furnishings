import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Import AuthContext to check authentication
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './Cart.css';

function Cart() {
    const { cart, increaseQuantity, decreaseQuantity, removeFromCart, calculateTotal } = useCart();
    const { isLoggedIn } = useAuth(); // Changed from isAuthenticated to isLoggedIn
    const navigate = useNavigate(); // Get the navigate function

    // Updated auth check to use isLoggedIn
    if (!isLoggedIn) {
        return <div className="cart-empty">Please log in to view your cart.</div>;
    }

    if (cart.length === 0) {
        return <div className="cart-empty">Your Cart Is Empty</div>;
    }

    const handleCheckout = () => {
        navigate('/checkout'); // Navigate to checkout page
    };

    return (
        <div className="cart-container">
            <h2 className="cart-header">Your Cart</h2>
            <ul className="cart-list">
                {cart.map((item) => (
                    <li key={item.id} className="cart-item">
                        <img src={item.image} alt={item.name} className="cart-item-image" />
                        <div className="cart-item-details">
                            <h3 className="cart-item-name">{item.name}</h3>
                            <p className="cart-item-brand">Brand: {item.make}</p>
                            <p className="cart-item-price">Price: ${parseFloat(item.price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                            <div className="cart-item-quantity">
                                <button 
                                    onClick={() => decreaseQuantity(item.id)} 
                                    aria-label="Decrease quantity"
                                    className="quantity-button"
                                >
                                    -
                                </button>
                                <span className="quantity-display">{item.quantity}</span>
                                <button 
                                    onClick={() => increaseQuantity(item.id)} 
                                    aria-label="Increase quantity"
                                    className="quantity-button"
                                >
                                    +
                                </button>
                            </div>
                            <button 
                                onClick={() => removeFromCart(item.id)} 
                                className="remove-button-cart"
                            >
                                Remove
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            <h3 className="cart-total">Total: ${calculateTotal().toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</h3>
            <button className="checkout-button" onClick={handleCheckout}>Proceed to Checkout</button>
        </div>
    );
}

export default Cart;
