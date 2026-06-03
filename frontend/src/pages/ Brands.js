import React, { useEffect, useState } from "react";
import API from "../api/api";

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [brandName, setBrandName] = useState("");

  const fetchBrands = async () => {
    const res = await API.get("/brands");
    setBrands(res.data);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const addBrand = async () => {
    await API.post("/brands", { brand_name: brandName });
    setBrandName("");
    fetchBrands();
  };

  const deleteBrand = async (id) => {
    await API.delete(`/brands/${id}`);
    fetchBrands();
  };

  return (
    <div className="container mt-4">
      <h2>Brands</h2>

      <div className="input-group mb-3">
        <input
          className="form-control"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Enter brand"
        />
        <button className="btn btn-primary" onClick={addBrand}>
          Add
        </button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr key={b.brand_id}>
              <td>{b.brand_id}</td>
              <td>{b.brand_name}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteBrand(b.brand_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Brands;