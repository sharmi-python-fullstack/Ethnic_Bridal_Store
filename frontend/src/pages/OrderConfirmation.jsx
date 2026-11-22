import { Link, useParams } from 'react-router-dom'

export default function OrderConfirmation() {
  const { id } = useParams()

  return (
    <section className="min-h-[70vh] bg-brand-cream flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-card text-center p-8 sm:p-12 animate-fade-in">
        <div className="text-7xl mb-5 motion-safe:animate-bounce" role="img" aria-label="smiling face">😊</div>
        <p className="text-brand-gold font-semibold uppercase tracking-[0.18em] text-xs">Thank you for choosing Shaaz</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-charcoal mt-3">Order was placed successfully!</h1>
        <p className="text-gray-600 mt-4 leading-relaxed">We’ve received your order and will keep you updated as it is prepared for delivery.</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link to={`/orders/${id}`} className="btn-primary">View order details</Link>
          <Link to="/products" className="btn-outline">Continue shopping</Link>
        </div>
      </div>
    </section>
  )
}
