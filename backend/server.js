const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// مسیر فایل‌ها
// ===============================
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

const PRODUCTS_FILE = path.join(__dirname, "products.json");
const ORDERS_FILE = path.join(__dirname, "orders.json");
const USERS_FILE = path.join(__dirname, "users.json");

// ===============================
// رمز مدیریت
// ===============================
const ADMIN_PASSWORD = "1234";

// ===============================
// Middleware
// ===============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// محصولات پیش‌فرض
// ===============================
const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "هودی مشکی اسپرت",
        price: 1100000,
        oldPrice: 0,
        discount: 0,
        rating: 5,
        colors: ["مشکی"],
        sizes: ["M", "L", "XL"],
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
        description: "هودی مشکی اسپرت با طراحی زیبا و مناسب استفاده روزمره.",
        category: "لباس"
    },
    {
        id: 2,
        name: "کفش اسپرت سفید",
        price: 1850000,
        oldPrice: 0,
        discount: 0,
        rating: 5,
        colors: ["سفید"],
        sizes: ["40", "41", "42", "43", "44"],
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
        description: "کفش اسپرت سفید راحت و مناسب استفاده روزانه.",
        category: "کفش"
    },
    {
        id: 3,
        name: "ساعت هوشمند",
        price: 2450000,
        oldPrice: 0,
        discount: 0,
        rating: 5,
        colors: ["مشکی"],
        sizes: [],
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        description: "ساعت هوشمند مدرن با طراحی شیک و امکانات کاربردی.",
        category: "اکسسوری"
    }
];

// ===============================
// توابع کمکی
// ===============================
function ensureFile(file, defaultData) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(defaultData, null, 2),
                "utf8"
            );
            return defaultData;
        }

        const text = fs.readFileSync(file, "utf8");

        if (!text.trim()) {
            fs.writeFileSync(
                file,
                JSON.stringify(defaultData, null, 2),
                "utf8"
            );
            return defaultData;
        }

        return JSON.parse(text);
    } catch (error) {
        console.error("File error:", error);
        return defaultData;
    }
}

function saveJson(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function loadProducts() {
    return ensureFile(
        PRODUCTS_FILE,
        DEFAULT_PRODUCTS
    );
}

function saveProducts(products) {
    saveJson(PRODUCTS_FILE, products);
}

function loadOrders() {
    return ensureFile(
        ORDERS_FILE,
        []
    );
}

function saveOrders(orders) {
    saveJson(ORDERS_FILE, orders);
}

function loadUsers() {
    return ensureFile(
        USERS_FILE,
        []
    );
}

function saveUsers(users) {
    saveJson(USERS_FILE, users);
}

function nextId(list) {
    if (!list.length) {
        return 1;
    }

    return (
        Math.max(
            ...list.map(item => Number(item.id) || 0)
        ) + 1
    );
}

// ===============================
// ورود مدیریت
// ===============================
app.post("/api/admin/login", (req, res) => {

    const password = String(
        req.body.password || ""
    );

    if (password !== ADMIN_PASSWORD) {

        return res.status(401).json({
            success: false,
            message: "رمز مدیریت اشتباه است."
        });
    }

    res.json({
        success: true,
        message: "ورود موفق بود."
    });
});

// ===============================
// صفحات
// ===============================
app.get("/", (req, res) => {

    const file = path.join(
        FRONTEND_DIR,
        "index.html"
    );

    if (!fs.existsSync(file)) {
        return res
            .status(404)
            .send("index.html پیدا نشد.");
    }

    res.sendFile(file);
});

app.get("/admin", (req, res) => {

    const file = path.join(
        FRONTEND_DIR,
        "admin.html"
    );

    if (!fs.existsSync(file)) {
        return res
            .status(404)
            .send("admin.html پیدا نشد.");
    }

    res.sendFile(file);
});

app.use(
    express.static(FRONTEND_DIR)
);

// ===============================
// PRODUCTS
// ===============================

app.get("/api/products", (req, res) => {

    res.json({
        success: true,
        products: loadProducts()
    });
});

app.get("/api/products/:id", (req, res) => {

    const id = Number(req.params.id);

    const product = loadProducts().find(
        p => Number(p.id) === id
    );

    if (!product) {

        return res.status(404).json({
            success: false,
            message: "محصول پیدا نشد."
        });
    }

    res.json({
        success: true,
        product
    });
});

app.post("/api/products", (req, res) => {

    try {

        const products = loadProducts();

        const {
            name,
            price,
            oldPrice,
            discount,
            rating,
            colors,
            sizes,
            image,
            description,
            category
        } = req.body;

        if (!name || price === undefined) {

            return res.status(400).json({
                success: false,
                message: "نام و قیمت محصول الزامی است."
            });
        }

        const product = {

            id: nextId(products),

            name: String(name),

            price: Number(price) || 0,

            oldPrice:
                Number(oldPrice) || 0,

            discount:
                Number(discount) || 0,

            rating:
                Number(rating) || 5,

            colors:
                Array.isArray(colors)
                    ? colors
                    : [],

            sizes:
                Array.isArray(sizes)
                    ? sizes
                    : [],

            image:
                String(image || ""),

            description:
                String(description || ""),

            category:
                String(category || "")
        };

        products.push(product);

        saveProducts(products);

        res.status(201).json({

            success: true,

            message:
                "محصول با موفقیت اضافه شد.",

            product,

            products
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در ذخیره محصول."
        });
    }
});

app.put("/api/products/:id", (req, res) => {

    try {

        const products = loadProducts();

        const id =
            Number(req.params.id);

        const index =
            products.findIndex(
                p => Number(p.id) === id
            );

        if (index === -1) {

            return res.status(404).json({
                success: false,
                message:
                    "محصول پیدا نشد."
            });
        }

        const oldProduct =
            products[index];

        products[index] = {

            ...oldProduct,

            ...req.body,

            id,

            price:
                req.body.price !== undefined
                    ? Number(req.body.price)
                    : oldProduct.price,

            oldPrice:
                req.body.oldPrice !== undefined
                    ? Number(req.body.oldPrice)
                    : oldProduct.oldPrice,

            discount:
                req.body.discount !== undefined
                    ? Number(req.body.discount)
                    : oldProduct.discount,

            rating:
                req.body.rating !== undefined
                    ? Number(req.body.rating)
                    : oldProduct.rating
        };

        saveProducts(products);

        res.json({

            success: true,

            message:
                "محصول با موفقیت ویرایش شد.",

            product:
                products[index]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در ویرایش محصول."
        });
    }
});

app.delete("/api/products/:id", (req, res) => {

    try {

        const products =
            loadProducts();

        const id =
            Number(req.params.id);

        const newProducts =
            products.filter(
                p => Number(p.id) !== id
            );

        if (
            newProducts.length ===
            products.length
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "محصول پیدا نشد."
            });
        }

        saveProducts(newProducts);

        res.json({

            success: true,

            message:
                "محصول حذف شد.",

            products:
                newProducts
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در حذف محصول."
        });
    }
});

// ===============================
// ORDERS
// ===============================

app.post("/api/orders", (req, res) => {

    try {

        const orders =
            loadOrders();

        const {
            customer,
            items,
            total
        } = req.body;

        if (
            !customer ||
            !customer.name ||
            !customer.phone ||
            !customer.address
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "نام، شماره تلفن و آدرس الزامی است."
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "سبد خرید خالی است."
            });
        }

        const order = {

            id: nextId(orders),

            orderNumber:
                "SHOP-" + Date.now(),

            customer: {

                name:
                    String(customer.name),

                phone:
                    String(customer.phone),

                address:
                    String(customer.address),

                note:
                    String(customer.note || "")
            },

            items:
                items.map(item => ({

                    id:
                        Number(item.id),

                    name:
                        String(item.name),

                    price:
                        Number(item.price) || 0,

                    image:
                        item.image || "",

                    color:
                        item.color || null,

                    size:
                        item.size || null,

                    quantity:
                        Number(item.quantity) || 1
                })),

            total:
                Number(total) || 0,

            status:
                "در انتظار بررسی",

            paymentStatus:
                "پرداخت نشده",

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };

        orders.push(order);

        saveOrders(orders);

        res.status(201).json({

            success: true,

            message:
                "سفارش با موفقیت ثبت شد.",

            order
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در ثبت سفارش."
        });
    }
});

// دریافت همه سفارش‌ها
app.get("/api/orders", (req, res) => {

    const orders =
        loadOrders().sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

    res.json({

        success: true,

        orders
    });
});

// دریافت یک سفارش
app.get("/api/orders/:id", (req, res) => {

    const id =
        Number(req.params.id);

    const order =
        loadOrders().find(
            o => Number(o.id) === id
        );

    if (!order) {

        return res.status(404).json({

            success: false,

            message:
                "سفارش پیدا نشد."
        });
    }

    res.json({

        success: true,

        order
    });
});

// تغییر وضعیت سفارش
app.put("/api/orders/:id", (req, res) => {

    try {

        const orders =
            loadOrders();

        const id =
            Number(req.params.id);

        const index =
            orders.findIndex(
                o => Number(o.id) === id
            );

        if (index === -1) {

            return res.status(404).json({

                success: false,

                message:
                    "سفارش پیدا نشد."
            });
        }

        if (
            req.body.status !== undefined
        ) {

            orders[index].status =
                String(req.body.status);
        }

        if (
            req.body.paymentStatus !== undefined
        ) {

            orders[index].paymentStatus =
                String(
                    req.body.paymentStatus
                );
        }

        orders[index].updatedAt =
            new Date().toISOString();

        saveOrders(orders);

        res.json({

            success: true,

            message:
                "سفارش به‌روزرسانی شد.",

            order:
                orders[index]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در به‌روزرسانی سفارش."
        });
    }
});

// حذف سفارش
app.delete("/api/orders/:id", (req, res) => {

    try {

        const orders =
            loadOrders();

        const id =
            Number(req.params.id);

        const newOrders =
            orders.filter(
                o => Number(o.id) !== id
            );

        if (
            newOrders.length ===
            orders.length
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "سفارش پیدا نشد."
            });
        }

        saveOrders(newOrders);

        res.json({

            success: true,

            message:
                "سفارش حذف شد.",

            orders:
                newOrders
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در حذف سفارش."
        });
    }
});

// آمار سفارش‌ها
app.get(
    "/api/orders/stats/summary",
    (req, res) => {

        const orders =
            loadOrders();

        const stats = {

            totalOrders:
                orders.length,

            pending:
                orders.filter(
                    o =>
                        o.status ===
                        "در انتظار بررسی"
                ).length,

            processing:
                orders.filter(
                    o =>
                        o.status ===
                        "در حال آماده‌سازی"
                ).length,

            shipped:
                orders.filter(
                    o =>
                        o.status ===
                        "ارسال شد"
                ).length,

            completed:
                orders.filter(
                    o =>
                        o.status ===
                        "تکمیل شد"
                ).length,

            revenue:
                orders
                    .filter(
                        o =>
                            o.paymentStatus ===
                            "پرداخت شده"
                    )
                    .reduce(
                        (sum, o) =>
                            sum +
                            Number(o.total || 0),
                        0
                    )
        };

        res.json({

            success: true,

            stats
        });
    }
);

// ===============================
// USERS
// ===============================

app.post("/api/users", (req, res) => {

    try {

        const users =
            loadUsers();

        const phone =
            String(
                req.body.phone || ""
            ).trim();

        if (
            !/^09\d{9}$/.test(phone)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "شماره موبایل معتبر نیست."
            });
        }

        let user =
            users.find(
                u => u.phone === phone
            );

        if (!user) {

            user = {

                id:
                    nextId(users),

                phone,

                name:
                    String(
                        req.body.name || ""
                    ),

                createdAt:
                    new Date().toISOString()
            };

            users.push(user);

            saveUsers(users);
        }

        res.json({

            success: true,

            message:
                "حساب کاربر آماده است.",

            user
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "خطا در ساخت حساب."
        });
    }
});

app.get(
    "/api/users/:phone/orders",
    (req, res) => {

        const phone =
            String(req.params.phone);

        const orders =
            loadOrders().filter(
                order =>
                    order.customer &&
                    order.customer.phone === phone
            );

        res.json({

            success: true,

            orders
        });
    }
);

// ===============================
// OTP
// ===============================

const otpStore =
    new Map();

app.post(
    "/api/auth/send-code",
    (req, res) => {

        const phone =
            String(
                req.body.phone || ""
            ).trim();

        if (
            !/^09\d{9}$/.test(phone)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "شماره موبایل معتبر نیست."
            });
        }

        const code =
            String(
                crypto.randomInt(
                    100000,
                    1000000
                )
            );

        otpStore.set(phone, {

            code,

            expires:
                Date.now() +
                2 * 60 * 1000
        });

        console.log(
            `OTP برای ${phone}: ${code}`
        );

        res.json({

            success: true,

            message:
                "کد تأیید ایجاد شد."
        });
    }
);

app.post(
    "/api/auth/verify-code",
    (req, res) => {

        const phone =
            String(
                req.body.phone || ""
            ).trim();

        const code =
            String(
                req.body.code || ""
            ).trim();

        const saved =
            otpStore.get(phone);

        if (!saved) {

            return res.status(400).json({

                success: false,

                message:
                    "کدی برای این شماره وجود ندارد."
            });
        }

        if (
            Date.now() >
            saved.expires
        ) {

            otpStore.delete(phone);

            return res.status(400).json({

                success: false,

                message:
                    "کد منقضی شده است."
            });
        }

        if (
            saved.code !== code
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "کد وارد شده اشتباه است."
            });
        }

        otpStore.delete(phone);

        const users =
            loadUsers();

        let user =
            users.find(
                u => u.phone === phone
            );

        if (!user) {

            user = {

                id:
                    nextId(users),

                phone,

                name: "",

                createdAt:
                    new Date().toISOString()
            };

            users.push(user);

            saveUsers(users);
        }

        res.json({

            success: true,

            message:
                "ورود موفق بود.",

            user
        });
    }
);

// ===============================
// Health
// ===============================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            shop:
                "SHOPX PRO",

            server:
                "online",

            time:
                new Date().toISOString()
        });
    }
);

// ===============================
// 404
// ===============================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "مسیر پیدا نشد."
        });
    }
);

// ===============================
// Error Handler
// ===============================

app.use(
    (err, req, res, next) => {

        console.error(err);

        res.status(500).json({

            success: false,

            message:
                "خطای داخلی سرور."
        });
    }
);

// ===============================
// START SERVER
// ===============================

app.listen(
    PORT,
    () => {

        console.log(`
================================
          SHOPX PRO 🚀
================================

Server:
http://localhost:${PORT}

Shop:
http://localhost:${PORT}/

Admin:
http://localhost:${PORT}/admin

Products:
http://localhost:${PORT}/api/products

Orders:
http://localhost:${PORT}/api/orders

Health:
http://localhost:${PORT}/api/health

Admin Password:
1234

================================
        `);
    }
);