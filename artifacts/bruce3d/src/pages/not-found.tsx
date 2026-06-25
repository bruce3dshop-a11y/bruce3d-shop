import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <div className="text-8xl font-black font-display text-primary mb-4">404</div>
        <h1 className="text-2xl font-bold font-display mb-2">Страница не найдена</h1>
        <p className="text-muted-foreground mb-8">Такой страницы не существует или она была перемещена.</p>
        <Link href="/" className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
      </motion.div>
    </div>
  );
}
