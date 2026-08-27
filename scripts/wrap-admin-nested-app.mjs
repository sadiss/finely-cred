import fs from 'node:fs';
import path from 'node:path';

const abs = path.join(process.cwd(), 'src/App.tsx');
let src = fs.readFileSync(abs, 'utf8');

const replacements = [
  [
    `            <ProtectedAdminRoute>
              <AdminRolePreviewPage />
            </ProtectedAdminRoute>`,
    `            <ProtectedAdminRoute>
              <ProductRoutedPage role="admin" pageId="role-preview" legacy={<AdminRolePreviewPage />} />
            </ProtectedAdminRoute>`,
  ],
  [
    `            <ProtectedAdminRoute>
              <AdminCrmRecordPage />
            </ProtectedAdminRoute>`,
    `            <ProtectedAdminRoute>
              <ProductRoutedPage role="admin" pageId="crm-record" legacy={<AdminCrmRecordPage />} />
            </ProtectedAdminRoute>`,
  ],
  [
    `            <ProtectedAdminRoute>
              <AdminGrowthAgentsPage />
            </ProtectedAdminRoute>`,
    `            <ProtectedAdminRoute>
              <ProductRoutedPage role="admin" pageId="growth-agent-detail" legacy={<AdminGrowthAgentsPage />} />
            </ProtectedAdminRoute>`,
  ],
  [
    `            <ProtectedAdminRoute>
              <AdminOvernight50Page />
            </ProtectedAdminRoute>`,
    `            <ProtectedAdminRoute>
              <ProductRoutedPage role="admin" pageId="overnight" legacy={<AdminOvernight50Page />} />
            </ProtectedAdminRoute>`,
  ],
];

for (const [oldText, next] of replacements) {
  if (!src.includes(oldText)) {
    console.log(`missing:\n${oldText}`);
    process.exit(1);
  }
  src = src.replace(oldText, next);
  console.log('wrapped one route');
}

fs.writeFileSync(abs, src);
console.log('App.tsx updated');
