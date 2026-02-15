import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { COMPANY } from "@/lib/constants/company";

export default function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-700 py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container-custom relative text-center">
        <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
          Ready to Start Your
          <br />
          Investment Journey?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-200">
          Join thousands of smart investors who trust Trustner. Get expert
          guidance on mutual funds, insurance, and financial planning.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/mutual-funds"
            className="group flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary shadow-lg transition hover:shadow-xl"
          >
            Start Investing Now
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
          <a
            href={`tel:${COMPANY.contact.phone}`}
            className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-sm font-bold text-white transition hover:border-white/60 hover:bg-white/10"
          >
            <Phone size={18} />
            Talk to Expert
          </a>
        </div>

        <p className="mt-8 text-sm text-primary-300">
          Free consultation • No hidden charges • AMFI Registered Distributor
        </p>
      </div>
    </section>
  );
}
