import React, { createContext, useContext, useState, useEffect } from 'react';
import ky from 'ky';
import { useAuth } from './AuthContext';

export const WishlistContext = createContext();

export function useWishlist() {
    return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
    const { isLoggedIn } = useAuth();
    const [wishlist, setWishlist] = useState([]);

    // Load wishlist items from server on login
    useEffect(() => {
        const loadWishlistFromServer = async () => {
            if (!isLoggedIn) return;

            try {
                const response = await ky.get('http://localhost:5000/api/wishlist', { 
                    credentials: 'include' 
                }).json();
                setWishlist(response);
            } catch (error) {
                console.error('Error loading wishlist:', error);
            }
        };

        loadWishlistFromServer();
    }, [isLoggedIn]);

    const addToWishlist = async (item) => {
        setWishlist((prevWishlist) => {
            if (!prevWishlist.find(wishlistItem => wishlistItem.product_id === item.id)) {
                return [...prevWishlist, { product_id: item.id, ...item }]; // Include the entire item if necessary
            }
            return prevWishlist; // Prevent duplicates
        });

        try {
            await ky.post('http://localhost:5000/api/wishlist', {
                json: { product_id: item.id },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error adding to wishlist:', error);
        }
    };

    const removeFromWishlist = async (id) => {
        try {
            await ky.delete(`http://localhost:5000/api/wishlist/${id}`, { 
                credentials: 'include' 
            });
            // Update local state after successful deletion
            setWishlist(prevWishlist => 
                prevWishlist.filter(item => item.product_id !== id)
            );
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}
