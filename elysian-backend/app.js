const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // For session management
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid').v4;

const app = express();
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Update static file serving
app.use('/uploads', express.static(uploadsPath));

// Update the storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg files are allowed'));
        }
    }
}).single('image'); // Configure for single file upload named 'image'


// Update body parser configuration
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Update CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Vendor-ID'],
}));

// Ensure that cookieParser is used before express-session
app.use(cookieParser());

// Simplified session
app.use(session({
    secret: 'your_secret_key_here',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Simplified vendor auth check
const checkVendorAuth = (req, res, next) => {
    if (!req.session.vendorId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',  // Replace with your MySQL username
    password: 'Adsfjlk;122',  // Replace with your MySQL password
    database: 'elysiantest',  // Your database name
});

db.connect(err => {
    if (err) {
        console.log('DB connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// API route to get products filtered by category
app.get('/api/products', (req, res) => {
    const category = req.query.category;
    let mainQuery = 'SELECT * FROM products';
    let vendorQuery = 'SELECT *, "vendor" as source FROM vendor_products';

    if (category) {
        mainQuery += ' WHERE category = ?';
        vendorQuery += ' WHERE category = ?';
    }

    const params = category ? [category] : [];

    // Get regular products
    db.query(mainQuery, params, (err, productResults) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Get vendor products
        db.query(vendorQuery, params, (err, vendorResults) => {
            if (err) {
                console.error('Error fetching vendor products:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Format vendor product image paths
            const formattedVendorResults = vendorResults.map(product => ({
                ...product,
                image: `http://localhost:5000/${product.image_path}`,
                source: 'vendor'  // Keep source identifier
            }));

            // Combine and send results
            const combinedResults = [...productResults, ...formattedVendorResults];
            res.json(combinedResults);
        });
    });
});

// API route to get a product by ID
app.get('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const query = 'SELECT * FROM products WHERE id = ?';

    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
        } else if (results.length === 0) {
            res.status(404).json({ message: 'Product not found' });
        } else {
            res.json(results[0]);
        }
    });
});

// User Registration Route with Unique Email Check
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkEmailQuery, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length > 0) return res.status(400).json({ error: 'Email already in use' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertUserQuery = 'INSERT INTO users (email, password) VALUES (?, ?)';
            db.query(insertUserQuery, [email, hashedPassword], (err) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.status(201).json({ message: 'User registered successfully' });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// User Login Route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const sessionId = uuidv4();
                req.session.userId = user.id;
                req.session.email = email;
                
                res.set('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Secure=false; SameSite=Lax`);
                return res.status(200).json({ 
                    message: 'Login successful',
                    userId: user.id,
                    sessionId: sessionId
                });
            } else {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    });
});

// Route to add item to cart (POST /api/cart)
app.post('/api/cart', (req, res) => {
    const { product_id, quantity } = req.body;
    const userId = req.session.userId || null; // For logged-in users
    const sessionId = req.session.id || null; // For guests

    if (!userId && !sessionId) {
        return res.status(401).json({ error: 'User not logged in or session not available' });
    }

    const query = `
        INSERT INTO cart_items (user_id, session_id, product_id, quantity)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + ?;
    `;
    const params = [userId, sessionId, product_id, quantity, quantity];

    db.query(query, params, (err) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Item added to cart' });
        }
    });
});

// Route to get cart items (GET /api/cart)
app.get('/api/cart', (req, res) => {
    const userId = req.session.userId; // Assume user is logged in with session

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const query = `
        SELECT c.*, p.name, p.price, p.image 
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?;
    `;
    const params = [userId];

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results); // Send the cart items to the frontend
        }
    });
});

// Route to clear cart items (DELETE /api/cart)
app.delete('/api/cart', (req, res) => {
    const userId = req.session.userId || null;
    const sessionId = req.session.id || null;

    if (!userId && !sessionId) {
        return res.status(401).json({ error: 'User not logged in or session not available' });
    }

    const query = 'DELETE FROM cart_items WHERE user_id = ? OR session_id = ?';
    const params = [userId, sessionId];

    db.query(query, params, (err) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Cart cleared successfully' });
        }
    });
});

// User Logout Route
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Session Check Route
app.get('/api/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            isAuthenticated: true, 
            userId: req.session.userId,
            email: req.session.email // Include email in session response
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Route to add item to wishlist (POST /api/wishlist)
app.post('/api/wishlist', (req, res) => {
    const { product_id } = req.body;
    const userId = req.session.userId; // For logged-in users

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const query = `
        INSERT INTO wishlist_items (user_id, product_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE product_id = product_id; 
    `;
    const params = [userId, product_id];

    db.query(query, params, (err) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Item added to wishlist' });
        }
    });
});

// Route to get wishlist items (GET /api/wishlist)
app.get('/api/wishlist', (req, res) => {
    const userId = req.session.userId; // Assume user is logged in with session

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const query = `
        SELECT w.*, p.name, p.price, p.image 
        FROM wishlist_items w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = ?;
    `;
    const params = [userId];

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results); // Send the wishlist items to the frontend
        }
    });
});

// Route to remove item from wishlist (DELETE /api/wishlist/:id)
app.delete('/api/wishlist/:id', (req, res) => {
    const userId = req.session.userId; // Assume user is logged in with session
    const productId = req.params.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const query = 'DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?';
    const params = [userId, productId];

    db.query(query, params, (err) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Item removed from wishlist' });
        }
    });
});

// Get reviews for a product
app.get('/reviews/:productId', (req, res) => {
    const productId = req.params.productId;
    const query = `
        SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, 
               r.created_at, u.email AS userEmail
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
    `;

    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ error: 'Failed to fetch reviews' });
        }
        res.json(results);
    });
});

// Add a review for a product
app.post('/reviews/:productId', (req, res) => {
    const productId = req.params.productId;
    const { rating, comment } = req.body;
    const userId = req.session.userId; // Get user ID from session

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating value' });
    }

    const query = 'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)';

    db.query(query, [productId, userId, rating, comment], (err, result) => {
        if (err) {
            console.error('Error saving review:', err);
            return res.status(500).json({ error: 'Failed to save review' });
        }

        res.status(201).json({
            success: true,
            reviewId: result.insertId,
            userEmail: req.session.email, // Assuming you save the email in the session during login
        });
    });
});

// Add delete review endpoint
app.delete('/reviews/:reviewId', (req, res) => {
    const { reviewId } = req.params;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const query = 'DELETE FROM reviews WHERE id = ? AND user_id = ?';
    db.query(query, [reviewId, userId], (err, result) => {
        if (err) {
            console.error('Error deleting review:', err);
            return res.status(500).json({ error: 'Failed to delete review' });
        }
        if (result.affectedRows === 0) {
            return res.status(403).json({ error: 'Not authorized to delete this review' });
        }
        res.json({ message: 'Review deleted successfully' });
    });
});

// Add edit review endpoint
app.put('/reviews/:reviewId', (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating value' });
    }

    const query = 'UPDATE reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?';
    db.query(query, [rating, comment, reviewId, userId], (err, result) => {
        if (err) {
            console.error('Error updating review:', err);
            return res.status(500).json({ error: 'Failed to update review' });
        }
        if (result.affectedRows === 0) {
            return res.status(403).json({ error: 'Not authorized to edit this review' });
        }
        res.json({ message: 'Review updated successfully' });
    });
});

app.post('/api/vendor/signup', async (req, res) => {
    const { fullName, email, password, businessName, phone } = req.body;

    if (!fullName || !email || !password || !businessName || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const checkEmailQuery = 'SELECT * FROM vendors WHERE email = ?';
        db.query(checkEmailQuery, [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length > 0) return res.status(400).json({ error: 'Email already in use' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertVendorQuery = `
                INSERT INTO vendors (full_name, email, password, business_name, phone)
                VALUES (?, ?, ?, ?, ?)
            `;
            db.query(insertVendorQuery, [fullName, email, hashedPassword, businessName, phone], (err) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.status(201).json({ message: 'Vendor registered successfully' });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Vendor Login Route
app.post('/api/vendor/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    const query = 'SELECT * FROM vendors WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            console.log('No vendor found with email:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const vendor = results[0];
        console.log('Found vendor:', vendor.email);
        
        try {
            const match = await bcrypt.compare(password, vendor.password);
            console.log('Password match:', match);
            
            if (match) {
                const sessionId = uuidv4();
                req.session.vendorId = vendor.id;
                req.session.vendorName = vendor.full_name;
                
                res.set('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Secure=false; SameSite=Lax`);
                console.log('Login successful for vendor:', vendor.full_name);
                
                return res.status(200).json({ 
                    message: 'Login successful',
                    vendorId: vendor.id,
                    vendorName: vendor.full_name,
                    sessionId: sessionId
                });
            } else {
                console.log('Password mismatch for vendor:', email);
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    });
});

app.put('/api/vendor/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const query = 'UPDATE vendors SET application_status = ? WHERE id = ?';
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating vendor status:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        res.status(200).json({ message: `Vendor ${status} successfully` });
    });
});

app.get('/api/vendor/:id/products', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM vendor_products WHERE vendor_id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching vendor products:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(results);
    });
});

// Product addition route
app.post('/api/vendor/products', checkVendorAuth, (req, res) => {
    upload(req, res, function(err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const vendorId = req.session.vendorId;
        const { name, price, category, description, make, brand } = req.body;

        // Store only the filename in the database
        const imagePath = 'uploads/' + path.basename(req.file.path);

        const query = `
            INSERT INTO vendor_products 
            (vendor_id, name, price, category, description, image_path, make, brand) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            vendorId,
            name,
            parseFloat(price),
            category,
            description,
            imagePath,
            make,
            brand
        ];

        db.query(query, params, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Error cleaning up:', unlinkErr);
                });
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({
                message: 'Product added successfully',
                newProduct: {
                    id: result.insertId,
                    name,
                    price: parseFloat(price),
                    category,
                    description,
                    image_path: imagePath,
                    make,
                    brand,
                    vendor_id: vendorId,
                    source: 'vendor' // Add this to identify vendor products
                }
            });
        });
    });
});

// Simplified dashboard route
app.get('/api/vendor/dashboard', checkVendorAuth, (req, res) => {
    const query = 'SELECT * FROM vendor_products WHERE vendor_id = ?';
    db.query(query, [req.session.vendorId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        // Format image paths consistently
        const formattedResults = results.map(product => ({
            ...product,
            image_path: product.image_path
        }));
        res.json(formattedResults);
    });
});

app.delete('/api/vendor/products/:id', (req, res) => {
    const vendorId = req.session.vendorId;
    const productId = req.params.id;

    if (!vendorId) {
        return res.status(401).json({ error: 'Vendor not logged in' });
    }

    const query = 'DELETE FROM vendor_products WHERE id = ? AND vendor_id = ?';
    db.query(query, [productId, vendorId], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found or not owned by this vendor' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    });
});

// Add vendor session check route
app.get('/api/vendor/check-session', (req, res) => {
    if (req.session.vendorId) {
        res.json({
            isVendor: true,
            vendorId: req.session.vendorId,
            vendorName: req.session.vendorName
        });
    } else {
        res.json({ isVendor: false });
    }
});

// Vendor Logout Route
app.post('/api/vendor/logout', (req, res) => {
    if (req.session) {
        // Clear vendor-specific session data
        delete req.session.vendorId;
        delete req.session.vendorName;

        req.session.destroy((err) => {
            if (err) {
                console.error('Error during logout:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }

            // Clear the session cookie
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            res.status(200).json({ message: 'Logged out successfully' });
        });
    } else {
        res.status(200).json({ message: 'Already logged out' });
    }
});

// Modify the vendor products route to include more details
app.get('/api/vendor-products/:id', (req, res) => {
    const productId = req.params.id;
    const query = `
        SELECT 
            vp.*,
            v.business_name as vendor_name,
            v.id as vendor_id,
            v.email as vendor_email
        FROM vendor_products vp
        JOIN vendors v ON vp.vendor_id = v.id
        WHERE vp.id = ?
    `;
    
    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = results[0];
        // Ensure the image path is properly formatted
        if (product.image_path && !product.image_path.startsWith('http')) {
            product.image_path = `uploads/${product.image_path.split('uploads/').pop()}`;
        }
        
        res.json(product);
    });
});

// Add a route to get all vendor products by category
app.get('/api/vendor-products', (req, res) => {
    const category = req.query.category;
    const query = category 
        ? 'SELECT * FROM vendor_products WHERE category = ?' 
        : 'SELECT * FROM vendor_products';
    const params = category ? [category] : [];

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching vendor products:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        // Format image paths for all products
        const formattedResults = results.map(product => ({
            ...product,
            image_path: product.image_path ? `uploads/${product.image_path.split('uploads/').pop()}` : null,
            is_vendor: true
        }));
        res.json(formattedResults);
    });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

