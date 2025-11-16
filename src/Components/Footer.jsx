import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();

  // Show footer only on public homepage
  if (location.pathname !== "/") return null;

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold text-white/80">
                iStyleAR
              </h2>
              <p className="text-gray-300 text-base leading-relaxed max-w-sm">
                Experience fashion in Augmented Reality. Transform the way you
                shop and style with cutting-edge AR technology.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              {[
                { icon: FaFacebookF, href: "#", label: "Facebook" },
                { icon: FaInstagram, href: "#", label: "Instagram" },
                { icon: FaTwitter, href: "#", label: "Twitter" },
                { icon: FaLinkedinIn, href: "#", label: "LinkedIn" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.label}
                  className="group relative w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-300"
                >
                  <social.icon className="text-gray-300 group-hover:text-white transition-colors duration-300" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-lg font-semibold mb-6 text-white/90">
              Quick Links
            </h3>
            <nav className="space-y-3">
              {[
                { label: "About", id: "about" },
                { label: "Features", id: "features" },
                { label: "Try Free", id: "try-free-section" },
                { label: "Team", id: "team" },
              ].map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => handleScroll(link.id)}
                  className="block text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 text-left group"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="w-0 h-0.5 bg-purple-400 group-hover:w-3 transition-all duration-200"></span>
                    {link.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Account Links */}
          <div className="lg:col-span-3">
            <h3 className="text-lg font-semibold mb-6 text-white/90">
              Account
            </h3>
            <nav className="space-y-3">
              {[
                { label: "Login", to: "/login" },
                { label: "Sign Up", to: "/register" },
              ].map((link, idx) => (
                <Link
                  key={idx}
                  to={link.to}
                  className="block text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 group"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="w-0 h-0.5 bg-purple-400 group-hover:w-3 transition-all duration-200"></span>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Newsletter Section */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6 text-white/90">
              Stay Updated
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Get the latest AR fashion trends and updates.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all duration-200 text-sm"
              />
              <button className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-[1.02]">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-gray-400">
              &copy; {currentYear} iStyleAR. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              <a
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
