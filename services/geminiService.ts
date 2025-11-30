import { GoogleGenAI, Type } from "@google/genai";
import { Student, PaymentStatus } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash"; // Fast and efficient for text tasks

/**
 * Parses natural language input to determine actions on the student list.
 * E.g., "Anshu fee is clear" -> { studentName: "Anshu", status: "PAID" }
 */
export const parseCommand = async (command: string, students: Student[]) => {
  const studentNames = students.map(s => s.name).join(", ");
  
  const response = await ai.models.generateContent({
    model: modelId,
    contents: `
      You are an assistant managing a tuition fee database.
      Current students: [${studentNames}].
      
      Analyze the user's command: "${command}"
      
      Determine which student is being referred to and what the new status should be.
      
      Status Rules:
      - "fee is clear", "paid", "done" -> PAID
      - "pending", "will pay later", "not clear" -> PENDING
      - "crossmark", "cancel", "exempt", "don't send" -> EXEMPT
      - "late", "overdue", "not paid" -> OVERDUE
      
      Return JSON.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          found: { type: Type.BOOLEAN },
          studentName: { type: Type.STRING },
          newStatus: { type: Type.STRING, enum: ["PAID", "PENDING", "OVERDUE", "EXEMPT"] },
          confidence: { type: Type.NUMBER }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Generates a bilingual WhatsApp message based on status and context.
 */
export const generateWhatsAppMessage = async (
  student: Student,
  actionType: 'PAID' | 'REMINDER' | 'OVERDUE'
): Promise<string> => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  // Calculate cycle based on joining date
  const joinDay = new Date(student.joiningDate).getDate();
  const cycleText = `Cycle: ${joinDay}th to ${joinDay}th`;

  let promptContext = "";
  
  if (actionType === 'PAID') {
    promptContext = `The student ${student.name} has CLEARED their fee of ₹${student.monthlyFee} on ${currentDate}.`;
  } else if (actionType === 'REMINDER') {
    promptContext = `The student ${student.name} has a PENDING fee of ₹${student.monthlyFee}. It is a gentle reminder.`;
  } else if (actionType === 'OVERDUE') {
    promptContext = `The student ${student.name} has NOT CLEARED the fee. It is OVERDUE. Please pay immediately.`;
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: `
      Write a WhatsApp message for a parent from a Tuition Teacher.
      
      Context: ${promptContext}
      Parent Name: ${student.parentName}
      Student Name: ${student.name}
      Cycle Info: ${cycleText}
      
      Requirements:
      1. Write the message in BOTH English and Hindi (Devanagari script).
      2. Keep it professional yet polite.
      3. If status is PAID, thank them.
      4. If status is OVERDUE, be firm but polite.
      5. Include the calculated fee amount.
      6. MANDATORY: End the message exactly with: "(AI generated message)"
      7. Format strictly as plain text, using line breaks for separation.
      8. Do not add markdown like **bold**.
    `
  });

  return response.text || "Error generating message.";
};

/**
 * Identify students who need reminders based on today's date and their joining date.
 */
export const checkReminders = async (students: Student[]) => {
   // Logic handled in frontend usually, but if we need AI to explain WHY:
   return students.filter(s => s.status === PaymentStatus.PENDING || s.status === PaymentStatus.OVERDUE);
}
