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
  var shoppingCart          = document.querySelector('.shopping-cart'),
      cartMainToggle        = document.querySelector('.shopping-cart-toggle'),
      cartHideToggle        = document.querySelector('.hide-cart-toggle'),
      productList           = document.querySelector('.product-list .products'),
      shoppingCartProducts  = document.querySelector('.shopping-cart .products');

  // template for products shown in the main product list
  var productTemplateArrayList = ['\t<h3 class="item-name">{{productName}}</h3>\n',
                              '\t<div class="product-image">\n',
                              '\t\t<img src="{{productImageUrl}}">\n',
                              '\t</div>\n',
                              '\t<p class="product-description">{{productDescription}}</p>\n',
                              '\t<div class="price-overlay">\n',
                              '\t\t$<span class="price">{{productPrice}}</span>\n',
                              '\t</div>\n',
                              '\t<span class="button button-add">\n',
                              '\t\t<span class="add-to-cart">Add to cart</span>\n',
                              '\t\t<img class="cart" src="cart.png" alt="Add to cart">\n',
                              '\t</span>'];

  // template for products shown in the shopping cart
  var productTemplateArrayCart = ['\t<h3 class="item-name">{{productName}}</h3>\n',
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
                              '\t\t<span class="remove-from-cart">Remove from cart</span>\n',
                              '\t\t<img class="cart" src="cart.png" alt="Remove from cart">\n',
                              '\t</span>'];

  // object that will store the data for every product
  var productsObject = {};

  // the function that constructs the product data object
  function ProductConstructor(productDataObject) {
    this.productID = productDataObject.productID;
    this.productName = productDataObject.productName;
    this.productImageUrl = productDataObject.productImageUrl;
    this.productDescription = productDataObject.productDescription;
    this.productPrice = productDataObject.productPrice;
  }

  // generating 4 items
  // in real application, there will be admin interface where the item details would be entered
  for ( var i = 0; i < 8; i++ ) {
    productsObject['item-' + i] = new ProductConstructor({
      productID: 'item-' + i,
      productName: 'Schnappsy',
      productImageUrl: 'placeholder.png',
      productDescription: 'Taste the best schnapps in the world. Once you try it, you won\'t stop... it will change the way you see the world!',
      productPrice: (Math.random() * 200).toFixed(2) // this will be just plain number, I do this just to automate the process
    });
  }

  // console.log(JSON.stringify(productsObject, null, 2));

  // add the method for manipulating the price of the product
  // it is needed for applying the promo codes
  ProductConstructor.prototype.updatePrice = function(promoCode) {
    var initialPrice = this.productPrice;

    this.productPrice = (initialPrice * promoCode).toFixed(2);
  }

  // creates and adds item to the 'location' node
  // 'itemData' is the item data from the 'productsObject'
  // 'itemTemplate' is the template that is used to create the item HTML content
  function addItemTo(location, itemData, itemTemplate) {
    var newItemAddButton,
        removeItemButton,
        itemQuantity,
        newItem         = document.createElement('li'),
        isShoppingCart  = location.classList.contains('products-shopping-cart'),
        itemHTML        = itemTemplate.join('')
                                      .replace('{{productName}}', itemData.productName)
                                      .replace('{{productImageUrl}}', itemData.productImageUrl)
                                      .replace('{{productDescription}}', itemData.productDescription)
                                      .replace('{{productPrice}}', itemData.productPrice);

    // create element and append it to the 'location' node
    newItem.innerHTML = itemHTML;
    location.appendChild(newItem);

    // if the item is added to the shopping cart
    // change its id, and add event listeners on 'remove' button
    if ( isShoppingCart ) {

      newItem.id = 'cart-' + itemData.productID;

      itemQuantity = newItem.querySelector('.qty');
      // on 'keydown' we are preventing any input that is not a number or 'enter', 'backspace' and 'delete' keys
      itemQuantity.addEventListener('keydown', limitInput);
      // on 'keyup' we update the prices or remove the item depending on the value of the quantity field
      itemQuantity.addEventListener('keyup', updateQuantity);

      removeItemButton = newItem.querySelector('.button-remove');
      removeItemButton.addEventListener('click', removeItemFromCart);

    } else {
      // if the item is added to the product list, set its id
      newItem.id = itemData.productID;

      newItemAddButton = newItem.querySelector('.button-add');

      // set the event listener on the 'Add to Cart' button
      newItemAddButton.addEventListener('click', function() {
        var itemID       = this.parentElement.id,
            itemCartID   = 'cart-' + itemID,
            itemInCart   = document.querySelector('#' + itemCartID);

        itemQuantity = (itemInCart) ? itemInCart.querySelector('.qty') : '';

        // if the item is already in the cart, just update its quantity
        if ( itemQuantity ) {
          var quantity = +itemQuantity.value;

          itemQuantity.value = quantity + 1;
          return;
        }

        // if this is the first item added to the cart, show the cart if it is hidden
        if ( shoppingCartProducts.querySelectorAll('li').length === 0 ) {
          shoppingCartProducts.parentElement.classList.remove('hide');
        }

        // finally, add the item to the cart
        addItemTo(shoppingCartProducts, productsObject[itemID], productTemplateArrayCart);

      });

    }

  }

  // add items to the main product list through a loop
  for ( var item in productsObject ) {
    addItemTo(productList, productsObject[item], productTemplateArrayList);
  }

  // limits the input only to numbers, and keys 'backspace', 'delete', and 'enter'
  // used in the quantity field of the item in the shopping cart
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

  // this function will update the total price when the quantity is changed
  // it also removes the item if its quantity is zero
  function updateQuantity(e) {
    var value = this.value,
        key = e.key.toLowerCase(),
        item = this.parentElement.parentElement,
        removeButton = item.querySelector('.button-remove');

    // when the quantity is zero and 'enter' is pressed
    if ( key === 'enter' && value === '0' ) {
      // remove events on quantity field
      this.removeEventListener('keydown', limitInput);
      this.removeEventListener('keyup', updateQuantity);
      // call 'click' method on the 'remove' button
      removeButton.click();
    }
  }

  // removes the item from the shopping cart, obviously
  function removeItemFromCart() {
    var removeButton = this,
        item = removeButton.parentElement;

    removeButton.removeEventListener('click', removeItemFromCart);
    shoppingCartProducts.removeChild(item);

  }

   cartMainToggle.addEventListener('click', function(e) {

    // toggle the display of the shopping cart
    if ( shoppingCart.classList.contains('hide') ) {
      shoppingCart.classList.remove('hide');
      scrollToElement(150, shoppingCart);
    } else {
      shoppingCart.classList.add('hide');
    }

  });

  // hide the cart
  cartHideToggle.addEventListener('click', function() {
    shoppingCart.classList.add('hide');
  });

}

