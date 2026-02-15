import { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { COMPANY } from "@/lib/constants/company";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch with Trustner",
  description: "Contact Trustner for mutual fund investments, insurance queries, or financial planning. Call, email, or visit us.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-primary to-primary-700 py-16 text-white">
        <div className="container-custom text-center">
          <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">Get in Touch</h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-200">
            Have questions about investments or insurance? Our team of experts is here to help.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {[
              { icon: Phone, title: "Call Us", value: COMPANY.contact.phone, subtitle: "Toll-free, Mon-Sat", href: `tel:${COMPANY.contact.phone}` },
              { icon: Mail, title: "Email Us", value: COMPANY.contact.email, subtitle: "We reply within 24 hours", href: `mailto:${COMPANY.contact.email}` },
              { icon: MessageCircle, title: "WhatsApp", value: COMPANY.contact.whatsapp, subtitle: "Quick chat support", href: `https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}` },
              { icon: Clock, title: "Working Hours", value: COMPANY.contact.workingHours, subtitle: "Including Saturday" },
              { icon: MapPin, title: "Office", value: `${COMPANY.address.city}, ${COMPANY.address.state}`, subtitle: COMPANY.address.country },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    <item.icon size={20} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-bold text-gray-900 hover:text-primary-500">{item.value}</a>
                    ) : (
                      <p className="text-sm font-bold text-gray-900">{item.value}</p>
                    )}
                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
              <h2 className="mb-6 text-xl font-extrabold text-gray-900">Send Us a Message</h2>
              <form className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name</label>
                    <input type="text" placeholder="Your name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Mobile Number</label>
                    <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address</label>
                  <input type="email" placeholder="you@example.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Subject</label>
                  <select className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500">
                    <option value="">Select a topic</option>
                    <option>Mutual Fund Investment</option>
                    <option>SIP Query</option>
                    <option>Health Insurance</option>
                    <option>Life Insurance</option>
                    <option>Motor Insurance</option>
                    <option>Portfolio Review</option>
                    <option>Tax Planning</option>
                    <option>NPS / Other Investments</option>
                    <option>General Enquiry</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Message</label>
                  <textarea rows={5} placeholder="Tell us how we can help you..." className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600 sm:w-auto sm:px-8">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
