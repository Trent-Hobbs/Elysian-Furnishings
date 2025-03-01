import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ky from 'ky';

function Sofas() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        ky.get('http://localhost:5000/api/products', { 
            searchParams: { category: 'sofa' } 
        })
        .json()
        .then((results) => {
            setProducts(results);
        })
        .catch((error) => console.error('Error fetching sofas:', error));
    }, []);

    return (
        <div>
            <div class="mainImage">
                <img class="responsiveImg" src="img/sofaImg/bannerSofa8.jpg"/>
            </div>

            <div className="MainPageContent">
                <h1 className="productHeader">Sofas Collection</h1>
                <p className="productHeaderDescription">Welcome to the sofas collection. Here you can explore a wide variety of sofas for your perfect home decor.</p>
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

export default Sofas;
