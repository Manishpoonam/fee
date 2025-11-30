import React from 'react';
import { PaymentRecord } from '../types';
import { Download, CheckCircle2, XCircle } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';

interface Props {
  history: PaymentRecord[];
}

const TransactionHistory: React.FC<Props> = ({ history }) => {
  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-800">Fee Clearance History (Google Sheet View)</h3>
        <button 
            onClick={() => sheetsService.exportToCSV(history)}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
            <Download size={16} className="mr-1" /> Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-sm text-left min-w-[500px]">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0">
            <tr>
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Student Name</th>
              <th className="py-2 px-4 text-right">Amount (₹)</th>
              <th className="py-2 px-4">Method</th>
              <th className="py-2 px-4 text-center">Sheet Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedHistory.length === 0 ? (
                <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                        No fees cleared yet.
                    </td>
                </tr>
            ) : (
                sortedHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-900 whitespace-nowrap">{record.date}</td>
                    <td className="py-2 px-4 font-medium whitespace-nowrap">{record.studentName}</td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">₹{record.amount}</td>
                    <td className="py-2 px-4 text-xs text-gray-500 bg-gray-50 rounded whitespace-nowrap">
                        {record.method === 'AI_AUTO' ? 'AI Auto' : 'Manual'}
                    </td>
                    <td className="py-2 px-4 text-center">
                        {record.syncedToSheet ? (
                            <CheckCircle2 size={16} className="mx-auto text-green-500" />
                        ) : (
                            <div className="flex items-center justify-center text-gray-400" title="Not connected to real sheet">
                                <span className="w-2 h-2 rounded-full bg-gray-300 mr-1"></span> Local
                            </div>
                        )}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;