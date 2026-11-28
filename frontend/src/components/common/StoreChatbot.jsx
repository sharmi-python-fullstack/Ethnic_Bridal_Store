import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMessageCircle, FiMinimize2, FiSend, FiShoppingBag, FiX } from 'react-icons/fi'
import axiosInstance from '../../api/axios'

const WELCOME = {
  role: 'assistant',
  text: 'Namaste! I am the Shaaz Store Assistant. Ask me only about Shaaz Ethnicwear products, delivery, returns, payments, your account, or your own orders.',
  suggestions: ['Show bridal lehengas', 'How does delivery work?', 'Track my order'],
}

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

export default function StoreChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, open, loading])

  const ask = async (question) => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || loading) return

    setMessages((current) => [...current, { role: 'user', text: cleanQuestion }])
    setInput('')
    setLoading(true)
    try {
      const response = await axiosInstance.post('/api/chat/', { message: cleanQuestion })
      setMessages((current) => [...current, { role: 'assistant', ...response.data }])
    } catch (error) {
      const detail = error?.response?.data?.error || 'I could not reach the Shaaz support service. Please try again.'
      setMessages((current) => [...current, { role: 'assistant', text: detail }])
    } finally {
      setLoading(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    ask(input)
  }

  return (
    <div className="store-chatbot">
      {open && (
        <section className="store-chatbot__panel" role="dialog" aria-modal="false" aria-label="Shaaz Store Assistant">
          <header className="store-chatbot__header">
            <div className="flex items-center gap-2 min-w-0">
              <span className="store-chatbot__avatar"><FiShoppingBag /></span>
              <div>
                <h2>Shaaz Store Assistant</h2>
                <p>Store-only support</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Minimize chat" className="store-chatbot__icon-button">
              <FiMinimize2 size={18} />
            </button>
          </header>

          <div className="store-chatbot__messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`store-chatbot__message store-chatbot__message--${message.role}`}>
                <p>{message.text}</p>
                {message.products?.length > 0 && (
                  <div className="store-chatbot__products">
                    {message.products.map((product) => (
                      <Link key={product.id} to={`/products/${product.slug}`} className="store-chatbot__product" onClick={() => setOpen(false)}>
                        {product.primary_image?.image_url ? (
                          <img src={product.primary_image.image_url} alt="" />
                        ) : <span className="store-chatbot__product-image"><FiShoppingBag /></span>}
                        <span>
                          <strong>{product.name}</strong>
                          <small>{money(product.effective_price)} {product.in_stock ? '· In stock' : '· Out of stock'}</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {message.orders?.length > 0 && (
                  <div className="store-chatbot__links">
                    {message.orders.map((order) => (
                      <Link key={order.id} to={order.to} onClick={() => setOpen(false)}>
                        <strong>{order.order_number}</strong><span>{order.status}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {message.links?.length > 0 && (
                  <div className="store-chatbot__links">
                    {message.links.map((link) => <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>)}
                  </div>
                )}
                {message.suggestions?.length > 0 && (
                  <div className="store-chatbot__suggestions">
                    {message.suggestions.map((suggestion) => (
                      <button type="button" key={suggestion} onClick={() => ask(suggestion)} disabled={loading}>{suggestion}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="store-chatbot__typing" aria-label="Assistant is typing"><span /><span /><span /></div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="store-chatbot__form">
            <label className="sr-only" htmlFor="store-chat-input">Ask about Shaaz Ethnicwear</label>
            <input id="store-chat-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={300} placeholder="Ask about products or your order..." disabled={loading} />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send message"><FiSend size={18} /></button>
          </form>
        </section>
      )}
      <button type="button" className="store-chatbot__launcher" onClick={() => setOpen((visible) => !visible)} aria-label={open ? 'Close store assistant' : 'Open store assistant'} aria-expanded={open}>
        {open ? <FiX size={24} /> : <FiMessageCircle size={25} />}
        {!open && <span>Need help?</span>}
      </button>
    </div>
  )
}
