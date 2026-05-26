import { createContext, useContext, useState, useEffect, useMemo } from 'react'

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

  function addToCart(item) {
    setCart(prev => {
      if (prev.length >= MAX_CART_ITEMS) return prev
      return [...prev, { ...item, id: crypto.randomUUID() }]
    })
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  function clearCart() {
    setCart([])
    sessionStorage.removeItem(CART_KEY)
  }

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal: cart.reduce((sum, i) => sum + i.total, 0),
    cartCount: cart.length,
  }), [cart])

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