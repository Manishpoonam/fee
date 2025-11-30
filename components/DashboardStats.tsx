import React from 'react';
import { Student, PaymentStatus } from '../types';
import { IndianRupee, Users, AlertTriangle, CheckSquare } from 'lucide-react';

interface Props {
  students: Student[];
}

const DashboardStats: React.FC<Props> = ({ students }) => {
  const totalRevenue = students.reduce((acc, curr) => acc + curr.monthlyFee, 0);
  const collectedRevenue = students
    .filter(s => s.status === PaymentStatus.PAID)
    .reduce((acc, curr) => acc + curr.monthlyFee, 0);
  
  const pendingCount = students.filter(s => s.status === PaymentStatus.PENDING || s.status === PaymentStatus.OVERDUE).length;
  const paidCount = students.filter(s => s.status === PaymentStatus.PAID).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Expected</p>
            <p className="text-xl font-bold text-gray-900">₹{totalRevenue}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
            <IndianRupee size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Collected</p>
            <p className="text-xl font-bold text-green-600">₹{collectedRevenue}</p>
          </div>
          <div className="bg-green-50 p-2 rounded-lg text-green-600">
            <CheckSquare size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Pending/Due</p>
            <p className="text-xl font-bold text-orange-600">{pendingCount}</p>
          </div>
          <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Active Students</p>
            <p className="text-xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg text-gray-600">
            <Users size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;