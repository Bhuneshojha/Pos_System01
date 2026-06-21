function Topbar() {
  return (
    <div className="bg-white shadow-sm px-3 py-2 d-flex justify-content-between align-items-center">

      <h5 className="m-0">Clothing Store POS</h5>

      <div className="d-flex gap-3 align-items-center">
        <span className="text-muted">Admin</span>
        <div className="rounded-circle bg-dark text-white px-2 py-1">
          A
        </div>
      </div>

    </div>
  );
}

export default Topbar;