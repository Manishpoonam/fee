import React from 'react';
import { Student, PaymentStatus } from '../types';
import { Edit2, CheckCircle, XCircle, Clock, AlertCircle, Calendar, ChevronRight } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onSelect: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onSelect }) => {
  
  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-green-100 text-green-800 border-green-200';
      case PaymentStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PaymentStatus.OVERDUE: return 'bg-red-100 text-red-800 border-red-200';
      case PaymentStatus.EXEMPT: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-50';
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return <CheckCircle size={16} className="mr-1" />;
      case PaymentStatus.PENDING: return <Clock size={16} className="mr-1" />;
      case PaymentStatus.OVERDUE: return <AlertCircle size={16} className="mr-1" />;
      case PaymentStatus.EXEMPT: return <XCircle size={16} className="mr-1" />;
    }
  };

  const calculateNextDue = (student: Student) => {
    if (student.status === PaymentStatus.PAID) {
        const today = new Date();
        const joinDate = new Date(student.joiningDate);
        let dueDate = new Date(today.getFullYear(), today.getMonth(), joinDate.getDate());
        
        if (today > dueDate) {
             dueDate.setMonth(dueDate.getMonth() + 1);
        }
        return dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } else {
        const today = new Date();
        const joinDate = new Date(student.joiningDate);
        let dueDate = new Date(today.getFullYear(), today.getMonth(), joinDate.getDate());
        
        return dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <div>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {students.map((student) => (
          <div 
            key={student.id} 
            onClick={() => onSelect(student)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 active:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-gray-900">{student.name}</h3>
                    <p className="text-xs text-gray-500">Parent: {student.parentName}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(student.status)}`}>
                    {getStatusIcon(student.status)}
                    {student.status}
                </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-xs text-gray-400 block">Next Due</span>
                    <div className="font-medium flex items-center gap-1">
                        <Calendar size={12} />
                        {calculateNextDue(student)}
                    </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-xs text-gray-400 block">Monthly Fee</span>
                    <div className="font-medium">₹{student.monthlyFee}</div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                    Paid: {formatDate(student.lastPaymentDate)}
                </div>
                <div className="text-indigo-600 text-xs font-medium flex items-center">
                    Edit Details <ChevronRight size={14} className="ml-1"/>
                </div>
            </div>
          </div>
        ))}
        {students.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed">
                No students found.
            </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4">Last Paid</th>
                <th className="py-3 px-4 text-right">Fee (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onSelect(student)}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">Par: {student.parentName}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-medium">
                     <div className="flex items-center text-indigo-600">
                        <Calendar size={14} className="mr-1" />
                        {calculateNextDue(student)}
                     </div>
                     <div className="text-xs text-gray-400 mt-0.5">Joined: {new Date(student.joiningDate).getDate()}th</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                     {formatDate(student.lastPaymentDate)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    ₹{student.monthlyFee}
                  </td>
                  <td className="py-3 px-4 flex justify-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(student.status)}`}>
                      {getStatusIcon(student.status)}
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          onSelect(student);
                      }}
                      className="text-gray-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No students found. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;