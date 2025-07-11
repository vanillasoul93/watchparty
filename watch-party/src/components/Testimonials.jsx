import React from "react";
import {
  PlayCircle,
  Search,
  Calendar,
  Users,
  Star,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Alex Johnson",
      quote:
        "This is the best way to watch movies with friends who are far away. The sync is perfect!",
      avatar: "https://placehold.co/100x100/718096/ffffff?text=A",
    },
    {
      name: "Samantha Bee",
      quote:
        "Setting up a party was so easy! We had a blast. Highly recommend for any movie lover.",
      avatar: "https://placehold.co/100x100/718096/ffffff?text=S",
    },
    {
      name: "Mike Chen",
      quote:
        "A game-changer for long-distance relationships. It feels like we're in the same room.",
      avatar: "https://placehold.co/100x100/718096/ffffff?text=M",
    },
  ];
  return (
    <div>
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-900 p-8 rounded-xl shadow-lg text-center"
              >
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-indigo-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/100x100/718096/ffffff?text=Err";
                  }}
                />
                <p className="text-gray-300 italic mb-4">
                  "{testimonial.quote}"
                </p>
                <div className="flex justify-center text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill="currentColor" />
                  ))}
                </div>
                <h4 className="font-bold text-white text-lg">
                  {testimonial.name}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
