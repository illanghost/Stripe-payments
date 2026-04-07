const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const CLIENT_URL = process.env.CLIENT_URL;

// 🔥 Create Stripe Checkout Session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: "Haircut Booking"
            },
            unit_amount: amount * 100
          },
          quantity: 1
        }
      ],
      success_url: `${CLIENT_URL}/mybookings.html?success=true&bookingId=${bookingId}`,
      cancel_url: `${CLIENT_URL}/booking.html?canceled=true`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Payment failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Stripe backend running");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
