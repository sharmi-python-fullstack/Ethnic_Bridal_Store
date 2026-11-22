import { Link, useParams } from 'react-router-dom'

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'We use the details you share only to process orders, support your account, and improve your shopping experience.',
    sections: [
      ['Information we use', 'We use your contact, delivery, and order information to fulfil purchases and provide customer support. Payment card details are processed by Razorpay and are never stored on our servers.'],
      ['Your choices', 'You can update your profile and saved addresses from your account. For privacy questions or account requests, email info@shaazethnicwear.com.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'By using Shaaz Ethnicwear, you agree to provide accurate account and delivery details and to use the store lawfully.',
    sections: [
      ['Orders and pricing', 'Prices and stock availability can change before an order is confirmed. An online order is confirmed only after Razorpay securely verifies the payment.'],
      ['Payments', 'Online payments are securely handled by Razorpay. Cash on Delivery is available only where shown during checkout.'],
    ],
  },
  returns: {
    title: 'Return Policy',
    intro: 'We want every Shaaz purchase to feel right for your celebration. Please contact us promptly if an item arrives damaged or incorrect.',
    sections: [
      ['Starting a return', 'Email info@shaazethnicwear.com with your order number, photos, and a brief description of the issue. Our team will confirm whether the item is eligible and share the next steps.'],
      ['Refunds', 'Approved refunds are returned to the original payment method after the returned item is inspected. Bank processing times may vary.'],
    ],
  },
}

export default function Legal() {
  const { page } = useParams()
  const content = CONTENT[page] || CONTENT.privacy

  return (
    <section className="min-h-screen bg-brand-cream py-12 px-4">
      <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-card p-6 sm:p-10">
        <Link to="/" className="text-sm font-semibold text-brand-deep-red hover:underline">Back to home</Link>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-charcoal mt-5">{content.title}</h1>
        <p className="text-gray-600 leading-relaxed mt-4">{content.intro}</p>
        <div className="space-y-6 mt-8">
          {content.sections.map(([heading, text]) => (
            <section key={heading}>
              <h2 className="font-heading text-xl font-bold text-brand-charcoal">{heading}</h2>
              <p className="text-gray-600 leading-relaxed mt-2">{text}</p>
            </section>
          ))}
        </div>
      </article>
    </section>
  )
}
