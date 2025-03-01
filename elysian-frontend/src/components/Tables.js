import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ky from 'ky';

function Tables() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        ky.get('http://localhost:5000/api/products', { 
            searchParams: { category: 'table' } 
        })
        .json()
        .then((results) => {
            setProducts(results);
        })
        .catch((error) => console.error('Error fetching tables:', error));
    }, []);

    return (
        <div>
            <div className="mainImage">
                <img className="responsiveImg" src="img/tableImg/bannerTable2.jpg" alt="Banner" />
            </div>

            <div className="MainPageContent">
                <h1 className="productHeader">Tables Collection</h1>
                <p className="productHeaderDescription">Explore our diverse range of tables to find the ideal fit for your space and style preferences.</p>
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

export default Tables;
