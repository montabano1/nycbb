const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')('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');

admin.initializeApp();

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Spreadsheet',
        },
        unit_amount: 100, // Set your price
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: 'https://michaelmontalbano.com/nycbb?payment=success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://michaelmontalbano.com/nycbb/',
  });

  return {sessionId: session.id};
});

exports.verifyPaymentAndProvideDownloadLink = functions.https.onCall(async (data, context) => {
    const sessionId = data.session_id;

    try {
        // Fetch session details from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Check if the payment was successful
        if (session.payment_status === 'paid') {
            // Optionally: Further check if this session corresponds to the correct product, amount, etc.

            // Provide the download link if payment is verified
            return { downloadLink: 'https://firebasestorage.googleapis.com/v0/b/nycbb-f8a89.appspot.com/o/Monte%20Scraping%20Real%20Estate%20-%2010_3_23.csv?alt=media&token=885768fa-3e55-4ff0-a747-f84de2409408&_gl=1*1burskx*_ga*MTQ5MDY1MTQ4NC4xNjU0MTQwMzI1*_ga_CW55HF8NVT*MTY5NjczMzc5NS4xNTUuMS4xNjk2NzM0MDkzLjU5LjAuMA..' };
        } else {
            // Handle the case where the payment is not successful
            return { error: 'Payment not successful' };
        }
    } catch (error) {
        // Handle errors, e.g., session not found
        return { error: 'Error verifying payment' };
    }
});
