import React from 'react';
import { useCart } from '../context/CartContext';
import './Checkout.css';

function Checkout() {
    const { cart, calculateTotal, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = useCart();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Checkout submitted');
    };

    return (
        <div className="checkout-container">
            {/* Left Column: Cart Items */}
            <div className="checkout-items">
                <h2>Added to your cart</h2>
                <hr />
                {cart.map((item) => (
                    <div key={item.id} className="checkout-item">
                        <div className="checkout-image-container">
                            <img src={item.image} className="checkout-product-image" alt={item.name} />
                        </div>
                        <div className="checkout-item-details">
                            <strong>{item.name}</strong><br />
                            <span className="item-number">Item: {item.id}</span><br />
                            <span className="quantity-controls">
                                Quantity:
                                <button 
                                    className="quantity-btn" 
                                    onClick={() => decreaseQuantity(item.id)} 
                                    disabled={item.quantity <= 1}
                                >
                                    &#x25BC; {/* Down arrow */}
                                </button>
                                <span>{item.quantity}</span>
                                <button 
                                    className="quantity-btn" 
                                    onClick={() => increaseQuantity(item.id)}
                                >
                                    &#x25B2; {/* Up arrow */}
                                </button>
                            </span>
                            <span className="price">Price: ${parseFloat(item.price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} each</span>
                        </div>
                        {/* Trash Icon for Removing Item */}
                        <button 
                            className="remove-btn" 
                            onClick={() => removeFromCart(item.id)}
                            title="Remove item"
                        >
                            &#x1F5D1; {/* Trash icon */}
                        </button>
                    </div>
                ))}
                {cart.length > 0 && (
                    <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
                )}
            </div>

            {/* Right Column: Cart Summary */}
            <div className="checkout-summary">
                <h2>Your Cart: {cart.length} item(s)</h2>
                <hr />
                <div className="subtotal">
                    <span>Subtotal:</span>
                    <span className="subtotal-amount">${calculateTotal().toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                </div>
                <p className="subtotal-note">(Subtotal does not include shipping and processing, gift wrap, discounts or tax.)</p>
                <button className="checkout-button" onClick={handleSubmit}>CHECK OUT</button>
            </div>
        </div>
    );
}

export default Checkout;
