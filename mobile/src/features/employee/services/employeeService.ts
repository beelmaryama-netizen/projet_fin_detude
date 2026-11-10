import { apiMode } from '../../../services/api/config';
import { apiEmployeeService } from './apiEmployeeService';
import { createMockEmployeeService } from './mockEmployeeService';
// Replace this adapter with the Express API when integration is authorized.
const demoService = createMockEmployeeService();
export const employeeService = apiMode ? { ...demoService, ...apiEmployeeService } : demoService;
