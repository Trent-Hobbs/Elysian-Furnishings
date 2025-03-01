import React, { createContext, useContext, useState, useEffect } from 'react';
import ky from 'ky';
import { useAuth } from './AuthContext';

export const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const { isLoggedIn } = useAuth();
    const [cart, setCart] = useState([]);

    // Load cart items from server on login
    useEffect(() => {
        const loadCartFromServer = async () => {
            if (!isLoggedIn) return;

            try {
                const response = await ky.get('http://localhost:5000/api/cart', { credentials: 'include' }).json();
                setCart(response);
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        };

        loadCartFromServer();
    }, [isLoggedIn]);

    const addToCart = async (product) => {
        const sessionId = localStorage.getItem('session_id');
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    
        try {
            await ky.post('http://localhost:5000/api/cart', {
                json: { 
                    product_id: product.id, 
                    quantity: 1,
                    session_id: sessionId 
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    const increaseQuantity = async (id) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            )
        );

        try {
            await ky.post('http://localhost:5000/api/cart', {
                json: { product_id: id, quantity: 1 },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error increasing quantity:', error);
        }
    };

    const decreaseQuantity = async (id) => {
        setCart((prevCart) =>
            prevCart
                .map((item) =>
                    item.id === id ? { ...item, quantity: item.quantity - 1 } : item
                )
                .filter((item) => item.quantity > 0)
        );

        try {
            await ky.post('http://localhost:5000/api/cart', {
                json: { product_id: id, quantity: -1 },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error decreasing quantity:', error);
        }
    };

    // Remove a single item from the cart
    const removeFromCart = async (id) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== id));

        try {
            await ky.delete(`http://localhost:5000/api/cart/${id}`, { credentials: 'include' });
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    // Clear all items from the cart
    const clearCart = async () => {
        setCart([]);
        try {
            await ky.delete('http://localhost:5000/api/cart', { credentials: 'include' });
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, calculateTotal }}>
            {children}
        </CartContext.Provider>
    );
}
