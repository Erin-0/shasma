import { GoogleGenerativeAI } from '@google/generative-ai';
import CryptoJS from 'crypto-js';

const AES_SECRET_KEY = process.env.REACT_APP_AES_SECRET_KEY || 'demo-secret-key';

// دالة تشفير
export function encryptAES256(text) {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, AES_SECRET_KEY).toString();
}

// دالة فك التشفير (عند الحاجة)
export function decryptAES256(cipherText) {
  if (!cipherText) return '';
  const bytes = CryptoJS.AES.decrypt(cipherText, AES_SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
// إعداد Gemini AI
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'demo-key';
const genAI = new GoogleGenerativeAI(API_KEY);

// نموذج AI
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * توليد سؤال رياضي
 * @param {number} userAge - عمر المستخدم
 * @returns {Promise<Object>} - سؤال مع خيارات وإجابة
 */
export const generateMathQuestion = async (userAge) => {
  try {
    const prompt = `أنشئ سؤال رياضي مناسب لعمر ${userAge} سنة. يجب أن يكون السؤال باللغة العربية مع 4 خيارات والإجابة الصحيحة. 
    
    أريد الإجابة بالتنسيق التالي بالضبط:
    السؤال: [نص السؤال]
    أ) [الخيار الأول]
    ب) [الخيار الثاني]
    ج) [الخيار الثالث]
    د) [الخيار الرابع]
    الإجابة الصحيحة: [أ أو ب أو ج أو د]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const encryptedText = encryptAES256(text);
    const encryptedPrompt = encryptAES256(prompt);
    const encryptedUserAge = encryptAES256(userAge.toString());
    
    return parseGameResponse(text, 'math');
  } catch (error) {
    console.error('خطأ في توليد سؤال الرياضيات:', error);
    return getFallbackQuestion('math', userAge);
  }
};

/**
 * توليد لغز
 * @param {number} userAge - عمر المستخدم
 * @returns {Promise<Object>} - لغز مع إجابة
 */
export const generatePuzzle = async (userAge) => {
  try {
    const prompt = `أنشئ لغز قصير وممتع مناسب لعمر ${userAge} سنة باللغة العربية. 
    
    أريد الإجابة بالتنسيق التالي بالضبط:
    اللغز: [نص اللغز]
    أ) [الخيار الأول]
    ب) [الخيار الثاني]
    ج) [الخيار الثالث]
    د) [الخيار الرابع]
    الإجابة الصحيحة: [أ أو ب أو ج أو د]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const encryptedText = encryptAES256(text);
    const encryptedPrompt = encryptAES256(prompt);
    const encryptedUserAge = encryptAES256(userAge.toString());

    return parseGameResponse(text, 'puzzle');
  } catch (error) {
    console.error('خطأ في توليد اللغز:', error);
    return getFallbackQuestion('puzzle', userAge);
  }
};

/**
 * توليد سؤال ثقافة عامة
 * @param {number} userAge - عمر المستخدم
 * @returns {Promise<Object>} - سؤال ثقافة عامة
 */
export const generateGeneralKnowledge = async (userAge) => {
  try {
    const prompt = `أنشئ سؤال ثقافة عامة قصير لاختبار معرفة مستخدم عمره ${userAge} سنة باللغة العربية.
    
    أريد الإجابة بالتنسيق التالي بالضبط:
    السؤال: [نص السؤال]
    أ) [الخيار الأول]
    ب) [الخيار الثاني]
    ج) [الخيار الثالث]
    د) [الخيار الرابع]
    الإجابة الصحيحة: [أ أو ب أو ج أو د]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const encryptedText = encryptAES256(text);
    const encryptedPrompt = encryptAES256(prompt);
    const encryptedUserAge = encryptAES256(userAge.toString());
    
    
    return parseGameResponse(text, 'knowledge');
  } catch (error) {
    console.error('خطأ في توليد سؤال الثقافة العامة:', error);
    return getFallbackQuestion('knowledge', userAge);
  }
};

/**
 * تحليل استجابة النموذج
 * @param {string} text - النص المُولد
 * @param {string} type - نوع السؤال
 * @returns {Object} - السؤال المُنسق
 */
const parseGameResponse = (text, type) => {
  try {
    const lines = text.split('\n').filter(line => line.trim());
    
    // استخراج السؤال
    const questionLine = lines.find(line => 
      line.includes('السؤال:') || line.includes('اللغز:')
    );
    const question = questionLine ? questionLine.split(':')[1].trim() : 'سؤال تجريبي';
    const encryptedQuestion = encryptAES256(question);

    // استخراج الخيارات
    const options = [];
    const optionLines = lines.filter(line => 
      line.trim().match(/^[أ-د]\)/) || line.trim().match(/^[abcd]\)/)
    );
    
    optionLines.forEach(line => {
      const option = line.split(')')[1]?.trim();
      if (option) options.push(option);
    });
    
    // التأكد من وجود 4 خيارات
    while (options.length < 4) {
      options.push(`خيار ${options.length + 1}`);
    }
    
    // استخراج الإجابة الصحيحة
    const answerLine = lines.find(line => 
      line.includes('الإجابة الصحيحة:') || line.includes('الإجابة:')
    );
    const encryptedOptions = options.map(opt => encryptAES256(opt));
    const encryptedAnswer = encryptAES256(answerLine.split(':')[1].trim());
    const encryptedType = encryptAES256(type);

    let correctAnswerIndex = 0;
    if (answerLine) {
      const answerChar = answerLine.split(':')[1].trim().toLowerCase();
      if (answerChar.includes('أ') || answerChar.includes('a')) correctAnswerIndex = 0;
      else if (answerChar.includes('ب') || answerChar.includes('b')) correctAnswerIndex = 1;
      else if (answerChar.includes('ج') || answerChar.includes('c')) correctAnswerIndex = 2;
      else if (answerChar.includes('د') || answerChar.includes('d')) correctAnswerIndex = 3;
    }
    
    return {
      question,
      options: options.slice(0, 4),
      correctAnswer: correctAnswerIndex,
      type,
      points: 5
    };
  } catch (error) {
    console.error('خطأ في تحليل الاستجابة:', error);
    return getFallbackQuestion(type);
  }
};

/**
 * أسئلة احتياطية في حالة فشل API
 */
const getFallbackQuestion = (type, userAge = 20) => {
  const fallbackQuestions = {
    math: {
      question: 'ما ناتج 15 + 27؟',
      options: ['42', '32', '52', '35'],
      correctAnswer: 0,
      type: 'math',
      points: 5
    },
    puzzle: {
      question: 'أكون بيتاً بلا أبواب ونوافذ، فما أنا؟',
      options: ['البيضة', 'الخيمة', 'الكهف', 'السفينة'],
      correctAnswer: 0,
      type: 'puzzle',
      points: 5
    },
    knowledge: {
      question: 'ما هي عاصمة المملكة العربية السعودية؟',
      options: ['جدة', 'الدمام', 'الرياض', 'مكة المكرمة'],
      correctAnswer: 2,
      type: 'knowledge',
      points: 5
    }
  };
  
  return fallbackQuestions[type] || fallbackQuestions.math;
};


export default {
  generateMathQuestion,
  generatePuzzle,
  generateGeneralKnowledge
};
