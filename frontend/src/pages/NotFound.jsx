import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const NotFound = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center text-center py-20 border-t">
    <SEO title="Page not found" description="This page doesn't exist." canonical={false} noindex />
    <p className="text-sm tracking-widest text-[#587a3b] mb-2">404</p>
    <h1 className="text-3xl font-semibold text-gray-900 mb-3">Page not found</h1>
    <p className="text-gray-600 mb-8">Sorry, we couldn&apos;t find that page.</p>
    <div className="flex gap-4">
      <Link to="/collection" className="bg-[#587a3b] text-white px-6 py-3 text-sm">Shop products</Link>
      <Link to="/blog" className="border border-[#587a3b] text-[#587a3b] px-6 py-3 text-sm">Read our guides</Link>
    </div>
  </div>
)

export default NotFound
