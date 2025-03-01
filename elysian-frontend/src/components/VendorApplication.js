import React, { useState } from 'react';
import ky from 'ky';
import styles from './VendorApplication.module.css';

function VendorApplication() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        businessName: '',
        password: '', // Added password field
        termsAccepted: false,
    });
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setErrors((prevErrors) => ({ ...prevErrors, [name]: '' })); // Clear individual error
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName) newErrors.fullName = 'Full name is required.';
        if (!formData.email) {
            newErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Enter a valid email address.';
        }
        if (!formData.phone) newErrors.phone = 'Contact number is required.';
        if (!formData.businessName) newErrors.businessName = 'Business name is required.';
        if (!formData.password) {
            newErrors.password = 'Password is required.';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters.';
        }
        if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions.';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await ky
                .post('http://localhost:5000/api/vendor/signup', { json: formData })
                .json();
            setMessage(response.message || 'Application submitted successfully!');
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                businessName: '',
                password: '', // Reset password field
                termsAccepted: false,
            });
        } catch (error) {
            setMessage('Failed to submit application');
            console.error('Error during vendor application:', error);
        }
    };

    return (
        <div className={styles['vendor-form-container']}>
            <h1 className={styles['vendor-form-title']}>Vendor Application Form</h1>
            <p className={styles['vendor-form-subtitle']}>Let the world see your amazing products!</p>
            <form onSubmit={handleSubmit} className={styles['vendor-form']}>
                <h2 className={styles['section-title']}>Vendor Information</h2>

                <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`${styles['vendor-input']} ${errors.fullName ? styles['error-input'] : ''}`}
                />
                {errors.fullName && <p className={styles['error-message']}>{errors.fullName}</p>}

                <input
                    type="email"
                    name="email"
                    placeholder="Enter your business email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${styles['vendor-input']} ${errors.email ? styles['error-input'] : ''}`}
                />
                {errors.email && <p className={styles['error-message']}>{errors.email}</p>}

                <input
                    type="text"
                    name="phone"
                    placeholder="Enter your contact number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${styles['vendor-input']} ${errors.phone ? styles['error-input'] : ''}`}
                />
                {errors.phone && <p className={styles['error-message']}>{errors.phone}</p>}

                <input
                    type="text"
                    name="businessName"
                    placeholder="Enter your registered business name"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={`${styles['vendor-input']} ${errors.businessName ? styles['error-input'] : ''}`}
                />
                {errors.businessName && <p className={styles['error-message']}>{errors.businessName}</p>}

                <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${styles['vendor-input']} ${errors.password ? styles['error-input'] : ''}`}
                />
                {errors.password && <p className={styles['error-message']}>{errors.password}</p>}

                <h2 className={styles['section-title']}>Terms and Conditions</h2>
                <label className={styles['terms-label']}>
                    <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleChange}
                        className={styles['vendor-checkbox']}
                    />
                    {' '}I agree to Elysian Furnishings' Vendor Terms and Conditions.
                </label>
                {errors.termsAccepted && <p className={styles['error-message']}>{errors.termsAccepted}</p>}

                <button type="submit" className={styles['vendor-button']}>
                    Submit Application
                </button>
            </form>
            {message && <p className={styles['vendor-message']}>{message}</p>}
        </div>
    );
}

export default VendorApplication;
