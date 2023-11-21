$(document).ready(function() {
  const stripe = Stripe('pk_live_51O0FmtDhrn1JbalvsKHCX0QXFxMnTkLI3NfpbK19pdiN7FSghO5S1b3DMXqXeiSIA3TAo0un9htxlY6DxUvhiZGI00N0SNzcTs');
  const options = {
  mode: 'payment',
  amount: 1099,
  currency: 'usd',
  // Customizable with appearance API.
  appearance: {/*...*/},
};

// Set up Stripe.js and Elements to use in checkout form
const elements = stripe.elements(options);
  const expressCheckoutElement = elements.create('expressCheckout');
expressCheckoutElement.mount('#express-checkout-element');

//   initialize();
//
// async function initialize() {
//   // Call the Firebase function
//   const createCheckoutSession = firebase.functions().httpsCallable('testCreateCheckoutSession');
//
//   // Replace with your own data structure as required
//   const data = {
//     email: 'user@example.com', // User's email
//     priceId: 'price_1O1G3PDhrn1Jbalvm7Eos7Fw' // Price ID for the Stripe session
//   };
//
//   try {
//     const result = await createCheckoutSession(data);
//     const { clientSecret } = result.data;
//
//     const checkout = await stripe.initEmbeddedCheckout({
//       clientSecret: clientSecret
//     });
//
//     checkout.mount('#checkout');
//   } catch (error) {
//     console.error("Error creating checkout session: ", error);
//   }
// }

  const itemsData = {
    'one-time': {
      imageUrl: 'img/item1.png',
      price: '$175',
      description: 'Receive your list today'
    },
    'semi-annual': {
      imageUrl: 'img/item2.png',
      price: '$240',
      description: 'Receive your list today + an updated list in 6 months'
    },
    'quarterly': {
      imageUrl: 'img/item3.png',
      price: '$350',
      description: 'Receive your list today + updated lists every 3 months (3 more updates)'
    }
  };

  function getPlanFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('plan'); // Assuming your URL parameter is named 'plan'
  }

  function updateMonteDiv(planId) {
    const data = itemsData[planId];

    if (data) {
      $('.monteImage').attr('src', data.imageUrl);
      $('.montePrice').text(data.price);
      $('.monteDescription').text(data.description);
    }
  }

  const selectedPlan = getPlanFromUrl();
  if (selectedPlan) {
    $(`#${selectedPlan}`).prop('checked', true).trigger('change');
  }

  // Event handler for radio button change
  $('input[type="radio"][name="plan"]').change(function() {
    const planId = $(this).attr('id');
    updateMonteDiv(planId);
  });

  if (selectedPlan && itemsData[selectedPlan]) {
    updateMonteDiv(selectedPlan); // Update monte div with the selected plan data
    $(`input[type="radio"][name="plan"][id="${selectedPlan}"]`).prop('checked', true);
  }

  $('input[type="radio"][name="plan"]').change(function() {
    const planId = $(this).attr('id');
    const data = itemsData[planId];

    if (data) {
      // Update the image source
      $('.monteImage').attr('src', data.imageUrl);

      // Update the price text
      $('.montePrice').text(data.price);

      // Update the description text
      $('.monteDescription').text(data.description);
    }
  });

  const style = {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  };

  const cardNumber = elements.create('cardNumber', { style: style });
  cardNumber.mount('#cardNumber');

  const cardExpiry = elements.create('cardExpiry', { style: style });
  cardExpiry.mount('#cardExpiry');

  const cardCvc = elements.create('cardCvc', { style: style });
  cardCvc.mount('#cardCvc');

  // Handle real-time validation errors from the card Element
  function displayError(elementId, errorMessage) {
    $('#' + elementId).text(errorMessage || '');
  }

  cardNumber.on('change', function(event) {
    displayError('card-number-errors', event.error ? event.error.message : '');
  });

  cardExpiry.on('change', function(event) {
    displayError('card-expiry-errors', event.error ? event.error.message : '');
  });

  cardCvc.on('change', function(event) {
    displayError('card-cvc-errors', event.error ? event.error.message : '');
  });



  $('#submitBtn').on('click touchstart', function(e) {
    e.preventDefault();
    $('#spinner').show();

    var isValid = true;

    // Input fields
    var email = $('#email').val();
    var fullName = $('#fname').val();
    var address = $('#address').val();
    // ... add other field variables as needed

    // Field validation
    if (email.length === 0 || !email.includes('@')) {
      isValid = false;
      $('#email-error').text('Please enter a valid email address.'); // Display email error
    }

    if (fullName.length === 0) {
      isValid = false;
      $('#fname-error').text('Please enter your full name.'); // Display full name error
    }

    if (address.length === 0) {
      isValid = false;
      $('#address-error').text('Please enter your address.'); // Display address error
    }

    var selectedPriceId = $('input[name="plan"]:checked').data('priceid');

    // Create Payment Intent on the server
    if (isValid) {
      var createPaymentIntent = firebase.functions().httpsCallable('createPaymentIntent');
      createPaymentIntent({ email: email, priceId: selectedPriceId })
      .then(function(result) {
        if (result.error) {
          // Show error to the customer
          console.error('Payment failed:', result.error.message);
          $('#spinner').hide();
        }
        // Confirm the payment with the card details
        return stripe.confirmCardPayment(result.data.clientSecret, {
          payment_method: {
            card: cardNumber, // Use the cardNumber Element
            billing_details: {
              email: email
            }
          }
        });
      })
      .then(function(result) {
        if (result.error) {
          // Show error to the customer
          console.error('Payment failed:', result.error.message);
          $('#spinner').hide();
        } else {
          if (result.paymentIntent.status === 'succeeded') {
            $('#preContainer').hide();
            $('#success-message').show(); // Make sure you have this element in your HTML
          }
        }
      })
      .catch(function(error) {
        console.error('Error:', error);
        $('#spinner').hide();
      });
    }

  });

  function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  $('#terms-checkbox').change(function(){
    if(this.checked) {
      $('#submitBtn').prop('disabled', false);
    } else {
      $('#submitBtn').prop('disabled', true);
    }
  });

  $('.close-btn').on('click', function() {
    window.location.href = '/'; // Replace '/' with your home page URL if different
  });
});
