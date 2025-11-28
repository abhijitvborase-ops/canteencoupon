import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Employee } from '../models/user.model';
import { Coupon } from '../models/coupon.model';
import { API_KEY } from './api.key';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
  }

  async generateInsights(
    question: string,
    employees: Employee[],
    coupons: Coupon[]
  ): Promise<string> {

    const simplifiedEmployees = employees.map(emp => ({
      id: emp.id,
      role: emp.role,
      department: emp.department || 'N/A',
      contractor: emp.contractor || 'N/A'
    }));

    const simplifiedCoupons = coupons.map(c => ({
      employeeId: c.employeeId,
      couponType: c.couponType,
      status: c.status,
      dateIssued: c.dateIssued?.split('T')[0] || null,
      redeemDate: c.redeemDate ? c.redeemDate.split('T')[0] : null,
    }));

    const dataForAI = {
      employees: simplifiedEmployees,
      coupons: simplifiedCoupons,
    };

    const prompt = `
You are an AI assistant for a Canteen Management System.

Analyze the given JSON data to answer the user's question.
Be helpful and use bullet points if needed.

Current date: ${new Date().toISOString().split('T')[0]}

JSON Data:
${JSON.stringify(dataForAI)}

User Question:
"${question}"
`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-pro',
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      return '⚠️ Gemini service temporarily unavailable. Try later.';
    }
  }
}
