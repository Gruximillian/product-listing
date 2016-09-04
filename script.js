window.addEventListener('load', function() {
  initShoppingCart();
});

function getOffsetRect(elem) {
  var box       = elem.getBoundingClientRect(),
      body      = document.body,
      docElem   = document.documentElement,
      scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
      clientTop = docElem.clientTop || body.clientTop || 0,
      top       = box.top + scrollTop - clientTop;

  return {top: Math.round(top)};
}

function scrollToElement(pixelsAbove, element) {
  var pixelsAbove = pixelsAbove || 20,
      scrollTo = element && getOffsetRect(element).top;

  window.scrollTo(0, scrollTo - pixelsAbove);

}

function initShoppingCart() {
  var shoppingCart    = document.querySelector('.shopping-cart'),
      cartMainToggle  = document.querySelector('.shopping-cart-toggle'),
      cartHideToggle  = document.querySelector('.hide-cart-toggle'),
      addProduct      = document.querySelectorAll('.product-list .button-add'),
      i, len          = addProduct.length;

  var productTemplateArray = ['\t<h3 class="item-name">{{productName}}</h3>\n',
                              '\t<div class="product-image">\n',
                              '\t\t<img src="{{productImageUrl}}">\n',
                              '\t</div>\n',
                              '\t<p class="product-description">{{productDescription}}</p>\n',
                              '\t<div class="quantity">\n',
                              '\t\t<label for="qty">Quantity: </label>\n',
                              '\t\t<input type="text" name="qty" class="qty" value="1" maxlength="2" pattern="[0-9]|[1-9][0-9]">\n',
                              '\t</div>\n',
                              '\t<div class="price-overlay">\n',
                              '\t\t$<span class="price">{{productPrice}}</span>\n',
                              '\t</div>\n',
                              '\t<span class="button button-remove">\n',
                              '\t\t<span class="remove-from-cart">Remove</span>\n',
                              '\t\t<img class="cart" src="cart.png" alt="Remove from cart">\n',
                              '\t</span>'];

  var productTemplateString = productTemplateArray.join('');

  for ( i = 0; i < len; i++ ) {
    addProduct[i].addEventListener('click', function() {
      var parent                = this.parentElement,
          itemID                = 'cart-' + parent.id,
          itemInCart            = document.querySelector('#' + itemID),
          listItem              = document.createElement('li'),
          productTemplate       = productTemplateString,
          shoppingCartProducts  = document.querySelector('.shopping-cart .products'),
          itemQuantity          = (itemInCart) ? itemInCart.querySelector('.qty') : '';

      if ( itemQuantity ) {
        var quantity = +itemQuantity.value;

        itemQuantity.value = quantity + 1;
        return;
      }

      var productDetails = {
        productName         : parent.querySelector('.item-name').textContent,
        productImageUrl     : parent.querySelector('.product-image img').getAttribute('src'),
        productDescription  : parent.querySelector('.product-description').textContent,
        productPrice        : parent.querySelector('.price').textContent
      }

      productTemplate = productTemplateString.replace('{{productName}}', productDetails.productName)
                                             .replace('{{productImageUrl}}', productDetails.productImageUrl)
                                             .replace('{{productDescription}}', productDetails.productDescription)
                                             .replace('{{productPrice}}', productDetails.productPrice);

      listItem.id = itemID;
      listItem.innerHTML = productTemplate;

      if ( shoppingCartProducts.querySelectorAll('li').length === 0 ) {
        shoppingCartProducts.parentElement.classList.remove('hide');
      }

      shoppingCartProducts.appendChild(listItem);

      var removeItemButton = listItem.querySelector('.button-remove');

      removeItemButton.addEventListener('click', removeItemFromCart);

      function removeItemFromCart(cart, removeButton) {

        if ( !removeButton ) {
          removeButton = this;
          cart = this.parentElement.parentElement;
        }

        cart.removeChild(removeButton.parentElement);

        removeButton.removeEventListener('click', removeItemFromCart);

      }

      if ( !itemQuantity ) {
        itemQuantity = listItem.querySelector('.qty');
        itemQuantity.addEventListener('keydown', limitInput);
        itemQuantity.addEventListener('keyup', updateQuantity);
      }

      function limitInput(e) {
        var key = e.key.toLowerCase(),
            value = this.value;

        if ( !key.toString().match(/\d/) &&
              key !== 'backspace' &&
              key !== 'delete' &&
              key !== 'enter' ) {

          e.preventDefault();

        }
      }

      function updateQuantity(e) {
        var value = this.value,
            key = e.key.toLowerCase();

        if ( key === 'enter' && value === '0' ) {
          this.removeEventListener('keydown', limitInput);
          this.removeEventListener('keyup', updateQuantity);
          removeItemFromCart(shoppingCartProducts, this.parentElement);
        }
      }

    });
  }

  cartMainToggle.addEventListener('click', function(e) {

    if ( shoppingCart.classList.contains('hide') ) {
      shoppingCart.classList.remove('hide');
      scrollToElement(150, shoppingCart);
    } else {
      shoppingCart.classList.add('hide');
    }

  });

  cartHideToggle.addEventListener('click', function() {
    shoppingCart.classList.add('hide');
  });

}

