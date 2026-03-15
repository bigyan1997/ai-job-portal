import axios from "axios";

// 1. Point the base URL to the root of your local server
const BASE_URL = "http://127.0.0.1:8000";

const login = async (email, password) => {
  // 2. Map to dj-rest-auth path
  const response = await axios.post(`${BASE_URL}/dj-rest-auth/login/`, {
    username: email, // dj-rest-auth often expects 'username'
    email,
    password,
  });
  return response.data;
};

const register = async (email, password) => {
  // 3. This one is correctly at /api/auth/register/ based on your urls.py
  const response = await axios.post(`${BASE_URL}/api/auth/register/`, {
    email,
    password,
  });
  return response.data;
};

const updateRole = async (token, roleData) => {
  // Use PATCH instead of POST to match common Django UpdateView patterns
  const response = await axios.patch(`${BASE_URL}/api/user/update/`, roleData, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const authService = { login, register, updateRole };
