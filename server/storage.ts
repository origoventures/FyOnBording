import { 
  InsertSeoAnalysis, SeoAnalysis, seoAnalyses, 
  InsertUser, User, users, 
  Plan, plans, 
  InsertPayment, Payment, payments
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gt, SQL } from "drizzle-orm";

// Helper function for creating SQL expressions for string comparisons
function createStringCondition(column: any, value: string | null): SQL<unknown> {
  if (value === null) {
    return sql`${column} IS NULL`;
  }
  return sql`${column} = ${value}`;
}

// Interface for our storage operations
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPlan(userId: string, planType: string): Promise<User>;
  incrementUserUsage(userId: string): Promise<User>;
  checkUserSubscription(userId: string): Promise<{isSubscribed: boolean, remainingUsage: number}>;
  resetMonthlyUsage(): Promise<void>;
  
  // Plan methods
  getAllPlans(): Promise<Plan[]>;
  getPlanByType(planType: string): Promise<Plan | undefined>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  
  // SEO Analysis Methods
  createSeoAnalysis(analysis: InsertSeoAnalysis): Promise<SeoAnalysis>;
  getSeoAnalysisByUrl(url: string): Promise<SeoAnalysis | undefined>;
  getRecentSeoAnalyses(limit?: number): Promise<SeoAnalysis[]>;
  getSeoAnalysesByUser(userId: string, limit?: number): Promise<SeoAnalysis[]>;
}

// Database implementation of our storage
export class DatabaseStorage implements IStorage {
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Verifica se l'utente esiste già per email
      const existingUser = await this.getUserByEmail(insertUser.email);
      if (existingUser) {
        // Se l'utente esiste già, aggiorna i suoi dati e restituiscilo
        return this.updateUserData(existingUser.id, insertUser);
      }
      
      // Limita la lunghezza dei campi per evitare errori di database
      const sanitizedUser = {
        ...insertUser,
        firstName: insertUser.firstName?.substring(0, 250) || '',
        lastName: insertUser.lastName?.substring(0, 250) || '',
        profileImageUrl: insertUser.profileImageUrl?.substring(0, 250) || null
      };
      
      // Inserisci il nuovo utente
      const [user] = await db.insert(users).values(sanitizedUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUserData(userId: string, userData: Partial<InsertUser>): Promise<User> {
    try {
      // Sanitizza i dati di input
      const sanitizedData = Object.fromEntries(
        Object.entries(userData).map(([key, value]) => {
          if (typeof value === 'string' && value.length > 250) {
            return [key, value.substring(0, 250)];
          }
          return [key, value];
        })
      );
      
      const [updatedUser] = await db
        .update(users)
        .set({ 
          ...sanitizedData,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
        
      return updatedUser;
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  }
  
  async updateUserPlan(userId: string, planType: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        currentPlan: planType,
        monthlyUsage: 0,
        lastResetDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async incrementUserUsage(userId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        monthlyUsage: sql`${users.monthlyUsage} + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async checkUserSubscription(userId: string): Promise<{isSubscribed: boolean, remainingUsage: number}> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return { isSubscribed: false, remainingUsage: 0 };
    }
    
    // If user is on free plan, check free usage limit
    if (user.currentPlan === 'free') {
      const [freePlan] = await db.select().from(plans).where(sql`${plans.type} = 'free'`);
      const monthlyLimit = freePlan ? freePlan.monthlyLimit : 3;
      const usage = user.monthlyUsage ?? 0;
      return { 
        isSubscribed: true, 
        remainingUsage: Math.max(0, monthlyLimit - usage)
      };
    }
    
    // For paid plans
    const planType = user.currentPlan ?? 'free';
    const [userPlan] = await db.select().from(plans).where(sql`${plans.type} = ${planType}`);
    if (!userPlan) {
      return { isSubscribed: false, remainingUsage: 0 };
    }
    
    const usage = user.monthlyUsage ?? 0;
    return { 
      isSubscribed: true, 
      remainingUsage: Math.max(0, userPlan.monthlyLimit - usage) 
    };
  }
  
  // Reset usage for all users on the first of the month
  async resetMonthlyUsage(): Promise<void> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    await db
      .update(users)
      .set({ 
        monthlyUsage: 0,
        lastResetDate: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        sql`(${users.lastResetDate} IS NULL OR DATE(${firstDayOfMonth}) > DATE(${users.lastResetDate}))`,
        sql`${users.monthlyUsage} > 0`
      ));
  }
  
  // Plan methods
  async getAllPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.price);
  }
  
  async getPlanByType(planType: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(sql`${plans.type} = ${planType}`);
    return plan;
  }
  
  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }
  
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }
  
  // SEO Analysis Methods
  async createSeoAnalysis(analysis: InsertSeoAnalysis): Promise<SeoAnalysis> {
    const [newAnalysis] = await db.insert(seoAnalyses).values(analysis).returning();
    return newAnalysis;
  }
  
  async getSeoAnalysisByUrl(url: string): Promise<SeoAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(seoAnalyses)
      .where(eq(seoAnalyses.url, url))
      .orderBy(desc(seoAnalyses.createdAt))
      .limit(1);
    
    return analysis;
  }
  
  async getRecentSeoAnalyses(limit: number = 10): Promise<SeoAnalysis[]> {
    return db
      .select()
      .from(seoAnalyses)
      .orderBy(desc(seoAnalyses.createdAt))
      .limit(limit);
  }
  
  async getSeoAnalysesByUser(userId: string, limit: number = 10): Promise<SeoAnalysis[]> {
    return db
      .select()
      .from(seoAnalyses)
      .where(eq(seoAnalyses.userId, userId))
      .orderBy(desc(seoAnalyses.createdAt))
      .limit(limit);
  }
}

// Create and export a instance of our database storage
export const storage = new DatabaseStorage();
