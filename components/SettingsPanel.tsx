import React, { useState, useEffect } from 'react';
import { SheetConfig } from '../types';
import { Sheet, Save, CheckCircle2, AlertCircle, Copy, ArrowRight, ExternalLink, Globe, HelpCircle } from 'lucide-react';
import { sheetsService } from '../services/sheetsService';

interface Props {
  config: SheetConfig;
  onSave: (config: SheetConfig) => void;
}

const SettingsPanel: React.FC<Props> = ({ config, onSave }) => {
  const [formData, setFormData] = useState(config);
  const [step, setStep] = useState(1);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    // Get the current URL of the app to show the user
    setCurrentOrigin(window.location.origin);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    setShowTroubleshoot(false);

    const cleanClientId = formData.clientId.trim();
    const cleanSheetId = formData.spreadsheetId.trim();

    // Update state with trimmed values
    setFormData(prev => ({ ...prev, clientId: cleanClientId, spreadsheetId: cleanSheetId }));

    try {
        await sheetsService.init(cleanClientId, (success) => {
            if (success) {
                sheetsService.signIn().then(() => {
                    const newConfig = { 
                        ...formData, 
                        clientId: cleanClientId, 
                        spreadsheetId: cleanSheetId, 
                        isConnected: true 
                    };
                    setFormData(newConfig);
                    onSave(newConfig);
                }).catch((e: any) => {
                    console.error(e);
                    setErrorMsg("Connection failed. Google rejected the request.");
                    setShowTroubleshoot(true);
                });
            } else {
                setErrorMsg("Failed to initialize Google API. Please check if the Client ID is correct.");
                setShowTroubleshoot(true);
            }
        });
    } catch (e) {
        setErrorMsg("Unexpected error occurred.");
        setShowTroubleshoot(true);
    } finally {
        setIsConnecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied URL to clipboard!');
  };

  const renderTroubleshoot = () => (
    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 animate-fade-in text-left">
        <h4 className="text-red-800 font-bold flex items-center mb-2">
            <AlertCircle size={18} className="mr-2" />
            Fixing "Error 400: invalid_request"
        </h4>
        <p className="text-sm text-red-700 mb-3">
            This error means <strong>Google Cloud does not recognize this website</strong>. You must add the exact URL below to your Allowed Origins list.
        </p>
        
        <div className="bg-white border border-red-200 rounded-lg p-3 mb-3">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Copy this EXACT URL</label>
            <div className="flex gap-2">
                <code className="flex-1 bg-gray-50 px-2 py-1 rounded text-sm text-gray-800 break-all">
                    {currentOrigin}
                </code>
                <button 
                    onClick={() => copyToClipboard(currentOrigin)}
                    className="text-red-600 font-bold text-xs uppercase hover:underline"
                >
                    Copy
                </button>
            </div>
        </div>

        <ol className="list-decimal list-inside text-sm text-red-800 space-y-1">
            <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline font-bold">Google Cloud Console</a>.</li>
            <li>Click on your <strong>OAuth 2.0 Client ID</strong> name.</li>
            <li>Scroll down to <strong>Authorized JavaScript origins</strong>.</li>
            <li>Click <strong>ADD URI</strong> and paste the URL from above.</li>
            <li>Click <strong>SAVE</strong>.</li>
            <li>Wait 1 minute, then try "Authorize Connection" again.</li>
        </ol>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4 animate-fade-in">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <h4 className="font-bold flex items-center mb-2">
                <Globe size={16} className="mr-2" />
                Step 1: Whitelist this Domain
            </h4>
            <p className="mb-3">
                To prevent "Error 400", Google needs to know it's safe to talk to this app.
            </p>
            
            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Your Current App URL</label>
            <div className="flex gap-2 mb-2">
                <input 
                    type="text" 
                    readOnly 
                    value={currentOrigin} 
                    className="flex-1 bg-white border border-blue-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-mono"
                />
                <button 
                    onClick={() => copyToClipboard(currentOrigin)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors"
                    title="Copy URL"
                >
                    <Copy size={18} />
                </button>
            </div>
            <p className="text-xs">
                &rarr; Paste this into <strong>"Authorized JavaScript origins"</strong> in your Google Cloud Console.
            </p>
        </div>

        <div className="border-t border-gray-100 my-4 pt-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
             <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="e.g., 123456789-abc.apps.googleusercontent.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
             />
             <p className="text-xs text-gray-400 mt-1">Found in Google Cloud Credentials.</p>
        </div>

        <div className="flex justify-end pt-2">
            <button 
                onClick={() => setStep(2)} 
                disabled={!formData.clientId}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
                Next Step <ArrowRight size={16} className="ml-2" />
            </button>
        </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-fade-in">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
            <p>Create a blank Google Sheet in your Drive. The app will automatically create "Registry" and "Transactions" tabs inside it.</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spreadsheet ID</label>
            <input
                type="text"
                value={formData.spreadsheetId}
                onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                placeholder="Paste ID from URL: 1BxiMVs0XRA..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
                Found in URL: docs.google.com/spreadsheets/d/<strong>ID_IS_HERE</strong>/edit
            </p>
        </div>

        <div className="flex justify-between pt-4">
            <button 
                onClick={() => setStep(1)} 
                className="text-gray-500 hover:text-gray-700 font-medium"
            >
                Back
            </button>
            <button 
                onClick={() => setStep(3)} 
                disabled={!formData.spreadsheetId}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
                Next Step <ArrowRight size={16} className="ml-2" />
            </button>
        </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in text-center py-4">
        
        {config.isConnected ? (
             <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                    <CheckCircle2 className="text-green-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-green-800">Successfully Connected!</h3>
                <p className="text-sm text-green-700 mt-1">Your data is now syncing to Google Sheets.</p>
                
                <button 
                    onClick={() => {
                        const newConfig = { ...formData, isConnected: false };
                        setFormData(newConfig);
                        onSave(newConfig);
                    }}
                    className="mt-4 text-sm text-green-700 underline hover:text-green-900"
                >
                    Disconnect / Reset
                </button>
             </div>
        ) : (
            <div className="flex flex-col items-center">
                 {showTroubleshoot && renderTroubleshoot()}

                 {!showTroubleshoot && (
                     <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                        We are ready to connect. A Google popup will appear asking for permission to manage files.
                    </p>
                 )}

                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center text-lg font-medium"
                >
                    {isConnecting ? 'Connecting...' : 'Authorize Connection'}
                </button>
                
                {!showTroubleshoot && (
                    <button 
                        onClick={() => setShowTroubleshoot(true)}
                        className="mt-4 text-xs text-gray-500 flex items-center hover:text-indigo-600"
                    >
                        <HelpCircle size={14} className="mr-1" />
                        Having trouble?
                    </button>
                )}
            </div>
        )}

        <div className="flex justify-start pt-4 border-t border-gray-100 mt-4">
            <button 
                onClick={() => setStep(2)} 
                className="text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
                Back to Settings
            </button>
        </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Sheet className="mr-2 text-green-600" />
            Google Sheets Integration Setup
        </h2>
      </div>

      <div className="p-2 bg-white">
        {/* Step Indicators */}
        <div className="flex justify-center py-4">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>1</div>
                <span className="ml-2 text-sm font-medium hidden md:inline">Credentials</span>
            </div>
            <div className={`w-12 h-0.5 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>2</div>
                <span className="ml-2 text-sm font-medium hidden md:inline">Sheet ID</span>
            </div>
            <div className={`w-12 h-0.5 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 3 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>3</div>
                <span className="ml-2 text-sm font-medium hidden md:inline">Connect</span>
            </div>
        </div>
      </div>

      <div className="p-6 pt-2">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default SettingsPanel;