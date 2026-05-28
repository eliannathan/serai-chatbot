import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const CartContext = createContext(null)
const CART_KEY = 'serai_cart'
const MAX_CART_ITEMS = 5

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CART_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  // Returns true if the item was added, false if the cart was already full.
  // Callers can use the return value to show a "cart full" message.
  const addToCart = useCallback((item) => {
    if (cart.length >= MAX_CART_ITEMS) return false
    setCart(prev => {
      // Re-check inside the updater so a fast double-click can't exceed MAX
      if (prev.length >= MAX_CART_ITEMS) return prev
      return [...prev, { ...item, id: crypto.randomUUID() }]
    })
    return true
  }, [cart.length])

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    sessionStorage.removeItem(CART_KEY)
  }, [])

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal:    cart.reduce((sum, i) => sum + i.total, 0),
    cartCount:    cart.length,
    cartFull:     cart.length >= MAX_CART_ITEMS,
    maxCartItems: MAX_CART_ITEMS,
  }), [cart, addToCart, removeFromCart, clearCart])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
