import { User } from '../src/models/User';
import { Client } from '../src/models/Client';
import { Project } from '../src/models/Project';
import { TimeEntry } from '../src/models/TimeEntry';

export async function createTestUser(overrides: Partial<{ name: string; email: string }> = {}) {
  return User.create({
    name: overrides.name ?? 'Mohamed Kessentini',
    email: overrides.email ?? `user-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: 'irrelevant-for-service-tests',
  });
}

export async function createTestClient(userId: string, overrides: Partial<{ name: string }> = {}) {
  return Client.create({ user: userId, name: overrides.name ?? 'Acme Corp' });
}

export async function createTestProject(
  userId: string,
  clientId: string,
  overrides: Partial<{ name: string; hourlyRate: number; currency: string }> = {},
) {
  return Project.create({
    user: userId,
    client: clientId,
    name: overrides.name ?? 'Website Redesign',
    hourlyRate: overrides.hourlyRate ?? 75,
    currency: overrides.currency ?? 'EUR',
  });
}

export async function createTestTimeEntry(
  userId: string,
  projectId: string,
  overrides: Partial<{ hours: number; date: Date; billable: boolean; description: string }> = {},
) {
  return TimeEntry.create({
    user: userId,
    project: projectId,
    date: overrides.date ?? new Date(),
    hours: overrides.hours ?? 2,
    description: overrides.description ?? 'Work done',
    billable: overrides.billable ?? true,
  });
}
