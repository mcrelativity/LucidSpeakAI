"use client";
import Link from '@/components/LocaleLink';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FaMicrophone, FaChartLine, FaRocket } from 'react-icons/fa';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
};

export default function LandingPage() {
  const t = useTranslations();

  const features = [
    { icon: FaMicrophone, title: t('LandingPage.feature1Title'), text: t('LandingPage.feature1Text') },
    { icon: FaChartLine, title: t('LandingPage.feature2Title'), text: t('LandingPage.feature2Text') },
    { icon: FaRocket, title: t('LandingPage.feature3Title'), text: t('LandingPage.feature3Text') }
  ];

  return (
    <div className="w-full text-white overflow-x-hidden">
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="py-20 md:py-28"
      >
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              {t('LandingPage.heroTitlePart1')}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                {t('LandingPage.heroTitleHighlight1')}
              </span>
              {t('LandingPage.heroTitlePart2')}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                {t('LandingPage.heroTitleHighlight2')}
              </span>
              {t('LandingPage.heroTitlePart3')}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto md:mx-0 mb-8">
              {t('LandingPage.heroSubtitle')}
            </p>
            <Link href="/register" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 hover:scale-105 inline-block">
              {t('LandingPage.heroButton')}
            </Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative w-full h-64 md:h-80"
          >
            <Image
              src="/hero-image.jpg"
              alt="Análisis de ondas de voz"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-xl shadow-2xl shadow-sky-500/20 object-cover"
              priority
            />
          </motion.div>
        </div>
      </motion.section>

      <section className="py-20 bg-slate-800/50 rounded-xl">
        <div className="container mx-auto px-4">
          <motion.h2 
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="text-3xl font-bold text-center text-white mb-12"
          >
            {t('LandingPage.featuresTitle')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 p-8 rounded-xl flex flex-col items-center text-center hover:bg-slate-700/50 transition-colors duration-300"
              >
                <div className="bg-sky-500/20 p-4 rounded-full mb-4">
                  <feature.icon size={32} className="text-sky-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-20">
        <motion.div 
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="container mx-auto px-4 max-w-3xl"
        >
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-8 rounded-xl text-center shadow-lg">
            <p className="text-2xl italic text-white mb-4">{t('LandingPage.testimonialText')}</p>
            <p className="font-semibold text-sky-100">{t('LandingPage.testimonialAuthor')}</p>
          </div>
        </motion.div>
      </section>

      <section className="py-20 text-center">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">{t('LandingPage.finalCtaTitle')}</h2>
          <p className="text-slate-400 mb-8">{t('LandingPage.finalCtaSubtitle')}</p>
          <Link href="/register" className="bg-white text-slate-900 font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 hover:scale-105 inline-block">
            {t('LandingPage.finalCtaButton')}
          </Link>
        </motion.div>
      </section>
    </div>
  );
};