import { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle, ChevronRight, ArrowRight, Calendar, Users, BadgeCheck } from "lucide-react";
import { COMPANY } from "@/lib/constants/company";
import { REGULATORY } from "@/lib/constants/regulatory";

export const metadata: Metadata = {
  title: "Contact Us - Book a Free Consultation",
  description: "Contact Trustner for mutual fund investments, insurance queries, or financial planning. Book a free consultation, call, email, or WhatsApp us.",
};

const CONSULTATION_TYPES = [
  { title: "Investment Planning", description: "Mutual funds, SIP, lumpsum investment strategy", icon: "💰" },
  { title: "Insurance Review", description: "Health, life, motor insurance analysis", icon: "🛡️" },
  { title: "Tax Planning", description: "ELSS, NPS, 80C optimization", icon: "📋" },
  { title: "Retirement Planning", description: "Long-term wealth building strategy", icon: "🏖️" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10 lg:py-14">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">Contact</span>
          </div>
          <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            Get Expert Financial Guidance
          </h1>
          <p className="max-w-xl text-gray-400">
            Book a free consultation with our certified advisors. Whether you are starting your investment journey or optimizing your portfolio, we are here to help.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}?text=Hi%20Trustner,%20I%20would%20like%20to%20book%20a%20consultation.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-600"
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
            <a
              href={`tel:${COMPANY.contact.phone}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Phone size={16} /> {COMPANY.contact.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left - Contact Info + Consultation Types */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Contact Cards */}
            {[
              { icon: Phone, title: "Call Us", value: COMPANY.contact.phone, subtitle: "Toll-free, Mon-Sat", href: `tel:${COMPANY.contact.phone}`, color: "bg-blue-500" },
              { icon: Mail, title: "Email Us", value: COMPANY.contact.email, subtitle: "We reply within 24 hours", href: `mailto:${COMPANY.contact.email}`, color: "bg-purple-500" },
              { icon: MessageCircle, title: "WhatsApp", value: COMPANY.contact.whatsapp, subtitle: "Quick chat support", href: `https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}`, color: "bg-green-500" },
              { icon: Clock, title: "Working Hours", value: COMPANY.contact.workingHours, subtitle: "Including Saturday", color: "bg-amber-500" },
              { icon: MapPin, title: "Office", value: `${COMPANY.address.city}, ${COMPANY.address.state}`, subtitle: COMPANY.address.country, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-4 shadow-card transition-all hover:shadow-card-hover">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${item.color} text-white`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm font-bold text-gray-900 transition hover:text-primary-500">{item.value}</a>
                    ) : (
                      <p className="text-sm font-bold text-gray-900">{item.value}</p>
                    )}
                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Consultation Types */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Calendar size={16} className="text-primary-500" />
                Book a Free Consultation For
              </h3>
              <div className="space-y-3">
                {CONSULTATION_TYPES.map((ct) => (
                  <div key={ct.title} className="flex items-center gap-3 rounded-lg bg-surface-200 p-3">
                    <span className="text-lg">{ct.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ct.title}</p>
                      <p className="text-[11px] text-gray-400">{ct.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/50 p-4">
              <BadgeCheck size={20} className="flex-shrink-0 text-primary-500" />
              <p className="text-xs text-gray-600">
                <strong className="text-gray-700">AMFI Registered ({REGULATORY.AMFI_ARN})</strong> — Your data is secure and we never share it with third parties.
              </p>
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card lg:p-8">
              <h2 className="mb-2 text-xl font-extrabold text-gray-900">Send Us a Message</h2>
              <p className="mb-6 text-sm text-gray-500">Fill in your details and we will get back to you within 24 hours.</p>
              <form className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name *</label>
                    <input type="text" placeholder="Your name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Mobile Number *</label>
                    <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address *</label>
                    <input type="email" placeholder="you@example.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">City</label>
                    <input type="text" placeholder="Your city" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">I Need Help With *</label>
                  <select className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-500">
                    <option value="">Select a topic</option>
                    <option>Mutual Fund Investment / SIP</option>
                    <option>Health Insurance</option>
                    <option>Life Insurance</option>
                    <option>Motor / Travel Insurance</option>
                    <option>Portfolio Review</option>
                    <option>Tax Planning & ELSS</option>
                    <option>NPS / PPF / Other Investments</option>
                    <option>Retirement Planning</option>
                    <option>General Enquiry</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Message</label>
                  <textarea rows={4} placeholder="Tell us about your financial goals or questions..." className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600">
                    Send Message <ArrowRight size={14} />
                  </button>
                  <a
                    href={`https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-8 py-3.5 text-sm font-bold text-green-700 transition hover:bg-green-100"
                  >
                    <MessageCircle size={14} /> Chat on WhatsApp
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  By submitting, you agree to our Privacy Policy. We will never spam you or share your data.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
