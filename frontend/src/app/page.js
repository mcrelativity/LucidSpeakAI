import LucidApp from '@/components/LucidApp';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-slate-900 text-white">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
          LucidSpeak.ai
        </h1>
        <p className="text-md sm:text-lg text-slate-400">
          Tu Coach de Comunicación Personal con IA
        </p>
      </div>
      
      <LucidApp />
      
    </main>
  )
}
