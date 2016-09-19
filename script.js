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
  var shoppingCart           = document.querySelector('.shopping-cart'),
      cartMainToggle         = document.querySelector('.shopping-cart-toggle'),
      cartHideToggle         = document.querySelector('.hide-cart-toggle'),
      productList            = document.querySelector('.product-list .products'),
      shoppingCartProducts   = document.querySelector('.shopping-cart .products'),
      selectedProductsTable  = document.querySelector('#selected-products-table'),
      selectedProductsList   = document.querySelector('#selected-products-list'),
      promoCodeSubmit        = document.querySelector('#promo-submit'),
      promoCodeDisplayToggle = document.querySelector('.promo-display');

  // template for products shown in the main product list
  var productTemplateArrayList = ['\t<span class="item-category">Category: <span>{{productCategory}}</span></span>\n',
                                  '\t<h3 class="item-name">{{productName}}</h3>\n',
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
  var productTemplateArrayCart = ['\t<span class="item-category">Category: <span>{{productCategory}}</span></span>\n',
                                  '\t<h3 class="item-name">{{productName}}</h3>\n',
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

  var promoCodeItemTemplate = '<span class="code">{{promoCode}}</span>: <span class="code-description">{{promoCodeDescription}}</span>';

  // objects that will store the data for every product in product list and the product cart
  var productsObject = {};
  var shoppingCartObject = {
    itemList: {},
    itemNumber: 0,
    total: 0,
    removeItem: function(item) {
      if ( this.itemList[item] ) {
        delete this.itemList[item];
      }
    },
    setTotals: function(promoCode) {
      var total = 0,
          items = 0;

      for ( item in this.itemList ) {
        total = total + this.itemList[item].productSubtotal;
        items = items + (this.itemList[item].productQuantity * 1);
      }

      this.itemNumber = items;
      // if there is no promoCode applied, then update the total
      // if there is a promoCode applied and the new total is smaller than the previous
      // then update the total, else leave the previous total
      if ( !promoCode || ( promoCode && this.total > total ) ) {
        this.total = total;
      }
    },
    applyPromoCode: function(promoCode) {
      var categories = promoCodes[promoCode].appliesTo.categories,
          items      = promoCodes[promoCode].appliesTo.items;

      for ( var item in this.itemList ) {

        // if the promo code is not applied, then apply it
        if ( this.itemList[item].promoCodesApplied.indexOf(promoCode) === -1 ) {

          // apply the promo code the products
          if ( promoCodes[promoCode].appliesTo.allProducts ||
               (categories.length && categories.indexOf(this.itemList[item].productCategory) !== -1) ||
               (items.length && items.indexOf(item) !== -1) ) {
            this.itemList[item].promoCodesApplied.push(promoCode);
          }

        }

      }

      // remember that a promo code is already applied
      if ( !promoCodes[promoCode].applied ) promoCodes[promoCode].applied = true;
      // remember that any promo code is already applied
      if ( !promoCodes.applied ) promoCodes.applied = true;

      // console.log(JSON.stringify(promoCodes, null, 2));

    }

  };

  // object that stores the promo codes and their properties
  var promoCodes = {
    // use this to check if any promo code is applied, to avoid looping through all codes to check
    applied: false,
    PARTY4ALL: {
      code: 'PARTY4ALL',
      value: 15,
      description: '15% off for "Party Drinks"',
      appliesTo: {
        // this object defines the categories and items that this code applies to, and if it applies to all products
        categories: ['Party Drinks', 'Killer Drinks'],
        items: [],
        allProducts: false
      },
      // this property is used to check if the code is applied by the user
      // and when the new product is added after the promo code is applied
      applied: false
    },
    BUYMECHEAP: {
      code: 'BUYMECHEAP',
      value: 10,
      description: '10% off for a specific product',
      appliesTo: {
        categories: [],
        items: ['item-9999', 'item-6'],
        allProducts: false
      },
      applied: false
    },
    PRICEDOWN: {
      code: 'PRICEDOWN',
      value: 5,
      description: '5% off on total value',
      appliesTo: {
        categories: [],
        items: [],
        allProducts: true
      },
      applied: false
    }
  }

  // this function creates an list item to display promo code details
  function listPromoCode(promoCodesObject, promoCode, itemTemplate) {
    var promoCodeList = document.querySelector('.promo-code-list'),
        promoCodeItem,
        promoCodeItemContent;

      promoCodeItem = document.createElement('li');
      itemTemplate = itemTemplate.replace('{{promoCode}}', promoCodesObject[promoCode].code)
                                 .replace('{{promoCodeDescription}}', promoCodesObject[promoCode].description);
      promoCodeItem.innerHTML = itemTemplate;
      promoCodeList.appendChild(promoCodeItem);

  }

  for ( var code in promoCodes ) {
    // skip 'applied' property since it's not a promo code
    if ( code !== 'applied' ) {
      listPromoCode(promoCodes, code, promoCodeItemTemplate);
    }
  }

  // the function that constructs the product data object
  function ProductConstructor(productDataObject) {
    this.productID          = productDataObject.productID;
    this.productCategory    = productDataObject.productCategory;
    this.productName        = productDataObject.productName;
    this.productImageUrl    = productDataObject.productImageUrl;
    this.productDescription = productDataObject.productDescription;
    this.productPrice       = productDataObject.productPrice;
    this.productQuantity    = 1;
  }

  // the function that constructs product object in the shopping cart 'itemList' array
  function ShoppingCartProductItem(productDataObject) {
    this.productID          = productDataObject.productID;
    this.productCategory    = productDataObject.productCategory;
    this.productPrice       = productDataObject.productPrice;
    this.productQuantity    = productDataObject.productQuantity;
    this.productSubtotal    = 0;
    this.promoCodesApplied  = [];
  }

  // add the method for manipulating the price, quantity and subtotal of the product
  // it is needed for applying the promo codes
  ShoppingCartProductItem.prototype.updatePrice = function(modifier) {
    var initialPrice = this.productPrice;
    // modifier is the percentage number, so we must divide by 100 to get real value
    this.productPrice = Math.round((initialPrice * modifier / 100));
  }
  ShoppingCartProductItem.prototype.updateQuantity = function(qty) {
    this.productQuantity = qty;
  }
  ShoppingCartProductItem.prototype.updateSubtotal = function() {
    this.productSubtotal = this.productPrice * this.productQuantity;
  }

  // generating items
  // in real application, there will be admin interface where the item details would be entered
  for ( var i = 0; i < 8; i++ ) {
    productsObject['item-' + i] = new ProductConstructor({
      productID: 'item-' + i,
      productName: 'Schnappsy',
      productImageUrl: 'placeholder.png',
      productDescription: 'Taste the best schnapps in the world. Once you try it, you won\'t stop... it will change the way you see the world!',
      productPrice: (Math.random() * 20000).toFixed(0) // this will be just plain number of cents, I do this just to automate the process
    });

    // add some product categories
    if ( i < 2 ) {
      productsObject['item-' + i].productCategory = 'Party Drinks';
    } else if ( i >= 2 && i < 4 ) {
      productsObject['item-' + i].productCategory = 'Soft Drinks';
    } else if ( i >= 4 && i < 6 ) {
      productsObject['item-' + i].productCategory = 'Drinks for all';
    } else if ( i >= 6 ) {
      productsObject['item-' + i].productCategory = 'Killer Drinks';
    }
  }

  // create an specific item
  productsObject['item-9999'] = new ProductConstructor({
    productID: 'item-9999',
    productName: 'Mind Haze',
    productImageUrl: 'placeholder.png',
    productDescription: 'Have you ever wondered how would the world look like if you could see the invisible? Try Mind Haze and you will know!',
    productPrice: 43200,
    productCategory: 'Special Drinks'
  });

  // console.log(JSON.stringify(productsObject, null, 2));

  // creates and adds item to the 'location' node
  // 'itemData' is the item data from the 'productsObject'
  // 'itemTemplate' is the template that is used to create the item HTML content
  function addItemTo(location, itemData, itemTemplate) {
    var newItemAddButton,
        removeItemButton,
        itemQuantity,
        productTableListContainer = document.querySelector('.selected-products-table-list'),
        newItem                   = document.createElement('li'), // THIS IS MAYBE BETTER TO DO IN SOME OTHER PLACE
        isShoppingCart            = location.classList.contains('products-shopping-cart'),
        itemHTML                  = itemTemplate.join('')
                                                .replace('{{productName}}', itemData.productName)
                                                .replace('{{productCategory}}', itemData.productCategory)
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

        // since the item is not found in the cart, update the cart with it, and set quantity to 1
        updateCart(itemID, 1);
        // create a row in the table that displays selected items
        itemRow = document.createElement('tr');
        itemRow.id = itemTableID;
        itemRow.classList.add(itemID);
        // the data that fills the template is mostly gathered from the 'shoppindCartObject'
        itemRow.innerHTML = productTableTemplate.join('')
                                                .replace('{{productName}}', itemData.productName)
                                                .replace('{{productPrice}}', formatPrice(shoppingCartObject.itemList[itemID].productPrice))
                                                .replace('{{productQuantity}}', shoppingCartObject.itemList[itemID].productQuantity)
                                                .replace('{{productSubtotal}}', formatPrice(shoppingCartObject.itemList[itemID].productSubtotal));

        selectedProductsTable.appendChild(itemRow);

        // create a list item in the list that displays selected items
        // this list and previous table are displayed in the same location,
        // the list appears on small screens while table appears on larger screens
        listItem = document.createElement('li');
        listItem.id = itemListID;
        listItem.classList.add(itemID);
        // the data that fills the template is mostly gathered from the 'shoppindCartObject'
        listItem.innerHTML = productListItemTemplate.join('')
                                                    .replace('{{productName}}', itemData.productName)
                                                    .replace('{{productPrice}}', formatPrice(shoppingCartObject.itemList[itemID].productPrice))
                                                    .replace('{{productQuantity}}', shoppingCartObject.itemList[itemID].productQuantity);

        selectedProductsList.appendChild(listItem);

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

  function updateCart(itemID, quantity) {
    // updates the total and subtotal rows
    // updates cart icon on top of the page
    var itemElements = document.querySelectorAll('.' + itemID),
        itemPrice,
        itemQuantity,
        itemSubtotal,
        cartSummaryItems = document.querySelector('.cart-item-no'),
        cartSummaryTotal = document.querySelectorAll('.cart-total'),
        i, len = itemElements.length;

    // if the item does not exist in the 'shoppingCartObject', then create a new one, else update its quantity
    if ( !shoppingCartObject.itemList[itemID] ) {
      shoppingCartObject.itemList[itemID] = new ShoppingCartProductItem(productsObject[itemID]);
      // if there are applied promo codes, check if some apply to the new product and apply it
      if ( promoCodes.applied ) {
        for ( var code in promoCodes ) {
          // skip 'applied' property since it's not a promo code
          // and apply only applied codes
          if ( code !== 'applied' && promoCodes[code].applied ) {
            shoppingCartObject.applyPromoCode(code);
          }
        }
      }
    } else {
      shoppingCartObject.itemList[itemID].updateQuantity(quantity);
    }

    // in any case, update the subtotal for the item, and the total for the shopping cart
    shoppingCartObject.itemList[itemID].updateSubtotal();
    shoppingCartObject.setTotals();

    for ( i = 0; i < len; i++ ) {
      // itemPrice = itemElements[i].querySelector('.price');
      itemQuantity = itemElements[i].querySelector('.quantity');
      itemSubtotal = itemElements[i].querySelector('.subtotal');

      // if ( itemPrice ) itemPrice.textContent = shoppingCartObject.itemList[itemID].productPrice;
      if ( itemQuantity ) itemQuantity.textContent = shoppingCartObject.itemList[itemID].productQuantity;
      if ( itemSubtotal ) itemSubtotal.textContent = formatPrice(shoppingCartObject.itemList[itemID].productSubtotal);
    }

    // update the view with new values (the cart in the header, and the 'total' value in the shopping cart)
    cartSummaryItems.textContent = shoppingCartObject.itemNumber;
    len = cartSummaryTotal.length;
    for ( i = 0; i < len; i++ ) {
      cartSummaryTotal[i].textContent = formatPrice(shoppingCartObject.total);
    }

    // pretty obvious :)
    if ( quantity === 0 ) {
      shoppingCartObject.removeItem(itemID);
    }

    console.log(JSON.stringify(shoppingCartObject, null, 2));

  }

  function formatPrice(price) {
    // since price is given in cents, we divide it with 100 to get the dollar amount
    // then keep only two decimal places, then turn into string and split on the dot
    var price = ((price * 1) / 100).toFixed(2).toString().split('.'),
        // digits of the price in front of the decimal dot
        modifiedPriceDigits = price[0].split(''),
        displayPrice = '';

    // create a new string with the digits of the price and comas inserted on thousands positions
    for ( j = modifiedPriceDigits.length - 1; j >= 0 ; j-- ) {
      if ( displayPrice.length === 3 || displayPrice.length === 7 ) {
        displayPrice = modifiedPriceDigits[j] + ',' + displayPrice;
      } else {
        displayPrice = modifiedPriceDigits[j] + displayPrice;
      }
    }

    // concatenate the price part in front and after the decimal dot
    displayPrice = displayPrice + '.' + price[1];

    return displayPrice;
  }

  // add items to the main product list through a loop
  for ( var item in productsObject ) {
    addItemTo(productList, productsObject[item], productTemplateArrayList);
  }

  // limits the input only to numbers, and keys 'backspace', 'delete', and 'enter'
  // used in the quantity field of the item in the shopping cart
  // maybe left and right arrow keys should be added here too
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
    // this remove item from shopping cart object and updates the view
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

  promoCodeDisplayToggle.addEventListener('click', function() {
    var promoCodesDisplay = document.querySelector('.promo-code-list');
    promoCodesDisplay.classList.toggle('hide-promo-codes');
  });

  promoCodeSubmit.addEventListener('click', function() {
    var promoCodeInput = document.querySelector('#promo-code'),
        promoCode      = promoCodeInput.value;

    if ( !promoCode ) return;
    shoppingCartObject.applyPromoCode(promoCode);
    promoCodeInput.value = '';
  });

}

