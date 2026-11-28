import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronDown, FiMessageCircle } from 'react-icons/fi'

const FAQS = [
  {
    group: 'Shopping & products',
    items: [
      ['How do I find an outfit?', 'Use the Products menu to browse all styles, or filter by category, colour, occasion, price and availability. Each product page shows its fabric, available options and current stock.'],
      ['Can I check an item before ordering?', 'Yes. Open the product page to see its photographs, price, selected size and colour options. Add it to your wishlist if you want to compare it later.'],
      ['What if my size is unavailable?', 'An unavailable option cannot be added to the cart. Please check another product or contact the store for help with a suitable alternative.'],
    ],
  },
  {
    group: 'Orders & delivery',
    items: [
      ['When is shipping free?', 'Shipping is free for orders above ₹999. The checkout page clearly shows any shipping charge before you place the order.'],
      ['How can I track my order?', 'Sign in, open My Orders, and select your order. The tracking timeline displays updates such as confirmed, processing, shipped and delivered.'],
      ['Can I cancel my order?', 'Orders can be cancelled while they are still pending or confirmed. Open the order in My Orders to see whether cancellation is available.'],
    ],
  },
  {
    group: 'Payments, returns & account',
    items: [
      ['Which payment methods do you accept?', 'You can use Cash on Delivery where available, or pay online through Razorpay. Online orders are confirmed only after secure payment verification.'],
      ['How do returns and refunds work?', 'If an item is damaged or incorrect, email info@shaazethnicwear.com with the order number, photos and a short description. We will confirm eligibility and the next steps.'],
      ['How do I reset my password?', 'Choose Forgot Password from Login, enter your registered email address, then use the 6-digit OTP sent to that inbox to set a new password.'],
    ],
  },
]

export default function FAQ() {
  const [openItem, setOpenItem] = useState('0-0')

  return (
    <section className="min-h-screen bg-brand-cream py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-brand-deep-red font-semibold tracking-[0.18em] uppercase text-sm">Help centre</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-brand-charcoal mt-2">Frequently asked questions</h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Quick answers for shopping at Shaaz Ethnicwear. For product and order help, use the Store Assistant at the bottom-right of any page.</p>
        </div>

        <div className="space-y-7">
          {FAQS.map((section, sectionIndex) => (
            <section key={section.group} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <h2 className="font-heading text-2xl font-bold text-brand-charcoal px-6 sm:px-8 py-5 border-b border-brand-gold/20">{section.group}</h2>
              <div className="divide-y divide-gray-100">
                {section.items.map(([question, answer], itemIndex) => {
                  const key = `${sectionIndex}-${itemIndex}`
                  const isOpen = openItem === key
                  return (
                    <div key={question}>
                      <button type="button" className="w-full px-6 sm:px-8 py-5 flex items-center justify-between gap-4 text-left hover:bg-brand-cream/60 transition-colors" onClick={() => setOpenItem(isOpen ? '' : key)} aria-expanded={isOpen}>
                        <span className="font-semibold text-brand-charcoal">{question}</span>
                        <FiChevronDown className={`text-brand-deep-red flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
                      </button>
                      {isOpen && <p className="px-6 sm:px-8 pb-5 text-gray-600 leading-relaxed animate-fade-in">{answer}</p>}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-brand-deep-red text-white rounded-2xl px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-heading text-2xl font-bold">Still need help?</h2>
            <p className="text-white/80 text-sm mt-1">Our Store Assistant answers only Shaaz Ethnicwear questions.</p>
          </div>
          <Link to="/products" className="inline-flex items-center justify-center gap-2 bg-brand-gold text-brand-charcoal rounded-lg px-5 py-3 font-semibold hover:bg-yellow-400 transition-colors">
            <FiMessageCircle /> Explore the store
          </Link>
        </div>
      </div>
    </section>
  )
}
