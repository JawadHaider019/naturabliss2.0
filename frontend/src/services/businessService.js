import axios from 'axios';

let cachedData = null;
let inFlightPromise = null;

/**
 * Fetch business details with deduplication and caching across Navbar, Footer, and Favicon.
 */
export const getBusinessDetails = async (backendUrl) => {
  if (cachedData) {
    return cachedData;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  if (!backendUrl) return null;

  inFlightPromise = axios.get(`${backendUrl}/api/business-details`, {
    timeout: 6000
  })
    .then((res) => {
      if (res.data?.success && res.data?.data) {
        cachedData = res.data.data;
        return cachedData;
      }
      return null;
    })
    .catch((err) => {
      return null;
    })
    .finally(() => {
      inFlightPromise = null;
    });

  return inFlightPromise;
};
