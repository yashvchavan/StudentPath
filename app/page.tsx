"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  TrendingUp,
  Target,
  Award,
  ArrowRight,
  GraduationCap,
  Brain,
  Rocket,
  Stars,
  Zap,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Send,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '3s'
          }}
        />
      ))}
    </div>
  );
};

const CursorFollowImage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const smoothMove = () => {
      setImagePosition(prev => {
        const newX = prev.x + (mousePosition.x - prev.x) * 0.05;
        const newY = prev.y + (mousePosition.y - prev.y) * 0.05;

        const deltaX = mousePosition.x - newX;
        const deltaY = mousePosition.y - newY;
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        setRotation(angle);

        return { x: newX, y: newY };
      });
    };

    const animationFrame = requestAnimationFrame(smoothMove);
    return () => cancelAnimationFrame(animationFrame);
  }, [mousePosition, imagePosition]);

  return (
    <div
      className="fixed pointer-events-none z-30 transition-transform duration-100"
      style={{
        left: imagePosition.x - 96,
        top: imagePosition.y - 96,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center center'
      }}
    >
      <img
        src="/Rocket2.png"
        alt="Floating element"
        className="w-48 h-70 object-cover duration-100 opacity-50"
        style={{
          filter: 'blur(0.5px)',
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
};

const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const increment = target / 100;
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= target) {
          clearInterval(timer);
          return target;
        }
        return prev + increment;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{Math.floor(count).toLocaleString()}{suffix}</span>;
};

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to send message");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl">
      <CardHeader className="p-8">
        <CardTitle className="text-2xl font-bold text-white mb-6">
          Send us a Message
        </CardTitle>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Tell us how we can help you..."
            />
          </div>

          {status === "success" && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 text-sm">
                ✓ Message sent successfully! We'll get back to you soon.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                ✗ {errorMessage}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Message
                <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </Button>
        </form>
      </CardHeader>
    </Card>
  );
};

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const scrollToSection = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Cursor Following Image */}
      <div className="fixed inset-0 z-30 pointer-events-none">
        <CursorFollowImage />
      </div>

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.2) 25%, transparent 50%)`,
            transition: 'background 0.3s ease'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-blue-900/20 animate-pulse" />
        <FloatingParticles />

        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }} />
        </div>
      </div>

      {/* Navigation */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl'
          : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <img
              src="/logo.png"
              alt="StudentPath Logo"
              className="h-15 w-auto"
            />

            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features-section"
                onClick={scrollToSection('features-section')}
                className="text-gray-300 hover:text-white transition-colors duration-300 cursor-pointer"
              >
                Features
              </a>
              <a
                href="#about-section"
                onClick={scrollToSection('about-section')}
                className="text-gray-300 hover:text-white transition-colors duration-300 cursor-pointer"
              >
                About
              </a>
              <a
                href="#contact-section"
                onClick={scrollToSection('contact-section')}
                className="text-gray-300 hover:text-white transition-colors duration-300 cursor-pointer"
              >
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/register-other">
                <Button className="bg-gradient-to-r from-gray-600 to-white hover:from-blue-700 hover:to-white-700 text-black font-semibold px-6 py-2 rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Space Shuttle Background */}
        <div className="absolute inset-0 z-10">
          <div
            className="absolute inset-0 opacity-100"
            style={{
              backgroundImage: `url('/hero-bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-20">
          <div className="animate-fadeInUp">  
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-left font-black leading-tight">
                Where{" "}
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-600 to-black bg-clip-text text-transparent">
                  Knowledge
                </span>
              </h1>
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-right font-black mr-20 leading-tight">
                <br /><br />
                Meets{" "}
                <br />
                <span className="bg-gradient-to-r from-black via-blue-600 to-blue-200 bg-clip-text text-transparent">
                  Success
                </span>
              </h1>
            </div>
            <p className="text-xl md:text-md text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Unlock your potential with personalized learning paths, AI-driven insights,
              and expert guidance. Join thousands of students transforming their academic journey.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register-other">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-gray-600 to-white hover:from-blue-700 hover:to-white-700 text-black font-bold px-8 py-4 rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl text-lg group"
                >
                  Start Your Journey
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-white/10 mb-6 backdrop-blur-sm">
              <Stars className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">Why Choose StudentPath?</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Empower Your Future
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive platform provides cutting-edge tools and personalized guidance
              to accelerate your academic and professional success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                title: "AI Career Planning",
                description: "Advanced algorithms analyze your strengths, interests, and market trends to create personalized career pathways.",
                gradient: "from-indigo-500 to-blue-500"
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: "Skill Intelligence",
                description: "Track your skill development with real-time analytics and receive targeted recommendations for improvement.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Progress Analytics",
                description: "Comprehensive dashboards showing your academic milestones, achievements, and future projections.",
                gradient: "from-green-500 to-teal-500"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Expert Network",
                description: "Connect with industry professionals, mentors, and career counselors for personalized guidance.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Smart Resources",
                description: "Curated learning materials, courses, and resources tailored to your specific goals and learning style.",
                gradient: "from-cyan-500 to-blue-500"
              },
              {
                icon: <Rocket className="w-8 h-8" />,
                title: "Future Insights",
                description: "Stay ahead with emerging industry trends, job market analysis, and future career opportunities.",
                gradient: "from-violet-500 to-purple-500"
              }
            ].map((feature, index) => (
              <Card
                key={index}
                className="group bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="p-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 leading-relaxed text-lg">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="py-32 px-6 relative bg-gradient-to-br from-indigo-900/10 to-purple-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-white/10 mb-6 backdrop-blur-sm">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">About StudentPath</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Our Mission
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white mb-4">
                Transforming Education Through Innovation
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                StudentPath was founded with a simple yet powerful vision: to democratize access to quality career guidance and make personalized education accessible to every student, regardless of their background or location.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                We believe that every student has unique potential waiting to be unlocked. Our AI-powered platform combines cutting-edge technology with human expertise to provide personalized guidance that adapts to each student's individual needs, aspirations, and learning style.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                With a team of educators, technologists, and career counselors, we're building the future of education—one student at a time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: <Target className="w-8 h-8" />, title: "Personalized Approach", desc: "Tailored guidance for every student" },
                { icon: <Brain className="w-8 h-8" />, title: "AI-Powered Insights", desc: "Smart recommendations based on data" },
                { icon: <Users className="w-8 h-8" />, title: "Expert Mentors", desc: "Access to industry professionals" },
                { icon: <Award className="w-8 h-8" />, title: "Proven Results", desc: "95% student success rate" }
              ].map((item, index) => (
                <Card
                  key={index}
                  className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300"
                >
                  <CardHeader className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <CardTitle className="text-lg font-bold text-white mb-2">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                      {item.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { number: 10000, label: "Students Guided", suffix: "+" },
              { number: 95, label: "Success Rate", suffix: "%" },
              { number: 500, label: "Partner Colleges", suffix: "+" }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="relative">
                  <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                    <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                </div>
                <div className="text-xl text-gray-300 font-medium tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-section" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-white/10 mb-6 backdrop-blur-sm">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">Get In Touch</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Contact Us
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl">
                <CardHeader className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white mb-2">
                        Email Us
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        <a href="mailto:vijishvanya@gmail.com" className="hover:text-white transition-colors">
                          vijishvanya@gmail.com
                        </a>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl">
                <CardHeader className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white mb-2">
                        Call Us
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Comming Soon..
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl">
                <CardHeader className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white mb-2">
                        Visit Us
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Comming Soon..
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-600/20 to-white/50 opacity-90" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          animation: 'moveBackground 20s linear infinite'
        }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 mb-8 backdrop-blur-sm">
            <Award className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-white/90">Transform Your Future Today</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to Unlock Your{" "}
            <span className="text-yellow-300">Potential?</span>
          </h2>

          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join StudentPath today and embark on a transformative journey towards academic excellence
            and career success with personalized AI-powered guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register-other">
              <Button
                size="lg"
                className="bg-gradient-to-r from-gray-600 to-white hover:from-blue-700 hover:to-white-700 text-black font-bold px-10 py-4 rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl text-lg group"
              >
                Start Free Trial
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <a href="mailto:vijishvanya@gmail.com">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-10 py-4 rounded-full transition-all duration-300 text-lg backdrop-blur-sm"
              >
                Contact Sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-black/50 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <img
                src="/logo.png"
                alt="StudentPath Logo"
                className="h-15 w-auto mb-6"
              />
              <p className="text-gray-400 leading-relaxed">
                Empowering students worldwide with AI-powered career guidance and personalized learning experiences.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features-section"
                    onClick={scrollToSection('features-section')}
                    className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#about-section"
                    onClick={scrollToSection('about-section')}
                    className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#contact-section"
                    onClick={scrollToSection('contact-section')}
                    className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 StudentPath. All rights reserved. Built with ❤️ for students worldwide.
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(1deg);
          }
          66% {
            transform: translateY(5px) rotate(-1deg);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes moveBackground {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(60px, 60px);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}