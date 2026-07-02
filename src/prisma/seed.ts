import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const superAdminEmail = 'admin@fieldtrack.com';
  const existing = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (existing) {
    console.log('Super admin already exists, skipping seed');
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: 'FieldTrack Inc.',
      email: 'admin@fieldtrack.com',
      phone: '+1-555-0001',
      address: '123 Main Street, New York, NY 10001',
    },
  });

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  await prisma.user.create({
    data: {
      email: superAdminEmail,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      companyId: company.id,
    },
  });

  const departments = [
    { name: 'Engineering', description: 'Software Engineering Department' },
    { name: 'Sales', description: 'Sales and Marketing' },
    { name: 'Human Resources', description: 'HR Department' },
    { name: 'Operations', description: 'Operations and Logistics' },
  ];

  const designations = [
    { name: 'Software Engineer', description: 'Software Development' },
    { name: 'Senior Software Engineer', description: 'Senior Development Role' },
    { name: 'Team Lead', description: 'Team Leadership Role' },
    { name: 'Manager', description: 'Management Role' },
    { name: 'Sales Representative', description: 'Sales Role' },
  ];

  const createdDepartments = await Promise.all(
    departments.map((dept) =>
      prisma.department.create({ data: { ...dept, companyId: company.id } })
    )
  );

  const createdDesignations = await Promise.all(
    designations.map((desig) =>
      prisma.designation.create({ data: { ...desig, companyId: company.id } })
    )
  );

  const employees = [
    { name: 'John Doe', email: 'john@fieldtrack.com', phone: '+1-555-0101', departmentId: createdDepartments[0].id, designationId: createdDesignations[2].id },
    { name: 'Jane Smith', email: 'jane@fieldtrack.com', phone: '+1-555-0102', departmentId: createdDepartments[1].id, designationId: createdDesignations[4].id },
    { name: 'Bob Johnson', email: 'bob@fieldtrack.com', phone: '+1-555-0103', departmentId: createdDepartments[0].id, designationId: createdDesignations[0].id },
    { name: 'Alice Brown', email: 'alice@fieldtrack.com', phone: '+1-555-0104', departmentId: createdDepartments[2].id, designationId: createdDesignations[3].id },
    { name: 'Charlie Wilson', email: 'charlie@fieldtrack.com', phone: '+1-555-0105', departmentId: createdDepartments[3].id, designationId: createdDesignations[1].id },
  ];

  for (const emp of employees) {
    const empHashedPassword = await bcrypt.hash('Employee@123', 12);

    await prisma.user.create({
      data: {
        email: emp.email,
        password: empHashedPassword,
        role: 'EMPLOYEE',
        companyId: company.id,
      },
    });

    await prisma.employee.create({
      data: {
        ...emp,
        employeeId: `EMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        companyId: company.id,
      },
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
