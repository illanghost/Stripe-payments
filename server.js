import express from "express";
import Stripe from "stripe";
import cors from "cors";

console.log("🚀 Starting server...");

const app = express();

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* 🔒 CHECK STRIPE KEY (VIKTIGT) */
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY saknas!");
  process.exit(1);
}

/* STRIPE INIT */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.send("Stripe backend running");
});

/* STRIPE CHECKOUT */
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("📩 Request received:", req.body);

    const { name, date, time, price } = req.body;

    /* 🔒 VALIDATION */
    if (!name || !date || !time || !price) {
      console.log("❌ Missing booking data");
      return res.status(400).json({
        error: "Missing booking data"
      });
    }

    /* 🔒 Säkerställ att pris är nummer */
    const numericPrice = Number(price);

    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.log("❌ Invalid price:", price);
      return res.status(400).json({
        error: "Invalid price"
      });
    }

    console.log("💳 Creating Stripe session:", numericPrice, "SEK");

    /* 🔥 CREATE STRIPE SESSION */
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: `Klippning ${date} ${time}`,
            },
            unit_amount: numericPrice * 100,
          },
          quantity: 1,
        },
      ],

      mode: "payment",

      success_url: `https://hcbokning.se/mybookings.html?paid=true&name=${encodeURIComponent(name)}&date=${date}&time=${time}&price=${numericPrice}`,

      cancel_url: `https://hcbokning.se/payment.html`,
    });

    console.log("✅ Stripe session created");

    /* ✅ SKICKA TILL FRONTEND */
    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe error:", err);

    res.status(500).json({
      error: "Stripe session failed"
    });
  }
});

/* 🔥 VIKTIGT FÖR RENDER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
