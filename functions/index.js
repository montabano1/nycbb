const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')('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');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
sgMail.setApiKey('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')

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  const userEmail = data.email
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
    customer_email: userEmail,
    mode: 'payment',
    success_url: 'https://brokerlistnyc.com?payment=success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://brokerlistnyc.com',
  });

  return {sessionId: session.id};
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            req.headers['stripe-signature'],
            'whsec_GV5SqQ9wr931GRCEvKiiRNszVuMLmRJh'
        );
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return res.sendStatus(400);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Get the customer's email address from the session
        const customerEmail = session.customer_email;

        // Retrieve the file from Firebase Storage
        const bucket = admin.storage().bucket();
        const filePath = 'BrokerListNYC.csv'; // Update this to the path of your file in Firebase Storage
        const file = bucket.file(filePath);

        // Generate a signed URL for the file
        const signedUrl = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000 // 15 minutes
        });

        // Set up the email data
        const msg = {
            to: customerEmail,
            from: 'agent@brokerlistnyc.com',
            subject: 'BrokerListNYC Spreadsheet',
            text: 'Thank you for your purchase! Here is your spreadsheet.',
            html: `<p>Thank you for your purchase! <a href="${signedUrl[0]}">Download your spreadsheet</a>.</p>`
        };

        // Send the email
        await sgMail.send(msg);
    }

    res.sendStatus(200);
});
