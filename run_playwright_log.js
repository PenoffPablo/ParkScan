import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Mock Supabase
  await page.route('**/rest/v1/administradores*', async (route) => {
    await route.fulfill({
      status: 200,
      json: [{ id: 1, usuario: 'admin', password: '$2b$10$j3uty7CrEY38qR7v6f7GJucJg8y9izORfVMcuEMxPCtwdjciJB2YC', rol: 'admin', nombre: 'Admin Mock' }]
    });
  });

  await page.goto('http://localhost:5173/admin/login');
  await page.getByPlaceholder('Ingresa tu usuario').fill('admin');
  await page.getByPlaceholder('••••••••').fill('password_real');
  
  console.log('Submitting login...');
  await page.locator('button[type="submit"]').click();
  
  // Wait a bit
  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());

  const errorText = await page.evaluate(() => document.querySelector('.bg-red-500\\/10')?.textContent || document.querySelector('.text-red-400')?.textContent);
  console.log('Error displayed on page:', errorText);
  
  await browser.close();
}

main().catch(console.error);
