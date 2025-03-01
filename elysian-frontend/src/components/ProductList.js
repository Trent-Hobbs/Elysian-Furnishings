import React, { useState, useEffect } from 'react';
import '../styles.css';

function ProductList() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for dark mode preference and set the state accordingly
    const darkModePreference = localStorage.getItem("dark-mode");
    if (darkModePreference === "enabled") {
      setIsDarkMode(true);
    }
  }, []);

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("dark-mode", newMode ? "enabled" : "disabled");
      return newMode;
    });
  };

  // Define the products array inside the component
  const products = [
    { name: 'Chairs', image: 'chairmain.jfif', link: '/chairs' },
    { name: 'Beds', image: 'bedmain.jfif', link: '/beds' },
    { name: 'Sofas', image: 'sofamain.jfif', link: '/sofas' },
    { name: 'Tables', image: 'tablemain.jfif', link: '/tables' },
  ];

  // Background image URL for the hero section
  const heroBackground = '/img/banner2.jpg'; // Source: Getty Images. - Trent Hobbs

  return (
    <div className={`home-MainPageContent ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Hero Section with Inline Style */}
      <section className="home-hero-section" style={{ backgroundImage: `url(${heroBackground})` }}>
        <div className="overlay" /> {/* Overlay for darkening effect */}
        <div className="home-hero-text">
          <h1>Welcome to Elysian Furnishings</h1>
          <p>Explore our modern furniture collection</p>
        </div>
      </section>
      {/* Featured Products Section */}
      <section className="home-featured-products">
        <h2>Featured Products</h2>
        <div className="home-product-listHome">
          {products.map((product, index) => (
            <div className="home-product" key={index}>
              <a href={product.link}>
                <img src={`/img/${product.image}`} alt={product.name} />
                <div className="home-product-name">{product.name}</div>
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProductList;
