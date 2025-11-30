import React, { useState, useEffect, useCallback } from 'react';
import { Student, PaymentStatus, GeneratedMessage, PaymentRecord, SheetConfig } from './types';
import StudentList from './components/StudentList';
import DashboardStats from './components/DashboardStats';
import CommandCenter from './components/CommandCenter';
import StudentDetailsModal from './components/StudentDetailsModal';
import TransactionHistory from './components/TransactionHistory';
import SettingsPanel from './components/SettingsPanel';
import { parseCommand, generateWhatsAppMessage } from './services/geminiService';
import { sheetsService } from './services/sheetsService';
import { MessageCircle, Settings, Plus, Send, LayoutDashboard, SkipForward, X, RefreshCw, Menu } from 'lucide-react';

// Mock Data (only used on very first load if no local storage)
const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Anshu',
    parentName: 'Mr. Sharma',
    parentPhone: '919876543210',
    joiningDate: '2024-06-15',
    monthlyFee: 2000,
    status: PaymentStatus.PENDING,
  },
  {
    id: '2',
    name: 'Aman',
    parentName: 'Mrs. Verma',
    parentPhone: '919876543211',
    joiningDate: '2024-01-05',
    monthlyFee: 1500,
    status: PaymentStatus.PAID,
    lastPaymentDate: '2024-07-05'
  },
  {
    id: '3',
    name: 'Riya',
    parentName: 'Mr. Singh',
    parentPhone: '919876543212',
    joiningDate: '2024-03-20',
    monthlyFee: 2500,
    status: PaymentStatus.EXEMPT, // Crossmark
  }
];

const App: React.FC = () => {
  // Load initial state from local storage or fall back to defaults
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('tf_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('tf_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = localStorage.getItem('tf_sheet_config');
    return saved ? JSON.parse(saved) : { clientId: '', spreadsheetId: '', isConnected: false };
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState<GeneratedMessage | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [reminderQueue, setReminderQueue] = useState<Student[]>([]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('tf_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('tf_history', JSON.stringify(paymentHistory));
  }, [paymentHistory]);

  useEffect(() => {
    localStorage.setItem('tf_sheet_config', JSON.stringify(sheetConfig));
  }, [sheetConfig]);


  // --- Auto-Status Logic ---
  
  const calculateAutoStatus = (student: Student): PaymentStatus => {
    if (student.status === PaymentStatus.EXEMPT) return PaymentStatus.EXEMPT;

    const today = new Date();
    const joinDate = new Date(student.joiningDate);
    today.setHours(0, 0, 0, 0);
    
    // Identify current cycle start
    let cycleStartDate = new Date(today.getFullYear(), today.getMonth(), joinDate.getDate());
    
    // If today is before this month's joining date, the current cycle started last month
    if (today.getDate() < joinDate.getDate()) {
        cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
    }
    cycleStartDate.setHours(0, 0, 0, 0);

    // If payment was made AFTER the cycle start date, it is PAID
    if (student.lastPaymentDate) {
        const lastPay = new Date(student.lastPaymentDate);
        lastPay.setHours(0, 0, 0, 0);
        if (lastPay >= cycleStartDate) {
            return PaymentStatus.PAID;
        }
    }

    // If not paid, check grace period
    const diffTime = Math.abs(today.getTime() - cycleStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays > 7) {
        return PaymentStatus.OVERDUE;
    } else {
        return PaymentStatus.PENDING;
    }
  };

  const refreshStatuses = useCallback(() => {
    setStudents(currentStudents => 
        currentStudents.map(student => ({
            ...student,
            status: calculateAutoStatus(student)
        }))
    );
  }, []);

  // Run auto-status on mount
  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);


  // --- Transaction Logic ---

  const logTransaction = async (student: Student, method: 'MANUAL' | 'AI_AUTO') => {
    const record: PaymentRecord = {
        id: Date.now().toString(),
        studentId: student.id,
        studentName: student.name,
        amount: student.monthlyFee,
        date: new Date().toISOString().split('T')[0],
        method: method,
        syncedToSheet: false
    };

    let synced = false;
    // Attempt sync if configured
    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
        // Init service if needed (might need re-init on refresh)
        if (!sheetsService.gapiInited) {
             await new Promise<void>(resolve => sheetsService.init(sheetConfig.clientId, () => resolve()));
        }
        synced = await sheetsService.appendRow(sheetConfig, record);
    }

    setPaymentHistory(prev => [{ ...record, syncedToSheet: synced }, ...prev]);
  };

  const generateAndSetMessage = async (student: Student) => {
    setIsProcessing(true);
    try {
        const actionType = student.status === PaymentStatus.OVERDUE ? 'OVERDUE' : 'REMINDER';
        const msg = await generateWhatsAppMessage(student, actionType);
        setGeneratedMsg({
            studentId: student.id,
            text: msg,
            targetPhone: student.parentPhone,
            type: actionType
        });
    } catch (e) {
        console.error("Error generating message", e);
        alert(`Failed to generate message for ${student.name}`);
        if (reminderQueue.length > 0) {
            handleNextInQueue();
        } else {
            setGeneratedMsg(null);
        }
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCommand = async (text: string) => {
    setIsProcessing(true);
    setGeneratedMsg(null);
    setReminderQueue([]); 

    try {
      if (text.toLowerCase().includes("remind") || text.toLowerCase().includes("reminder")) {
        const pendingStudents = students.filter(s => s.status === PaymentStatus.PENDING || s.status === PaymentStatus.OVERDUE);
        if (pendingStudents.length > 0) {
            setReminderQueue(pendingStudents);
            await generateAndSetMessage(pendingStudents[0]);
        } else {
            alert("Great news! No pending or overdue payments found.");
            setIsProcessing(false);
        }
      } else {
        const result = await parseCommand(text, students);
        
        if (result.found && result.studentName) {
          const studentIndex = students.findIndex(s => s.name === result.studentName);
          if (studentIndex !== -1) {
            const updatedStudents = [...students];
            const student = updatedStudents[studentIndex];
            const oldStatus = student.status;
            
            if (result.newStatus) {
                student.status = result.newStatus as PaymentStatus;
                if (result.newStatus === PaymentStatus.PAID) {
                    student.lastPaymentDate = new Date().toISOString().split('T')[0];
                }
            }
            setStudents(updatedStudents);

            if (oldStatus !== PaymentStatus.PAID && student.status === PaymentStatus.PAID) {
                logTransaction(student, 'AI_AUTO');
            }

            if (student.status !== PaymentStatus.EXEMPT) {
                await generateAndSetMessage(student);
            }
          }
        }
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Failed to process command. Check API Key.");
      setIsProcessing(false);
    }
  };

  const handleManualSelect = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleAddNewStudent = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newStudent: Student = {
        id: Date.now().toString(),
        name: '',
        parentName: '',
        parentPhone: '',
        joiningDate: todayStr,
        monthlyFee: 0,
        status: PaymentStatus.PENDING,
        notes: ''
    };
    setSelectedStudent(newStudent);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => {
        const index = prev.findIndex(s => s.id === updatedStudent.id);
        const processedStudent = {
            ...updatedStudent,
            status: updatedStudent.status === PaymentStatus.EXEMPT ? PaymentStatus.EXEMPT : calculateAutoStatus(updatedStudent)
        };
        
        if (updatedStudent.status === PaymentStatus.PAID && !updatedStudent.lastPaymentDate) {
             processedStudent.lastPaymentDate = new Date().toISOString().split('T')[0];
             processedStudent.status = PaymentStatus.PAID;
        }

        if (index !== -1) {
            return prev.map(s => {
                if (s.id === updatedStudent.id) {
                    const original = s;
                    if (original.status !== PaymentStatus.PAID && processedStudent.status === PaymentStatus.PAID) {
                        logTransaction(processedStudent, 'MANUAL');
                    }
                    return processedStudent;
                }
                return s;
            });
        } else {
            return [...prev, processedStudent];
        }
    });
    setSelectedStudent(null);
  };

  const handleGenerateMessageFromModal = async (student: Student) => {
    setSelectedStudent(null);
    setReminderQueue([]); 
    await generateAndSetMessage(student);
  };

  const handleNextInQueue = () => {
      if (reminderQueue.length > 0) {
          const nextQueue = reminderQueue.slice(1);
          setReminderQueue(nextQueue);
          if (nextQueue.length > 0) {
              generateAndSetMessage(nextQueue[0]);
          } else {
              setGeneratedMsg(null);
          }
      } else {
          setGeneratedMsg(null);
      }
  };

  const sendWhatsApp = () => {
    if (!generatedMsg) return;
    const encodedText = encodeURIComponent(generatedMsg.text);
    window.open(`https://wa.me/${generatedMsg.targetPhone}?text=${encodedText}`, '_blank');
    handleNextInQueue();
  };

  const handleSkip = () => {
    handleNextInQueue();
  };

  const handleCancelPreview = () => {
    setGeneratedMsg(null);
    setReminderQueue([]); 
  };

  const handleSaveSettings = (config: SheetConfig) => {
    setSheetConfig(config);
    // If saving disconnected state, we stay on settings, else maybe go to dashboard?
    // User can navigate manually.
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row max-w-7xl mx-auto">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen overflow-y-auto z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
             <div className="bg-indigo-600 text-white p-1 rounded">TF</div>
             TuitionFlow
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="mr-3" size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings className="mr-3" size={18} />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
            <button 
                onClick={handleAddNewStudent}
                className="flex items-center justify-center w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
                <Plus size={16} className="mr-1" /> Add Student
            </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
             <div className="bg-indigo-600 text-white text-xs p-1 rounded">TF</div>
             TuitionFlow
         </div>
         {activeTab === 'dashboard' && (
             <button 
                onClick={refreshStatuses}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                title="Refresh Status"
             >
                 <RefreshCw size={20} />
             </button>
         )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-20 md:mb-0">
        
        {/* Desktop Header */}
        <header className="hidden md:flex mb-8 justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'dashboard' ? 'Fee Clearance Dashboard' : 'Settings & Integrations'}
                </h1>
                {activeTab === 'dashboard' && (
                    <button 
                        onClick={refreshStatuses} 
                        className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
                        title="Refresh Statuses based on Date"
                    >
                        <RefreshCw size={18} />
                    </button>
                )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
                {activeTab === 'dashboard' 
                    ? `Automated tracking for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}` 
                    : 'Configure Google Sheets and application preferences'}
            </p>
          </div>
          <div>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium">
                AI Agent Active
            </span>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
            <>
                <CommandCenter onCommand={handleCommand} isProcessing={isProcessing} />
                <DashboardStats students={students} />
                <div className="mt-8 space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 px-1">Student Registry</h3>
                        <StudentList students={students} onSelect={handleManualSelect} />
                    </div>
                    <TransactionHistory history={paymentHistory} />
                </div>
            </>
        ) : (
            <SettingsPanel config={sheetConfig} onSave={handleSaveSettings} />
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex justify-around items-end pb-4 pt-2 shadow-lg">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
              <LayoutDashboard size={24} className="mb-1" />
              Dashboard
          </button>

          <button 
             onClick={handleAddNewStudent}
             className="flex flex-col items-center justify-center -mt-8"
          >
              <div className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 hover:scale-105 transition-transform">
                <Plus size={24} />
              </div>
              <span className="text-xs font-medium text-indigo-600 mt-1">Add</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'settings' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
              <Settings size={24} className="mb-1" />
              Settings
          </button>
      </div>

      {/* Student Details Modal */}
      <StudentDetailsModal 
        student={selectedStudent} 
        isOpen={!!selectedStudent} 
        onClose={() => setSelectedStudent(null)}
        onSave={handleUpdateStudent}
        onGenerateMessage={handleGenerateMessageFromModal}
      />

      {/* Message Preview Modal */}
      {generatedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className={`p-4 flex justify-between items-center text-white ${reminderQueue.length > 0 ? 'bg-indigo-600' : 'bg-green-600'}`}>
                <div className="font-semibold flex items-center">
                    <MessageCircle className="mr-2" size={20} />
                    {reminderQueue.length > 0 ? `Batch: ${reminderQueue.length} Remaining` : 'WhatsApp Preview'}
                </div>
                <button onClick={handleCancelPreview} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="p-6 bg-gray-50">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">
                    {generatedMsg.text}
                </div>
                
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>To: {generatedMsg.targetPhone}</span>
                    {reminderQueue.length > 0 && <span className="text-indigo-600 font-medium">Next: {reminderQueue.length > 1 ? reminderQueue[1].name : 'Done'}</span>}
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                {reminderQueue.length > 0 && (
                    <button 
                        onClick={handleSkip}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center transition-colors"
                    >
                        <SkipForward className="mr-2" size={18} />
                        Skip
                    </button>
                )}
                <button 
                    onClick={sendWhatsApp}
                    className={`flex-[2] text-white font-medium py-3 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-md ${reminderQueue.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-green-500 hover:bg-green-600 shadow-green-200'}`}
                >
                    <Send className="mr-2" size={18} />
                    {reminderQueue.length > 0 ? 'Send & Next' : 'Send Message'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;