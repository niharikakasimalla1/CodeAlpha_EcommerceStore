const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

mongoose
    .connect("mongodb://localhost:27017/codealpha_ecommerce")
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error.message);
    });

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String
});

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    image: String
});

const orderSchema = new mongoose.Schema({
    userEmail: String,
    products: [
        {
            name: String,
            price: Number
        }
    ],
    total: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

const defaultProducts = [
    {
        name: "Wireless Headphones",
        price: 1499,
        description: "High-quality wireless headphones with clear sound and comfortable design.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
    },
    {
        name: "Smart Watch",
        price: 1999,
        description: "Modern smart watch with a stylish design for everyday use.",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
    },
    {
        name: "Running Shoes",
        price: 2499,
        description: "Comfortable running shoes designed for daily workouts and running.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
    },
    {
        name: "Backpack",
        price: 999,
        description: "Lightweight and spacious backpack suitable for college and travel.",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
];

async function seedProducts() {
    const count = await Product.countDocuments();

    if (count === 0) {
        await Product.insertMany(defaultProducts);
        console.log("Default products added to database.");
    }
}

app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Unable to fetch products." });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill all fields."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.json({
            message: "Registration successful!"
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed."
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
            name: user.name,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed."
        });
    }
});

app.post("/api/orders", async (req, res) => {
    try {
        const { userEmail, products, total } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json({
                message: "Cart is empty."
            });
        }

        const order = new Order({
            userEmail: userEmail || "Guest",
            products,
            total
        });

        await order.save();

        res.json({
            message: "Order placed successfully!",
            orderId: order._id
        });
    } catch (error) {
        res.status(500).json({
            message: "Order could not be placed."
        });
    }
});

app.get("/api/orders/:email", async (req, res) => {
    try {
        const orders = await Order.find({
            userEmail: req.params.email
        }).sort({ date: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch orders."
        });
    }
});

const PORT = 5000;

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    try {
        await mongoose.connection.asPromise();
        await seedProducts();
    } catch (error) {
        console.log("Database setup error:", error.message);
    }
});