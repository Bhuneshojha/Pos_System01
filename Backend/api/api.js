import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3030"
});

export default API;

