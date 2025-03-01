import React, { useContext, useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../styles.css';

function Navbar() {
    const { isDarkMode, enableDarkMode, enableLightMode } = useContext(ThemeContext);
    const { isVendorLoggedIn } = useAuth();
    const [isResponsive, setIsResponsive] = useState(false);
    const navigate = useNavigate();

    // State for logo image
    const logoImage = isDarkMode ? '/img/EFDarkmode.jpg' : '/img/EF___1.jpg';

    const toggleMenu = () => {
        setIsResponsive(!isResponsive);
    };

    return (
        <div className={`topnav ${isResponsive ? 'responsive' : ''} ${isDarkMode ? 'dark-mode' : ''}`} id="TopNav">
            <div className="topnavCentered">
                <Link to="/" className="homeButton">
                    <img src={logoImage} width="70px" alt="Company Logo" />
                </Link>
            </div>

            <NavLink to="/chairs" className="textButton">Chairs</NavLink>
            <NavLink to="/sofas" className="textButton">Sofas</NavLink>
            <NavLink to="/tables" className="textButton">Tables</NavLink>
            <NavLink to="/beds" className="textButton">Beds</NavLink>

            <div className="icon-container">
                <Link to="/account" className={`icon ${isResponsive ? 'responsive-padding' : ''}`} id="account">
                    <img src="/img/AccountIcon.png" width="24px" alt="Account" />
                </Link>
                <Link to="/wishlist" id="wish" className={`icon ${isResponsive ? 'responsive-padding' : ''}`}>
                    <img src="/img/WishList2.png" width="27px" alt="Wishlist" />
                </Link>
                <Link to="/cart" id="cart" className={`icon ${isResponsive ? 'responsive-padding' : ''}`}>
                    <img src="/img/Cart2.png" width="27px" alt="Cart" />
                </Link>     
            </div>

            {/* Dark and Light Mode Toggle */}
            <a href="#light-mode" id="light" className={`icon ${isResponsive ? 'responsive-padding' : ''}`} onClick={enableLightMode}>
                <img src="/img/Light3.png" width="27px" alt="Light Mode" />
            </a>
            <a href="#dark-mode" id="dark" className={`icon ${isResponsive ? 'responsive-padding' : ''}`} onClick={enableDarkMode}>
                <img src="/img/Dark2.png" width="27px" alt="Dark Mode" />
            </a>

            <a className="subMenu" onClick={toggleMenu} aria-label="Toggle Menu" type="button">
                <img
                    id="menuIcon"
                    src={`/img/${isResponsive ? 'CloseIcon.png' : 'Hamburger%20Menu%20Icon2.png'}`}
                    width="24px"
                    alt="Menu"
                />
            </a>

            <div className="search">
                <form action="#">
                    <input
                        className={`searchBar ${isDarkMode ? 'dark-mode-search' : 'light-mode-search'}`}
                        type="text"
                        placeholder="Search For Product"
                        name="search"
                    />
                    <button className="searchButton" type="submit">
                        <img src="/img/SearchIcon2.png" width="30px" alt="Search" />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Navbar;
