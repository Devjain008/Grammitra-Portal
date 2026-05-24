import Employee from '../models/Employee.js';

// @desc    Get all employees for the business owner and calculate payroll
// @route   GET /api/employees
// @access  Private
export const getEmployees = async (req, res) => {
  try {
    const query = { businessOwnerId: req.user._id };
    if (req.query.businessId) {
      query.businessId = req.query.businessId;
    }
    const employees = await Employee.find(query)
      .populate('userId', 'fullName mobile village location')
      .sort({ joinedAt: -1 });
    
    // Calculate total salary (payroll) for active employees
    const totalSalary = employees
      .filter(emp => emp.status === 'active')
      .reduce((sum, emp) => sum + emp.salary, 0);

    res.status(200).json({
      employees,
      totalSalary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new employee manually
// @route   POST /api/employees
// @access  Private
export const addEmployee = async (req, res) => {
  try {
    const { name, mobile, role, salary, salaryType } = req.body;
    
    if (!name || !role || salary === undefined) {
      return res.status(400).json({ message: 'Please provide name, role, and salary' });
    }

    const employee = new Employee({
      businessOwnerId: req.user._id,
      businessId: req.body.businessId || undefined,
      name,
      mobile,
      role,
      salary,
      salaryType: salaryType || 'monthly'
    });

    const createdEmployee = await employee.save();
    res.status(201).json(createdEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update employee details (salary, role, status)
// @route   PUT /api/employees/:id
// @access  Private
export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      businessOwnerId: req.user._id
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found or unauthorized' });
    }

    const { salary, role, status, salaryType } = req.body;
    if (salary !== undefined) employee.salary = salary;
    if (role !== undefined) employee.role = role;
    if (status !== undefined) employee.status = status;
    if (salaryType !== undefined) employee.salaryType = salaryType;

    const updatedEmployee = await employee.save();
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove/fire an employee
// @route   DELETE /api/employees/:id
// @access  Private
export const deleteEmployee = async (req, res) => {
  try {
    const result = await Employee.deleteOne({
      _id: req.params.id,
      businessOwnerId: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Employee not found or unauthorized' });
    }

    res.status(200).json({ message: 'Employee removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
