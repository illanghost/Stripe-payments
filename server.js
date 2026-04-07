import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.send("Stripe backend running");
});

/* STRIPE CHECKOUT */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, date, time, price } = req.body;

    if (!name || !date || !time || !price) {
      return res.status(400).json({ error: "Missing booking data" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: `Klippning ${date} ${time}`,
            },
            unit_amount: price * 100, // Stripe använder ören
          },
          quantity: 1,
        },
      ],

      mode: "payment",

      success_url: `https://hcbokning.se/mybookings.html?paid=true&name=${name}&date=${date}&time=${time}&price=${price}`,

      cancel_url: `https://hcbokning.se/payment.html`,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Stripe error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
