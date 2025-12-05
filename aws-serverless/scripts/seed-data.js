#!/usr/bin/env node
/**
 * Seed script to populate DynamoDB with initial data
 * Run: node scripts/seed-data.js <table-name>
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.argv[2];

if (!TABLE_NAME) {
  console.error('Usage: node scripts/seed-data.js <table-name>');
  process.exit(1);
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const putItem = async (item) => {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
};

async function seed() {
  console.log(`Seeding table: ${TABLE_NAME}`);

  // Create admin user
  const adminId = uuidv4();
  const adminPassword = await bcrypt.hash('admin123', 10);
  const now = new Date().toISOString();

  const adminUser = {
    PK: `USER#${adminId}`,
    SK: `USER#${adminId}`,
    GSI1PK: 'EMAIL#admin@example.com',
    GSI1SK: `USER#${adminId}`,
    entityType: 'USER',
    id: adminId,
    email: 'admin@example.com',
    passwordHash: adminPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    authProvider: 'local',
    createdAt: now,
    updatedAt: now,
  };

  await putItem(adminUser);
  console.log('Created admin user: admin@example.com / admin123');

  // Create sample classes
  const classes = [
    { title: 'Morning Yoga', instructor: 'Anna Svensson', daysFromNow: 1, hour: 7 },
    { title: 'HIIT Training', instructor: 'Erik Johansson', daysFromNow: 1, hour: 12 },
    { title: 'Spinning', instructor: 'Maria Lindberg', daysFromNow: 2, hour: 18 },
    { title: 'Pilates', instructor: 'Sofia Nilsson', daysFromNow: 3, hour: 10 },
    { title: 'CrossFit', instructor: 'Oskar Berg', daysFromNow: 4, hour: 17 },
  ];

  for (const cls of classes) {
    const classId = uuidv4();
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + cls.daysFromNow);
    scheduledAt.setHours(cls.hour, 0, 0, 0);
    const scheduledAtISO = scheduledAt.toISOString();

    const classItem = {
      PK: `CLASS#${classId}`,
      SK: `CLASS#${classId}`,
      GSI1PK: 'CLASSES',
      GSI1SK: `${scheduledAtISO}#${classId}`,
      entityType: 'CLASS',
      id: classId,
      title: cls.title,
      description: `A great ${cls.title.toLowerCase()} session for all fitness levels.`,
      maxCapacity: 15,
      scheduledAt: scheduledAtISO,
      durationMinutes: 60,
      instructor: cls.instructor,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    };

    await putItem(classItem);
    console.log(`Created class: ${cls.title}`);
  }

  console.log('Seed completed successfully!');
}

seed().catch(console.error);
