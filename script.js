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
      shoppingCartProducts  = document.querySelector('.shopping-cart .products'),
      selectedProductsTable = document.querySelector('#selected-products-table'),
      selectedProductsList  = document.querySelector('#selected-products-list');

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

  // template for table row, for displaying items in a table
  var productTableTemplate = ['<td class="item-name">{{productName}}</td>',
                              '<td>$<span class="price">{{productPrice}}</span></td>',
                              '<td class="quantity">{{productQuantity}}</td>',
                              '<td>$<span class="subtotal">{{productSubtotal}}</span></td>'];

  // template for list item, for displaying items in a list. For small screens
  var productListItemTemplate = ['<span class="product-name">{{productName}}</span> - ',
                                 '$<span class="price">{{productPrice}}</span>, ',
                                 'qty: <span class="quantity">{{productQuantity}}</span>'];

  // objects that will store the data for every product in product list and the product cart
  var productsObject = {};
  var shoppingCartObject = {
    itemList: [],
    itemNumber: 0,
    total: 0,
    pushItem: function(item) {
      if ( this.itemList.indexOf(item) === -1 ) {
        this.itemList.push(item);
      }
    },
    removeItem: function(item) {
      if ( this.itemList.indexOf(item) !== -1 ) {
        var itemIndex = this.itemList.indexOf(item);
        this.itemList.splice(itemIndex, 1);
      }
    },
    setTotals: function() {
      var i, len = this.itemList.length,
          total = 0,
          items = 0;

      for ( i = 0; i < len; i++ ) {
        total = total + productsObject[this.itemList[i]].productSubtotal;
        items = items + (productsObject[this.itemList[i]].productQuantity * 1);
      }

      this.itemNumber = items;
      this.total = total;
    }
  };

  // the function that constructs the product data object
  function ProductConstructor(productDataObject) {
    this.productID          = productDataObject.productID;
    this.productName        = productDataObject.productName;
    this.productImageUrl    = productDataObject.productImageUrl;
    this.productDescription = productDataObject.productDescription;
    this.productPrice       = productDataObject.productPrice;
    this.productQuantity    = productDataObject.productQuantity || 0;
    this.productSubtotal    = productDataObject.productSubtotal || 0;
  }

  // add the method for manipulating the price, quantity and subtotal of the product
  // it is needed for applying the promo codes
  ProductConstructor.prototype.updatePrice = function(promoCode) {
    var initialPrice = this.productPrice;
    this.productPrice = (initialPrice * promoCode).toFixed(2);
  }
  ProductConstructor.prototype.updateQuantity = function(qty) {
    this.productQuantity = qty;
  }
  ProductConstructor.prototype.updateSubtotal = function() {
    this.productSubtotal = this.productPrice * this.productQuantity;
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
    // productsObject['item-' + i].updateSubtotal();
  }

  // console.log(JSON.stringify(productsObject, null, 2));

  // creates and adds item to the 'location' node
  // 'itemData' is the item data from the 'productsObject'
  // 'itemTemplate' is the template that is used to create the item HTML content
  function addItemTo(location, itemData, itemTemplate) {
    var newItemAddButton,
        removeItemButton,
        itemQuantity,
        productTableListContainer = document.querySelector('.selected-products-table-list'),
        newItem         = document.createElement('li'), // THIS IS MAYBE BETTER TO DO IN SOME OTHER PLACE
        isShoppingCart  = location.classList.contains('products-shopping-cart'),
        itemHTML        = itemTemplate.join('')
                                      .replace('{{productName}}', itemData.productName)
                                      .replace('{{productImageUrl}}', itemData.productImageUrl)
                                      .replace('{{productDescription}}', itemData.productDescription)
                                      .replace('{{productPrice}}', formatPrice(itemData.productPrice));

    // create element and append it to the 'location' node
    newItem.innerHTML = itemHTML;
    location.appendChild(newItem);

    // if the item is being added to the shopping cart
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
      // if the item is being added to the product list, set its id
      newItem.id = itemData.productID;

      newItemAddButton = newItem.querySelector('.button-add');

      // set the event listener on the 'Add to Cart' button
      newItemAddButton.addEventListener('click', function() {
        var itemID      = this.parentElement.id,
            itemCartID  = 'cart-' + itemID,
            itemTableID = 'product-table-' + itemID,
            itemListID  = 'list-' + itemID,
            itemInCart  = document.querySelector('#' + itemCartID),
            itemRow,
            listItem;

        itemQuantity = (itemInCart) ? itemInCart.querySelector('.qty') : '';

        // if the item is already in the cart, just update its quantity
        if ( itemQuantity ) {
          var quantity = +itemQuantity.value + 1;
          itemQuantity.value = quantity;

          updateCart(itemID, quantity);

          return;
        }

        // itemData.updateQuantity(1);
        // itemData.updateSubtotal();
        updateCart(itemID, 1);
        itemRow = document.createElement('tr');
        itemRow.id = itemTableID;
        itemRow.classList.add(itemID);
        itemRow.innerHTML = productTableTemplate.join('')
                                                .replace('{{productName}}', itemData.productName)
                                                .replace('{{productPrice}}', formatPrice(itemData.productPrice))
                                                .replace('{{productQuantity}}', itemData.productQuantity)
                                                .replace('{{productSubtotal}}', formatPrice(itemData.productSubtotal));

        selectedProductsTable.appendChild(itemRow);

        listItem = document.createElement('li');
        listItem.id = itemListID;
        listItem.classList.add(itemID);
        listItem.innerHTML = productListItemTemplate.join('')
                                                    .replace('{{productName}}', itemData.productName)
                                                    .replace('{{productPrice}}', formatPrice(itemData.productPrice))
                                                    .replace('{{productQuantity}}', itemData.productQuantity);

        selectedProductsList.appendChild(listItem);

        // updateCart(itemData.productID); // MAYBE NOT NEEDED

        // if this is the first item added to the cart, show the cart if it is hidden
        if ( shoppingCartProducts.querySelectorAll('li').length === 0 ) {
          shoppingCartProducts.parentElement.classList.remove('hide');
          productTableListContainer.classList.remove('hide');
        }

        // finally, add the item to the cart
        addItemTo(shoppingCartProducts, productsObject[itemID], productTemplateArrayCart);

      });

    }

  }

  function formatPrice(price) {
    // accounting for decimal values is not needed now because the prices
    // are now calculated to be whole numbers, but it doesn't hurt to have this anyway.
    var price = price.toString().split('.'),
    modifiedPriceDigits = price[0].split(''),
    displayPrice = '';
    for ( j = modifiedPriceDigits.length - 1; j >= 0 ; j-- ) {
      if ( displayPrice.length === 3 || displayPrice.length === 7 ) {
        displayPrice = modifiedPriceDigits[j] + ',' + displayPrice;
      } else {
        displayPrice = modifiedPriceDigits[j] + displayPrice;
      }
    }

    if ( price[1] ) {
      // keep only two decimal places, this is a bad way of doing it, but it will do for now
      price[1] = price[1].charAt(0) + price[1].charAt(1);
      displayPrice = displayPrice + '.' + price[1];
    }

    return displayPrice;
  }

  function updateCart(itemID, value) {
    // updates the total and subtotal rows
    // updates cart icon on top of the page
    var itemElements = document.querySelectorAll('.' + itemID),
        itemPrice,
        itemQuantity,
        itemSubtotal,
        cartSummaryItems = document.querySelector('.cart-item-no'),
        cartSummaryTotal = document.querySelectorAll('.cart-total'),
        i, len = itemElements.length;

    productsObject[itemID].updateQuantity(value);
    productsObject[itemID].updateSubtotal();
    shoppingCartObject.pushItem(itemID);
    shoppingCartObject.setTotals();

    // console.log(JSON.stringify(shoppingCartObject, null, 2));

    for ( i = 0; i < len; i++ ) {
      // itemPrice = itemElements[i].querySelector('.price');
      itemQuantity = itemElements[i].querySelector('.quantity');
      itemSubtotal = itemElements[i].querySelector('.subtotal');

      // if ( itemPrice ) itemPrice.textContent = productsObject[itemID].productPrice;
      if ( itemQuantity ) itemQuantity.textContent = productsObject[itemID].productQuantity;
      if ( itemSubtotal ) itemSubtotal.textContent = formatPrice(productsObject[itemID].productSubtotal);
    }

    cartSummaryItems.textContent = shoppingCartObject.itemNumber;
    len = cartSummaryTotal.length;
    for ( i = 0; i < len; i++ ) {
      cartSummaryTotal[i].textContent = formatPrice(shoppingCartObject.total);
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
        itemID = item.id.split('cart-')[1],
        removeButton = item.querySelector('.button-remove');

    updateCart(itemID, value);

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
        item = removeButton.parentElement,
        itemID = item.id.split('cart-')[1],
        itemElements = document.querySelectorAll('.' + itemID),
        productTableListContainer = document.querySelector('.selected-products-table-list'),
        i, len = itemElements.length,
        itemsInCart;

    // this removes items from shopping cart thumbnail display
    removeButton.removeEventListener('click', removeItemFromCart);
    shoppingCartProducts.removeChild(item);
    shoppingCartObject.removeItem(itemID);
    updateCart(itemID, 0);

    // this removes items from table and list display in shopping cart
    for ( i = 0; i < len; i++ ) {
      // if there are no items in cart, hide this section
      itemsInCart = shoppingCartObject.itemNumber;
      if ( !itemsInCart ) {
        productTableListContainer.classList.add('hide');
      }
      itemElements[i].parentElement.removeChild(itemElements[i]);
    }

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

