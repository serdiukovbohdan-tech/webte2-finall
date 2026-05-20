const axios = require('axios');

async function getLocation(ip) {
  const normalizedIp = normalizeIp(ip);

  if (isLocalhostIp(normalizedIp)) {
    return {
      city: 'Local',
      country: 'Local'
    };
  }

  try {
    const response = await axios.get(
      `http://ip-api.com/json/${encodeURIComponent(normalizedIp)}`,
      {
        params: {
          fields: 'status,message,city,country'
        },
        timeout: 5000
      }
    );

    if (response.data && response.data.status === 'success') {
      return {
        city: response.data.city || 'Unknown',
        country: response.data.country || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Geo lookup failed:', error.message);
  }

  return {
    city: 'Unknown',
    country: 'Unknown'
  };
}

function normalizeIp(ip) {
  if (!ip) {
    return '127.0.0.1';
  }

  return String(ip).replace(/^::ffff:/, '');
}

function isLocalhostIp(ip) {
  return ip === '127.0.0.1' || ip === '::1';
}

module.exports = {
  getLocation
};
