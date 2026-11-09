import { Link } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

/**
 * Breadcrumbs Component
 * Provides both visible navigation trail and Schema.org BreadcrumbList microdata + JSON-LD
 *
 * @param {Array<{ label: string, path?: string }>} items
 */
const Breadcrumbs = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  // Filter out any raw 24-character hex MongoDB ObjectIds (e.g. "6ac378326bd9fed0373d4114")
  const validItems = items.filter(item => {
    if (!item || !item.label) return false;
    const str = item.label.toString().trim();
    if (/^[0-9a-fA-F]{24}$/.test(str)) return false;
    return true;
  });

  if (validItems.length === 0) return null;

  // Ensure 'Home' is the first item if not already provided
  const rawItems = validItems[0]?.label?.toLowerCase() === 'home'
    ? validItems
    : [{ label: 'Home', path: '/' }, ...validItems];

  // Standardize items to support both path and href properties
  const fullItems = rawItems.map((item, index) => {
    const isLast = index === rawItems.length - 1;
    const targetPath = item.path || item.href || (isLast && typeof window !== 'undefined' ? window.location.pathname : undefined);
    return {
      ...item,
      path: targetPath
    };
  });

  // Schema.org BreadcrumbList JSON-LD
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": fullItems.map((item, index) => {
      const fullUrl = item.path
        ? (item.path.startsWith('http') ? item.path : `https://naturabliss.pk${item.path.startsWith('/') ? item.path : `/${item.path}`}`)
        : undefined;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        ...(fullUrl ? { "item": fullUrl } : {})
      };
    })
  };

  return (
    <>
      {/* Schema.org BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Visible Breadcrumbs Trail */}
      <nav aria-label="Breadcrumb" className="py-2.5 mb-3 text-xs sm:text-sm text-gray-500">
        <ol className="flex items-center flex-wrap gap-1.5 list-none m-0 p-0">
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1;
            const isHome = index === 0;

            return (
              <li key={index} className="flex items-center gap-1.5">
                {!isLast && item.path ? (
                  <Link
                    to={item.path}
                    className="hover:text-[#587a3b] transition-colors flex items-center gap-1 text-gray-600"
                  >
                    {isHome && <FaHome className="text-xs text-gray-400" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className="text-gray-900 font-semibold truncate max-w-[220px] sm:max-w-md"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                )}

                {!isLast && (
                  <FaChevronRight className="text-[10px] text-gray-400 flex-shrink-0" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
