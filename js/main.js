jQuery(document).ready(function ($) {

  // Header fixed and Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
      $('#header').addClass('header-fixed');
    } else {
      $('.back-to-top').fadeOut('slow');
      $('#header').removeClass('header-fixed');
    }
  });
  $('.back-to-top').click(function () {
    $('html, body').animate({
      scrollTop: 0
    }, 1500, 'easeInOutExpo');
    return false;
  });

  // Initiate the wowjs
  new WOW().init();

  // Initiate superfish on nav menu
  $('.nav-menu').superfish({
    animation: {
      opacity: 'show'
    },
    speed: 400
  });

  // Mobile Navigation
  if ($('#nav-menu-container').length) {
    var $mobile_nav = $('#nav-menu-container').clone().prop({
      id: 'mobile-nav'
    });
    $mobile_nav.find('> ul').attr({
      'class': '',
      'id': ''
    });
    $('body').append($mobile_nav);
    $('body').prepend('<button type="button" id="mobile-nav-toggle"><i class="fa fa-bars"></i></button>');
    $('body').append('<div id="mobile-body-overly"></div>');
    $('#mobile-nav').find('.menu-has-children').prepend('<i class="fa fa-chevron-down"></i>');

    $(document).on('click', '.menu-has-children i', function (e) {
      $(this).next().toggleClass('menu-item-active');
      $(this).nextAll('ul').eq(0).slideToggle();
      $(this).toggleClass("fa-chevron-up fa-chevron-down");
    });

    $(document).on('click', '#mobile-nav-toggle', function (e) {
      $('body').toggleClass('mobile-nav-active');
      $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
      $('#mobile-body-overly').toggle();
    });

    $(document).click(function (e) {
      var container = $("#mobile-nav, #mobile-nav-toggle");
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
      }
    });
  } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
    $("#mobile-nav, #mobile-nav-toggle").hide();
  }

  // Smoth scroll on page hash links
  $('a[href*="#"]:not([href="#"])').on('click', function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {

      var target = $(this.hash);
      if (target.length) {
        var top_space = 0;

        if ($('#header').length) {
          top_space = $('#header').outerHeight();

          if (!$('#header').hasClass('header-fixed')) {
            top_space = top_space - 20;
          }
        }

        $('html, body').animate({
          scrollTop: target.offset().top - top_space
        }, 1500, 'easeInOutExpo');

        if ($(this).parents('.nav-menu').length) {
          $('.nav-menu .menu-active').removeClass('menu-active');
          $(this).closest('li').addClass('menu-active');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
          $('#mobile-body-overly').fadeOut();
        }
        return false;
      }
    }
  });

  // Porfolio filter
  $("#portfolio-flters li").click(function () {
    $("#portfolio-flters li").removeClass('filter-active');
    $(this).addClass('filter-active');

    var selectedFilter = $(this).data("filter");
    $("#portfolio-wrapper").fadeTo(100, 0);

    $(".portfolio-item").fadeOut().css('transform', 'scale(0)');

    setTimeout(function () {
      $(selectedFilter).fadeIn(100).css('transform', 'scale(1)');
      $("#portfolio-wrapper").fadeTo(300, 1);
    }, 300);
  });

  // jQuery counterUp
  $('[data-toggle="counter-up"]').counterUp({
    delay: 10,
    time: 1000
  });

  // custom code monte
  var selectedPriceId;  // Global variable to store the selected priceId

$('button[id^="purchaseBtn"]').on('click', function() {
    selectedPriceId = $(this).data('priceid');  // Store the priceId when a button is clicked
    $('#emailModal').show();
});

$('.close').on('click', function() {
    $('#emailModal').hide();
});

function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

$('#submitEmailBtn').on('click touchstart', function(e) {
    e.stopPropagation();

    var email = $('#emailInput').val();
    if (validateEmail(email)) {
        $('#emailModal').hide();
        $('#spinner').show();

        console.log("Fetched priceId:", selectedPriceId);  // Debugging statement

        var functions = firebase.functions();
        var createCheckoutSession = functions.httpsCallable('createCheckoutSession');

        createCheckoutSession({ email: email, priceId: selectedPriceId })
  .then(function(result) {
    console.log(result)
    $('#spinner').hide();
    // Redirect to Stripe Checkout using session ID received from Cloud Function
    var stripe = Stripe('pk_live_51O0FmtDhrn1JbalvsKHCX0QXFxMnTkLI3NfpbK19pdiN7FSghO5S1b3DMXqXeiSIA3TAo0un9htxlY6DxUvhiZGI00N0SNzcTs');
    stripe.redirectToCheckout({ sessionId: result.data.sessionId })
      .then(function (result) {
        if (result.error) {
          alert(result.error.message);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  })
  .catch(function(error) {
    console.error('Error:', error);
  });
    } else {
      alert('Please enter a valid email address.');
    }
  });

  function getUrlParameter(name) {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Check URL parameters
    var paymentStatus = getUrlParameter('payment');
    var sessionId = getUrlParameter('session_id');
    var email = getUrlParameter('email')

    if (paymentStatus === "success" && sessionId) {
        // You can further validate the session ID if needed
        // For this example, we'll just check its existence

        // Set the success message
        var message = "Successful checkout. An email with the attached spreadsheet has been sent to " + email;
        $("#successMessage").text(message);

        // Display the modal
        $("#successModal").show();
    }

    // Close modal on button click
    $("#closeModalBtn").click(function() {
        $("#successModal").hide();
    });

    $('#supportForm').submit(function(event) {
        event.preventDefault();
        console.log($(this).serialize());
        $.ajax({
            url: 'https://us-central1-nycbb-f8a89.cloudfunctions.net/sendEmail',
            type: 'POST',
            data: $(this).serialize(),
            success: function(data) {
                console.log('Email sent successfully');
                $("#sendmessage").addClass("show");
                $("#errormessage").removeClass("show");
                $('.contactForm').find("input, textarea").val("");
            },
            error: function(error) {
                console.error('Error sending email', error);
                $("#sendmessage").removeClass("show");
                $("#errormessage").addClass("show");
                $('#errormessage').html("error");
            }
        });
    });
});
