import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Markets } from './components/Markets'
import { HowItWorks } from './components/HowItWorks'
import { ForEveryone } from './components/ForEveryone'
import { Benefits } from './components/Benefits'
import { Cta } from './components/Cta'
import { Footer } from './components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased">
      <Header />
      <main>
        <Hero />
        <About />
        <Markets />
        <HowItWorks />
        <ForEveryone />
        <Benefits />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}

export default App
