import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ky from 'ky';

function Chairs() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        ky.get('http://localhost:5000/api/products', { 
            searchParams: { category: 'chair' } 
        })
        .json()
        .then((results) => {
            setProducts(results);
        })
        .catch((error) => console.error('Error fetching chairs:', error));
    }, []);

    return (
        <div>
            {/* Banner Image */}
            {/* Background via Freepik https://www.freepik.com/free-photo/view-room-interior-with-furniture-copy-space_58556710.htm#fromView=search&page=5&position=32&uuid=6c49763b-be93-4d0f-a315-58988d1d0505 -Sean Tiner */}
            <div class="mainImage">
                <img class="responsiveImg" src="img/chairImg/bannerChair8.jpg"/>
            </div>

            <div className="MainPageContent">
                <h1 className="productHeader">Chairs Collection</h1>
                <p className="productHeaderDescription">Check out our amazing collection of chairs. Find the perfect chair to complement your room style and comfort needs.</p>
                <div className="product-list">
                    {products.map((product) => (
                        <div key={product.id} className="product">
                            <Link to={product.image_path ? `/vendor-products/${product.id}` : `/products/${product.id}`}>
                                <div className="product-image-container">
                                    <img 
                                        src={product.image_path ? `http://localhost:5000/${product.image_path}` : product.image}
                                        alt={product.name}
                                        className="product-image"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/placeholder-image.jpg';
                                        }}
                                    />
                                </div>
                            </Link>
                            <p className="productName">{product.name}</p>
                            <p>Brand: {product.make}</p>
                            <p>Price: ${parseFloat(product.price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                            <p>{product.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Chairs;