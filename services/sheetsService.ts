import { PaymentRecord, SheetConfig } from '../types';

// Global types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Added drive.file scope to prevent some permission errors during file creation/lookup
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

export const sheetsService = {
  tokenClient: null as any,
  gapiInited: false,
  gisInited: false,

  /**
   * Initialize the Google API client
   */
  async init(clientId: string, callback: (success: boolean) => void) {
    if (!clientId) return;

    try {
        const gapiLoadPromise = new Promise<void>((resolve) => {
        window.gapi.load('client', async () => {
            await window.gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
            });
            this.gapiInited = true;
            resolve();
        });
        });

        const gisLoadPromise = new Promise<void>((resolve) => {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: '', // defined later per-request
        });
        this.gisInited = true;
        resolve();
        });

        await Promise.all([gapiLoadPromise, gisLoadPromise]);
        callback(true);
    } catch (e) {
        console.error("GAPI Init Failed", e);
        callback(false);
    }
  },

  /**
   * Request access token from user
   */
  async signIn() {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) return reject('Token client not initialized');
      
      this.tokenClient.callback = async (resp: any) => {
        if (resp.error) {
          console.error("Google Auth Error:", resp);
          reject(resp);
        }
        resolve(resp);
      };

      // Force consent if no token, otherwise silent
      if (window.gapi.client.getToken() === null) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  },

  /**
   * Append a payment record to the spreadsheet
   */
  async appendRow(config: SheetConfig, record: PaymentRecord): Promise<boolean> {
    if (!config.spreadsheetId || !this.gapiInited) return false;

    try {
        // Ensure we have a token
        if (!window.gapi.client.getToken()) {
            await this.signIn();
        }

        const range = 'Sheet1!A:D'; // Assuming standard sheet
        const valueRangeBody = {
            values: [
                [record.date, record.studentName, record.amount, record.method]
            ]
        };

        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: config.spreadsheetId,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: valueRangeBody,
        });

        return true;
    } catch (error) {
        console.error('Error appending to sheet:', error);
        return false;
    }
  },

  /**
   * Helper to create a CSV export if API is not used
   */
  exportToCSV(records: PaymentRecord[]) {
    const headers = ['Date', 'Student Name', 'Amount', 'Method'];
    const rows = records.map(r => [r.date, r.studentName, r.amount, r.method]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'fee_records.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }
};