import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* STRIPE INIT */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.send("Stripe backend running");
});

/* STRIPE CHECKOUT */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, date, time, price } = req.body;

    /* 🔒 VALIDATION */
    if (!name || !date || !time || !price) {
      return res.status(400).json({
        error: "Missing booking data"
      });
    }

    /* 🔒 Säkerställ att pris är nummer */
    const numericPrice = Number(price);

    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        error: "Invalid price"
      });
    }

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
            unit_amount: numericPrice * 100, // ören
          },
          quantity: 1,
        },
      ],

      mode: "payment",

      success_url: `https://hcbokning.se/mybookings.html?paid=true&name=${encodeURIComponent(name)}&date=${date}&time=${time}&price=${numericPrice}`,

      cancel_url: `https://hcbokning.se/payment.html`,
    });

    /* ✅ SKICKA TILL FRONTEND */
    res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err.message);

    res.status(500).json({
      error: "Stripe session failed"
    });
  }
});

/* 🔥 VIKTIGT FÖR RENDER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
