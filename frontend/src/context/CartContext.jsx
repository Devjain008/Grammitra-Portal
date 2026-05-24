import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    console.warn("useCart was called outside of a CartProvider context. Returning fallback values.");
    return {
      cartItems: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      cartTotal: 0,
      cartCount: 0
    };
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('grammitra_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('grammitra_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);
      const limit = typeof product.stock === 'number' ? product.stock : 999;
      
      const discountedPrice = product.discount > 0 
        ? Math.round(product.price * (1 - product.discount / 100))
        : product.price;

      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + quantity, limit);
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: newQty } : item
        );
      } else {
        const newQty = Math.min(quantity, limit);
        if (limit <= 0) return prevItems; // Product out of stock
        return [...prevItems, { 
          ...product, 
          discountedPrice,
          quantity: newQty 
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id === productId) {
          const limit = typeof item.stock === 'number' ? item.stock : 999;
          const newQty = Math.max(1, Math.min(quantity, limit));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.discountedPrice * item.quantity),
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
