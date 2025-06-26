// Заглушка для axios
const axios = {
  get: async (url) => {
    console.log(`Mock GET request to ${url}`);
    return { data: [] };
  },
  post: async (url, data, config) => {
    console.log(`Mock POST request to ${url}`, data);
    return { data: {} };
  },
  put: async (url, data, config) => {
    console.log(`Mock PUT request to ${url}`, data);
    return { data: {} };
  },
  delete: async (url, config) => {
    console.log(`Mock DELETE request to ${url}`);
    return { data: {} };
  },
  create: (config) => {
    return axios;
  }
};

export default axios;