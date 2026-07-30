// app.js (front-end logic)

const API_BASE = "/api";

const form = document.getElementById("employee-form");
const formMessage = document.getElementById("form-message");
const employeesBody = document.getElementById("employees-body");
const employeesEmpty = document.getElementById("employees-empty");
const searchInput = document.getElementById("search");

// Stats elements
const statTotal = document.getElementById("stat-total");
const statDepartments = document.getElementById("stat-departments");
const statLocations = document.getElementById("stat-locations");

let employees = [];

// Load existing employees from backend
async function fetchEmployees() {
  try {
    const res = await fetch(`${API_BASE}/employees`);
    if (!res.ok) throw new Error("Failed to fetch employees");

    employees = await res.json();
    updateStats();
    renderEmployees();
  } catch (err) {
    console.error(err);
    employeesEmpty.hidden = false;
    employeesEmpty.textContent =
      "Failed to load employees. Check that the server is running.";
  }
}

function updateStats() {
  const total = employees.length;
  const deptSet = new Set(employees.map((e) => e.department).filter(Boolean));
  const locSet = new Set(employees.map((e) => e.location).filter(Boolean));

  statTotal.textContent = total;
  statDepartments.textContent = deptSet.size;
  statLocations.textContent = locSet.size;
}

function renderEmployees() {
  const query = (searchInput.value || "").toLowerCase();

  const filtered = employees.filter((emp) => {
    const haystack = `${emp.full_name} ${emp.email} ${emp.role} ${emp.department}`.toLowerCase();
    return haystack.includes(query);
  });

  employeesBody.innerHTML = "";

  if (filtered.length === 0) {
    employeesEmpty.hidden = false;
    employeesEmpty.textContent = "No employees match your search.";
    return;
  }

  employeesEmpty.hidden = true;

  filtered.forEach((emp) => {
    const tr = document.createElement("tr");

    // Employee (name + email only, no avatar)
    const tdEmp = document.createElement("td");

    const meta = document.createElement("div");
    meta.className = "employee-meta";

    const nameEl = document.createElement("div");
    nameEl.className = "employee-name";
    nameEl.textContent = emp.full_name;

    const emailEl = document.createElement("div");
    emailEl.className = "employee-email";
    emailEl.textContent = emp.email;

    meta.appendChild(nameEl);
    meta.appendChild(emailEl);
    tdEmp.appendChild(meta);

    const tdRole = document.createElement("td");
    tdRole.textContent = emp.role || "-";

    const tdDept = document.createElement("td");
    tdDept.textContent = emp.department || "-";

    const tdLocation = document.createElement("td");
    tdLocation.textContent = emp.location || "-";

    const tdJoin = document.createElement("td");
    tdJoin.textContent = emp.join_date
      ? new Date(emp.join_date).toLocaleDateString()
      : "-";

    tr.appendChild(tdEmp);
    tr.appendChild(tdRole);
    tr.appendChild(tdDept);
    tr.appendChild(tdLocation);
    tr.appendChild(tdJoin);

    employeesBody.appendChild(tr);
  });
}

// Handle add-employee submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "form-message";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  if (!payload.full_name || !payload.email) {
    formMessage.textContent = "Name and email are required.";
    formMessage.classList.add("form-message--error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create employee");
    }

    const created = await res.json();
    employees.unshift(created);
    updateStats();
    renderEmployees();

    form.reset();
    formMessage.textContent = "Employee added successfully.";
    formMessage.classList.add("form-message--success");
  } catch (err) {
    console.error(err);
    formMessage.textContent =
      "Something went wrong while adding employee. Check the server logs.";
    formMessage.classList.add("form-message--error");
  }
});

// Live search
searchInput.addEventListener("input", renderEmployees);

// Initial load
fetchEmployees();
