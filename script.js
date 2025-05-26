const employeeSelect = document.getElementById("employee");
const clientTypeSelect = document.getElementById("client-type");
const companyInput = document.getElementById("company");
const calendarDiv = document.getElementById("calendar");
const monthYearHeader = document.getElementById("month-year");
const employeeFilterSelect = document.getElementById("employee-filter");
const employeeScheduleDisplay = document.getElementById("employee-schedule-display");

let scheduleData = JSON.parse(localStorage.getItem("scheduleData")) || [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentEditIndex = null;

const employeeClientMap = {
    Kenneth: ["AAA"],
    Raymond: ["Testing Center", "Batching Plants", "Geotechnical Companies"],
    Aileen: ["AAAA", "Telecoms", "Real Estate"],
    Jinky: ["Trading Companies", "Manufacturing"],
    Remi: ["AA", "A", "B", "C", "D", "E"]
};


function addSchedule() {
    const employee = employeeSelect.value;
    const type = clientTypeSelect.value;
    const company = companyInput.value.trim();
    const date = document.getElementById("date").value;

    if (!employee || !type || !company || !date) return alert("Fill in all fields!");

    scheduleData.push({ employee, type, company, date });
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData));

    alert("Scheduled successfully!");
    renderCalendar();
    renderEmployeeTab();
}

function renderCalendar() {
    calendarDiv.innerHTML = "";
    monthYearHeader.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) calendarDiv.appendChild(document.createElement("div"));

    for (let day = 1; day <= lastDate; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const cell = document.createElement("div");

        const dateBox = document.createElement("div");
        dateBox.className = "date-box";
        dateBox.textContent = day;
        cell.appendChild(dateBox);


        scheduleData.filter(s => s.date === dateStr).forEach(item => {
            const globalIndex = scheduleData.findIndex(s => 
                s.date === dateStr && 
                s.employee === item.employee && 
                s.company === item.company
            );
            
            const div = document.createElement("div");
            div.className = "schedule-entry";
            div.innerHTML = `
                <span class="entry-text">${item.employee} - ${item.company}</span>
                <div class="appointment-actions">
                    <button class="edit-btn" onclick="openEditModal(${globalIndex})">✏️</button>
                    <button class="delete-btn" onclick="deleteAppointment(${globalIndex})">🗑️</button>
                </div>
            `;
            cell.appendChild(div);
        });
        calendarDiv.appendChild(cell);
    }
}

function renderEmployeeTab() {
    const container = document.getElementById("employee-list");
    container.innerHTML = scheduleData.map(item => `
        <div class="employee-schedule-item">
            ${item.employee} → ${item.company} on ${formatDateDisplay(item.date)}
        </div>
    `).join("");
}

function filterEmployeeSchedule() {
    const selectedEmployee = employeeFilterSelect.value;
    const selectedMonth = document.getElementById("month-filter").value; // yyyy-mm

    if (!selectedEmployee) {
        employeeScheduleDisplay.innerHTML = "<p>Select an employee to view their schedule</p>";
        return;
    }

    const employeeSchedules = scheduleData.filter(item => {
        
        const isMatch = item.employee === selectedEmployee;
        const isInMonth = !selectedMonth || item.date.startsWith(selectedMonth);
        return isMatch && isInMonth;
    });

    if (employeeSchedules.length === 0) {
        employeeScheduleDisplay.innerHTML = `<p>No schedules found for ${selectedEmployee}${selectedMonth ? ` in ${selectedMonth}` : ""}</p>`;
        return;
    }

    const groupedByDate = {};
    employeeSchedules.forEach(schedule => {
        if (!groupedByDate[schedule.date]) {
            groupedByDate[schedule.date] = [];
        }
        groupedByDate[schedule.date].push(schedule);
    });

    let html = `<h3>${selectedEmployee}'s Schedule</h3>`;
    html += '<div class="employee-schedule-container">';

    Object.keys(groupedByDate).sort().forEach(date => {
        html += `<div class="schedule-date-group">`;
        html += `<h4>${formatDateDisplay(date)}</h4>`;

        groupedByDate[date].forEach(appointment => {
            html += `<div class="employee-appointment">`;
            html += `<span class="company">${appointment.company}</span>`;
            html += `<span class="client-type">${appointment.type}</span>`;
            html += `</div>`;
        });

        html += `</div>`;
    });

    html += '</div>';
    employeeScheduleDisplay.innerHTML = html;
}

function formatDateDisplay(dateStr) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

function prevMonth() {
    if (currentMonth === 0) currentMonth = 11, currentYear--;
    else currentMonth--;
    renderCalendar();
}

function nextMonth() {
    if (currentMonth === 11) currentMonth = 0, currentYear++;
    else currentMonth++;
    renderCalendar();
}

function showTab(tab) {
    document.getElementById("calendar-tab").classList.toggle("active", tab === "calendar");
    document.getElementById("per-employee-tab").classList.toggle("active", tab === "per-employee");
}

function openEditModal(index) {
    currentEditIndex = index;
    const item = scheduleData[index];
    
    // Create modal if it doesn't exist
    let modal = document.querySelector('.edit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>Edit Appointment</h3>
                <div class="edit-form">
                    <select id="modal-employee">
                        ${Object.keys(employeeInfo).map(emp => 
                            `<option value="${emp}">${emp}</option>`
                        ).join('')}
                    </select>
                    <select id="modal-client-type">
                        <option value="" disabled selected>Select Client Type</option>
                    </select>
                    <input type="text" id="modal-company" placeholder="Company Name">
                    <input type="date" id="modal-date">
                    <div class="modal-buttons">
                        <button onclick="saveEdit()">Save</button>
                        <button onclick="closeEditModal()" class="secondary-btn">Cancel</button>
                        <button onclick="deleteAppointment(currentEditIndex)" class="danger-btn">Delete</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup client type dropdown
        const employeeSelect = modal.querySelector('#modal-employee');
        const clientTypeSelect = modal.querySelector('#modal-client-type');
        
        employeeSelect.addEventListener('change', () => {
            const types = employeeClientMap[employeeSelect.value] || [];
            clientTypeSelect.innerHTML = '<option disabled selected>Select Client Type</option>';
            types.forEach(type => clientTypeSelect.appendChild(new Option(type, type)));
        });
    }
    
    // Populate fields with current data
    modal.querySelector('#modal-employee').value = item.employee;
    modal.querySelector('#modal-company').value = item.company;
    modal.querySelector('#modal-date').value = item.date;
    
    // Populate client types based on current employee info
    const clientTypeSelect = modal.querySelector('#modal-client-type');
    clientTypeSelect.innerHTML = '<option disabled selected>Select Client Type</option>';
    const types = employeeInfo[item.employee]?.clients.split(',') || [];
    types.forEach(type => clientTypeSelect.appendChild(new Option(type.trim(), type.trim())));
    clientTypeSelect.value = item.type;
    
    modal.style.display = 'flex';
}

function closeEditModal() {
    document.querySelector('.edit-modal').style.display = 'none';
}

function saveEdit() {
    const modal = document.querySelector('.edit-modal');
    const employee = modal.querySelector('#modal-employee').value;
    const type = modal.querySelector('#modal-client-type').value;
    const company = modal.querySelector('#modal-company').value.trim();
    const date = modal.querySelector('#modal-date').value;
    
    if (!employee || !type || !company || !date) return alert("Fill in all fields!");
    
    // Update the schedule data
    scheduleData[currentEditIndex] = { employee, type, company, date };
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
    
    closeEditModal();
    renderCalendar();
    renderEmployeeTab();
    filterEmployeeSchedule();
}

function deleteAppointment(index) {
    if (confirm("Are you sure you want to delete this appointment?")) {
        scheduleData.splice(index, 1);
        localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
        closeEditModal();
        renderCalendar();
        renderEmployeeTab();
        filterEmployeeSchedule();
    }
}

// Employee Info Management
let employeeInfo = JSON.parse(localStorage.getItem("employeeInfo")) || {
    Kenneth: { position: "Sales Agent", number: "09171234567", email: "kenneth@email.com", clients: "AAA" },
    Raymond: { position: "Sales Agent", number: "09181112222", email: "raymond@email.com", clients: "Testing Center, Batching Plants, Geotechnical Companies" },
    Aileen: { position: "Sales Agent", number: "09183334444", email: "aileen@email.com", clients: "AAAA, Telecoms, Real Estate" },
    Jinky: { position: "Sales Agent", number: "09189997777", email: "jinky@email.com", clients: "Trading Companies, Manufacturing" },
    Remi: { position: "Sales Agent", number: "09186668888", email: "remi@email.com", clients: "AA, A, B, C, D, E" },
};
document.addEventListener("DOMContentLoaded", () => {
    // Initialize data
    initializeEmployeeClientMap();
    
    // Set up dropdowns - only call this once
    updateEmployeeDropdowns();
    
    // Set up employee select change handler
    employeeSelect.addEventListener("change", function() {
        const types = employeeClientMap[this.value] || [];
        clientTypeSelect.innerHTML = '<option disabled selected>Select Client Type</option>';
        types.forEach(type => clientTypeSelect.add(new Option(type, type)));
    });
    
    // Initialize modal buttons
    document.querySelector('.add-employee-btn')?.addEventListener('click', addNewEmployeeField);
    document.querySelector('.save-employee-btn')?.addEventListener('click', saveAllEmployeeInfo);
    document.querySelector('.close-employee-btn')?.addEventListener('click', closeEmployeeInfoModal);

    // Initial render
    renderCalendar();
    renderEmployeeTab();
});

function initializeEmployeeClientMap() {
    for (const [name, info] of Object.entries(employeeInfo)) {
        employeeClientMap[name] = info.clients.split(',').map(item => item.trim());
    }
}

function updateEmployeeDropdowns() {
    // Clear both dropdowns completely
    employeeSelect.innerHTML = '<option value="" disabled selected>Select Employee</option>';
    employeeFilterSelect.innerHTML = '<option value="" disabled selected>Select Employee to View Schedule</option>';
    
    // Use employeeInfo as the single source of truth
    const employees = Object.keys(employeeInfo);
    
    // Populate both dropdowns
    employees.forEach(emp => {
        employeeSelect.add(new Option(emp, emp));
        employeeFilterSelect.add(new Option(emp, emp));
    });
}

function saveEmployeeInfo() {
    localStorage.setItem("employeeInfo", JSON.stringify(employeeInfo));
    initializeEmployeeClientMap();
    updateEmployeeDropdowns();
}


let employeeInfoModalInitialized = false;

function showEmployeeInfoModal() {
    const modal = document.getElementById("employee-info-modal");
    const container = document.getElementById("employee-info-container");
    
    // Clear existing content except buttons
    container.innerHTML = '';
    
    // Add employee blocks
    Object.entries(employeeInfo).forEach(([name, info]) => {
        const block = document.createElement('div');
        block.className = 'employee-info-block';
        block.dataset.employee = name;
        block.innerHTML = `
            <label>Employee Name</label>
            <input type="text" value="${name}" class="employee-name">
            <label>Position</label>
            <input type="text" value="${info.position}" class="employee-position">
            <label>Contact Number</label>
            <input type="text" value="${info.number}" class="employee-number">
            <label>Email</label>
            <input type="email" value="${info.email}" class="employee-email">
            <label>Client Types (comma separated)</label>
            <input type="text" value="${info.clients}" class="employee-clients">
            <button class="remove-employee-btn" data-employee="${name}">Remove Employee</button>
        `;
        container.appendChild(block);
        
        // Add remove button listener
        block.querySelector('.remove-employee-btn').addEventListener('click', () => {
            removeEmployee(name);
        });
    });

    modal.style.display = "flex";
}


// Update the close function to properly hide the modal
function closeEmployeeInfoModal() {
    document.getElementById("employee-info-modal").style.display = "none";
}

function saveAllEmployeeInfo() {
    const updatedEmployeeInfo = {};
    const nameChanges = {}; // Track oldName -> newName mappings
    
    document.querySelectorAll('.employee-info-block').forEach(block => {
        const oldName = block.dataset.employee;
        const newName = block.querySelector('.employee-name').value.trim();
        const position = block.querySelector('.employee-position').value.trim();
        const number = block.querySelector('.employee-number').value.trim();
        const email = block.querySelector('.employee-email').value.trim();
        const clients = block.querySelector('.employee-clients').value.trim();
        
        if (newName) {
            // Track name changes
            if (oldName && oldName !== newName) {
                nameChanges[oldName] = newName;
            }
            
            updatedEmployeeInfo[newName] = {
                position: position || '',
                number: number || '',
                email: email || '',
                clients: clients || ''
            };
        }
    });
    
    // Update schedule data with new names
    if (Object.keys(nameChanges).length > 0) {
        scheduleData.forEach(appointment => {
            if (nameChanges[appointment.employee]) {
                appointment.employee = nameChanges[appointment.employee];
            }
        });
        localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
    }
    
    employeeInfo = updatedEmployeeInfo;
    saveEmployeeInfo();
    updateEmployeeDropdowns();
    closeEmployeeInfoModal();
    alert("Employee information saved successfully!");
    
    // Refresh all views
    renderCalendar();
    renderEmployeeTab();
    filterEmployeeSchedule();
}

let isAddingEmployee = false;

let currentNewEmployeeId = null;

function addNewEmployeeField() {
    if (isAddingEmployee) {
        alert("Please finish adding the current employee first");
        return;
    }
    
    const container = document.getElementById("employee-info-container");
    currentNewEmployeeId = 'new-employee-' + Date.now();
    isAddingEmployee = true;

    const newBlock = document.createElement('div');
    newBlock.className = 'employee-info-block adding';
    newBlock.dataset.employee = currentNewEmployeeId;
    newBlock.innerHTML = `
        <label>Employee Name</label>
        <input type="text" class="employee-name" placeholder="Enter full name" required>
        
        <label>Position</label>
        <input type="text" class="employee-position" placeholder="Enter position" required>
        
        <label>Contact Number</label>
        <input type="text" class="employee-number" placeholder="Enter contact number" required>
        
        <label>Email</label>
        <input type="email" class="employee-email" placeholder="Enter email" required>
        
        <label>Client Types (comma separated)</label>
        <input type="text" class="employee-clients" placeholder="Enter client types" required>
        
        <div class="new-employee-actions">
            <button class="btn btn-primary confirm-add-btn">Confirm Add</button>
            <button class="btn btn-secondary cancel-add-btn">Cancel</button>
        </div>
    `;
    
    // Insert before the actions container
    const actionsContainer = container.querySelector('.employee-actions');
    container.insertBefore(newBlock, actionsContainer);
    
    // Add event listeners
    newBlock.querySelector('.confirm-add-btn').addEventListener('click', confirmAddEmployee);
    newBlock.querySelector('.cancel-add-btn').addEventListener('click', cancelAddEmployee);
}

function confirmAddEmployee() {
    const block = document.querySelector(`.employee-info-block[data-employee="${currentNewEmployeeId}"]`);
    
    if (!block) {
        console.error("Couldn't find employee block to confirm");
        return;
    }

    const name = block.querySelector('.employee-name').value.trim();
    const position = block.querySelector('.employee-position').value.trim();
    const number = block.querySelector('.employee-number').value.trim();
    const email = block.querySelector('.employee-email').value.trim();
    const clients = block.querySelector('.employee-clients').value.trim();

    // Validate all fields
    if (!name || !position || !number || !email || !clients) {
        alert("Please fill in all required fields");
        return;
    }

    // Check if employee already exists
    if (employeeInfo[name]) {
        alert("An employee with this name already exists");
        return;
    }

    // Add to employeeInfo
    employeeInfo[name] = { 
        position, 
        number, 
        email, 
        clients 
    };

    // Save and refresh
    saveEmployeeInfo();
    currentNewEmployeeId = null;
    isAddingEmployee = false;
    showEmployeeInfoModal(); // Refresh the view
}

function cancelAddEmployee() {
    document.querySelector(`.employee-info-block[data-employee="${currentNewEmployeeId}"]`)?.remove();
    currentNewEmployeeId = null;
    isAddingEmployee = false;
}

// Remove employee
function removeEmployee(employeeId) {
    const employeeName = document.querySelector(`.employee-info-block[data-employee="${employeeId}"] .employee-name`)?.value.trim();
    
    if (employeeName && employeeInfo[employeeName]) {
        if (!confirm(`Are you sure you want to remove ${employeeName}?`)) return;
        delete employeeInfo[employeeName];
    }
    
    document.querySelector(`.employee-info-block[data-employee="${employeeId}"]`)?.remove();
}
function cleanupEmployeeData() {
    // Remove any schedule data for employees that no longer exist
    scheduleData = scheduleData.filter(appointment => 
        employeeInfo.hasOwnProperty(appointment.employee)
    );
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
}

// Open/close modal
function openCompanyModal() {
    document.getElementById("companyModal").style.display = "flex";
    loadCompanyList();
    populateEmployeeDropdown();
}

function closeCompanyModal() {
    document.getElementById("companyModal").style.display = "none";
    document.getElementById("companyForm").reset();
    document.getElementById("editingCompanyIndex").value = "";
    hideCompanyForm();
}

// Form visibility
function showAddCompanyForm() {
    document.getElementById("companyFormContainer").style.display = "block";
    document.getElementById("formTitle").textContent = "Add New Company";
    document.getElementById("companyTable").style.display = "none";
    document.getElementById("companySearch").style.display = "none";
    document.getElementById("cityFilter").style.display = "none";
    document.querySelector(".company-controls .add-btn").style.display = "none";
}

function hideCompanyForm() {
    document.getElementById("companyFormContainer").style.display = "none";
    document.getElementById("companyTable").style.display = "table";
    document.getElementById("companySearch").style.display = "inline-block";
    document.getElementById("cityFilter").style.display = "inline-block";
    document.querySelector(".company-controls .add-btn").style.display = "inline-block";
}

function cancelCompanyForm() {
    hideCompanyForm();
}

// Employee dropdown
function populateEmployeeDropdown() {
    const employeeSelect = document.getElementById("assignedEmployee");
    employeeSelect.innerHTML = "";
    
    const employees = JSON.parse(localStorage.getItem("employees") || []);
    const defaultEmployees = ["Kenneth", "Raymond", "Aileen", "Jinky", "Remi"];
    const options = employees.length > 0 ? employees : defaultEmployees;
    
    options.forEach(emp => {
        const option = document.createElement("option");
        option.value = emp;
        option.textContent = emp;
        employeeSelect.appendChild(option);
    });
}

// Load and display companies
function loadCompanyList() {
    const companies = JSON.parse(localStorage.getItem("companies") || "[]");
    const citySelect = document.getElementById("cityFilter");
    
    // Render table
    document.getElementById("companyTableBody").innerHTML = companies.map((company, index) => `
        <tr>
            <td>${company.city || ''}</td>
            <td>${company.name || ''}</td>
            <td>${company.address || ''}</td>
            <td>${company.contact || ''}</td>
            <td>${company.email || ''}</td>
            <td>${company.assignedTo || ''}</td>
            <td class="actions-cell">
                <button onclick="editCompany(${index})" class="company-btn edit-btn">Edit</button>
                <button onclick="deleteCompany(${index})" class="company-btn delete-btn">Delete</button>
            </td>
        </tr>
    `).join("");

    // Populate city filter
    const uniqueCities = [...new Set(companies.map(c => c.city).filter(Boolean))].sort();
    citySelect.innerHTML = `<option value="">All Cities</option>` + 
        uniqueCities.map(city => `<option value="${city}">${city}</option>`).join("");
}

// Filter companies (combines search and city filter)
function filterCompanies() {
    const searchTerm = document.getElementById("companySearch").value.toLowerCase();
    const selectedCity = document.getElementById("cityFilter").value;
    const companies = JSON.parse(localStorage.getItem("companies") || "[]");
    
    const filtered = companies.filter(company => {
        const matchesCity = !selectedCity || company.city === selectedCity;
        const matchesSearch = !searchTerm || 
            (company.name && company.name.toLowerCase().includes(searchTerm)) ||
            (company.city && company.city.toLowerCase().includes(searchTerm)) ||
            (company.address && company.address.toLowerCase().includes(searchTerm)) ||
            (company.contact && company.contact.toLowerCase().includes(searchTerm)) ||
            (company.email && company.email.toLowerCase().includes(searchTerm));
        
        return matchesCity && matchesSearch;
    });
    
    document.getElementById("companyTableBody").innerHTML = filtered.map((company, index) => `
        <tr>
            <td>${company.city || ''}</td>
            <td>${company.name || ''}</td>
            <td>${company.address || ''}</td>
            <td>${company.contact || ''}</td>
            <td>${company.email || ''}</td>
            <td>${company.assignedTo || ''}</td>
            <td class="actions-cell">
                <button onclick="editCompany(${index})" class="company-btn edit-btn">Edit</button>
                <button onclick="deleteCompany(${index})" class="company-btn delete-btn">Delete</button>
            </td>
        </tr>
    `).join("");
}

// CRUD Operations
function saveCompany(e) {
    e.preventDefault();
    
    const company = {
        city: document.getElementById("companyCity").value,
        name: document.getElementById("companyName").value,
        address: document.getElementById("companyAddress").value,
        contact: document.getElementById("companyContact").value,
        email: document.getElementById("companyEmail").value,
        assignedTo: document.getElementById("assignedEmployee").value
    };

    const companies = JSON.parse(localStorage.getItem("companies") || []);
    const editingIndex = document.getElementById("editingCompanyIndex").value;

    if (editingIndex !== "") {
        companies[editingIndex] = company; // Update
    } else {
        companies.push(company); // Create
    }

    localStorage.setItem("companies", JSON.stringify(companies));
    loadCompanyList();
    hideCompanyForm();
}

function editCompany(index) {
    const companies = JSON.parse(localStorage.getItem("companies") || []);
    const company = companies[index];
    
    document.getElementById("editingCompanyIndex").value = index;
    document.getElementById("companyCity").value = company.city || '';
    document.getElementById("companyName").value = company.name || '';
    document.getElementById("companyAddress").value = company.address || '';
    document.getElementById("companyContact").value = company.contact || '';
    document.getElementById("companyEmail").value = company.email || '';
    document.getElementById("assignedEmployee").value = company.assignedTo || '';
    
    document.getElementById("formTitle").textContent = "Edit Company";
    showAddCompanyForm();
}

function deleteCompany(index) {
    if (confirm("Are you sure you want to delete this company?")) {
        const companies = JSON.parse(localStorage.getItem("companies") || []);
        companies.splice(index, 1);
        localStorage.setItem("companies", JSON.stringify(companies));
        loadCompanyList();
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modal as hidden
    document.getElementById('companyModal').style.display = 'none';
    
    // Load initial data if needed
    if (!localStorage.getItem("companies")) {
        fetch('Companies.json')
            .then(response => response.json())
            .then(data => {
                const normalized = data.map(entry => ({
                    name: entry["Company Name"],
                    city: entry["City"],
                    address: entry["Address"],
                    contact: entry["Phone"],
                    email: entry["Email / Website"],
                    assignedTo: entry["Employee"]
                }));
                localStorage.setItem("companies", JSON.stringify(normalized));
                loadCompanyList();
            })
            .catch(err => console.error("Failed to load companies.json:", err));
    } else {
        loadCompanyList();
    }
    
    // Set up event listeners
    document.getElementById("companySearch").addEventListener("input", filterCompanies);
    document.getElementById("cityFilter").addEventListener("change", filterCompanies);
});

// ======================
// ENHANCED COMPANY MANAGEMENT
// ======================

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set modal to hidden initially
    document.getElementById('companyModal').style.display = 'none';
    
    // Load initial data
    if (!localStorage.getItem("companies")) {
        fetchDefaultCompanies();
    } else {
        loadCompanyList();
    }
    
    // Set up event listeners
    document.getElementById("companySearch").addEventListener("input", filterCompanies);
    document.getElementById("cityFilter").addEventListener("change", filterCompanies);
});

// Modal functions
function openCompanyModal() {
    document.getElementById("companyModal").style.display = "flex";
    loadCompanyList();
    populateEmployeeDropdown();
}

function closeCompanyModal() {
    document.getElementById("companyModal").style.display = "none";
    document.getElementById("companyForm").reset();
    document.getElementById("editingCompanyIndex").value = "";
    hideCompanyForm();
}

function showAddCompanyForm() {
    // Clear any previous edit data
    document.getElementById("editingCompanyIndex").value = "";
    document.getElementById("companyForm").reset();
    
    document.getElementById("formTitle").textContent = "Add New Company";
    document.getElementById("companyFormContainer").style.display = "block";
    document.getElementById("companyTable").style.display = "none";
    populateEmployeeDropdown(); // Refresh dropdown
}

function hideCompanyForm() {
    document.getElementById("companyFormContainer").style.display = "none";
    document.getElementById("companyTable").style.display = "table";
    document.getElementById("companySearch").style.display = "inline-block";
    document.getElementById("cityFilter").style.display = "inline-block";
    document.querySelector(".company-controls .add-btn").style.display = "inline-block";
}

// Employee dropdown - FIXED VERSION
function populateEmployeeDropdown() {
    const employeeSelect = document.getElementById("assignedEmployee");
    employeeSelect.innerHTML = '<option value="" disabled selected>Select Employee</option>';
    
    // Get employees from localStorage or use defaults
    const employees = JSON.parse(localStorage.getItem("employees")) || 
                     ["Kenneth", "Raymond", "Aileen", "Jinky", "Remi"];
    
    employees.forEach(emp => {
        const option = document.createElement("option");
        option.value = emp;
        option.textContent = emp;
        employeeSelect.appendChild(option);
    });
    
    // Set selected value if editing
    const editingIndex = document.getElementById("editingCompanyIndex").value;
    if (editingIndex !== "") {
        const companies = JSON.parse(localStorage.getItem("companies") || "[]");
        const company = companies[editingIndex];
        if (company && company.assignedTo) {
            employeeSelect.value = company.assignedTo;
        }
    }
}

// Company data functions
function loadCompanyList() {
    const companies = JSON.parse(localStorage.getItem("companies") || "[]");
    renderCompanyTable(companies);
    populateCityFilter();
}

function populateCityFilter() {
    const companies = JSON.parse(localStorage.getItem("companies") || "[]");
    const citySelect = document.getElementById("cityFilter");
    
    const uniqueCities = [...new Set(companies.map(c => c.city).filter(Boolean))].sort();
    citySelect.innerHTML = '<option value="">All Cities</option>' + 
        uniqueCities.map(city => `<option value="${city}">${city}</option>`).join('');
}

function filterCompanies() {
    const searchTerm = document.getElementById("companySearch").value.toLowerCase();
    const selectedCity = document.getElementById("cityFilter").value;
    const companies = JSON.parse(localStorage.getItem("companies") || []);
    
    const filtered = companies.map((company, originalIndex) => ({
        ...company,
        originalIndex  // Store original index with each company
    })).filter(company => {
        const cityMatch = !selectedCity || company.city === selectedCity;
        const nameMatch = !searchTerm || 
            (company.name && company.name.toLowerCase().includes(searchTerm));
        
        return cityMatch && nameMatch;
    });
    
    renderCompanyTable(filtered);
}

function renderCompanyTable(companies) {
    const tbody = document.getElementById("companyTableBody");
    tbody.innerHTML = '';
    
    if (companies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-results">No companies found</td></tr>';
        return;
    }
    
    companies.forEach((company) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${company.city || ''}</td>
            <td>${company.name || ''}</td>
            <td>${company.address || ''}</td>
            <td>${company.contact || ''}</td>
            <td>${company.email || ''}</td>
            <td>${company.assignedTo || ''}</td>
            <td class="actions-cell">
                <button onclick="editCompany(${company.originalIndex})" class="company-btn edit-btn">Edit</button>
                <button onclick="deleteCompany(${company.originalIndex})" class="company-btn delete-btn">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// CRUD Operations
function saveCompany(e) {
    e.preventDefault();
    
    const company = {
        city: document.getElementById("companyCity").value,
        name: document.getElementById("companyName").value,
        address: document.getElementById("companyAddress").value,
        contact: document.getElementById("companyContact").value,
        email: document.getElementById("companyEmail").value,
        assignedTo: document.getElementById("assignedEmployee").value
    };

    const companies = JSON.parse(localStorage.getItem("companies") || []);
    const editingIndex = document.getElementById("editingCompanyIndex").value;

    if (editingIndex !== "") {
        companies[editingIndex] = company;
    } else {
        companies.push(company);
    }

    localStorage.setItem("companies", JSON.stringify(companies));
    loadCompanyList();
    hideCompanyForm();
}

function editCompany(index) {
    const companies = JSON.parse(localStorage.getItem("companies") || []);
    const company = companies[index];
    
    // Store the index we're editing
    document.getElementById("editingCompanyIndex").value = index;
    
    // Fill the form
    document.getElementById("companyCity").value = company.city || '';
    document.getElementById("companyName").value = company.name || '';
    document.getElementById("companyAddress").value = company.address || '';
    document.getElementById("companyContact").value = company.contact || '';
    document.getElementById("companyEmail").value = company.email || '';
    
    document.getElementById("formTitle").textContent = "Edit Company";
    document.getElementById("companyFormContainer").style.display = "block";
    document.getElementById("companyTable").style.display = "none";
    
    // Set dropdown value after slight delay
    setTimeout(() => {
        document.getElementById("assignedEmployee").value = company.assignedTo || '';
    }, 50);
}

function deleteCompany(index) {
    if (confirm("Are you sure you want to delete this company?")) {
        const companies = JSON.parse(localStorage.getItem("companies") || []);
        companies.splice(index, 1);
        localStorage.setItem("companies", JSON.stringify(companies));
        loadCompanyList();
    }
}

// Helper function to load default data
function fetchDefaultCompanies() {
    fetch('Companies.json')
        .then(response => response.json())
        .then(data => {
            const normalized = data.map(entry => ({
                name: entry["Company Name"] || '',
                city: entry["City"] || '',
                address: entry["Address"] || '',
                contact: entry["Phone"] || '',
                email: entry["Email / Website"] || '',
                assignedTo: entry["Employee"] || ''
            }));
            localStorage.setItem("companies", JSON.stringify(normalized));
            loadCompanyList();
        })
        .catch(err => {
            console.error("Failed to load companies.json:", err);
            // Initialize with empty array if fetch fails
            localStorage.setItem("companies", JSON.stringify([]));
            loadCompanyList();
        });
}
function populateReportEmployeeOptions() {
    const employeeSelect = document.getElementById("reportEmployeeSelect");
    employeeSelect.innerHTML = '<option value="" disabled selected>Select Employee</option>';
  
    // Get employees from employeeInfo object
    const employees = Object.keys(employeeInfo);
    
    if (employees.length === 0) {
        // Fallback to default if empty
        employees = ["Kenneth", "Raymond", "Aileen", "Jinky", "Remi"];
    }
  
    employees.forEach(empName => {
        const option = document.createElement("option");
        option.value = empName;
        option.textContent = empName;
        employeeSelect.appendChild(option);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Button to open modal
    document.getElementById("openReportBtn").addEventListener("click", openReportModal);
    // Button to close modal
    document.getElementById("closeReportBtn").addEventListener("click", closeReportModal);
  });
  
  
  function openReportModal() {
    const modal = document.getElementById('reportModal');
    const select = document.getElementById('reportEmployeeSelect');
    select.innerHTML = '<option value="" disabled selected>-- Select Employee --</option>';

    // Get employees from employeeInfo object
    const employees = Object.keys(employeeInfo);
    if (employees.length === 0) {
        // Fallback to default list if empty
        employees = ["Kenneth", "Raymond", "Aileen", "Jinky", "Remi"];
    }

    employees.forEach(empName => {
        const opt = document.createElement('option');
        opt.value = empName;
        opt.textContent = empName;
        select.appendChild(opt);
    });

    // Set default start date to Monday of current week
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    document.getElementById('reportStartDate').valueAsDate = monday;

    modal.style.display = 'block';
}
  
  function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
  }
  
  async function generateWeeklyReport() {
    const select = document.getElementById('reportEmployeeSelect');
    const startDateInput = document.getElementById('reportStartDate');
    const reportDiv = document.getElementById('reportContent');
    const employeeName = select.value;
    const startDate = new Date(startDateInput.value);
    
    if (!employeeName) {
        reportDiv.innerHTML = '<p>Please select an employee.</p>';
        return;
    }
    
    if (!startDateInput.value) {
        reportDiv.innerHTML = '<p>Please select a start date.</p>';
        return;
    }

    // Calculate end of week (6 days after start)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || [];
    
    // Filter schedules for selected employee within date range
    const employeeSchedules = scheduleData.filter(sch => {
        if (sch.employee !== employeeName) return false;
        
        const scheduleDate = new Date(sch.date);
        return scheduleDate >= startDate && scheduleDate <= endDate;
    });

    if (employeeSchedules.length === 0) {
        reportDiv.innerHTML = `<p>No schedules found for ${employeeName} between ${formatDate(startDate)} and ${formatDate(endDate)}</p>`;
        return;
    }

    // Get companies from localStorage instead of companies.json
    const companies = JSON.parse(localStorage.getItem("companies")) || [];
  
    // Build HTML report
    let html = `<h3>Weekly Report for ${employeeName}</h3>`;
    html += `<p>Week of ${formatDate(startDate)} to ${formatDate(endDate)}</p>`;
    html += '<table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">';
    html += `
      <thead>
        <tr>
          <th>Date</th>
          <th>Company Name</th>
          <th>Client Type</th>
          <th>City</th>
          <th>Address</th>
          <th>Phone</th>
          <th>Email / Website</th>
        </tr>
      </thead>
      <tbody>
    `;
  
    employeeSchedules.forEach(sch => {
        // Find matching company in localStorage data
        const companyInfo = companies.find(c => 
            c.name?.toLowerCase() === sch.company.toLowerCase()
        ) || {};
    
        html += `
            <tr>
                <td>${formatDate(new Date(sch.date))}</td>
                <td>${sch.company}</td>
                <td>${sch.type}</td>
                <td>${companyInfo.city || '-'}</td>
                <td>${companyInfo.address || '-'}</td>
                <td>${companyInfo.contact || '-'}</td>
                <td>${companyInfo.email || '-'}</td>
            </tr>
        `;
    });
  
    html += '</tbody></table>';
    reportDiv.innerHTML = html;
}

// Helper function to format dates
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}
  
  function downloadReportAsDoc() {
    const content = document.getElementById('reportContent').innerHTML;
    const header = "<html><head><meta charset='utf-8'><title>Weekly Report</title></head><body>";
    const footer = "</body></html>";
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Weekly_Report.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
