import { db } from './db';
import { plans } from '@shared/schema';

// Seed function to populate initial data in the plans table
async function seedPlans() {
  console.log('🌱 Seeding plans data...');
  
  // Check if there are already plans in the database
  const existingPlans = await db.select().from(plans);
  
  if (existingPlans.length > 0) {
    console.log('Plans already exist in the database. Skipping seed.');
    return;
  }

  // Insert plan data with the updated prices
  await db.insert(plans).values([
    {
      name: 'Free',
      type: 'free',
      price: 0, // $0
      monthlyLimit: 3,
      description: 'Basic SEO analysis with limited features'
    },
    {
      name: 'Pro',
      type: 'basic',
      price: 10, // $0.10
      monthlyLimit: 25,
      description: 'Comprehensive SEO analysis with all features'
    },
    {
      name: 'Teams',
      type: 'premium',
      price: 20, // $0.20
      monthlyLimit: 100,
      description: 'Advanced SEO analysis for multiple team members'
    },
    {
      name: 'Enterprise',
      type: 'enterprise',
      price: 30, // $0.30
      monthlyLimit: 500,
      description: 'Enterprise-grade SEO analysis with unlimited access'
    }
  ]);

  console.log('✅ Plans seeded successfully!');
}

// Run the seed function
seedPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding data:', error);
    process.exit(1);
  });