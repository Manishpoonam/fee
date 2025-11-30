import React, { useState, useEffect } from 'react';
import { Student, PaymentStatus } from '../types';
import { X, Save, MessageCircle, DollarSign, Calendar, User, Phone, FileText, History } from 'lucide-react';

interface StudentDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStudent: Student) => void;
  onGenerateMessage: (student: Student) => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
  onGenerateMessage
}) => {
  const [formData, setFormData] = useState<Student | null>(null);

  useEffect(() => {
    setFormData(student);
  }, [student]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof Student, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) onSave(formData);
  };

  const isNewStudent = !student?.name && student?.monthlyFee === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl md:max-w-lg shadow-xl overflow-hidden flex flex-col max-h-none md:max-h-[90vh]">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            {isNewStudent ? 'Add New Student' : 'Edit Student Details'}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Anshu"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Parent Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
              <input
                type="text"
                required
                value={formData.parentName}
                onChange={(e) => handleChange('parentName', e.target.value)}
                placeholder="Mr. Sharma"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (No +)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={formData.parentPhone}
                  onChange={(e) => handleChange('parentPhone', e.target.value)}
                  placeholder="919876543210"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Fee & Join Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  required
                  value={formData.monthlyFee}
                  onChange={(e) => handleChange('monthlyFee', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => handleChange('joiningDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>
          
           {/* Last Payment Date */}
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Payment Date</label>
              <div className="relative">
                <History className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={formData.lastPaymentDate || ''}
                  onChange={(e) => handleChange('lastPaymentDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave empty if never paid.</p>
            </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as PaymentStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Any special arrangements or observations..."
                />
            </div>
          </div>

          {/* Spacer for bottom nav on mobile */}
          <div className="h-20 md:h-0"></div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex items-center gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={() => onGenerateMessage(formData)}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-green-700 px-4 py-3 rounded-xl hover:bg-green-50 transition-colors font-medium shadow-sm"
            >
              <MessageCircle size={18} />
              <span className="text-sm">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-md shadow-indigo-200"
            >
              <Save size={18} />
              <span className="text-sm">{isNewStudent ? 'Save Student' : 'Save Changes'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;